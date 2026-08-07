import { randomUUID } from 'crypto';
import type { AuthUser, UserProfile } from '../domain/user';
import type { CoverLetterDocument, ResumeBuilderInput, ResumeDocument } from '../domain/resume';
import { coverLetterRepository, resumeRepository, userRepository } from '../repositories';
import { buildAdvancedResumeHtml, buildBestAtsResume } from './resumeBuildService';
import { parseResumeBuffer, parsedToProfilePatch } from './resumeParseService';
import { profileService } from './profileService';

/** Keep under Firestore ~1MB doc limit with headroom for other fields. */
const MAX_BASE64_CHARS = 700_000;

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

    const saved = await resumeRepository.upsert(resume);
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
}

export const resumeService = new ResumeService();
