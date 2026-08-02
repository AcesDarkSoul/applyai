import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { jobService } from '../services/jobService';
import { profileService } from '../services/profileService';
import { memoryStore } from '../repositories/memory/store';

const searchSchema = z.object({
  q: z.string().optional().default(''),
});

export async function searchJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q } = searchSchema.parse(req.query);
    const profile = await profileService.getOrCreate(req.user!);
    const jobs = await jobService.search(q, profile);
    res.json({ success: true, data: jobs });
  } catch (err) {
    next(err);
  }
}

export async function getJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await profileService.getOrCreate(req.user!);
    const job = await jobService.getById(req.params.id, profile);
    if (!job) throw new AppError(404, 'Job not found', 'NOT_FOUND');
    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
}

export async function todaysJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await profileService.getOrCreate(req.user!);
    const jobs = await jobService.search('', profile);
    const sorted = [...jobs].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    res.json({ success: true, data: sorted });
  } catch (err) {
    next(err);
  }
}

export async function saveJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = req.user!.uid;
    const set = memoryStore.savedJobIds.get(uid) ?? new Set<string>();
    set.add(req.params.id);
    memoryStore.savedJobIds.set(uid, set);
    res.json({ success: true, data: { saved: [...set] } });
  } catch (err) {
    next(err);
  }
}

export async function listSavedJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = req.user!.uid;
    const profile = await profileService.getOrCreate(req.user!);
    const ids = memoryStore.savedJobIds.get(uid) ?? new Set<string>();
    const all = await jobService.search('', profile);
    res.json({ success: true, data: all.filter((j) => ids.has(j.id)) });
  } catch (err) {
    next(err);
  }
}
