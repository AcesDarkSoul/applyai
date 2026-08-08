import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { generateAndSaveCoverLetter } from '../services/coverLetterService';
import { jobService } from '../services/jobService';
import { profileService } from '../services/profileService';

const coverLetterSchema = z.object({
  jobId: z.string().min(1),
});

export async function generateCoverLetter(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { jobId } = coverLetterSchema.parse(req.body);
    const profile = await profileService.getOrCreate(req.user!);
    const job = await jobService.getById(jobId, profile);
    if (!job) throw new AppError(404, 'Job not found', 'NOT_FOUND');

    if (!profile.summary && !(profile.skills?.length > 1) && !profile.title) {
      throw new AppError(
        400,
        'Upload or complete your resume/profile first so we can draft a cover letter.',
        'PROFILE_INCOMPLETE',
      );
    }

    const cover = await generateAndSaveCoverLetter(req.user!, profile, job);

    res.json({
      success: true,
      data: {
        jobId,
        content: cover.content,
        coverLetterId: cover.id,
        aiAssisted: cover.aiAssisted,
        promptVersion: 'cover-letter@v2',
      },
    });
  } catch (err) {
    next(err);
  }
}
