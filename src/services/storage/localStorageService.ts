export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function browserStorage(): StorageAdapter | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
}

export const localStorageService = {
  read<T>(key: string, validate: (value: unknown) => value is T): T | null {
    const storage = browserStorage();
    if (!storage) return null;
    try {
      const raw = storage.getItem(key);
      if (raw === null) return null;
      const value: unknown = JSON.parse(raw);
      return validate(value) ? value : null;
    } catch { return null; }
  },
  readRaw(key: string): string | null {
    try { return browserStorage()?.getItem(key) ?? null; } catch { return null; }
  },
  write<T>(key: string, value: T): boolean {
    try {
      const storage = browserStorage();
      if (!storage) return false;
      const serialized = JSON.stringify(value);
      storage.setItem(key, serialized);
      return storage.getItem(key) === serialized;
    } catch { return false; }
  },
  remove(key: string): boolean {
    try { browserStorage()?.removeItem(key); return true; } catch { return false; }
  },
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every(isRecord);
}
