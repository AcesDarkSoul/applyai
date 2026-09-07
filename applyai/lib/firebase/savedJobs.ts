import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './config';
import { userDocIdFromEmail } from './userDocId';
import type { Job, JobMatchScore } from '@/types';

export interface SavedJob {
  id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  url: string;
  source: string;
  remote?: boolean;
  employmentType?: Job['employmentType'];
  matchScore?: JobMatchScore;
  savedAt: string;
}

function resolveUserDocId(userIdOrEmail: string): string {
  if (userIdOrEmail.includes('@')) {
    return userDocIdFromEmail(userIdOrEmail);
  }
  const email = auth.currentUser?.email;
  if (email) return userDocIdFromEmail(email);
  throw new Error('Signed-in email is required for saved jobs.');
}

function savedJobsCol(userIdOrEmail: string) {
  return collection(db, 'users', resolveUserDocId(userIdOrEmail), 'savedJobs');
}

export async function listSavedJobs(userId: string): Promise<SavedJob[]> {
  const snap = await getDocs(savedJobsCol(userId));
  const items = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      jobId: data.jobId || d.id,
      title: data.title || '',
      company: data.company || '',
      location: data.location || '',
      salary: data.salary,
      url: data.url || '',
      source: data.source || '',
      remote: data.remote,
      employmentType: data.employmentType,
      matchScore: data.matchScore,
      savedAt: data.savedAt?.toDate?.()?.toISOString?.() || data.savedAt || '',
    } as SavedJob;
  });
  return items.sort((a, b) => {
    const ta = a.savedAt ? new Date(a.savedAt).getTime() : 0;
    const tb = b.savedAt ? new Date(b.savedAt).getTime() : 0;
    return tb - ta;
  });
}

export async function isJobSaved(userId: string, jobId: string): Promise<boolean> {
  const snap = await getDocs(savedJobsCol(userId));
  return snap.docs.some((d) => d.id === jobId || d.data().jobId === jobId);
}

export async function getSavedJobIds(userId: string): Promise<Set<string>> {
  const snap = await getDocs(savedJobsCol(userId));
  return new Set(snap.docs.map((d) => d.id));
}

export async function saveJob(userId: string, job: Job): Promise<void> {
  const docId = resolveUserDocId(userId);
  await setDoc(
    doc(db, 'users', docId, 'savedJobs', job.id),
    {
      jobId: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary || null,
      url: job.url,
      source: job.source,
      remote: job.remote,
      employmentType: job.employmentType,
      matchScore: job.matchScore || null,
      savedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function unsaveJob(userId: string, jobId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', resolveUserDocId(userId), 'savedJobs', jobId));
}

export async function toggleSaveJob(
  userId: string,
  job: Job,
  currentlySaved: boolean
): Promise<boolean> {
  if (currentlySaved) {
    await unsaveJob(userId, job.id);
    return false;
  }
  await saveJob(userId, job);
  return true;
}
