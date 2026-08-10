import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DEFAULT_SMART_APPLY_PLATFORMS } from '../domain/audit';
import { AppError } from '../middleware/errorHandler';
import { auditService } from '../services/auditService';
import { profileService } from '../services/profileService';

const platformsSchema = z.object({
  linkedin: z.boolean().optional(),
  indeed: z.boolean().optional(),
  naukri: z.boolean().optional(),
  googlejobs: z.boolean().optional(),
  other: z.boolean().optional(),
});

const consentSchema = z.object({
  confirmedAssistiveOnly: z.literal(true),
});

export async function listAuditLog(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const data = await auditService.listByUser(req.user!.uid, limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateSmartApplyPlatforms(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patch = platformsSchema.parse(req.body || {});
    const current = await profileService.getOrCreate(req.user!);
    const smartApplyPlatforms = {
      ...DEFAULT_SMART_APPLY_PLATFORMS,
      ...(current.smartApplyPlatforms || {}),
      ...patch,
    };
    const profile = await profileService.update(req.user!, { smartApplyPlatforms });
    await auditService.append(
      req.user!.uid,
      'platform_toggle',
      `Updated Smart Apply platform toggles: ${JSON.stringify(smartApplyPlatforms)}`,
      { metadata: smartApplyPlatforms },
    );
    res.json({ success: true, data: profile.smartApplyPlatforms });
  } catch (err) {
    next(err);
  }
}

export async function confirmSmartApplyConsent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    consentSchema.parse(req.body || {});
    const now = new Date().toISOString();
    const profile = await profileService.update(req.user!, {
      smartApplyConsentAt: now,
    });
    await auditService.append(
      req.user!.uid,
      'consent_update',
      'User confirmed Smart Apply is assistive-only (no unauthorized third-party form bots)',
      { confirmedAssistiveOnly: true, metadata: { at: now } },
    );
    res.json({
      success: true,
      data: {
        smartApplyConsentAt: profile.smartApplyConsentAt,
        policy:
          'Assistive only (AD-002): ApplyAI prepares materials and opens official postings; it does not submit third-party application forms without you.',
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getComplianceSettings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile = await profileService.getOrCreate(req.user!);
    res.json({
      success: true,
      data: {
        smartApplyConsentAt: profile.smartApplyConsentAt || null,
        smartApplyPlatforms: {
          ...DEFAULT_SMART_APPLY_PLATFORMS,
          ...(profile.smartApplyPlatforms || {}),
        },
        notificationPrefs: profile.notificationPrefs || null,
        policy:
          'Assistive Smart Apply only — explicit confirmation required; per-platform toggles honored; actions are audit-logged.',
      },
    });
  } catch (err) {
    next(err);
  }
}

/** Guard helper used by apply flows */
export function assertAssistiveConsent(body: { confirmedAssistiveOnly?: boolean }): void {
  if (body.confirmedAssistiveOnly !== true) {
    throw new AppError(
      400,
      'Confirm assistive-only Smart Apply (confirmedAssistiveOnly: true) before continuing.',
      'CONSENT_REQUIRED',
    );
  }
}
