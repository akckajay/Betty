/**
 * Storage utilities with versioned migration and export/import.
 */

import { CONFIG } from '../config';

export interface StoragePayload<T> {
  version: number;
  data: T;
  savedAt: number;
}

export function saveToStorage<T>(key: string, data: T): void {
  try {
    const payload: StoragePayload<T> = {
      version: CONFIG.storageVersion,
      data,
      savedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to write to localStorage', err);
  }
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: StoragePayload<T> = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !('version' in parsed)) {
      return fallback;
    }
    // Migration hook if version differs
    if (parsed.version !== CONFIG.storageVersion) {
      return migrateState(parsed.version, parsed.data, fallback);
    }
    return parsed.data ?? fallback;
  } catch (err) {
    console.error('Corrupted localStorage data, using fallback', err);
    return fallback;
  }
}

function migrateState<T>(oldVersion: number, oldData: any, fallback: T): T {
  // If version 0 or older, merge with fallback
  console.info(`Migrating state from v${oldVersion} to v${CONFIG.storageVersion}`);
  return { ...fallback, ...oldData };
}

export function exportAppData(fullState: any): string {
  return JSON.stringify(
    {
      app: CONFIG.appName,
      version: CONFIG.storageVersion,
      exportedAt: new Date().toISOString(),
      state: fullState,
    },
    null,
    2
  );
}

export function importAppData(jsonString: string): any {
  const parsed = JSON.parse(jsonString);
  if (!parsed || !parsed.state) {
    throw new Error('Invalid PaperBook backup file format');
  }
  return parsed.state;
}
