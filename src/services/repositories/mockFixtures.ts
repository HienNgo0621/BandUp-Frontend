import type { DomainSnapshot } from '../domain/schema';

// Pure fixtures for opt-in mock development/tests. Never imported by the live
// loader, never assigned to unresolved legacy records, no credential shortcuts.
export function createRepositoryFixture(): DomainSnapshot {
  const learner = (suffix: string) => ({ id: `fixture:student:${suffix}`, name: `Synthetic learner ${suffix.toUpperCase()}`,
    role: 'student' as const, status: 'active' as const, label: 'Learner' });
  const teacher = (suffix: string) => ({ id: `fixture:teacher:${suffix}`, name: `Synthetic teacher ${suffix.toUpperCase()}`,
    role: 'teacher' as const, status: 'active' as const, label: 'Teacher' });
  const users = [learner('a'), learner('b'), teacher('a'), teacher('b'),
    { id: 'fixture:admin', name: 'Synthetic administrator', role: 'admin' as const, status: 'active' as const, label: 'Administrator' }];
  return {
    schemaVersion: 2, revision: 0, users, legacy: {}, migratedAt: null, migrationReview: [], preferences: {}, supportMessages: [],
    notes: ['a', 'b'].map((suffix) => ({ id: `fixture:note:${suffix}`, ownerId: `fixture:student:${suffix}`,
      type: 'Other', heading: `Learning note ${suffix.toUpperCase()}`, meaning: `Separate synthetic content ${suffix}` })),
    studyPlan: { '2026-11-27': ['a', 'b'].map((suffix) => ({ id: `fixture:task:${suffix}`, ownerId: `fixture:student:${suffix}`,
      title: `Reading practice ${suffix.toUpperCase()}`, skill: 'Reading', minutes: 15, done: false })) },
    questionBank: [{ id: 'fixture:content', title: 'Reading practice', skill: 'Reading', status: 'Published',
      questionCount: 1, sections: [{ id: 'fixture:section', title: 'Reading', groups: [{ id: 'fixture:group', type: 'Short Answer', startQuestionNumber: 1,
        questions: [{ id: 'fixture:question', number: 1, prompt: 'Read the supplied text.', answerKey: 'synthetic answer' }] }] }] }],
    attempts: ['a', 'b'].map((suffix) => ({ id: `fixture:attempt:${suffix}`, ownerId: `fixture:student:${suffix}`,
      userId: `fixture:student:${suffix}`, questionSetId: 'fixture:content', skill: 'Reading', status: 'in_progress', stage: 'Reading',
      startedAt: 1, remainingSeconds: 60, answers: [], flaggedQuestionIds: [] })),
    practiceHistory: ['a', 'b'].map((suffix) => ({ id: `fixture:history:${suffix}`, ownerId: `fixture:student:${suffix}`,
      userId: `fixture:student:${suffix}`, skill: 'Reading', title: `Historical practice ${suffix.toUpperCase()}`, timestamp: 1 })),
    submissions: ['a', 'b'].map((suffix) => ({ id: `fixture:submission:${suffix}`, ownerId: `fixture:student:${suffix}`,
      studentId: `fixture:student:${suffix}`, title: `Writing ${suffix.toUpperCase()}`, skill: 'Writing', status: 'posted', visibility: 'PUBLIC', createdAt: 1 })),
    grading: ['a', 'b'].map((suffix) => ({ id: `fixture:grade:${suffix}`, ownerId: `fixture:teacher:${suffix}`,
      teacherId: `fixture:teacher:${suffix}`, submissionId: 'fixture:submission:a', bandScore: 6, feedback: `Synthetic feedback from teacher ${suffix}.`, createdAt: 1, updatedAt: 1 })),
    forumPosts: [{ id: 'fixture:post:public', ownerId: 'fixture:student:a', authorId: 'fixture:student:a', title: 'Public discussion', body: 'Public synthetic discussion.',
      tags: ['Writing'], skill: 'Writing', status: 'published', visibility: 'PUBLIC' },
    { id: 'fixture:post:private', ownerId: 'fixture:student:a', authorId: 'fixture:student:a', title: 'Private synthetic title', body: 'Private synthetic content.',
      tags: ['Private'], skill: 'Writing', status: 'published', visibility: 'ONLY_ME' },
    { id: 'fixture:post:teacher', ownerId: 'fixture:student:b', authorId: 'fixture:student:b', title: 'Teacher feedback request', body: 'Teacher-visible synthetic content.',
      tags: ['Writing'], skill: 'Writing', status: 'published', visibility: 'TEACHER_ONLY' }],
    notifications: [{ id: 'fixture:notification:a', recipientId: 'fixture:student:a', content: 'Your feedback is available.', createdAt: 1, readBy: [] },
      { id: 'fixture:notification:b', recipientId: 'fixture:student:b', content: 'Your practice reminder.', createdAt: 1, readBy: [] },
      { id: 'fixture:notification:students', recipientId: 'all:student', content: 'A new practice activity is available.', createdAt: 1, readBy: [] }],
    applications: [], registrations: [], forumTopics: [], forumComments: [], forumReports: [],
  };
}
