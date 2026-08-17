import { randomUUID } from 'crypto';
import type { AuthUser, UserProfile } from '../domain/user';
import type { CoverLetterDocument, ResumeBuilderInput, ResumeDocument } from '../domain/resume';
import { AppError } from '../middleware/errorHandler';
import { coverLetterRepository, resumeRepository, userRepository } from '../repositories';
import { aiService } from './aiService';
import { buildAdvancedResumeHtml, buildBestAtsResume } from './resumeBuildService';
import { parseResumeBuffer, parsedToProfilePatch } from './resumeParseService';
import { profileService } from './profileService';

/** Keep under Firestore ~1MB doc limit with headroom for other fields. */
const MAX_BASE64_CHARS = 250_000;

function isFirestoreWriteError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const code =
    typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: unknown }).code) : '';
  return (
    /undefined as a Firestore value|exceeds the maximum allowed size|INVALID_ARGUMENT|invalid-argument/i.test(
      message,
    ) || /invalid-argument|resource-exhausted/i.test(code)
  );
}

function mimeFromName(fileName: string): string {
  const n = fileName.toLowerCase();
  if (n.endsWith('.pdf')) return 'application/pdf';
  if (n.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (n.endsWith('.md')) return 'text/markdown';
  return 'text/plain';
}

export class ResumeService {
  async uploadAndPersist(
    auth: AuthUser,
    buffer: Buffer,
    fileName: string,
  ): Promise<{ profile: UserProfile; resume: ResumeDocument; parsed: Record<string, unknown> }> {
    const parsed = await parseResumeBuffer(buffer, fileName);
    const patch = parsedToProfilePatch(parsed, fileName);
    const profile = await profileService.update(auth, patch);

    const now = new Date().toISOString();
    const base64 = buffer.toString('base64');
    const existingId = profile.resumeId;
    const previous = existingId
      ? await resumeRepository.getById(auth.uid, existingId)
      : null;

    const resume: ResumeDocument = {
      id: existingId || randomUUID(),
      userId: auth.uid,
      source: 'upload',
      fileName,
      mimeType: mimeFromName(fileName),
      uploadedAt: previous?.uploadedAt || now,
      updatedAt: now,
      parseMethod: parsed.parseMethod,
      textChars: parsed.textChars,
      extractedText: parsed.rawText,
      contentBase64: base64.length <= MAX_BASE64_CHARS ? base64 : undefined,
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
        website: parsed.website,
        location: parsed.location,
        experienceEntries: parsed.experienceEntries,
        educationEntries: parsed.educationEntries,
        projects: parsed.projects,
        certifications: parsed.certifications,
        languages: parsed.languages,
        achievements: parsed.achievements,
      },
      // Clear stale HTML so the UI does not keep a previous (incomplete) preview
      // (Firestore merge strips `undefined`, so use empty string to overwrite)
      atsScore: profile.atsScore,
      htmlContent: '',
      template: previous?.template,
    };

    const saved = await this.persistResume(resume);
    const withResumeId = await profileService.update(auth, {
      resumeId: saved.id,
      resumeFileName: fileName,
      resumeParsedAt: now,
    });

    return {
      profile: withResumeId,
      resume: {
        ...saved,
        contentBase64: saved.contentBase64 ? '[stored]' : undefined,
      },
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
        website: parsed.website,
        location: parsed.location,
        experienceEntries: parsed.experienceEntries,
        educationEntries: parsed.educationEntries,
        projects: parsed.projects,
        certifications: parsed.certifications,
        languages: parsed.languages,
        achievements: parsed.achievements,
        parseMethod: parsed.parseMethod,
        textChars: parsed.textChars,
        atsScore: withResumeId.atsScore,
        fileStored: Boolean(resume.contentBase64),
      },
    };
  }

  async buildFromForm(
    auth: AuthUser,
    input: ResumeBuilderInput,
    options?: {
      optimizeAts?: boolean;
      jobTitle?: string;
      jobDescription?: string;
    },
  ): Promise<{
    profile: UserProfile;
    resume: ResumeDocument;
    tips?: string[];
    template?: 'classic' | 'modern' | 'executive';
  }> {
    const jobContext =
      options?.jobTitle || options?.jobDescription
        ? { jobTitle: options.jobTitle, jobDescription: options.jobDescription }
        : undefined;

    const built = options?.optimizeAts
      ? buildBestAtsResume(input, jobContext)
      : {
          ...buildAdvancedResumeHtml(input),
          template: (input.template || 'modern') as 'classic' | 'modern' | 'executive',
          tips: undefined as string[] | undefined,
          optimized: input,
        };

    const finalInput = built.optimized || input;
    const { html, atsScore, fileName } = built;
    const now = new Date().toISOString();
    const current = await profileService.getOrCreate(auth);
    const previous = current.resumeId
      ? await resumeRepository.getById(auth.uid, current.resumeId)
      : null;

    const profile = await profileService.update(auth, {
      displayName: finalInput.displayName,
      title: finalInput.title,
      phone: finalInput.phone,
      linkedinUrl: finalInput.linkedinUrl,
      website: finalInput.website,
      location: finalInput.location,
      summary: finalInput.summary,
      skills: finalInput.skills,
      experienceYears: finalInput.experienceYears,
      education: finalInput.education.map((e) =>
        [e.degree, e.field, e.school].filter(Boolean).join(' — '),
      ),
      preferredLocations: finalInput.location ? [finalInput.location] : current.preferredLocations,
      experienceEntries: finalInput.experience,
      educationEntries: finalInput.education,
      projects: finalInput.projects,
      certifications: finalInput.certifications,
      languages: finalInput.languages,
      achievements: finalInput.achievements,
      atsScore,
      resumeFileName: fileName,
      resumeParsedAt: now,
    });

    const resume: ResumeDocument = {
      id: profile.resumeId || randomUUID(),
      userId: auth.uid,
      source: 'builder',
      fileName,
      mimeType: 'text/html',
      uploadedAt: previous?.uploadedAt || now,
      updatedAt: now,
      htmlContent: html,
      template: built.template || finalInput.template || 'modern',
      atsScore,
      contentBase64: previous?.contentBase64,
      extractedText: previous?.extractedText,
      parseMethod: previous?.parseMethod,
      textChars: previous?.textChars,
      parsed: {
        name: finalInput.displayName,
        title: finalInput.title,
        skills: finalInput.skills,
        summary: finalInput.summary,
        experience: finalInput.experienceYears,
        education: finalInput.education.map((e) => e.degree),
        experienceEntries: finalInput.experience,
        educationEntries: finalInput.education,
        projects: finalInput.projects,
        certifications: finalInput.certifications,
        languages: finalInput.languages,
        achievements: finalInput.achievements,
      },
    };

    const saved = await resumeRepository.upsert(resume);
    const withId = await profileService.update(auth, {
      resumeId: saved.id,
      resumeFileName: fileName,
    });

    return {
      profile: withId,
      resume: {
        ...saved,
        contentBase64: saved.contentBase64 ? '[stored]' : undefined,
      },
      tips: built.tips,
      template: built.template,
    };
  }

  async getLatest(userId: string): Promise<ResumeDocument | null> {
    const profile = await userRepository.getById(userId);
    const linked =
      profile?.resumeId
        ? await resumeRepository.getById(userId, profile.resumeId)
        : null;
    const doc = linked ?? (await resumeRepository.getLatest(userId));
    if (!doc) return null;
    return {
      ...doc,
      contentBase64: doc.contentBase64 ? '[stored]' : undefined,
    };
  }

  async list(userId: string): Promise<ResumeDocument[]> {
    const rows = await resumeRepository.list(userId);
    return rows.map((doc) => ({
      ...doc,
      contentBase64: doc.contentBase64 ? '[stored]' : undefined,
    }));
  }

  async saveCoverLetter(
    auth: AuthUser,
    data: Omit<CoverLetterDocument, 'id' | 'userId' | 'createdAt'>,
  ): Promise<CoverLetterDocument> {
    const doc: CoverLetterDocument = {
      id: randomUUID(),
      userId: auth.uid,
      createdAt: new Date().toISOString(),
      ...data,
    };
    return coverLetterRepository.create(doc);
  }

  async listCoverLetters(userId: string): Promise<CoverLetterDocument[]> {
    return coverLetterRepository.listByUser(userId);
  }

  /**
   * Create a per-job ATS resume variant without overwriting the master resume profile.
   */
  async tailorForJob(
    auth: AuthUser,
    job: import('../domain/job').Job,
  ): Promise<{
    profile: UserProfile;
    resume: ResumeDocument;
    tips?: string[];
    notes: string[];
    aiAssisted: boolean;
  }> {
    const profile = await profileService.getOrCreate(auth);

    const input: ResumeBuilderInput = {
      displayName: profile.displayName,
      title: profile.title,
      email: profile.email,
      phone: profile.phone,
      location: profile.location || profile.preferredLocations?.[0],
      linkedinUrl: profile.linkedinUrl,
      website: profile.website,
      summary: profile.summary,
      skills: profile.skills || [],
      experienceYears: profile.experienceYears,
      experience: profile.experienceEntries || [],
      education:
        profile.educationEntries ||
        (profile.education || []).map((line, i) => ({
          id: `ed-${i}`,
          school: line,
          degree: line,
        })),
      projects: profile.projects || [],
      certifications: profile.certifications || [],
      languages: profile.languages || [],
      achievements: profile.achievements || [],
      template: 'modern',
    };

    if (!input.skills.length && !input.summary && !input.experience.length) {
      throw new AppError(
        400,
        'Upload a resume or fill profile details before generating a tailored resume',
        'VALIDATION',
      );
    }

    const ai = await aiService.tailorResumeForJob(profile, job);
    let notes = [
      `ATS variant for ${job.title} @ ${job.company}`,
      'Skills and bullets reordered toward the job description',
    ];
    let aiAssisted = false;

    if (ai) {
      aiAssisted = true;
      if (ai.summary) input.summary = ai.summary;
      if (ai.skillsOrder?.length) {
        const rest = input.skills.filter(
          (s) => !ai.skillsOrder.some((x) => x.toLowerCase() === s.toLowerCase()),
        );
        input.skills = [...ai.skillsOrder, ...rest];
      }
      if (ai.highlightBullets?.length && input.experience[0]) {
        const existing = input.experience[0].bullets || [];
        input.experience = [
          {
            ...input.experience[0],
            bullets: [...ai.highlightBullets.slice(0, 3), ...existing].slice(0, 8),
          },
          ...input.experience.slice(1),
        ];
      }
      notes = [...notes, ...(ai.notes || [])];
    }

    const built = buildBestAtsResume(input, {
      jobTitle: job.title,
      jobDescription: job.description,
    });

    const now = new Date().toISOString();
    const resume: ResumeDocument = {
      id: randomUUID(),
      userId: auth.uid,
      source: 'tailored',
      fileName: `resume-${job.company.replace(/\W+/g, '-').slice(0, 24)}-${job.title.replace(/\W+/g, '-').slice(0, 32)}.html`,
      mimeType: 'text/html',
      uploadedAt: now,
      updatedAt: now,
      htmlContent: built.html,
      template: built.template,
      atsScore: built.atsScore,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      tailoredFromResumeId: profile.resumeId,
      tailorNotes: notes,
      parsed: {
        name: input.displayName,
        title: input.title,
        skills: built.optimized?.skills || input.skills,
        summary: built.optimized?.summary || input.summary,
        jobId: job.id,
      },
    };

    const saved = await resumeRepository.upsert(resume);
    return {
      profile,
      resume: {
        ...saved,
        contentBase64: saved.contentBase64 ? '[stored]' : undefined,
      },
      tips: built.tips,
      notes,
      aiAssisted,
    };
  }

  private async persistResume(resume: ResumeDocument): Promise<ResumeDocument> {
    try {
      return await resumeRepository.upsert(resume);
    } catch (err) {
      if (!isFirestoreWriteError(err)) throw err;
      try {
        return await resumeRepository.upsert({
          ...resume,
          contentBase64: undefined,
          extractedText: (resume.extractedText || '').slice(0, 12_000),
        });
      } catch {
        throw new AppError(
          400,
          'Could not save this resume. Try a smaller PDF or a DOCX/TXT file.',
          'RESUME_SAVE',
        );
      }
    }
  }
}

export const resumeService = new ResumeService();
