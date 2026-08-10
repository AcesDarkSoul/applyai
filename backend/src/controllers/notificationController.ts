import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { notificationService } from '../services/notificationService';
import { profileService } from '../services/profileService';

const prefsSchema = z.object({
  inAppEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  highMatchJobs: z.boolean().optional(),
  interviewUpdates: z.boolean().optional(),
  weeklySummary: z.boolean().optional(),
  highMatchMinScore: z.number().min(40).max(100).optional(),
  pushTokens: z.array(z.string().max(400)).max(10).optional(),
});

export async function listNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const unreadOnly = req.query.unread === '1' || req.query.unread === 'true';
    const data = await notificationService.list(req.user!.uid, { unreadOnly });
    const unreadCount = await notificationService.unreadCount(req.user!.uid);
    res.json({ success: true, data, meta: { unreadCount } });
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await notificationService.markRead(req.user!.uid, req.params.id);
    if (!data) throw new AppError(404, 'Notification not found', 'NOT_FOUND');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const count = await notificationService.markAllRead(req.user!.uid);
    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
}

export async function updateNotificationPrefs(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const prefs = prefsSchema.parse(req.body || {});
    const current = await profileService.getOrCreate(req.user!);
    const profile = await profileService.update(req.user!, {
      notificationPrefs: {
        ...(current.notificationPrefs || {}),
        ...prefs,
      },
    });
    res.json({ success: true, data: profile.notificationPrefs || prefs });
  } catch (err) {
    next(err);
  }
}

export async function registerPushToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = z.object({ token: z.string().min(8).max(400) }).parse(req.body);
    const current = await profileService.getOrCreate(req.user!);
    const tokens = [
      ...new Set([...(current.notificationPrefs?.pushTokens || []), body.token]),
    ].slice(0, 10);
    const profile = await profileService.update(req.user!, {
      notificationPrefs: {
        ...(current.notificationPrefs || {}),
        pushEnabled: true,
        pushTokens: tokens,
      },
    });
    res.json({
      success: true,
      data: { pushTokens: profile.notificationPrefs?.pushTokens || tokens },
    });
  } catch (err) {
    next(err);
  }
}
