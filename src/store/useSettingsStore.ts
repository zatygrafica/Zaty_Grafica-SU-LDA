import { create } from 'zustand';
import type { AppSettings } from '../types';
import { supabaseDataProvider as dataProvider } from '../services/supabaseDataProvider';
import { createDefaultSettings } from './settingsDefaults';
import { supabase } from '../services/supabaseClient';

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
  recordId?: string;
  loadSettings: (force?: boolean) => Promise<AppSettings>;
  updateSettings: (changes: Partial<AppSettings>) => Promise<AppSettings>;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<AppSettings>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: createDefaultSettings(),
  loading: false,
  hasLoaded: false,
  error: null,
  recordId: undefined,

  loadSettings: async (force = false) => {
    if (!force && (get().loading || get().hasLoaded)) {
      return get().settings;
    }
    set({ loading: true, hasLoaded: false, error: null });
    try {
      // tenta buscar pelo id conhecido
      let record: SettingRow | null = null;
      let settings: AppSettings | null = null;

      const byId = await supabase.from<SettingRow>('settings' as any).select('*').eq('id', SETTINGS_ID).maybeSingle();
      if (byId.error) throw byId.error;
      if (byId.data) {
        record = byId.data;
        settings = record.value;
      }

      // se nao achou pelo id, pega o primeiro registro existente
      if (!record) {
        const first = await supabase.from<SettingRow>('settings' as any).select('*').limit(1).single();
        if (first.error && first.error.code !== 'PGRST116') throw first.error;
        if (first.data) {
          record = first.data;
          settings = record.value;
        }
      }

      // se ainda nao existir, cria um novo com id padrao
      if (!record || !settings) {
        settings = createDefaultSettings();
        const insert = await supabase
          .from<SettingRow>('settings' as any)
          .upsert({ id: SETTINGS_ID, value: settings } as any)
          .select()
          .single();
        if (insert.error) throw insert.error;
        record = insert.data;
        settings = record.value;
      }

      set({ settings, recordId: record.id, loading: false, hasLoaded: true });
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
      const { data, error } = await supabase
        .from<SettingRow>('settings' as any)
        .upsert({ id: SETTINGS_ID, value: merged } as any)
        .eq('id', SETTINGS_ID)
        .select()
        .single();
      if (error) throw error;
      set({ settings: merged, recordId: data?.id ?? SETTINGS_ID, error: null });
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
