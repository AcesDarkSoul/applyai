import { create } from 'zustand';
import { hasLocalResume, getLocalResumeMeta } from '@/lib/local/resumeStorage';

interface ResumeState {
  hasResume: boolean;
  fileName: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setHasResume: (has: boolean, fileName?: string | null) => void;
}

export const useResumeStore = create<ResumeState>((set) => ({
  hasResume: false,
  fileName: null,
  loading: true,

  setHasResume: (has, fileName = null) => set({ hasResume: has, fileName, loading: false }),

  refresh: async () => {
    set({ loading: true });
    const exists = await hasLocalResume();
    const meta = exists ? await getLocalResumeMeta() : null;
    set({
      hasResume: exists,
      fileName: meta?.fileName ?? null,
      loading: false,
    });
  },
}));

/** Hook-friendly check: local file OR Firestore flag */
export function userHasResume(local: boolean, profileHasResume?: boolean): boolean {
  return local || !!profileHasResume;
}
