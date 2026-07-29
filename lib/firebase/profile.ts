import {
  doc,
  updateDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import * as DocumentPicker from 'expo-document-picker';
import { auth, db } from './config';
import { saveResumeLocally, readLocalResumeAsBase64 } from '@/lib/local/resumeStorage';
import { parseResumeFromLocalAPI } from './functions';
import { formDataToProfileUpdate, type ProfileFormData } from '@/components/profile/ProfileReviewForm';
import type { UserProfile, Application, ApplicationStatus } from '@/types';

export function formatFirebaseError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes('Missing or insufficient permissions')) {
      return 'Firestore permission denied. Deploy Firestore rules from the Firebase Console.';
    }
    if (msg.includes('Failed to fetch') || msg.includes('Network')) {
      return 'Network error. Check your internet connection.';
    }
    return msg.replace('Firebase: ', '').replace(/\(auth\/.*?\)\.?/g, '').trim() || msg;
  }
  return 'Something went wrong. Please try again.';
}

/**
 * Save resume locally on device + sync metadata to Firestore (no Firebase Storage).
 */
export async function saveResumeForUser(
  userId: string,
  file: DocumentPicker.DocumentPickerAsset
): Promise<{ fileName: string }> {
  if (!auth.currentUser) {
    throw new Error('You must be signed in to save a resume');
  }
  if (auth.currentUser.uid !== userId) {
    throw new Error('Session mismatch. Please sign out and sign in again.');
  }

  const meta = await saveResumeLocally(file);

  // Firestore: metadata only — file stays on device
  await setDoc(
    doc(db, 'users', userId),
    {
      hasResume: true,
      resumeFileName: meta.fileName,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { fileName: meta.fileName };
}

export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function saveUserProfileFromForm(
  userId: string,
  form: ProfileFormData,
  extra?: Partial<UserProfile>
): Promise<void> {
  const data = { ...formDataToProfileUpdate(form), ...extra, parseStatus: 'complete' as const };
  await setDoc(doc(db, 'users', userId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

/** When AI unavailable — mark profile for manual entry, no fake data */
export async function markProfileForManualEntry(userId: string): Promise<void> {
  await setDoc(
    doc(db, 'users', userId),
    { parseStatus: 'manual', updatedAt: serverTimestamp() },
    { merge: true }
  );
}

import { parseResumeContent } from '@/lib/local/resumeParser';

function extractBasicInfoFromBase64(base64: string, fileName: string): Record<string, unknown> {
  const parsed = parseResumeContent(base64, fileName);
  return { ...parsed };
}

async function parseResumeDirectWithOpenAI(
  base64Content: string,
  fileName: string,
  apiKey: string
): Promise<Record<string, unknown> | null> {
  try {
    let rawText = '';
    try {
      const decoded = atob(base64Content);
      if (decoded.includes('%PDF') || decoded.length < 50) {
        const asciiWords = decoded.match(/[a-zA-Z0-9.+@#/\\-]{2,}/g) || [];
        rawText = asciiWords.join(' ');
      } else {
        rawText = decoded.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
      }
    } catch {
      rawText = base64Content;
    }

    const prompt = `You are a world-class ATS resume parser. Extract ALL information strictly from this candidate resume content. Do NOT invent or fabricate data.

Return ONLY valid JSON:
{
  "name": "full name string or null",
  "phone": "phone number string or null",
  "linkedin": "LinkedIn profile URL or null",
  "location": "location/city/country string or null",
  "preferredLocation": "location string or null",
  "expectedSalary": "salary string or null",
  "workAuthorization": "work authorization/visa string or null",
  "skills": ["skill1", "skill2"],
  "experience": number_of_years_or_0,
  "education": [{"institution": "string", "degree": "string", "field": "string", "startYear": 2020, "endYear": 2024}],
  "certifications": ["cert1"],
  "languages": ["language1"],
  "summary": "professional summary text extracted from resume",
  "atsScore": 85
}`;

    const fetchPayload: any = {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `Resume File: ${fileName}\nText Content: ${rawText.substring(0, 15000)}` },
      ],
      temperature: 0.1,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    };

    let response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(fetchPayload),
    });

    if (!response.ok) {
      fetchPayload.model = 'gpt-4o-mini';
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(fetchPayload),
      });
    }

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    }
  } catch (err) {
    console.warn('Direct OpenAI client parse failed:', err);
  }
  return null;
}

/** Parse local resume with OpenAI (via Cloud Function or direct OpenAI API fallback) */
export async function parseResumeWithAI(
  userId: string,
  fileName: string,
  directBase64?: string
): Promise<Record<string, unknown>> {
  let base64 = directBase64;
  if (!base64) {
    const local = await readLocalResumeAsBase64();
    if (!local) throw new Error('No local resume found');
    base64 = local.base64;
  }

  // 1. Try Cloud Function parseResume
  try {
    const result = await parseResumeFromLocalAPI(base64, fileName);
    if (result && result.profile) {
      await setDoc(doc(db, 'users', userId), { ...result.profile, updatedAt: serverTimestamp() }, { merge: true });
      return result.profile;
    }
  } catch (err) {
    console.warn('Cloud Function parseResume unavailable:', err);
  }

  // 2. Try direct OpenAI API client call if key is configured
  const clientKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (clientKey) {
    const directResult = await parseResumeDirectWithOpenAI(base64, fileName, clientKey);
    if (directResult) {
      await setDoc(doc(db, 'users', userId), { ...directResult, updatedAt: serverTimestamp() }, { merge: true });
      return directResult;
    }
  }

  // 3. Smart local extraction strictly from candidate resume
  const extractedProfile = extractBasicInfoFromBase64(base64, fileName);
  await setDoc(doc(db, 'users', userId), { ...extractedProfile, updatedAt: serverTimestamp() }, { merge: true });
  return extractedProfile;
}

import { saveLocalApplication, getLocalApplications, deleteLocalApplication } from '@/lib/local/applicationStorage';

export async function getApplications(userId: string): Promise<Application[]> {
  let remoteApps: Application[] = [];
  try {
    if (userId && userId !== 'local_user') {
      const q = query(collection(db, 'applications'), where('userId', '==', userId));
      const snap = await getDocs(q);
      remoteApps = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          appliedAt: data.appliedAt?.toDate?.()?.toISOString() || data.appliedAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as Application;
      });
    }
  } catch (err) {
    console.warn('Firestore getApplications failed, relying on local storage:', err);
  }

  const localApps = await getLocalApplications();

  // Merge remote and local applications, prioritizing remote if duplicate
  const combinedMap = new Map<string, Application>();
  localApps.forEach((app) => combinedMap.set(app.id, app));
  remoteApps.forEach((app) => combinedMap.set(app.id, app));

  const allApps = Array.from(combinedMap.values());
  return allApps.sort((a, b) => {
    const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return dateB - dateA;
  });
}

export async function createApplication(
  userId: string,
  job: { id: string; title: string; company: string; matchScore: number; status?: ApplicationStatus }
): Promise<string> {
  const status = job.status || ('applied' as ApplicationStatus);

  // Always save to local storage immediately for fast UI update & offline resiliency
  const localSaved = await saveLocalApplication({
    userId,
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    status,
    matchScore: job.matchScore,
  });

  if (!userId || userId === 'local_user') {
    return localSaved.id;
  }

  try {
    const docRef = await addDoc(collection(db, 'applications'), {
      userId,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      status,
      matchScore: job.matchScore,
      appliedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.warn('Firestore createApplication failed, application saved locally:', err);
    return localSaved.id;
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): Promise<void> {
  try {
    await updateDoc(doc(db, 'applications', applicationId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Firestore updateApplicationStatus failed, updating local storage:', err);
  }
  const localList = await getLocalApplications();
  const target = localList.find((a) => a.id === applicationId || a.jobId === applicationId);
  if (target) {
    await saveLocalApplication({ ...target, status });
  }
}

export async function deleteApplication(applicationId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'applications', applicationId));
  } catch (err) {
    console.warn('Firestore deleteApplication failed:', err);
  }
  await deleteLocalApplication(applicationId);
}

export function calculateProfileCompleteness(
  profile: UserProfile | null,
  localHasResume = false
): number {
  const hasResume = localHasResume || profile?.hasResume || !!profile?.resumeUrl;
  let score = 0;

  if (hasResume) score += 25;

  if (profile?.name && profile.name.trim() !== '' && profile.name !== 'Candidate') {
    score += 15;
  }

  const skillsCount = profile?.skills?.length || 0;
  if (skillsCount >= 3) {
    score += 25;
  } else if (skillsCount > 0) {
    score += 15;
  }

  if (typeof profile?.experience === 'number' && profile.experience > 0) {
    score += 15;
  }

  if (profile?.education && profile.education.length > 0) {
    score += 10;
  }

  if (profile?.preferredLocation && profile.preferredLocation.trim() !== '') {
    score += 5;
  }

  if (profile?.summary && profile.summary.length > 15) {
    score += 5;
  }

  return Math.min(100, score);
}

export async function getOutreachEmails(userId: string): Promise<import('@/types').OutreachEmail[]> {
  const q = query(collection(db, 'outreachEmails'), where('userId', '==', userId));
  const snap = await getDocs(q);

  const emails = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      sentAt: data.sentAt?.toDate?.()?.toISOString() || data.sentAt,
    } as import('@/types').OutreachEmail;
  });

  return emails.sort((a, b) => {
    const dateA = a.sentAt ? new Date(a.sentAt).getTime() : 0;
    const dateB = b.sentAt ? new Date(b.sentAt).getTime() : 0;
    return dateB - dateA;
  });
}
