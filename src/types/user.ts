import type { AccountStatus, AppRole, BaseEntity, JsonValue } from './common';

export interface UserProfile {
  shortName?: string;
  label?: string;
  joinedAt?: number;
  details?: Record<string, JsonValue>;
  [key: string]: JsonValue | undefined;
}

export interface User extends BaseEntity {
  id: string;
  name: string;
  email?: string;
  role: AppRole;
  status: AccountStatus;
  label: string;
  profile?: UserProfile;
}
