import { create } from 'zustand';
import type { Job } from '@/types';

interface JobState {
  jobs: Job[];
  selectedJob: Job | null;
  setJobs: (jobs: Job[]) => void;
  addJobs: (jobs: Job[]) => void;
  setSelectedJob: (job: Job | null) => void;
  getJobById: (id: string) => Job | null;
}

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [],
  selectedJob: null,

  setJobs: (jobs) => set({ jobs }),

  addJobs: (newJobs) => {
    const existing = get().jobs;
    const map = new Map<string, Job>();
    existing.forEach((j) => map.set(j.id, j));
    newJobs.forEach((j) => map.set(j.id, j));
    set({ jobs: Array.from(map.values()) });
  },

  setSelectedJob: (selectedJob) => set({ selectedJob }),

  getJobById: (id: string) => {
    const { selectedJob, jobs } = get();
    if (selectedJob && selectedJob.id === id) return selectedJob;
    return jobs.find((j) => j.id === id) || null;
  },
}));
