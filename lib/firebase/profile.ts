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

/** Parse local resume with OpenAI (sends base64 to Cloud Function — with smart client-side extraction) */
export async function parseResumeWithAI(userId: string, fileName: string): Promise<Record<string, unknown>> {
  const local = await readLocalResumeAsBase64();
  if (!local) throw new Error('No local resume found');
  try {
    const result = await parseResumeFromLocalAPI(local.base64, fileName || local.fileName);
    if (result && result.profile) {
      await setDoc(doc(db, 'users', userId), { ...result.profile, updatedAt: serverTimestamp() }, { merge: true });
      return result.profile;
    }
    throw new Error('Empty API response');
  } catch (err) {
    console.warn('Cloud Function parseResume unavailable, using smart client-side extraction:', err);
    const extractedProfile = extractBasicInfoFromBase64(local.base64, fileName || local.fileName);
    await setDoc(doc(db, 'users', userId), { ...extractedProfile, updatedAt: serverTimestamp() }, { merge: true });
    return extractedProfile;
  }
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
