import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Application, ApplicationStatus } from '@/types';

const APPLICATIONS_KEY = '@applyai/local_applications';

export async function getLocalApplications(): Promise<Application[]> {
  try {
    const raw = await AsyncStorage.getItem(APPLICATIONS_KEY);
    if (!raw) return [];
    const list: Application[] = JSON.parse(raw);
    return list.sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });
  } catch (err) {
    console.warn('Failed to load local applications:', err);
    return [];
  }
}

export async function saveLocalApplication(appData: {
  id?: string;
  userId?: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: ApplicationStatus;
  matchScore: number;
  notes?: string;
}): Promise<Application> {
  const existing = await getLocalApplications();
  const now = new Date().toISOString();

  // Check if application for this job already exists
  const existingIndex = existing.findIndex(
    (a) => a.id === appData.id || (a.jobId === appData.jobId && a.jobId !== undefined)
  );

  let newApp: Application;

  if (existingIndex >= 0) {
    newApp = {
      ...existing[existingIndex],
      status: appData.status,
      matchScore: appData.matchScore,
      updatedAt: now,
      notes: appData.notes ?? existing[existingIndex].notes,
    };
    existing[existingIndex] = newApp;
  } else {
    newApp = {
      id: appData.id || `local_app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: appData.userId || 'local_user',
      jobId: appData.jobId,
      jobTitle: appData.jobTitle,
      company: appData.company,
      status: appData.status,
      matchScore: appData.matchScore,
      appliedAt: now,
      updatedAt: now,
      notes: appData.notes,
    };
    existing.unshift(newApp);
  }

  await AsyncStorage.setItem(APPLICATIONS_KEY, JSON.stringify(existing));
  return newApp;
}

export async function deleteLocalApplication(id: string): Promise<void> {
  try {
    const existing = await getLocalApplications();
    const filtered = existing.filter((a) => a.id !== id && a.jobId !== id);
    await AsyncStorage.setItem(APPLICATIONS_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to delete local application:', err);
  }
}
