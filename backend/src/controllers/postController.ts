import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { jobService } from '../services/jobService';
import { profileService } from '../services/profileService';
import { isHiringPost, toHiringPost } from '../services/contentParse';

export async function listPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await profileService.getOrCreate(req.user!);
    const q = String(req.query.q || '');
    const jobs = await jobService.search(q, profile);
    const posts = jobs.filter(isHiringPost).map(toHiringPost);
    res.json({
      success: true,
      data: posts,
      meta: { count: posts.length, kind: 'hiring_posts' },
    });
  } catch (err) {
    next(err);
  }
}

export async function getPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await profileService.getOrCreate(req.user!);
    const rawId = req.params.id.replace(/^post-/, '');
    const job = await jobService.getById(rawId, profile);
    if (!job || !isHiringPost(job)) {
      throw new AppError(404, 'Post not found', 'NOT_FOUND');
    }
    res.json({ success: true, data: toHiringPost(job) });
  } catch (err) {
    next(err);
  }
}

/** Formal job boards only (Indeed / Naukri / other) — LinkedIn & Google Jobs live under Posts. */
export async function listFormalJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await profileService.getOrCreate(req.user!);
    const q = String(req.query.q || '');
    const jobs = await jobService.search(q, profile);
    const formal = jobs.filter((j) => !isHiringPost(j));
    res.json({
      success: true,
      data: formal,
      meta: { count: formal.length, kind: 'jobs' },
    });
  } catch (err) {
    next(err);
  }
}
