import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { profileService } from '../services/profileService';
import { parseResumeBuffer, parsedToProfilePatch } from '../services/resumeParseService';

const updateSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  phone: z.string().max(40).optional(),
  title: z.string().max(120).optional(),
  linkedinUrl: z.string().max(300).optional(),
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

/** Upload PDF/DOCX/TXT/MD → parse → strengthen profile. */
export async function uploadResume(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const file = req.file;
    if (!file?.buffer?.length) {
      throw new AppError(400, 'Resume file required (PDF, DOCX, TXT, or MD)', 'VALIDATION');
    }
    if (file.size > 8 * 1024 * 1024) {
      throw new AppError(400, 'Resume must be under 8MB', 'VALIDATION');
    }

    const parsed = await parseResumeBuffer(file.buffer, file.originalname || 'resume.pdf');
    const patch = parsedToProfilePatch(parsed, file.originalname || 'resume.pdf');
    const profile = await profileService.update(req.user!, patch);

    res.status(201).json({
      success: true,
      data: {
        profile,
        parsed: {
          name: parsed.name,
          email: parsed.email,
          phone: parsed.phone,
          title: parsed.title,
          skills: parsed.skills,
          experience: parsed.experience,
          education: parsed.education,
          summary: parsed.summary,
          linkedin: parsed.linkedin,
          location: parsed.location,
          parseMethod: parsed.parseMethod,
          textChars: parsed.textChars,
          atsScore: profile.atsScore,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
