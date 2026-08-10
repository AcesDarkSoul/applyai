import type { Application, ApplicationStatus } from '../domain/application';
import type { UserProfile } from '../domain/user';
import { applicationRepository, userRepository } from '../repositories';
import { auditService } from './auditService';
import { notificationService } from './notificationService';

const RANK: Record<ApplicationStatus, number> = {
  saved: 0,
  applied: 1,
  viewed: 2,
  interview: 3,
  offer: 4,
  rejected: 5,
  withdrawn: 6,
};

const INTERVIEW_RE =
  /\b(interview|schedule a call|phone screen|technical round|hiring manager|onsite|video call|zoom|meet\.google)\b/i;
const VIEWED_RE =
  /\b(application (was )?viewed|profile viewed|under review|we (have )?received your application|thank you for applying)\b/i;
const OFFER_RE = /\b(offer letter|job offer|pleased to offer|congratulations.{0,40}offer)\b/i;
const REJECT_RE =
  /\b(unfortunately|not moving forward|other candidates|rejected|decline(d)? your application)\b/i;

function daysSince(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return (Date.now() - t) / (1000 * 60 * 60 * 24);
}

function blob(app: Application): string {
  return `${app.notes || ''}\n${(app.timeline || []).map((e) => e.note || '').join('\n')}`;
}

/**
 * Heuristic auto-sync for application timelines (Applied → Viewed → Interview).
 * Uses age + keyword signals in notes/timeline — no unauthorized portal scraping (AD-002).
 */
export function suggestNextStatus(app: Application): {
  status: ApplicationStatus;
  note: string;
  source: 'auto' | 'email_heuristic';
} | null {
  if (app.status === 'rejected' || app.status === 'withdrawn' || app.status === 'offer') {
    return null;
  }

  const text = blob(app);
  const age = daysSince(app.updatedAt || app.createdAt);

  if (REJECT_RE.test(text) && RANK[app.status] < RANK.rejected) {
    return {
      status: 'rejected',
      note: 'Auto-sync: rejection language detected in notes/timeline',
      source: 'email_heuristic',
    };
  }
  if (OFFER_RE.test(text) && RANK[app.status] < RANK.offer) {
    return {
      status: 'offer',
      note: 'Auto-sync: offer language detected in notes/timeline',
      source: 'email_heuristic',
    };
  }
  if (INTERVIEW_RE.test(text) && RANK[app.status] < RANK.interview) {
    return {
      status: 'interview',
      note: 'Auto-sync: interview signal detected in notes/timeline',
      source: 'email_heuristic',
    };
  }
  if (VIEWED_RE.test(text) && RANK[app.status] < RANK.viewed) {
    return {
      status: 'viewed',
      note: 'Auto-sync: recruiter view / under-review signal detected',
      source: 'email_heuristic',
    };
  }

  // Age-based assistive progression (conservative)
  if (app.status === 'applied' && age >= 3) {
    return {
      status: 'viewed',
      note: `Auto-sync: marked viewed after ${Math.floor(age)} days without update (assistive estimate — confirm manually if needed)`,
      source: 'auto',
    };
  }
  if (app.status === 'viewed' && age >= 10 && INTERVIEW_RE.test(text)) {
    return {
      status: 'interview',
      note: 'Auto-sync: advanced to interview from viewed + interview cues',
      source: 'email_heuristic',
    };
  }

  return null;
}

export type SyncResult = {
  checked: number;
  updated: Application[];
  unchanged: number;
};

export async function syncApplicationStatuses(
  userId: string,
  opts?: { applicationId?: string },
): Promise<SyncResult> {
  const all = await applicationRepository.listByUser(userId);
  const targets = opts?.applicationId
    ? all.filter((a) => a.id === opts.applicationId)
    : all.filter((a) => !['rejected', 'withdrawn', 'offer'].includes(a.status));

  const updated: Application[] = [];
  let unchanged = 0;
  let profile: UserProfile | null = null;

  for (const app of targets) {
    const suggestion = suggestNextStatus(app);
    if (!suggestion) {
      unchanged += 1;
      // still stamp lastSyncedAt via create overwrite
      const stamped = {
        ...app,
        lastSyncedAt: new Date().toISOString(),
      };
      await applicationRepository.create(stamped);
      continue;
    }

    const next = await applicationRepository.updateStatus(
      userId,
      app.id,
      suggestion.status,
      suggestion.note,
    );
    const withMeta: Application = {
      ...next,
      lastSyncedAt: new Date().toISOString(),
      syncSource: suggestion.source,
      interviewAt:
        suggestion.status === 'interview' ? next.interviewAt || new Date().toISOString() : next.interviewAt,
    };
    const saved = await applicationRepository.create(withMeta);
    updated.push(saved);

    await auditService.append(userId, 'status_sync', suggestion.note, {
      applicationId: saved.id,
      jobId: saved.jobId,
      metadata: { from: app.status, to: suggestion.status, source: suggestion.source },
    });

    if (suggestion.status === 'interview' || suggestion.status === 'offer') {
      if (!profile) {
        profile = await userRepository.getById(userId);
      }
      if (profile?.email) {
        await notificationService.notifyInterviewUpdate(profile, saved);
      }
    }
  }

  return { checked: targets.length, updated, unchanged };
}
