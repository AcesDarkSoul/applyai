import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { profileService } from '../services/profileService';

const updateSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  phone: z.string().max(40).optional(),
  skills: z.array(z.string()).optional(),
  experienceYears: z.number().min(0).max(60).optional(),
  education: z.array(z.string()).optional(),
  summary: z.string().max(4000).optional(),
  preferredLocations: z.array(z.string()).optional(),
  expectedSalary: z.string().max(80).optional(),
  remotePreference: z.enum(['remote', 'hybrid', 'onsite', 'any']).optional(),
});

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await profileService.getOrCreate(req.user!);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const patch = updateSchema.parse(req.body);
    const profile = await profileService.update(req.user!, patch);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}
