import { failure, type Result } from '../domain/contracts';
import type { StorageAdapter } from './localStorageService';

// Acquisition is injected and lazy. No implicit access to a browser or session.
export function createStorageAccess(acquire: () => StorageAdapter | null) {
  function target(): Result<StorageAdapter> {
    try {
      const storage = acquire();
      return storage ? { ok: true, value: storage } : failure('storage-unavailable', 'Saved data is unavailable in this browser.', true);
    } catch { return failure('storage-unavailable', 'Saved data is unavailable in this browser.', true); }
  }
  function read(key: string): Result<string | null> {
    const storage = target(); if (!storage.ok) return storage;
    try { return { ok: true, value: storage.value.getItem(key) }; }
    catch { return failure('storage-read-failed', 'Your saved data could not be read. Please try again.', true); }
  }
  function write(key: string, raw: string): Result<void> {
    const storage = target(); if (!storage.ok) return storage;
    try {
      storage.value.setItem(key, raw);
      if (storage.value.getItem(key) !== raw) return failure('storage-write-failed', 'Your changes could not be verified. Please try again.', true);
      return { ok: true, value: undefined };
    } catch { return failure('storage-write-failed', 'Your changes could not be saved. Please try again.', true); }
  }
  function remove(key: string): Result<void> {
    const storage = target(); if (!storage.ok) return storage;
    try {
      storage.value.removeItem(key);
      return storage.value.getItem(key) === null ? { ok: true, value: undefined } : failure('storage-write-failed', 'Saved-data recovery could not be finished.', true);
    } catch { return failure('storage-write-failed', 'Saved-data recovery could not be finished.', true); }
  }
  return { read, write, remove };
}
