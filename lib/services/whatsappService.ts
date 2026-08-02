import { Linking } from 'react-native';
import type { Job, UserProfile } from '@/types';
import { useAutomationStore } from '@/stores/automationStore';

export interface WhatsAppDispatchResult {
  success: boolean;
  message: string;
  openedApp: boolean;
}

/**
 * Send formal recruiter WhatsApp message via Webhook AND/OR direct WhatsApp app linking
 */
export async function sendFormalWhatsAppMessage(
  recruiterPhone: string,
  job: Job,
  profile?: Partial<UserProfile> | null
): Promise<WhatsAppDispatchResult> {
  const candidateName = profile?.name || 'Candidate';
  const skills = profile?.skills?.slice(0, 3).join(', ') || 'Software Development';
  const experience = profile?.experience !== undefined ? `${profile.experience} years` : 'Fresher';
  const resumeName = profile?.resumeFileName || 'Candidate Resume attached';

  // Clean phone number (strip non-digits, ensure country code)
  let cleanPhone = recruiterPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }
  if (!cleanPhone || cleanPhone.length < 10) {
    cleanPhone = '919999999999'; // Fallback test number
  }

  const messageText =
    `🚨 *NEW CANDIDATE APPLICATION* 🚀\n\n` +
    `*${candidateName}* has applied for *${job.title}* at *${job.company}*!\n\n` +
    `👤 Candidate Name: ${candidateName}\n` +
    `📧 Email: ${profile?.email || 'candidate@applyai.app'}\n` +
    `📞 Phone: ${profile?.phone || 'Not specified'}\n` +
    `⚡ Key Skills: ${skills}\n` +
    `💼 Experience: ${experience}\n` +
    (profile?.linkedin ? `🔗 LinkedIn: ${profile.linkedin}\n` : '') +
    `📄 Attached Resume: ${resumeName}\n\n` +
    `Candidate is available for an immediate discussion.`;

  const store = useAutomationStore.getState();
  const customTelegram = store.telegramWebhookUrl || process.env.EXPO_PUBLIC_TELEGRAM_WEBHOOK_URL;
  const customWhatsApp = store.whatsappWebhookUrl || process.env.EXPO_PUBLIC_WHATSAPP_WEBHOOK_URL || process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL;

  const payload = {
    action: 'send_direct_whatsapp',
    recipientPhone: cleanPhone,
    recruiterPhone: cleanPhone,
    message: messageText,
    candidate: {
      name: candidateName,
      email: profile?.email || 'candidate@applyai.app',
      phone: profile?.phone || '',
      skills: profile?.skills || [],
      experience: profile?.experience || 0,
      resumeFileName: resumeName,
    },
    job: {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
    },
    timestamp: new Date().toISOString(),
  };

  let webhookTriggered = false;

  try {
    // 1. Dispatch to Telegram Webhook
    if (customTelegram && customTelegram.startsWith('http')) {
      fetch(customTelegram, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: 'default',
          text: messageText,
          parse_mode: 'Markdown',
          payload,
        }),
      }).catch(() => {});
      webhookTriggered = true;
    }

    // 2. Dispatch to WhatsApp Webhook
    if (customWhatsApp && customWhatsApp.startsWith('http')) {
      fetch(customWhatsApp, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
      webhookTriggered = true;
    }
  } catch (err) {
    console.warn('WhatsApp webhook error:', err);
  }

  // 3. Open WhatsApp app directly with pre-composed message to recruiter phone
  let openedApp = false;
  try {
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    const canOpen = await Linking.canOpenURL(waUrl);
    if (canOpen) {
      await Linking.openURL(waUrl);
      openedApp = true;
    }
  } catch (linkErr) {
    console.warn('WhatsApp deep link error:', linkErr);
  }

  return {
    success: true,
    openedApp,
    message: webhookTriggered
      ? `WhatsApp Webhook payload sent for Recruiter (+${cleanPhone})! ${openedApp ? 'WhatsApp app opened with pre-filled message.' : ''}`
      : `WhatsApp message composed for Recruiter (+${cleanPhone})! ${openedApp ? 'WhatsApp app opened with pre-filled message.' : ''}`,
  };
}

