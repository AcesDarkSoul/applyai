import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';
import type { Job } from '../domain/job';
import type { OutreachCredentials, UserProfile } from '../domain/user';
import { coverLetterToPitch } from './coverLetterService';

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+|00)?[0-9][0-9\s().-]{7,}[0-9]/g;
const BLOCKED_EMAIL =
  /(noreply|no-reply|donotreply|do-not-reply|mailer-daemon|example\.com|sentry|github\.com)/i;

export type JobContacts = {
  email: string | null;
  phone: string | null;
};

export type OutreachChannel = 'email' | 'whatsapp' | 'none';

export type OutreachResult = {
  channel: OutreachChannel;
  contacts: JobContacts;
  dryRun: boolean;
  sent: boolean;
  subject?: string;
  body?: string;
  to?: string;
  providerMessageId?: string;
  /** Kept for debugging only — UI must NOT auto-open this. */
  waLink?: string;
  applyUrl: string;
  note: string;
  coverLetter?: string;
  coverLetterId?: string;
  fromAccount?: string;
};

export function extractContactsFromText(text = ''): JobContacts {
  const emails = [
    ...new Set((String(text).match(EMAIL_RE) || []).filter((e) => !BLOCKED_EMAIL.test(e))),
  ];
  const phones = [
    ...new Set(
      (String(text).match(PHONE_RE) || [])
        .map((p) => p.replace(/\s+/g, ' ').trim())
        .filter((p) => p.replace(/\D/g, '').length >= 10),
    ),
  ];
  return { email: emails[0] || null, phone: phones[0] || null };
}

function buildApplicationEmail(
  profile: UserProfile,
  job: Job,
  coverLetter: string,
): { subject: string; text: string; html: string } {
  const name = profile.displayName || 'Candidate';
  const subject = `Application: ${job.title} — ${name}`;
  const text = `${coverLetter.trim()}

---
Role: ${job.title} at ${job.company}
Candidate: ${name}${profile.email ? ` <${profile.email}>` : ''}${profile.phone ? ` · ${profile.phone}` : ''}
Posting: ${job.applyUrl}
`;
  const html = text.replace(/\n/g, '<br/>');
  return { subject, text, html };
}

function buildWhatsAppMessage(profile: UserProfile, job: Job, coverLetter: string): string {
  const name = profile.displayName || 'Candidate';
  const pitch = coverLetterToPitch(coverLetter, 550);
  return `Hi, I'm ${name}. Applying for ${job.title} at ${job.company}.

${pitch}

Posting: ${job.applyUrl}`;
}

function toE164ish(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function resolveOutreach(profile: UserProfile): OutreachCredentials {
  const o = profile.outreach || {};
  return {
    autoSendEnabled: o.autoSendEnabled,
    smtpHost: o.smtpHost || env.USER_SMTP_HOST || '',
    smtpPort: o.smtpPort || env.USER_SMTP_PORT || 587,
    smtpSecure: o.smtpSecure ?? env.USER_SMTP_SECURE,
    smtpUser: o.smtpUser || env.USER_SMTP_USER || profile.email || '',
    smtpPass: o.smtpPass || env.USER_SMTP_PASS || '',
    whatsappPhoneNumberId: o.whatsappPhoneNumberId || env.WHATSAPP_PHONE_NUMBER_ID || '',
    whatsappAccessToken: o.whatsappAccessToken || env.WHATSAPP_ACCESS_TOKEN || '',
    twilioAccountSid: o.twilioAccountSid || env.TWILIO_ACCOUNT_SID || '',
    twilioAuthToken: o.twilioAuthToken || env.TWILIO_AUTH_TOKEN || '',
    twilioWhatsappFrom: o.twilioWhatsappFrom || env.TWILIO_WHATSAPP_FROM || '',
  };
}

function canSendUserEmail(c: OutreachCredentials): boolean {
  return Boolean(c.smtpHost && c.smtpUser && c.smtpPass);
}

function canSendUserWhatsApp(c: OutreachCredentials): boolean {
  if (c.whatsappPhoneNumberId && c.whatsappAccessToken) return true;
  if (c.twilioAccountSid && c.twilioAuthToken && c.twilioWhatsappFrom) return true;
  return false;
}

/** Send FROM the user's mailbox via their SMTP (Gmail App Password, Outlook, etc.). */
async function sendUserSmtp(
  creds: OutreachCredentials,
  to: string,
  subject: string,
  text: string,
  html: string,
  fromName?: string,
): Promise<string | undefined> {
  const transporter = nodemailer.createTransport({
    host: creds.smtpHost,
    port: creds.smtpPort || 587,
    secure: Boolean(creds.smtpSecure),
    auth: {
      user: creds.smtpUser!,
      pass: creds.smtpPass!,
    },
  });
  const info = await transporter.sendMail({
    from: `"${fromName || 'Candidate'}" <${creds.smtpUser}>`,
    to,
    replyTo: creds.smtpUser,
    subject,
    text,
    html,
  });
  return info.messageId;
}

/** Optional platform fallback (not the user's mailbox). */
async function sendSendGridFallback(
  to: string,
  subject: string,
  text: string,
  html: string,
  replyTo?: { email: string; name?: string },
): Promise<string | undefined> {
  if (!env.SENDGRID_API_KEY || !env.SENDGRID_FROM_EMAIL) {
    throw new Error('No user SMTP configured and SendGrid fallback missing');
  }
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: env.SENDGRID_FROM_EMAIL, name: replyTo?.name || 'ApplyAI' },
      ...(replyTo?.email
        ? { reply_to: { email: replyTo.email, name: replyTo.name || 'Candidate' } }
        : {}),
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

/** Meta WhatsApp Cloud API — background send from user's WA Business number. */
async function sendMetaWhatsApp(
  phoneNumberId: string,
  accessToken: string,
  toPhone: string,
  body: string,
): Promise<string | undefined> {
  const to = toE164ish(toPhone);
  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { preview_url: false, body: body.slice(0, 4000) },
    }),
  });
  const json = (await res.json()) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(`WhatsApp Cloud API: ${json.error?.message || res.status}`);
  }
  return json.messages?.[0]?.id;
}

async function sendTwilioWhatsApp(
  creds: OutreachCredentials,
  toPhone: string,
  body: string,
): Promise<string | undefined> {
  const to = `whatsapp:+${toE164ish(toPhone)}`;
  const from = creds.twilioWhatsappFrom!.startsWith('whatsapp:')
    ? creds.twilioWhatsappFrom!
    : `whatsapp:${creds.twilioWhatsappFrom}`;

  const auth = Buffer.from(`${creds.twilioAccountSid}:${creds.twilioAuthToken}`).toString('base64');
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${creds.twilioAccountSid}/Messages.json`,
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

async function sendUserWhatsApp(
  creds: OutreachCredentials,
  toPhone: string,
  body: string,
): Promise<{ id?: string; fromAccount: string }> {
  if (creds.whatsappPhoneNumberId && creds.whatsappAccessToken) {
    const id = await sendMetaWhatsApp(
      creds.whatsappPhoneNumberId,
      creds.whatsappAccessToken,
      toPhone,
      body,
    );
    return { id, fromAccount: `WhatsApp Business (${creds.whatsappPhoneNumberId})` };
  }
  const id = await sendTwilioWhatsApp(creds, toPhone, body);
  return { id, fromAccount: creds.twilioWhatsappFrom || 'Twilio WhatsApp' };
}

export type OutreachOptions = {
  coverLetter: string;
  coverLetterId?: string;
};

/**
 * Background outreach — never opens apps.
 * 1) Public email in post → send FROM user's SMTP mailbox
 * 2) Else public phone → send FROM user's WhatsApp Business / Twilio WA
 * 3) Else save cover letter only (no browser/WhatsApp open)
 */
export async function outreachApply(
  profile: UserProfile,
  job: Job,
  options: OutreachOptions,
): Promise<OutreachResult> {
  const contacts: JobContacts = {
    email: explicitEmail || extracted.email || null,
    phone: explicitPhone || extracted.phone || null,
  };

  const creds = resolveOutreach(profile);
  // User opt-in to live background send overrides global dry-run
  const dryRun = creds.autoSendEnabled ? false : env.OUTREACH_DRY_RUN;
  const applyUrl = job.applyUrl;
  const coverLetter = options.coverLetter;
  const coverLetterId = options.coverLetterId;

  if (contacts.email) {
    const mail = buildApplicationEmail(profile, job, coverLetter);
    const fromAccount = canSendUserEmail(creds) ? creds.smtpUser! : env.SENDGRID_FROM_EMAIL || '';

    if (dryRun) {
      logger.info('Outreach email dry-run (background)', { to: contacts.email, from: fromAccount });
      return {
        channel: 'email',
        contacts,
        dryRun: true,
        sent: false,
        subject: mail.subject,
        body: mail.text,
        to: contacts.email,
        applyUrl,
        coverLetter,
        coverLetterId,
        fromAccount: fromAccount || undefined,
        note: `Dry-run: would email HR at ${contacts.email} from ${fromAccount || 'your SMTP'}. Enable Auto-send in AI Tools and save SMTP (Gmail App Password).`,
      };
    }

    if (!canSendUserEmail(creds) && !(env.SENDGRID_API_KEY && env.SENDGRID_FROM_EMAIL)) {
      return {
        channel: 'email',
        contacts,
        dryRun: false,
        sent: false,
        subject: mail.subject,
        body: mail.text,
        to: contacts.email,
        applyUrl,
        coverLetter,
        coverLetterId,
        note: `HR email found (${contacts.email}) but no mailbox configured. Add your SMTP in AI Tools → Outreach (Gmail App Password) for background send from your email.`,
      };
    }

    try {
      let id: string | undefined;
      let usedFrom = fromAccount;
      if (canSendUserEmail(creds)) {
        id = await sendUserSmtp(
          creds,
          contacts.email,
          mail.subject,
          mail.text,
          mail.html,
          profile.displayName,
        );
        usedFrom = creds.smtpUser!;
      } else {
        id = await sendSendGridFallback(contacts.email, mail.subject, mail.text, mail.html, {
          email: profile.email,
          name: profile.displayName,
        });
        usedFrom = env.SENDGRID_FROM_EMAIL;
      }
      logger.info('Outreach email sent in background', { to: contacts.email, from: usedFrom });
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
        coverLetter,
        coverLetterId,
        fromAccount: usedFrom,
        note: `Emailed AI cover letter to ${contacts.email} from ${usedFrom} (background — no app opened).`,
      };
    } catch (err) {
      logger.warn('Background email failed', { err: err instanceof Error ? err.message : err });
      return {
        channel: 'email',
        contacts,
        dryRun: false,
        sent: false,
        subject: mail.subject,
        body: mail.text,
        to: contacts.email,
        applyUrl,
        coverLetter,
        coverLetterId,
        note: `Email send failed: ${err instanceof Error ? err.message : 'error'}. Cover letter saved — nothing was opened.`,
      };
    }
  }

  if (contacts.phone) {
    const msg = buildWhatsAppMessage(profile, job, coverLetter);
    const waLink = `https://wa.me/${toE164ish(contacts.phone)}?text=${encodeURIComponent(msg)}`;

    if (dryRun) {
      logger.info('Outreach WhatsApp dry-run (background)', { to: contacts.phone });
      return {
        channel: 'whatsapp',
        contacts,
        dryRun: true,
        sent: false,
        body: msg,
        to: contacts.phone,
        waLink,
        applyUrl,
        coverLetter,
        coverLetterId,
        note: `Dry-run: would WhatsApp ${contacts.phone} from your WhatsApp Business API (background). Enable Auto-send + add Cloud API / Twilio keys in AI Tools.`,
      };
    }

    if (!canSendUserWhatsApp(creds)) {
      return {
        channel: 'whatsapp',
        contacts,
        dryRun: false,
        sent: false,
        body: msg,
        to: contacts.phone,
        waLink,
        applyUrl,
        coverLetter,
        coverLetterId,
        note: `Phone found (${contacts.phone}) but WhatsApp API not configured. Personal WhatsApp app cannot send in background — add Meta Cloud API or Twilio WhatsApp (your Business number) in AI Tools. Nothing was opened.`,
      };
    }

    try {
      const { id, fromAccount } = await sendUserWhatsApp(creds, contacts.phone, msg);
      logger.info('Outreach WhatsApp sent in background', { to: contacts.phone, fromAccount });
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
        coverLetter,
        coverLetterId,
        fromAccount,
        note: `WhatsApp pitch sent to ${contacts.phone} via ${fromAccount} (background — WhatsApp app not opened).`,
      };
    } catch (err) {
      logger.warn('Background WhatsApp failed', { err: err instanceof Error ? err.message : err });
      return {
        channel: 'whatsapp',
        contacts,
        dryRun: false,
        sent: false,
        body: msg,
        to: contacts.phone,
        waLink,
        applyUrl,
        coverLetter,
        coverLetterId,
        note: `WhatsApp API failed: ${err instanceof Error ? err.message : 'error'}. Cover letter saved — app was NOT opened.`,
      };
    }
  }

  return {
    channel: 'none',
    contacts,
    dryRun,
    sent: false,
    applyUrl,
    body: coverLetter,
    coverLetter,
    coverLetterId,
    note:
      'No public HR email or phone in this posting. Application + AI cover letter saved in background — nothing opened. Paste the letter on the board when you choose.',
  };
}
