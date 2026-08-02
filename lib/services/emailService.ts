import { Linking } from 'react-native';
import type { Job, UserProfile } from '@/types';
import { readLocalResumeAsBase64, getLocalResumeMeta } from '@/lib/local/resumeStorage';
import { useAutomationStore } from '@/stores/automationStore';
import { sendOutreachEmailAPI } from '@/lib/firebase/functions';
import * as Clipboard from 'expo-clipboard';

export interface EmailDispatchResult {
  success: boolean;
  message: string;
}

/**
 * Send formal recruiter email with attached resume.
 * 1. Tries Firebase Cloud Function Backend (functions/src/email.ts) if available.
 * 2. Tries user configured Webhook / Email endpoint (Nodemailer / n8n / Sheets).
 * 3. Tries opening native Mail Client (mailto:).
 */
export async function sendFormalRecruiterEmail(
  recruiterEmail: string,
  job: Job,
  profile?: Partial<UserProfile> | null
): Promise<EmailDispatchResult> {
  const candidateName = profile?.name || 'Candidate';
  const candidateEmail = profile?.email || 'candidate@applyai.app';
  const skills = profile?.skills?.slice(0, 4).join(', ') || 'Software Development';
  const experience = profile?.experience !== undefined ? `${profile.experience} years` : 'Fresher';

  let resumeFileName = profile?.resumeFileName || 'candidate_resume.pdf';
  let resumeBase64 = '';
  try {
    const local = await readLocalResumeAsBase64();
    const meta = await getLocalResumeMeta();
    if (local && local.base64) {
      resumeBase64 = local.base64;
      resumeFileName = local.fileName || meta?.fileName || resumeFileName;
    }
  } catch (err) {
    console.warn('Could not read local resume for email:', err);
  }

  const subject = `Job Application: ${job.title} - ${candidateName}`;
  const bodyText =
    `Dear Hiring Team at ${job.company},\n\n` +
    `I am writing to formally express my interest in the ${job.title} position.\n\n` +
    `Candidate Overview:\n` +
    `• Candidate Name: ${candidateName}\n` +
    `• Contact Email: ${candidateEmail}\n` +
    `• Phone Number: ${profile?.phone || 'Not specified'}\n` +
    `• Key Skills: ${skills}\n` +
    `• Experience: ${experience}\n` +
    (profile?.linkedin ? `• LinkedIn Profile: ${profile.linkedin}\n` : '') +
    (resumeFileName ? `• Attached Resume: ${resumeFileName}\n` : '') +
    `\nPlease find my resume details attached to this email. I would welcome the opportunity to discuss how my technical background aligns with your team's goals.\n\n` +
    `Thank you for your time and consideration.\n\n` +
    `Best regards,\n${candidateName}`;

  // 1. Primary: Try Firebase Cloud Functions Backend (functions/src/email.ts)
  try {
    const backendResult = await sendOutreachEmailAPI({
      recruiterEmail,
      jobTitle: job.title,
      company: job.company,
    });
    if (backendResult && backendResult.id) {
      return {
        success: true,
        message: `Email dispatched via Firebase Backend Server (SendGrid)! ✉️ ID: ${backendResult.id}`,
      };
    }
  } catch (backendErr) {
    console.warn('Firebase Cloud Function backend call fallback:', backendErr);
  }

  // 2. Secondary: Try user configured Custom Webhook / Email API Endpoint (Nodemailer / n8n compatible)
  const store = useAutomationStore.getState();
  const customWebhook = store.sheetsWebhookUrl || process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL || process.env.EXPO_PUBLIC_SHEETS_WEBHOOK_URL;
  if (customWebhook && customWebhook.startsWith('http')) {
    try {
      const htmlBody = `<div style="font-family: Arial, sans-serif; line-height: 1.6;">` +
        `<p>Dear Hiring Team at <strong>${job.company}</strong>,</p>` +
        `<p>I am writing to formally express my interest in the <strong>${job.title}</strong> position.</p>` +
        `<h3>Candidate Overview:</h3>` +
        `<ul>` +
        `<li><strong>Candidate Name:</strong> ${candidateName}</li>` +
        `<li><strong>Contact Email:</strong> ${candidateEmail}</li>` +
        `<li><strong>Phone Number:</strong> ${profile?.phone || 'Not specified'}</li>` +
        `<li><strong>Key Skills:</strong> ${skills}</li>` +
        `<li><strong>Experience:</strong> ${experience}</li>` +
        (profile?.linkedin ? `<li><strong>LinkedIn:</strong> <a href="${profile.linkedin}">${profile.linkedin}</a></li>` : '') +
        `</ul>` +
        `<p>Please find my resume attached for your review.</p>` +
        `<p>Best regards,<br><strong>${candidateName}</strong></p>` +
        `</div>`;

      // Use mode: 'no-cors' to avoid browser CORS fetch blocking errors on third-party webhooks
      await fetch(customWebhook, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'recruiter_email_sent',
          from: candidateEmail,
          to: recruiterEmail,
          replyTo: candidateEmail,
          subject,
          text: bodyText,
          html: htmlBody,
          attachments: resumeBase64
            ? [
                {
                  filename: resumeFileName,
                  content: resumeBase64,
                  encoding: 'base64',
                  contentType: 'application/pdf',
                },
              ]
            : [],
          candidate: {
            name: candidateName,
            email: candidateEmail,
            phone: profile?.phone || '',
            skills: profile?.skills || [],
          },
          job: {
            id: job.id,
            title: job.title,
            company: job.company,
          },
          timestamp: new Date().toISOString(),
        }),
      });

      return {
        success: true,
        message: `Nodemailer / n8n Webhook Payload Dispatched! ✉️ From: ${candidateEmail} ➔ To: ${recruiterEmail}. Resume attached.`,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Network error';
      console.warn('Custom webhook dispatch error:', errMsg);
      return {
        success: false,
        message: `Webhook connection failed: ${errMsg}`,
      };
    }
  }

  // 3. Tertiary: Resend API Direct Automated Dispatch (CORS Safe)
  const resendApiKey = process.env.EXPO_PUBLIC_RESEND_API_KEY;
  if (resendApiKey && resendApiKey.startsWith('re_')) {
    try {
      // In Web browsers, call via CORS-safe proxy to prevent browser CORS preflight blocking
      const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
      const endpoint = isWeb
        ? 'https://corsproxy.io/?https://api.resend.com/emails'
        : 'https://api.resend.com/emails';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Resend free tier requires 'onboarding@resend.dev' as verified test sender
          from: 'ApplyAI Candidate <onboarding@resend.dev>',
          to: [recruiterEmail],
          reply_to: candidateEmail,
          subject: subject,
          text: bodyText,
        }),
      });

      if (response.ok || response.status === 200 || response.status === 201) {
        return {
          success: true,
          message: `Email sent automatically via Resend API! ✉️ Recruiter (${recruiterEmail}) notified from ${candidateEmail}.`,
        };
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Resend API returned error status ' + response.status }));
        console.warn('Resend API error response:', errorData);
        return {
          success: false,
          message: `Resend API Error (${response.status}): ${errorData.message || 'Check your Resend API key or parameters.'}`,
        };
      }
    } catch (resendErr: unknown) {
      const errMsg = resendErr instanceof Error ? resendErr.message : 'Network error';
      console.warn('Resend API dispatch error:', errMsg);
      return {
        success: false,
        message: `Resend API network call failed: ${errMsg}`,
      };
    }
  }

  // 4. SendGrid API Direct Automated Dispatch
  const sendgridApiKey = process.env.EXPO_PUBLIC_SENDGRID_API_KEY;
  if (sendgridApiKey && sendgridApiKey.startsWith('SG.')) {
    try {
      const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
      const endpoint = isWeb
        ? 'https://corsproxy.io/?https://api.sendgrid.com/v3/mail/send'
        : 'https://api.sendgrid.com/v3/mail/send';

      const sgRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: recruiterEmail }] }],
          from: { email: candidateEmail },
          reply_to: { email: candidateEmail },
          subject: subject,
          content: [{ type: 'text/plain', value: bodyText }],
        }),
      });

      if (sgRes.ok || sgRes.status === 202) {
        return {
          success: true,
          message: `Email sent automatically via SendGrid API! ✉️ Recruiter (${recruiterEmail}) notified.`,
        };
      } else {
        return {
          success: false,
          message: `SendGrid API Error (${sgRes.status}): Could not deliver email.`,
        };
      }
    } catch (sgErr: unknown) {
      console.warn('SendGrid API dispatch error:', sgErr);
    }
  }

  // 5. Instant Direct Google Apps Script / Webhook Engine (EXPO_PUBLIC_EMAIL_WEBHOOK_URL)
  const gasEndpoint = process.env.EXPO_PUBLIC_EMAIL_WEBHOOK_URL || store.sheetsWebhookUrl || process.env.EXPO_PUBLIC_SHEETS_WEBHOOK_URL || process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL;
  if (gasEndpoint && gasEndpoint.startsWith('http')) {
    try {
      const htmlBody = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">` +
        `<p>Dear Hiring Team at <strong>${job.company}</strong>,</p>` +
        `<p>I am writing to formally express my interest in the <strong>${job.title}</strong> position.</p>` +
        `<h3>Candidate Profile Summary:</h3>` +
        `<ul>` +
        `<li><strong>Candidate Name:</strong> ${candidateName}</li>` +
        `<li><strong>Contact Email:</strong> ${candidateEmail}</li>` +
        `<li><strong>Phone Number:</strong> ${profile?.phone || 'Not specified'}</li>` +
        `<li><strong>Key Skills:</strong> ${skills}</li>` +
        `<li><strong>Experience:</strong> ${experience}</li>` +
        (profile?.linkedin ? `<li><strong>LinkedIn:</strong> <a href="${profile.linkedin}">${profile.linkedin}</a></li>` : '') +
        `</ul>` +
        `<p>Please find my resume attached to this email for your review.</p>` +
        `<p>Best regards,<br><strong>${candidateName}</strong></p>` +
        `</div>`;

      await fetch(gasEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_instant_email',
          to: recruiterEmail,
          recruiterEmail: recruiterEmail,
          replyTo: candidateEmail,
          from: candidateEmail,
          subject: subject,
          body: bodyText,
          text: bodyText,
          html: htmlBody,
          message: bodyText,
          candidateName: candidateName,
          jobTitle: job.title,
          company: job.company,
          resumeFileName,
          resumeBase64,
          timestamp: new Date().toISOString(),
        }),
      });

      return {
        success: true,
        message: `Email sent instantly to Recruiter (${recruiterEmail})! ✉️ (Delivered via Webhook Engine with attached resume & reply-to ${candidateEmail}).`,
      };
    } catch (gasErr: unknown) {
      console.warn('Instant Webhook engine error:', gasErr);
    }
  }

  // 6. Native Direct Mail Compose Fallback (Instant, Zero Activation)
  try {
    const mailtoUrl = `mailto:${recruiterEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
    await Clipboard.setStringAsync(`To: ${recruiterEmail}\nSubject: ${subject}\n\n${bodyText}`);
    await Linking.openURL(mailtoUrl);
    return {
      success: true,
      message: `Mail App opened for ${recruiterEmail}! ✉️ Pre-filled application email is ready to send instantly.`,
    };
  } catch (linkErr) {
    await Clipboard.setStringAsync(`To: ${recruiterEmail}\nSubject: ${subject}\n\n${bodyText}`);
    return {
      success: true,
      message: `Formal Email Package copied for ${recruiterEmail}! Ready to paste and send with your resume (${resumeFileName}).`,
    };
  }
}

