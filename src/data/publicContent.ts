export interface PublicFeature { title: string; description: string }
export interface VolunteerContributor { name: string; role: string; initials: string; tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze'; hours: number; contributions: number }
export interface CommunityStory { name: string; role: string; quote: string }

export const PUBLIC_FEATURES: PublicFeature[] = [
  { title: 'Practise all four skills', description: 'Listening, Reading, Writing and Speaking exercises you can filter by section and question type.' },
  { title: 'Full mock tests', description: 'Rehearse exam day with a countdown timer and an instant band estimate.' },
  { title: 'Forum-based feedback', description: 'Submit Writing and Speaking to Forum. Teacher / Volunteers grade directly on each eligible post, with independent grading comments.' },
  { title: 'Notes you can trace', description: 'Take notes while you practise, then jump back to the exact task whenever you need it.' },
  { title: 'See your progress', description: 'Follow your band trajectory and spot the skill that needs the most attention.' },
  { title: 'A plan for your exam date', description: 'A daily study schedule that counts down to the day you sit the test.' },
];

export const PUBLIC_VOLUNTEERS: VolunteerContributor[] = [
  { name: 'Phuong Hoang', role: 'Writing & Speaking feedback', initials: 'PH', tier: 'Platinum', hours: 412, contributions: 186 },
  { name: 'Minh Tran', role: 'Listening recordings', initials: 'MT', tier: 'Gold', hours: 365, contributions: 94 },
  { name: 'Linh Nguyen', role: 'Writing Task 1 feedback', initials: 'LN', tier: 'Silver', hours: 240, contributions: 142 },
  { name: 'Sarah Mitchell', role: 'Speaking practice', initials: 'SM', tier: 'Silver', hours: 198, contributions: 121 },
  { name: 'David Okafor', role: 'Reading passages', initials: 'DO', tier: 'Bronze', hours: 120, contributions: 48 },
  { name: 'Hana Lee', role: 'Vocabulary decks', initials: 'HL', tier: 'Bronze', hours: 96, contributions: 31 },
];

export const PROTOTYPE_STATISTICS = { learners: 12480, learnersMonth: 320, teachers: 152, teachersMonth: 8, tasksReviewed: 9200, hoursGiven: 4800, countries: 40 } as const;
const roundedPlus = (value: number, interval: number) => `${Math.floor(value / interval) * interval}+`;
export const LANDING_IMPACT = [
  { value: roundedPlus(PROTOTYPE_STATISTICS.learners, 1000), label: 'Learners supported' },
  { value: roundedPlus(PROTOTYPE_STATISTICS.teachers, 10), label: 'Volunteer teachers' },
  { value: roundedPlus(PROTOTYPE_STATISTICS.tasksReviewed, 100), label: 'Tasks reviewed with feedback' },
  { value: '100%', label: 'Free, always' },
];

export const VOLUNTEER_OF_THE_MONTH_TOTALS = {
  name: PUBLIC_VOLUNTEERS[0].name,
  initials: PUBLIC_VOLUNTEERS[0].initials,
  role: PUBLIC_VOLUNTEERS[0].role,
  hours: PUBLIC_VOLUNTEERS[0].hours,
  tasks: PUBLIC_VOLUNTEERS[0].contributions,
};

export const VOLUNTEER_OF_THE_MONTH = {
  month: 'October 2026',
  quote: 'Every learner I help reminds me why I started teaching. Watching someone reach the band they worked for is the best reward.',
};

export const HALL_OF_FAME_STATS = [
  { value: roundedPlus(PROTOTYPE_STATISTICS.hoursGiven, 100), label: 'Hours donated' },
  { value: roundedPlus(PROTOTYPE_STATISTICS.tasksReviewed, 100), label: 'Tasks reviewed' },
  { value: roundedPlus(PROTOTYPE_STATISTICS.teachers, 10), label: 'Active volunteers' },
  { value: String(PROTOTYPE_STATISTICS.countries), label: 'Countries represented' },
];

export const COMMUNITY_STORIES: CommunityStory[] = [
  { name: 'Linh N.', role: 'Student · 6.0 → 7.5', quote: 'The volunteer’s corrections on my essays showed me exactly what to fix. I could finally see my Writing improve.' },
  { name: 'Minh T.', role: 'Student · 6.5 → 7.5', quote: 'Timed mock tests made the real exam feel familiar. I walked in calm and prepared.' },
  { name: 'Hana L.', role: 'Volunteer', quote: 'I reached Band 8 thanks to this community. Now I make vocabulary decks to help the next learner.' },
];
