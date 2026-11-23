export const STORAGE_KEYS = {
  appData: 'bandup_app_data_v1',
  migration: 'bandup_legacy_migration_v1',
  session: 'bandup_auth_session_v1',
} as const;

export const LEGACY_LOCAL_STORAGE_KEYS = [
  'ep_db_v3', 'ep_plan_v4', 'ep_notes_v4', 'ep_users_v4', 'ep_prefs_v1',
  'ep_qb_v4', 'ep_qb_esc2', 'ep_support_v1',
] as const;
export const LEGACY_SESSION_STORAGE_KEYS = ['ep_uid', 'bandup_application_id', 'bandup_registration_id'] as const;
