import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { jobService } from '../services/jobService';
import { profileService } from '../services/profileService';
import { memoryStore } from '../repositories/memory/store';

const searchSchema = z.object({
  q: z.string().optional().default(''),
});

const ingestSchema = z.object({
  jobs: z
    .array(
      z.object({
        jobId: z.string().optional(),
        id: z.string().optional(),
        sourcePlatform: z.string().optional(),
        source: z.string().optional(),
        title: z.string().optional(),
        company: z.string().optional(),
        location: z.string().optional(),
        isRemote: z.boolean().optional(),
        description: z.string().optional(),
        applyUrl: z.string().optional(),
        postedAt: z.string().optional(),
      }),
    )
    .min(1),
  source: z.string().optional().default('n8n'),
});

const refreshSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
});

export async function searchJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q } = searchSchema.parse(req.query);
    const profile = await profileService.getOrCreate(req.user!);
    const jobs = await jobService.search(q, profile);
    res.json({ success: true, data: jobs, meta: jobService.catalogMeta() });
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
    res.json({ success: true, data: sorted, meta: jobService.catalogMeta() });
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

/** n8n / automation ingest — auth via X-Ingest-Key (or Bearer demo in DEMO_MODE). */
export async function ingestJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const key = String(req.headers['x-ingest-key'] || '');
    const auth = String(req.headers.authorization || '');
    const okKey = Boolean(key && key === env.INGEST_API_KEY);
    const okDemo = env.DEMO_MODE && auth.startsWith('Bearer demo-');
    if (!okKey && !okDemo) {
      throw new AppError(401, 'Invalid ingest credentials', 'UNAUTHORIZED');
    }

    const body = ingestSchema.parse(req.body);
    const result = await jobService.ingestNormalized(body.jobs, body.source);
    res.status(201).json({
      success: true,
      data: {
        ...result,
        catalog: jobService.catalogMeta(),
      },
    });
  } catch (err) {
    next(err);
  }
}

/** Live refresh from Apify + SerpApi (same sources as n8n). */
export async function refreshJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = refreshSchema.parse(req.body ?? {});
    const result = await jobService.refreshFromProviders(body.query, body.location);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function catalogStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ success: true, data: jobService.catalogMeta() });
  } catch (err) {
    next(err);
  }
}
