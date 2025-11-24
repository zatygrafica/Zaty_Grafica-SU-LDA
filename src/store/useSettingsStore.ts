import { create } from 'zustand';
import type { AppSettings } from '../types';
import { supabaseDataProvider as dataProvider } from '../services/supabaseDataProvider';
import { createDefaultSettings } from './settingsDefaults';

type SettingRow = {
  id: string;
  value: AppSettings;
};

const SETTINGS_ID = 'app_settings';

const mergeSettings = (base: AppSettings, updates: Partial<AppSettings>): AppSettings => ({
  ...base,
  ...updates,
  company: { ...base.company, ...(updates.company ?? {}) },
  support: { ...base.support, ...(updates.support ?? {}) },
});

interface SettingsState {
  settings: AppSettings;
  loading: boolean;
  hasLoaded: boolean;
  error: string | null;
  loadSettings: (force?: boolean) => Promise<AppSettings>;
  updateSettings: (changes: Partial<AppSettings>) => Promise<AppSettings>;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<AppSettings>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: createDefaultSettings(),
  loading: false,
  hasLoaded: false,
  error: null,

  loadSettings: async (force = false) => {
    if (!force && (get().loading || get().hasLoaded)) {
      return get().settings;
    }
    set({ loading: true, hasLoaded: false, error: null });
    try {
      const record = await dataProvider.getById<SettingRow>('settings', SETTINGS_ID);
      let settings = record?.value ?? createDefaultSettings();
      if (!record) {
        await dataProvider.create('settings', { id: SETTINGS_ID, value: settings });
      }
      set({ settings, loading: false, hasLoaded: true });
      return settings;
    } catch (error) {
      set({ loading: false, hasLoaded: false, error: (error as Error).message });
      throw error;
    }
  },

  updateSettings: async (changes) => {
    const current = get().settings;
    const merged = mergeSettings(current, changes);
    try {
      await dataProvider.update('settings', SETTINGS_ID, { value: merged });
      set({ settings: merged, error: null });
      return merged;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateSetting: async (key, value) => {
    const updates = { [key]: value } as Partial<AppSettings>;
    return get().updateSettings(updates);
  },
}));
