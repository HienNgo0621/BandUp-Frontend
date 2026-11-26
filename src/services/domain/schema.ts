import type { AppDataSnapshot } from '../storage/legacyMigration';
import type { OwnedApplication, OwnedAttempt, OwnedForumPost, OwnedGrade, OwnedHistory, OwnedNote, OwnedStudyTask, OwnedSubmission } from './contracts';

export const DOMAIN_SCHEMA_VERSION = 2;
export interface MigrationReview {
  path: string;
  reason: 'owner-unresolved' | 'invalid-record' | 'invalid-collection' | 'duplicate-id' | 'invalid-group-key' |
    'invalid-nested-data' | 'broken-reference' | 'invalid-state' | 'duplicate-answer' | 'unrecognized-field';
  // Kept outside ordinary repository reads. Review requires an explicit owner
  // decision; current session, email, display name and array order are not proof.
  original: unknown;
  detail?: string;
}
export interface DomainSnapshot extends Omit<AppDataSnapshot,
  'schemaVersion' | 'notes' | 'studyPlan' | 'practiceHistory' | 'submissions' | 'grading' | 'forumPosts' | 'applications'> {
  schemaVersion: 2;
  revision: number;
  notes: OwnedNote[];
  studyPlan: Record<string, OwnedStudyTask[]>;
  practiceHistory: OwnedHistory[];
  attempts: OwnedAttempt[];
  submissions: OwnedSubmission[];
  grading: OwnedGrade[];
  forumPosts: OwnedForumPost[];
  applications: OwnedApplication[];
  migrationReview: MigrationReview[];
}
