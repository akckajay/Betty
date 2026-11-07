/**
 * User Settings Store
 */

import { create } from 'zustand';
import { CONFIG, CurrencyCode } from '../config';
import { UserSettings } from '../types';
import { loadFromStorage, saveToStorage } from '../lib/storage';

const STORAGE_KEY = 'paperbook_settings_v1';

const defaultSettings: UserSettings = {
  currency: CONFIG.defaultCurrency,
  startingBalanceMinor: CONFIG.defaultStartingBalanceMinor,
  theme: 'dark',
  realityCheckMinutes: CONFIG.intervals.realityCheckDefaultMinutes,
  dataSource: 'mock',
  cricketApiKey: '',
  oddsApiKey: '',
  bankrollResetsCount: 0,
  hasCompletedOnboarding: false,
  hasConfirmed18Plus: false,
};

interface SettingsState {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  confirm18Plus: () => void;
  completeOnboarding: (currency?: CurrencyCode, startingBalanceMinor?: number) => void;
}

const savedSettings = loadFromStorage<UserSettings>(STORAGE_KEY, defaultSettings);

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: savedSettings,

  updateSettings: (updates: Partial<UserSettings>) => {
    const current = get().settings;
    const newSettings = { ...current, ...updates };
    set({ settings: newSettings });
    saveToStorage(STORAGE_KEY, newSettings);
  },

  confirm18Plus: () => {
    const current = get().settings;
    const newSettings = { ...current, hasConfirmed18Plus: true };
    set({ settings: newSettings });
    saveToStorage(STORAGE_KEY, newSettings);
  },

  completeOnboarding: (currency = 'INR', startingBalanceMinor = CONFIG.defaultStartingBalanceMinor) => {
    const current = get().settings;
    const newSettings: UserSettings = {
      ...current,
      currency,
      startingBalanceMinor,
      hasCompletedOnboarding: true,
      hasConfirmed18Plus: true,
    };
    set({ settings: newSettings });
    saveToStorage(STORAGE_KEY, newSettings);
  },
}));
