import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@applyai/outreach_cooldown_records';
const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 Hours

export interface JobOutreachRecord {
  emailSentAt?: number;
  whatsappSentAt?: number;
}

interface OutreachState {
  records: Record<string, JobOutreachRecord>;
  loadRecords: () => Promise<void>;
  clearCooldowns: () => Promise<void>;
  recordEmailSent: (jobId: string) => Promise<void>;
  recordWhatsAppSent: (jobId: string) => Promise<void>;
  isEmailSent: (jobId: string) => boolean;
  isWhatsAppSent: (jobId: string) => boolean;
}

export const useOutreachStore = create<OutreachState>((set, get) => ({
  records: {},

  loadRecords: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Always reset sample test job to unsent state
        delete parsed['sample_recruiter_test_job'];
        set({ records: parsed });
      }
    } catch (err) {
      console.warn('Failed to load outreach records:', err);
    }
  },

  clearCooldowns: async () => {
    set({ records: {} });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear cooldowns:', err);
    }
  },

  recordEmailSent: async (jobId: string) => {
    const now = Date.now();
    const updated = {
      ...get().records,
      [jobId]: {
        ...get().records[jobId],
        emailSentAt: now,
      },
    };
    set({ records: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save email outreach record:', err);
    }
  },

  recordWhatsAppSent: async (jobId: string) => {
    const now = Date.now();
    const updated = {
      ...get().records,
      [jobId]: {
        ...get().records[jobId],
        whatsappSentAt: now,
      },
    };
    set({ records: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save whatsapp outreach record:', err);
    }
  },

  isEmailSent: (jobId: string) => {
    const record = get().records[jobId];
    if (!record || !record.emailSentAt) return false;
    const elapsed = Date.now() - record.emailSentAt;
    return elapsed < COOLDOWN_MS;
  },

  isWhatsAppSent: (jobId: string) => {
    const record = get().records[jobId];
    if (!record || !record.whatsappSentAt) return false;
    const elapsed = Date.now() - record.whatsappSentAt;
    return elapsed < COOLDOWN_MS;
  },
}));
