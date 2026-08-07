/** Structured experience row for advanced resume builder. */
export interface ExperienceEntry {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  bullets: string[];
}

export interface EducationEntry {
  id: string;
  school: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  details?: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  url?: string;
  tech?: string;
  description: string;
  bullets?: string[];
}

export interface ResumeDocument {
  id: string;
  userId: string;
  source: 'upload' | 'builder';
  fileName: string;
  mimeType?: string;
  uploadedAt: string;
  updatedAt: string;
  parseMethod?: string;
  textChars?: number;
  extractedText?: string;
  /** Base64 of original file when under Firestore-safe size (~700KB). */
  contentBase64?: string;
  parsed?: Record<string, unknown>;
  /** Generated advanced HTML resume. */
  htmlContent?: string;
  template?: 'classic' | 'modern' | 'executive';
  atsScore?: number;
}

export interface CoverLetterDocument {
  id: string;
  userId: string;
  jobId: string;
  jobTitle?: string;
  company?: string;
  content: string;
  createdAt: string;
}

export interface ResumeBuilderInput {
  displayName: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  website?: string;
  summary?: string;
  skills: string[];
  experienceYears?: number;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  certifications: string[];
  languages: string[];
  achievements: string[];
  template?: 'classic' | 'modern' | 'executive';
}
