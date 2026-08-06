import { env } from '../config/env';
import { logger } from '../config/logger';
import type { Job } from '../domain/job';
import type { UserProfile } from '../domain/user';

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+|00)?[0-9][0-9\s().-]{7,}[0-9]/g;
const BLOCKED_EMAIL = /(noreply|no-reply|donotreply|do-not-reply|mailer-daemon|example\.com|sentry|github\.com)/i;

export type JobContacts = {
  email: string | null;
  phone: string | null;
};

export type OutreachChannel = 'email' | 'whatsapp' | 'smart_apply';

export type OutreachResult = {
  channel: OutreachChannel;
  contacts: JobContacts;
  dryRun: boolean;
  sent: boolean;
  subject?: string;
  body?: string;
  to?: string;
  providerMessageId?: string;
  waLink?: string;
  applyUrl: string;
  note: string;
};

export function extractContactsFromText(text = ''): JobContacts {
  const emails = [...new Set((String(text).match(EMAIL_RE) || []).filter((e) => !BLOCKED_EMAIL.test(e)))];
  const phones = [
    ...new Set(
      (String(text).match(PHONE_RE) || [])
        .map((p) => p.replace(/\s+/g, ' ').trim())
        .filter((p) => p.replace(/\D/g, '').length >= 10),
    ),
  ];
  return { email: emails[0] || null, phone: phones[0] || null };
}

function buildApplicationEmail(profile: UserProfile, job: Job): { subject: string; text: string; html: string } {
  const name = profile.displayName || 'Candidate';
  const title = profile.title || 'Software Developer';
  const skills = (profile.skills || []).slice(0, 8).join(', ') || 'relevant skills';
  const years = profile.experienceYears ? `${profile.experienceYears}+ years` : 'professional';
  const summary = (profile.summary || '').slice(0, 400);

  const subject = `Application: ${job.title} — ${name}`;
  const text = `Hello ${job.company} Hiring Team,

I am applying for the ${job.title} role.

I am a ${title} with ${years} experience. Key skills: ${skills}.

${summary}

My resume highlights match this role. I would welcome a conversation.

Apply / posting: ${job.applyUrl}

Best regards,
${name}
${profile.email}${profile.phone ? `\n${profile.phone}` : ''}${profile.linkedinUrl ? `\n${profile.linkedinUrl}` : ''}
`;

  const html = text.replace(/\n/g, '<br/>');
  return { subject, text, html };
}

function buildWhatsAppMessage(profile: UserProfile, job: Job): string {
  const name = profile.displayName || 'Candidate';
  return `Hi, I'm ${name}. I'm interested in the ${job.title} role at ${job.company}. ${
    profile.title ? `I'm a ${profile.title}. ` : ''
  }Skills: ${(profile.skills || []).slice(0, 5).join(', ') || 'see resume'}. Posting: ${job.applyUrl}`;
}

function toE164ish(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`; // India default for local numbers
  return digits;
}

async function sendSendGrid(
  to: string,
  subject: string,
  text: string,
  html: string,
  replyTo?: { email: string; name?: string },
): Promise<string | undefined> {
  if (!env.SENDGRID_API_KEY || !env.SENDGRID_FROM_EMAIL) {
    throw new Error('SendGrid not configured (SENDGRID_API_KEY / SENDGRID_FROM_EMAIL)');
  }
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: env.SENDGRID_FROM_EMAIL, name: 'ApplyAI' },
      ...(replyTo?.email ? { reply_to: { email: replyTo.email, name: replyTo.name || 'Candidate' } } : {}),
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SendGrid HTTP ${res.status}: ${body.slice(0, 240)}`);
  }
  return res.headers.get('x-message-id') || undefined;
}

async function sendTwilioWhatsApp(toPhone: string, body: string): Promise<string | undefined> {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_WHATSAPP_FROM) {
    throw new Error('Twilio WhatsApp not configured (TWILIO_ACCOUNT_SID / AUTH_TOKEN / WHATSAPP_FROM)');
  }
  const to = `whatsapp:+${toE164ish(toPhone)}`;
  const from = env.TWILIO_WHATSAPP_FROM.startsWith('whatsapp:')
    ? env.TWILIO_WHATSAPP_FROM
    : `whatsapp:${env.TWILIO_WHATSAPP_FROM}`;

  const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    },
  );
  const json = (await res.json()) as { sid?: string; message?: string; error_message?: string };
  if (!res.ok) {
    throw new Error(`Twilio HTTP ${res.status}: ${json.message || json.error_message || 'failed'}`);
  }
  return json.sid;
}

/**
 * Prefer public email → auto email.
 * Else public phone → WhatsApp.
 * Else Smart Apply URL (user completes on site — no silent platform submit).
 */
export async function outreachApply(profile: UserProfile, job: Job): Promise<OutreachResult> {
  const blob = `${job.description || ''} ${job.title} ${job.company} ${job.applyUrl}`;
  const contacts = extractContactsFromText(blob);
  const dryRun = env.OUTREACH_DRY_RUN;
  const applyUrl = job.applyUrl;

  if (contacts.email) {
    const mail = buildApplicationEmail(profile, job);
    if (dryRun) {
      logger.info('Outreach email dry-run', { to: contacts.email, job: job.id });
      return {
        channel: 'email',
        contacts,
        dryRun: true,
        sent: false,
        subject: mail.subject,
        body: mail.text,
        to: contacts.email,
        applyUrl,
        note: `Dry-run: would email ${contacts.email}. Set OUTREACH_DRY_RUN=false + SendGrid to send.`,
      };
    }
    try {
      const id = await sendSendGrid(contacts.email, mail.subject, mail.text, mail.html, {
        email: profile.email,
        name: profile.displayName,
      });
      return {
        channel: 'email',
        contacts,
        dryRun: false,
        sent: true,
        subject: mail.subject,
        body: mail.text,
        to: contacts.email,
        providerMessageId: id,
        applyUrl,
        note: `Application email sent to ${contacts.email}`,
      };
    } catch (err) {
      logger.warn('SendGrid failed', { err: err instanceof Error ? err.message : err });
      return {
        channel: 'email',
        contacts,
        dryRun: false,
        sent: false,
        subject: mail.subject,
        body: mail.text,
        to: contacts.email,
        applyUrl,
        note: `Email found but send failed: ${err instanceof Error ? err.message : 'error'}. Draft kept.`,
      };
    }
  }

  if (contacts.phone) {
    const msg = buildWhatsAppMessage(profile, job);
    const waLink = `https://wa.me/${toE164ish(contacts.phone)}?text=${encodeURIComponent(msg)}`;
    if (dryRun) {
      logger.info('Outreach WhatsApp dry-run', { to: contacts.phone, job: job.id });
      return {
        channel: 'whatsapp',
        contacts,
        dryRun: true,
        sent: false,
        body: msg,
        to: contacts.phone,
        waLink,
        applyUrl,
        note: `Dry-run: would WhatsApp ${contacts.phone}. Set OUTREACH_DRY_RUN=false + Twilio WhatsApp to send.`,
      };
    }
    try {
      const id = await sendTwilioWhatsApp(contacts.phone, msg);
      return {
        channel: 'whatsapp',
        contacts,
        dryRun: false,
        sent: true,
        body: msg,
        to: contacts.phone,
        providerMessageId: id,
        waLink,
        applyUrl,
        note: `WhatsApp message sent to ${contacts.phone}`,
      };
    } catch (err) {
      logger.warn('Twilio WhatsApp failed; returning wa.me link', {
        err: err instanceof Error ? err.message : err,
      });
      return {
        channel: 'whatsapp',
        contacts,
        dryRun: false,
        sent: false,
        body: msg,
        to: contacts.phone,
        waLink,
        applyUrl,
        note: `WhatsApp API failed — open wa.me link to send manually.`,
      };
    }
  }

  return {
    channel: 'smart_apply',
    contacts,
    dryRun,
    sent: false,
    applyUrl,
    note:
      'No public email/phone in this posting (common on LinkedIn). Opening official apply URL — you complete apply on the site.',
  };
}
