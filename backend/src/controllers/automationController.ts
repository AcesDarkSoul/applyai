import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import {
  getDailyAutomationStatus,
  loadDailyAutomationStatus,
  runDailyAutomation,
} from '../services/dailyAutomationService';

function allowAutomationTrigger(req: Request): boolean {
  const key = String(req.headers['x-ingest-key'] || '');
  const auth = String(req.headers.authorization || '');
  const okKey = Boolean(key && key === env.INGEST_API_KEY);
  const okDemo = env.DEMO_MODE && auth.startsWith('Bearer demo-');
  const okUser = Boolean(req.user);
  return okKey || okDemo || okUser;
}

export async function getDailyStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = await loadDailyAutomationStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
}

/** Manual trigger — JWT user or X-Ingest-Key */
export async function runDailyNow(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!allowAutomationTrigger(req)) {
      throw new AppError(401, 'Unauthorized to run daily automation', 'UNAUTHORIZED');
    }
    const status = await runDailyAutomation('manual');
    res.status(202).json({
      success: true,
      data: status,
      message: 'Daily job fetch + auto-apply finished (or was already running).',
    });
  } catch (err) {
    next(err);
  }
}

export function peekDailyStatus() {
  return getDailyAutomationStatus();
}
