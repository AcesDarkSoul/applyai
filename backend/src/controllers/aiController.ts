import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { aiService } from '../services/aiService';
import { jobService } from '../services/jobService';
import { profileService } from '../services/profileService';
import { resumeService } from '../services/resumeService';

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

    const content = await aiService.generateCoverLetter(profile, job);
    const saved = await resumeService.saveCoverLetter(req.user!, {
      jobId,
      jobTitle: job.title,
      company: job.company,
      content,
    });

    res.json({
      success: true,
      data: {
        jobId,
        content,
        coverLetterId: saved.id,
        aiAssisted: true,
        promptVersion: 'cover-letter@v1',
      },
    });
  } catch (err) {
    next(err);
  }
}
