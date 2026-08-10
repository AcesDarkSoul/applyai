import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';
import type { Job } from '../domain/job';
import {
  DEFAULT_NOTIFICATION_PREFS,
  type AppNotification,
  type NotificationPrefs,
  type NotificationType,
} from '../domain/notification';
import type { UserProfile } from '../domain/user';
import { fileStore } from '../repositories/file/fileStore';
import type { Application } from '../domain/application';

function mergePrefs(profile: UserProfile): Required<
  Omit<NotificationPrefs, 'pushTokens'>
> & { pushTokens: string[] } {
  return {
    ...DEFAULT_NOTIFICATION_PREFS,
    ...(profile.notificationPrefs || {}),
    pushTokens: profile.notificationPrefs?.pushTokens || [],
  };
}

async function sendProductEmail(
  to: string,
  subject: string,
  text: string,
): Promise<boolean> {
  const html = text.replace(/\n/g, '<br/>');

  if (env.SENDGRID_API_KEY && env.SENDGRID_FROM_EMAIL) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: env.SENDGRID_FROM_EMAIL, name: 'ApplyAI' },
          subject,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html },
          ],
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        logger.warn('Notification SendGrid failed', { status: res.status, body: body.slice(0, 200) });
        return false;
      }
      return true;
    } catch (err) {
      logger.warn('Notification SendGrid error', {
        err: err instanceof Error ? err.message : err,
      });
      return false;
    }
  }

  if (env.USER_SMTP_HOST && env.USER_SMTP_USER && env.USER_SMTP_PASS) {
    try {
      const transport = nodemailer.createTransport({
        host: env.USER_SMTP_HOST,
        port: env.USER_SMTP_PORT || 587,
        secure: env.USER_SMTP_SECURE,
        auth: { user: env.USER_SMTP_USER, pass: env.USER_SMTP_PASS },
      });
      await transport.sendMail({
        from: `"ApplyAI" <${env.USER_SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });
      return true;
    } catch (err) {
      logger.warn('Notification SMTP error', {
        err: err instanceof Error ? err.message : err,
      });
      return false;
    }
  }

  logger.info('Notification email skipped (no SendGrid/SMTP)', { to, subject });
  return false;
}

export class NotificationService {
  async list(userId: string, opts?: { unreadOnly?: boolean; limit?: number }): Promise<AppNotification[]> {
    const rows = await fileStore.queryByField<AppNotification>('notifications', 'userId', userId);
    let out = rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    if (opts?.unreadOnly) out = out.filter((n) => !n.read);
    return out.slice(0, opts?.limit ?? 80);
  }

  async unreadCount(userId: string): Promise<number> {
    const rows = await this.list(userId, { unreadOnly: true, limit: 200 });
    return rows.length;
  }

  async markRead(userId: string, id: string): Promise<AppNotification | null> {
    const row = await fileStore.get<AppNotification>('notifications', id);
    if (!row || row.userId !== userId) return null;
    const updated = { ...row, read: true };
    await fileStore.set('notifications', id, updated);
    return updated;
  }

  async markAllRead(userId: string): Promise<number> {
    const rows = await this.list(userId, { unreadOnly: true, limit: 500 });
    for (const row of rows) {
      await fileStore.set('notifications', row.id, { ...row, read: true });
    }
    return rows.length;
  }

  async create(
    profile: UserProfile,
    input: {
      type: NotificationType;
      title: string;
      body: string;
      href?: string;
      jobId?: string;
      applicationId?: string;
      forceEmail?: boolean;
    },
  ): Promise<AppNotification> {
    const prefs = mergePrefs(profile);
    const channels: AppNotification['channels'] = [];
    if (prefs.inAppEnabled) channels.push('in_app');
    if (prefs.pushEnabled && prefs.pushTokens.length) channels.push('push');

    let allowEmail = prefs.emailEnabled;
    if (input.type === 'high_match_job' && prefs.highMatchJobs === false) allowEmail = false;
    if (input.type === 'interview_update' && prefs.interviewUpdates === false) allowEmail = false;
    if (input.type === 'weekly_summary' && prefs.weeklySummary === false) allowEmail = false;

    if (input.type === 'high_match_job' && prefs.highMatchJobs === false && !input.forceEmail) {
      // Still allow in-app if master on — only skip when type disabled entirely
    }
    const typeEnabled =
      input.type === 'high_match_job'
        ? prefs.highMatchJobs !== false
        : input.type === 'interview_update'
          ? prefs.interviewUpdates !== false
          : input.type === 'weekly_summary'
            ? prefs.weeklySummary !== false
            : true;

    if (!typeEnabled) {
      const skipped: AppNotification = {
        id: randomUUID(),
        userId: profile.uid,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href,
        jobId: input.jobId,
        applicationId: input.applicationId,
        read: true,
        channels: [],
        createdAt: new Date().toISOString(),
      };
      return skipped;
    }

    if (allowEmail) channels.push('email');

    const notification: AppNotification = {
      id: randomUUID(),
      userId: profile.uid,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
      jobId: input.jobId,
      applicationId: input.applicationId,
      read: false,
      channels,
      emailSent: false,
      createdAt: new Date().toISOString(),
    };

    if (prefs.inAppEnabled) {
      await fileStore.set('notifications', notification.id, notification);
    }

    if (channels.includes('email')) {
      const sent = await sendProductEmail(profile.email, input.title, input.body);
      notification.emailSent = sent;
      if (prefs.inAppEnabled) {
        await fileStore.set('notifications', notification.id, notification);
      }
    }

    // Push delivery is token-ready but transport is Phase 3 mobile; tokens are stored on prefs.
    return notification;
  }

  async notifyHighMatchJobs(profile: UserProfile, jobs: Job[]): Promise<number> {
    const prefs = mergePrefs(profile);
    const min = prefs.highMatchMinScore ?? 70;
    const hits = jobs.filter((j) => (j.matchScore ?? 0) >= min).slice(0, 8);
    if (!hits.length) return 0;

    let created = 0;
    for (const job of hits) {
      await this.create(profile, {
        type: 'high_match_job',
        title: `High match: ${job.title}`,
        body: `${job.matchScore}% match at ${job.company} (${job.location}). Open the job to tailor your resume and apply assistively.`,
        href: `/jobs/${job.id}`,
        jobId: job.id,
      });
      created += 1;
    }
    return created;
  }

  async notifyInterviewUpdate(
    profile: UserProfile,
    app: Application,
  ): Promise<AppNotification> {
    return this.create(profile, {
      type: 'interview_update',
      title: `Interview update: ${app.jobTitle}`,
      body: `Your application at ${app.company} moved to "${app.status}".${
        app.interviewAt ? ` Interview time: ${new Date(app.interviewAt).toLocaleString()}.` : ''
      } Review the timeline and prep in Applications.`,
      href: '/applications',
      applicationId: app.id,
      jobId: app.jobId,
    });
  }

  async sendWeeklySummary(
    profile: UserProfile,
    stats: {
      applied: number;
      interviews: number;
      offers: number;
      highMatches: number;
      topJobs?: Array<{ title: string; company: string; score: number }>;
    },
  ): Promise<AppNotification> {
    const lines = [
      `Weekly ApplyAI summary for ${profile.displayName || profile.email}`,
      '',
      `• Applications this week: ${stats.applied}`,
      `• Interviews: ${stats.interviews}`,
      `• Offers: ${stats.offers}`,
      `• New high-match roles surfaced: ${stats.highMatches}`,
    ];
    if (stats.topJobs?.length) {
      lines.push('', 'Top matches:');
      for (const j of stats.topJobs.slice(0, 5)) {
        lines.push(`  - ${j.score}% · ${j.title} @ ${j.company}`);
      }
    }
    lines.push('', 'Open ApplyAI to sync statuses and tailor resumes for your best matches.');

    return this.create(profile, {
      type: 'weekly_summary',
      title: 'Your weekly ApplyAI summary',
      body: lines.join('\n'),
      href: '/',
      forceEmail: true,
    });
  }
}

export const notificationService = new NotificationService();
