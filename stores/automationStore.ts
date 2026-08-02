import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@applyai/automation_settings';

export interface AutomationSettings {
  sheetsWebhookUrl: string;
  whatsappWebhookUrl: string;
  telegramWebhookUrl: string;
  autoAlertsEnabled: boolean;
  minMatchScoreThreshold: number;
  targetRoleKeywords: string[];
}

interface AutomationState extends AutomationSettings {
  setSettings: (settings: Partial<AutomationSettings>) => void;
  loadSettings: () => Promise<void>;
  saveSettings: (settings: Partial<AutomationSettings>) => Promise<void>;
}

const defaultSettings: AutomationSettings = {
  sheetsWebhookUrl: '',
  whatsappWebhookUrl: '',
  telegramWebhookUrl: '',
  autoAlertsEnabled: true,
  minMatchScoreThreshold: 80,
  targetRoleKeywords: ['Android', 'Kotlin', 'React Native', 'Remote'],
};

export const useAutomationStore = create<AutomationState>((set, get) => ({
  ...defaultSettings,

  setSettings: (newSettings) => set(newSettings),

  loadSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({ ...defaultSettings, ...parsed });
      }
    } catch (err) {
      console.warn('Failed to load automation settings:', err);
    }
  },

  saveSettings: async (newSettings) => {
    const updated = { ...get(), ...newSettings };
    set(newSettings);
    try {
      const toSave: AutomationSettings = {
        sheetsWebhookUrl: updated.sheetsWebhookUrl,
        whatsappWebhookUrl: updated.whatsappWebhookUrl,
        telegramWebhookUrl: updated.telegramWebhookUrl,
        autoAlertsEnabled: updated.autoAlertsEnabled,
        minMatchScoreThreshold: updated.minMatchScoreThreshold,
        targetRoleKeywords: updated.targetRoleKeywords,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (err) {
      console.warn('Failed to save automation settings:', err);
    }
  },
}));
