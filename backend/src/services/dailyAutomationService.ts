import cron from 'node-cron';
import { env } from '../config/env';
import { logger } from '../config/logger';
import type { AuthUser, UserProfile } from '../domain/user';
import { fileStore } from '../repositories/file/fileStore';
import { userRepository } from '../repositories';
import { applicationService } from './applicationService';
import { jobService } from './jobService';
import { notificationService } from './notificationService';
import { getDailyAutoApplyQuota, isBillingEnforced, isSubscriptionActive } from './planService';
import { syncApplicationStatuses } from './statusSyncService';

export type DailyAutomationStatus = {
  enabled: boolean;
  cron: string;
  timezone: string;
  lastStartedAt?: string;
  lastFinishedAt?: string;
  lastError?: string | null;
  lastFetch?: {
    query?: string;
    ingested?: number;
    sources?: string[];
    error?: string;
  };
  lastUsers?: Array<{
    uid: string;
    email: string;
    applied: number;
    skipped: number;
    sentEmail: number;
    sentWhatsapp: number;
    error?: string;
  }>;
  running: boolean;
};

let running = false;
let task: ReturnType<typeof cron.schedule> | null = null;
let latest: DailyAutomationStatus = {
  enabled: false,
  cron: '0 8 * * *',
  timezone: 'Asia/Kolkata',
  running: false,
};

function profileReady(p: UserProfile): boolean {
  return Boolean(p.summary || (p.skills?.length ?? 0) > 2 || p.title || p.resumeFileName);
}

function dailyApplyEnabled(p: UserProfile): boolean {
  // Default ON when resume/profile is ready; user can opt out in AI Tools
  if (p.outreach?.dailyAutoApplyEnabled === false) return false;
  if (isBillingEnforced() && !isSubscriptionActive(p.subscription)) return false;
  return profileReady(p);
}

async function listUsers(): Promise<UserProfile[]> {
  if (typeof userRepository.listAll === 'function') {
    return userRepository.listAll();
  }
  return [];
}

async function persistStatus(patch: Partial<DailyAutomationStatus>) {
  latest = { ...latest, ...patch };
  try {
    await fileStore.set('automation', 'daily-status', latest);
  } catch {
    // non-fatal
  }
}

export function getDailyAutomationStatus(): DailyAutomationStatus {
  return { ...latest, running };
}

export async function loadDailyAutomationStatus(): Promise<DailyAutomationStatus> {
  try {
    const saved = await fileStore.get<DailyAutomationStatus>('automation', 'daily-status');
    if (saved) {
      latest = { ...latest, ...saved, running };
    }
  } catch {
    // ignore
  }
  return getDailyAutomationStatus();
}

/**
 * 1) Fetch / refresh live jobs into catalog
 * 2) Auto-apply for every eligible user (resume ready + not opted out)
 */
export async function runDailyAutomation(trigger: 'cron' | 'startup' | 'manual' = 'manual') {
  if (running) {
    logger.warn('Daily automation skipped — already running', { trigger });
    return getDailyAutomationStatus();
  }

  running = true;
  const startedAt = new Date().toISOString();
  await persistStatus({
    running: true,
    lastStartedAt: startedAt,
    lastError: null,
  });

  logger.info('Daily automation started', { trigger });

  try {
    const users = await listUsers();
    const seed =
      users.find((u) => profileReady(u)) ||
      ({
        uid: 'system',
        email: 'system@applyai.local',
        displayName: 'System',
        role: 'user',
        skills: [],
        education: [],
        preferredLocations: [],
        profileCompleteness: 0,
        createdAt: startedAt,
        updatedAt: startedAt,
        title: env.JOB_SEARCH_QUERY,
      } as UserProfile);

    let fetchMeta: NonNullable<DailyAutomationStatus['lastFetch']> = {};
    try {
      const refreshed = await jobService.refreshFromProviders(undefined, undefined, seed);
      fetchMeta = {
        query: refreshed.query,
        ingested: refreshed.jobs?.length ?? 0,
        sources: Object.keys(refreshed.sources || {}),
      };
      logger.info('Daily job fetch complete', fetchMeta);
    } catch (err) {
      fetchMeta = {
        error: err instanceof Error ? err.message : 'Job fetch failed',
      };
      logger.warn('Daily job fetch failed — continuing with existing catalog', fetchMeta);
    }

    const eligible = users.filter(dailyApplyEnabled);
    const userResults: NonNullable<DailyAutomationStatus['lastUsers']> = [];

    for (const profile of eligible) {
      const auth: AuthUser = {
        uid: profile.uid,
        email: profile.email,
        role: profile.role || 'user',
      };
      const quota = getDailyAutoApplyQuota(profile);
      if (quota <= 0) continue;
      const limit = Math.min(
        Math.max(profile.outreach?.dailyAutoApplyLimit ?? quota, 1),
        quota,
      );
      const minScore = profile.outreach?.dailyMinScore ?? env.DAILY_AUTO_APPLY_MIN_SCORE;

      try {
        const result = await applicationService.autoApplyFromResume(auth, profile, {
          minScore,
          limit,
          boardOnly: true,
        });
        const sentEmail = result.applied.filter(
          (a) => a.outreach.channel === 'email' && a.outreach.sent,
        ).length;
        const sentWhatsapp = result.applied.filter(
          (a) => a.outreach.channel === 'whatsapp' && a.outreach.sent,
        ).length;
        userResults.push({
          uid: profile.uid,
          email: profile.email,
          applied: result.applied.length,
          skipped: result.skipped.length,
          sentEmail,
          sentWhatsapp,
        });
        logger.info('Daily auto-apply user done', {
          uid: profile.uid,
          applied: result.applied.length,
          skipped: result.skipped.length,
        });
      } catch (err) {
        userResults.push({
          uid: profile.uid,
          email: profile.email,
          applied: 0,
          skipped: 0,
          sentEmail: 0,
          sentWhatsapp: 0,
          error: err instanceof Error ? err.message : 'auto-apply failed',
        });
        logger.warn('Daily auto-apply user failed', {
          uid: profile.uid,
          err: err instanceof Error ? err.message : err,
        });
      }
    }

    // Module 10 — high-match alerts + weekly digest (Sundays) + Module 9 status sync
    for (const profile of users) {
      try {
        const recommended = await jobService.recommended(profile, {
          minScore: profile.notificationPrefs?.highMatchMinScore ?? 70,
          limit: 12,
        });
        await notificationService.notifyHighMatchJobs(profile, recommended);

        await syncApplicationStatuses(profile.uid);

        const isSunday = new Date().getDay() === 0;
        if (isSunday || trigger === 'manual') {
          const stats = await applicationService.getStats(profile.uid);
          await notificationService.sendWeeklySummary(profile, {
            applied: stats.applied,
            interviews: stats.interview,
            offers: stats.offer,
            highMatches: recommended.length,
            topJobs: recommended.slice(0, 5).map((j) => ({
              title: j.title,
              company: j.company,
              score: j.matchScore ?? 0,
            })),
          });
        }
      } catch (err) {
        logger.warn('Daily notify/sync failed for user', {
          uid: profile.uid,
          err: err instanceof Error ? err.message : err,
        });
      }
    }

    const finishedAt = new Date().toISOString();
    await persistStatus({
      running: false,
      lastFinishedAt: finishedAt,
      lastFetch: fetchMeta,
      lastUsers: userResults,
      lastError: fetchMeta.error && !userResults.length ? fetchMeta.error : null,
    });
    logger.info('Daily automation finished', {
      trigger,
      users: userResults.length,
      applied: userResults.reduce((n, u) => n + u.applied, 0),
    });
  } catch (err) {
    await persistStatus({
      running: false,
      lastFinishedAt: new Date().toISOString(),
      lastError: err instanceof Error ? err.message : 'Daily automation failed',
    });
    logger.error('Daily automation crashed', {
      err: err instanceof Error ? err.message : err,
    });
  } finally {
    running = false;
  }

  return getDailyAutomationStatus();
}

export function startDailyAutomationScheduler() {
  const enabled = env.DAILY_AUTOMATION_ENABLED;
  const expression = env.DAILY_AUTOMATION_CRON || '0 8 * * *';
  const timezone = env.DAILY_AUTOMATION_TZ || 'Asia/Kolkata';

  latest = {
    ...latest,
    enabled,
    cron: expression,
    timezone,
  };

  void loadDailyAutomationStatus().then((s) => {
    latest = { ...s, enabled, cron: expression, timezone, running };
  });

  if (!enabled) {
    logger.info('Daily automation scheduler disabled (DAILY_AUTOMATION_ENABLED=false)');
    return;
  }

  if (!cron.validate(expression)) {
    logger.error('Invalid DAILY_AUTOMATION_CRON — scheduler not started', { expression });
    return;
  }

  if (task) {
    task.stop();
    task = null;
  }

  task = cron.schedule(
    expression,
    () => {
      void runDailyAutomation('cron');
    },
    { timezone },
  );

  logger.info('Daily automation scheduler active', { expression, timezone });

  if (env.DAILY_AUTOMATION_RUN_ON_START) {
    const delayMs = env.DAILY_AUTOMATION_STARTUP_DELAY_MS;
    logger.info(`Daily automation will run once on startup in ${delayMs}ms`);
    setTimeout(() => {
      void runDailyAutomation('startup');
    }, delayMs);
  }
}
