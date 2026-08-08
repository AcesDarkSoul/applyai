import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { profileService } from '../services/profileService';
import { resumeService } from '../services/resumeService';

const experienceEntrySchema = z.object({
  id: z.string().optional(),
  company: z.string().max(160).default(''),
  title: z.string().max(160).default(''),
  location: z.string().max(120).optional(),
  startDate: z.string().max(40).default(''),
  endDate: z.string().max(40).default(''),
  current: z.boolean().optional(),
  bullets: z.array(z.string().max(500)).max(12).default([]),
});

const educationEntrySchema = z.object({
  id: z.string().optional(),
  school: z.string().max(160).default(''),
  degree: z.string().max(160).default(''),
  field: z.string().max(120).optional(),
  startDate: z.string().max(40).optional(),
  endDate: z.string().max(40).optional(),
  details: z.string().max(400).optional(),
});

const projectEntrySchema = z.object({
  id: z.string().optional(),
  name: z.string().max(160).default(''),
  url: z.string().max(300).optional(),
  tech: z.string().max(200).optional(),
  description: z.string().max(800).default(''),
  bullets: z.array(z.string().max(400)).max(8).optional(),
});

const updateSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  phone: z.string().max(40).optional(),
  title: z.string().max(120).optional(),
  linkedinUrl: z.string().max(300).optional(),
  website: z.string().max(300).optional(),
  location: z.string().max(120).optional(),
  skills: z.array(z.string()).optional(),
  experienceYears: z.number().min(0).max(60).optional(),
  education: z.array(z.string()).optional(),
  summary: z.string().max(4000).optional(),
  preferredLocations: z.array(z.string()).optional(),
  expectedSalary: z.string().max(80).optional(),
  remotePreference: z.enum(['remote', 'hybrid', 'onsite', 'any']).optional(),
  experienceEntries: z.array(experienceEntrySchema).max(20).optional(),
  educationEntries: z.array(educationEntrySchema).max(10).optional(),
  projects: z.array(projectEntrySchema).max(15).optional(),
  certifications: z.array(z.string().max(200)).max(30).optional(),
  languages: z.array(z.string().max(80)).max(20).optional(),
  achievements: z.array(z.string().max(400)).max(20).optional(),
  outreach: z
    .object({
      autoSendEnabled: z.boolean().optional(),
      dailyAutoApplyEnabled: z.boolean().optional(),
      dailyAutoApplyLimit: z.number().min(1).max(20).optional(),
      dailyMinScore: z.number().min(0).max(100).optional(),
      smtpHost: z.string().max(200).optional(),
      smtpPort: z.number().min(1).max(65535).optional(),
      smtpSecure: z.boolean().optional(),
      smtpUser: z.string().max(200).optional(),
      smtpPass: z.string().max(200).optional(),
      whatsappPhoneNumberId: z.string().max(120).optional(),
      whatsappAccessToken: z.string().max(500).optional(),
      twilioAccountSid: z.string().max(80).optional(),
      twilioAuthToken: z.string().max(120).optional(),
      twilioWhatsappFrom: z.string().max(80).optional(),
    })
    .optional(),
});

const buildResumeSchema = z.object({
  displayName: z.string().min(1).max(120),
  title: z.string().max(120).optional(),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  phone: z.string().max(40).optional(),
  location: z.string().max(120).optional(),
  linkedinUrl: z.string().max(300).optional(),
  website: z.string().max(300).optional(),
  summary: z.string().max(4000).optional(),
  skills: z.array(z.string().max(80)).max(60).default([]),
  experienceYears: z.number().min(0).max(60).optional(),
  experience: z.array(experienceEntrySchema).max(20).default([]),
  education: z.array(educationEntrySchema).max(10).default([]),
  projects: z.array(projectEntrySchema).max(15).default([]),
  certifications: z.array(z.string().max(200)).max(30).default([]),
  languages: z.array(z.string().max(80)).max(20).default([]),
  achievements: z.array(z.string().max(400)).max(20).default([]),
  template: z.enum(['classic', 'modern', 'executive']).optional(),
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

/** Upload PDF/DOCX/TXT/MD → parse → persist profile + resume doc (Firestore / file mirror). */
export async function uploadResume(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const file = req.file;
    if (!file?.buffer?.length) {
      throw new AppError(400, 'Resume file required (PDF, DOCX, TXT, or MD)', 'VALIDATION');
    }
    if (file.size > 8 * 1024 * 1024) {
      throw new AppError(400, 'Resume must be under 8MB', 'VALIDATION');
    }

    const result = await resumeService.uploadAndPersist(
      req.user!,
      file.buffer,
      file.originalname || 'resume.pdf',
    );

    res.status(201).json({
      success: true,
      data: {
        profile: result.profile,
        resume: result.resume,
        parsed: result.parsed,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** Build an advanced HTML resume from structured form data and persist it. */
export async function buildResume(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = buildResumeSchema.parse(req.body);
    if (!body.experience.length && !body.summary && !body.skills.length) {
      throw new AppError(
        400,
        'Add at least skills, a summary, or one experience entry to build a resume',
        'VALIDATION',
      );
    }
    const optimizeAts = Boolean((req.body as { optimizeAts?: boolean }).optimizeAts);
    const result = await resumeService.buildFromForm(
      req.user!,
      {
        ...body,
        email: body.email || req.user!.email,
      },
      { optimizeAts },
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/** Generate the best-ATS resume from the saved profile (or body overrides).
 * Optional jobTitle/jobDescription reorders skills & bullets toward the JD
 * while keeping the uploaded resume facts as the source of truth.
 */
export async function optimizeResume(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile = await profileService.getOrCreate(req.user!);
    const body = buildResumeSchema
      .partial()
      .extend({
        jobTitle: z.string().max(160).optional(),
        jobDescription: z.string().max(8000).optional(),
      })
      .parse(req.body || {});

    const input = {
      displayName: body.displayName || profile.displayName,
      title: body.title || profile.title,
      email: body.email || profile.email,
      phone: body.phone || profile.phone,
      location: body.location || profile.location || profile.preferredLocations?.[0],
      linkedinUrl: body.linkedinUrl || profile.linkedinUrl,
      website: body.website || profile.website,
      summary: body.summary || profile.summary,
      skills: body.skills?.length ? body.skills : profile.skills || [],
      experienceYears: body.experienceYears ?? profile.experienceYears,
      experience: body.experience?.length
        ? body.experience
        : profile.experienceEntries || [],
      education: body.education?.length
        ? body.education
        : profile.educationEntries ||
          (profile.education || []).map((line, i) => ({
            id: `ed-${i}`,
            school: line,
            degree: line,
          })),
      projects: body.projects?.length ? body.projects : profile.projects || [],
      certifications: body.certifications?.length
        ? body.certifications
        : profile.certifications || [],
      languages: body.languages?.length ? body.languages : profile.languages || [],
      achievements: body.achievements?.length
        ? body.achievements
        : profile.achievements || [],
    };

    if (!input.skills.length && !input.summary && !input.experience.length) {
      throw new AppError(
        400,
        'Upload a resume or fill profile details before generating an ATS resume',
        'VALIDATION',
      );
    }

    const result = await resumeService.buildFromForm(req.user!, input, {
      optimizeAts: true,
      jobTitle: body.jobTitle,
      jobDescription: body.jobDescription,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getLatestResume(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const resume = await resumeService.getLatest(req.user!.uid);
    res.json({ success: true, data: resume });
  } catch (err) {
    next(err);
  }
}

export async function listResumes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resumes = await resumeService.list(req.user!.uid);
    res.json({ success: true, data: resumes });
  } catch (err) {
    next(err);
  }
}

export async function listCoverLetters(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const letters = await resumeService.listCoverLetters(req.user!.uid);
    res.json({ success: true, data: letters });
  } catch (err) {
    next(err);
  }
}
