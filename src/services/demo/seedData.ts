import type { User } from '../../types/user';
import type { QuestionBankSet } from '../../types/question-bank';
import type { StudyPlan, LearningNote, LearningHistory } from '../../types/learning';
import type { ForumPost } from '../../types/forum';

export const demoUsers: User[] = [
  { id: 's1', name: 'Hien Phuong', email: 'hien.phuong@example.com', role: 'student', status: 'active', label: 'Learner', profile: { shortName: 'Hien P.' } },
  { id: 'sx1', name: 'Minh Tran', email: 'minh.t@example.com', role: 'student', status: 'active', label: 'Learner', profile: { shortName: 'Minh T.' } },
  { id: 'sx2', name: 'Hoa Pham', email: 'hoa.p@example.com', role: 'student', status: 'active', label: 'Learner', profile: { shortName: 'Hoa P.' } },
  { id: 'sx3', name: 'Linh Nguyen', email: 'linh.n@example.com', role: 'student', status: 'active', label: 'Learner', profile: { shortName: 'Linh N.' } },
  { id: 'sx4', name: 'An Vu', email: 'an.v@example.com', role: 'student', status: 'muted', label: 'Learner', profile: { shortName: 'An V.' } },
  { id: 'sx5', name: 'Tuan Kiet', email: 'tuan.k@example.com', role: 'student', status: 'active', label: 'Learner', profile: { shortName: 'Tuan K.' } },
  { id: 'sx6', name: 'Mai Do', email: 'mai.d@example.com', role: 'student', status: 'active', label: 'Learner', profile: { shortName: 'Mai D.' } },
  { id: 'sx7', name: 'Bao Le', email: 'bao.l@example.com', role: 'student', status: 'blocked', label: 'Learner', profile: { shortName: 'Bao L.' } },
  { id: 'v1', name: 'Phuong Hoang', email: 'phuong.hoang@example.com', role: 'teacher', status: 'active', label: 'Teacher / Volunteer', profile: { shortName: 'Hoang' } },
  { id: 'v2', name: 'Mark Tran', email: 'mark.tran@example.com', role: 'teacher', status: 'active', label: 'Teacher / Volunteer', profile: { shortName: 'Mark' } },
  { id: 'vp1', name: 'Elena Rossi', email: 'elena.r@example.com', role: 'teacher', status: 'pending', label: 'Teacher / Volunteer' },
  { id: 'vp2', name: 'Kenji Sato', email: 'kenji.s@example.com', role: 'teacher', status: 'pending', label: 'Teacher / Volunteer' },
  { id: 'vp3', name: 'Hana Lee', email: 'hana.l@example.com', role: 'teacher', status: 'active', label: 'Teacher / Volunteer' },
  { id: 'a1', name: 'Admin', role: 'admin', status: 'active', label: 'Administrator', profile: { shortName: 'Admin' } },
];

export const demoQuestionBank: QuestionBankSet[] = [
  { id: 'q1', title: 'Cambridge-style Reading · Test 1', skill: 'Reading', source: 'Official', questionCount: 40, durationMinutes: 60, status: 'Published' },
  { id: 'q2', title: 'Cambridge-style Reading · Test 2', skill: 'Reading', source: 'Official', questionCount: 40, durationMinutes: 60, status: 'Published' },
  { id: 'q3', title: 'Cambridge-style Listening · Test 1', skill: 'Listening', source: 'Official', questionCount: 40, durationMinutes: 30, status: 'Published' },
  { id: 'q4', title: 'Listening Section 1: Hotel Booking', skill: 'Listening', source: 'Community', questionCount: 10, durationMinutes: 6, status: 'Published' },
  { id: 'q5', title: 'Writing Task 1: Rain-shadow Desert', skill: 'Writing', source: 'Official', questionCount: 1, durationMinutes: 20, status: 'Published' },
  { id: 'q6', title: 'Writing Task 2: Technology and the Wealth Gap', skill: 'Writing', source: 'Community', questionCount: 1, durationMinutes: 40, status: 'Published' },
  { id: 'q7', title: 'Speaking Part 1: Work or Studies', skill: 'Speaking', source: 'Community', questionCount: 3, durationMinutes: 5, status: 'Draft' },
  { id: 'q8', title: 'Full Mock Test 3 · Reading', skill: 'Mock Test', source: 'Official', questionCount: 40, durationMinutes: 60, status: 'Draft' },
];

export const demoNotifications = [
  { id: 'n1', recipientId: 's1', content: 'Your Writing Task 2 was reviewed by Hoang. Take a look at the feedback.', createdAt: Date.now() - 10 * 86_400_000 + 9_000_000, readBy: [] as string[], relatedRoute: 'feedback', relatedEntityId: 'f1' },
];

function demoStudyPlan(): StudyPlan {
  const day = (offset: number) => { const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() + offset); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
  return {
    [day(-1)]: [{ id: 1, title: 'Reading practice: Passage 1', skill: 'Reading', minutes: 20, done: true }, { id: 2, title: 'Review 5 saved notes', skill: 'Notes', minutes: 10, done: true }],
    [day(0)]: [{ id: 3, title: 'Reading practice: Passage 2', skill: 'Reading', minutes: 20, done: true }, { id: 4, title: 'Writing Task 2: submit to Forum for feedback', skill: 'Writing', minutes: 40, done: false }, { id: 5, title: 'Listening Section 3', skill: 'Listening', minutes: 15, done: false }],
    [day(1)]: [{ id: 6, title: 'Speaking Part 1 practice', skill: 'Speaking', minutes: 15, done: false }, { id: 7, title: 'Mock test: Reading', skill: 'Reading', minutes: 60, done: false }],
  };
}

const demoNotes: LearningNote[] = [
  { id: 1, type: 'Vocabulary', heading: 'mitigate', meaning: 'to make something less harmful or serious', example: 'Governments must act to mitigate the effects of climate change.', source: 'Reading · Question 19', dateLabel: 'Oct 11', reference: { kind: 'Reading', token: 'p3', title: 'Cambridge-style Reading · Test 4', question: 19 } },
  { id: 2, type: 'Grammar', heading: 'Present perfect vs. past simple', meaning: 'Use the past simple for finished times (yesterday, in 2020). Use the present perfect when the time is not stated or still relevant.', example: 'I have lived here for five years. / I moved here in 2021.', source: 'Writing · Technology and the Wealth Gap', dateLabel: 'Oct 9', reference: { kind: 'Writing', token: 't4', title: 'Technology and the Wealth Gap' } },
  { id: 3, type: 'Mistake', heading: 'I go there last summer.', meaning: 'The time marker “last summer” needs the past simple.', example: 'I went there last summer.', source: 'Speaking · Hometown', dateLabel: 'Oct 8', reference: { kind: 'Speaking', token: 't5', title: 'Hometown' } },
  { id: 4, type: 'Vocabulary', heading: 'sedentary', meaning: 'involving little physical activity; sitting for most of the day', example: 'A sedentary lifestyle increases the risk of heart disease.', source: 'Reading · Question 23', dateLabel: 'Oct 5', reference: { kind: 'Reading', token: 'p6', title: 'Cambridge-style Reading · Test 3', question: 23 } },
];

function demoPracticeHistory(): LearningHistory[] {
  const now = Date.now();
  const skills = ['Reading', 'Listening', 'Mock Test'] as const;
  const records: LearningHistory[] = [];
  for (let dayOffset = 1; dayOffset <= 12; dayOffset += 1) {
    const skill = skills[dayOffset % skills.length];
    const correct = 22 + ((dayOffset * 7) % 15);
    records.push({ id: `p${dayOffset}`, userId: 's1', skill, title: `Cambridge-style ${skill === 'Mock Test' ? 'Mock Test · Reading' : skill} · Test ${1 + (dayOffset % 4)}`, timestamp: now - dayOffset * 86_400_000, durationSeconds: (30 + ((dayOffset * 11) % 28)) * 60, score: correct });
  }
  return records;
}

const demoForumPosts: ForumPost[] = [
  { id: 'fp-demo-public', authorId: 's1', authorName: 'Hien Phuong', skill: 'Writing', title: 'How can I make Task 2 arguments more specific?', body: 'I can usually state my opinion clearly, but my supporting examples sometimes remain too general. What helps you turn a broad idea into a concrete example without spending too much time planning?', topicKey: 'writing', tags: ['writing'], visibility: 'PUBLIC', status: 'published', createdAt: Date.now() - 86_400_000 * 2 },
  { id: 'fp-demo-private', authorId: 's1', authorName: 'Hien Phuong', skill: 'Speaking', title: 'Private speaking practice reflection', body: 'This sample post is visible only to its owner. It is included to demonstrate the Only me visibility rule.', topicKey: 'speaking', tags: ['speaking'], visibility: 'ONLY_ME', status: 'published', createdAt: Date.now() - 3_600_000 },
];

export function createEmptyAppData() {
  return { schemaVersion: 1, users: demoUsers, questionBank: demoQuestionBank, notifications: demoNotifications, legacy: {}, migratedAt: null as number | null, registrations: [], applications: [], submissions: [], grading: [], forumTopics: [{ id: 'writing', key: 'writing', title: 'Writing practice' }, { id: 'speaking', key: 'speaking', title: 'Speaking practice' }], forumPosts: demoForumPosts, forumComments: [], forumReports: [], practiceHistory: demoPracticeHistory(), studyPlan: demoStudyPlan(), notes: demoNotes, preferences: {}, supportMessages: [] };
}
