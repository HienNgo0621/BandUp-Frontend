import { createEmptyAppData } from './demo/seedData';
import { migrateLegacyData, type AppDataSnapshot } from './storage/legacyMigration';
import { localStorageService, isRecord } from './storage/localStorageService';
import { STORAGE_KEYS } from './storage/storageKeys';

export type AppData = AppDataSnapshot;
function isAppData(value: unknown): value is AppData {
  return isRecord(value) && value.schemaVersion === 1 && Array.isArray(value.users) && Array.isArray(value.questionBank) && Array.isArray(value.notifications) && isRecord(value.legacy) &&
    Array.isArray(value.registrations) && Array.isArray(value.applications) && Array.isArray(value.submissions) && Array.isArray(value.grading) &&
    Array.isArray(value.forumTopics) && Array.isArray(value.forumPosts) && Array.isArray(value.forumComments) && Array.isArray(value.forumReports) &&
    Array.isArray(value.practiceHistory) && isRecord(value.studyPlan) && Array.isArray(value.notes) && isRecord(value.preferences) && Array.isArray(value.supportMessages);
}

function loadInitialData(): AppData {
  const migrated = migrateLegacyData();
  if (migrated.snapshot) return migrated.snapshot;
  const existing = localStorageService.read(STORAGE_KEYS.appData, isAppData);
  if (existing) return existing;
  const fresh: AppData = { ...createEmptyAppData(), migratedAt: null };
  // Seed only when both the new namespace and legacy sources are absent/invalid.
  if (migrated.status === 'no-legacy-data') localStorageService.write(STORAGE_KEYS.appData, fresh);
  return fresh;
}

export const appDataService = {
  load(): AppData { return loadInitialData(); },
  save(next: AppData): boolean { return localStorageService.write(STORAGE_KEYS.appData, next); },
  update(updater: (current: AppData) => AppData): AppData | null {
    const current = this.load();
    const next = updater(current);
    return this.save(next) ? next : null;
  },
};

export function saveRegistration(registration: AppData['registrations'][number]): boolean {
  return appDataService.update((current) => ({ ...current, registrations: [...current.registrations, registration] })) !== null;
}

export function saveApplication(application: AppData['applications'][number]): boolean {
  return appDataService.update((current) => ({ ...current, applications: [...current.applications, application] })) !== null;
}
