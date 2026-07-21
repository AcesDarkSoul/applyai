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

/** Parse local resume with OpenAI (sends base64 to Cloud Function — key stays server-side) */
export async function parseResumeWithAI(userId: string, fileName: string): Promise<Record<string, unknown>> {
  const local = await readLocalResumeAsBase64();
  if (!local) throw new Error('No local resume found');
  const result = await parseResumeFromLocalAPI(local.base64, fileName || local.fileName);
  return result.profile;
}

export async function getApplications(userId: string): Promise<Application[]> {
  const q = query(collection(db, 'applications'), where('userId', '==', userId));
  const snap = await getDocs(q);

  const applications = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      appliedAt: data.appliedAt?.toDate?.()?.toISOString() || data.appliedAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    } as Application;
  });

  return applications.sort((a, b) => {
    const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return dateB - dateA;
  });
}

export async function createApplication(
  userId: string,
  job: { id: string; title: string; company: string; matchScore: number }
): Promise<string> {
  const docRef = await addDoc(collection(db, 'applications'), {
    userId,
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    status: 'applied' as ApplicationStatus,
    matchScore: job.matchScore,
    appliedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): Promise<void> {
  await updateDoc(doc(db, 'applications', applicationId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteApplication(applicationId: string): Promise<void> {
  await deleteDoc(doc(db, 'applications', applicationId));
}

export function calculateProfileCompleteness(
  profile: UserProfile | null,
  localHasResume = false
): number {
  if (!profile) return 0;
  const hasResume = localHasResume || profile.hasResume || !!profile.resumeUrl;
  const fields = [
    profile.name,
    profile.email,
    profile.skills?.length > 0,
    profile.experience > 0,
    profile.education?.length > 0,
    hasResume,
    profile.preferredLocation,
    profile.summary,
  ];
  const completed = fields.filter(Boolean).length;
  return Math.round((completed / fields.length) * 100);
}
