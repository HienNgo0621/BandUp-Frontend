export type HelpCategory = 'General' | 'Getting started' | 'Practice & exams' | 'Feedback & grading' | 'Account';
export interface HelpArticle { category: HelpCategory; question: string; answer: string }

export const helpArticles: HelpArticle[] = [
  { category: 'General', question: 'Is BandUp IELTS really free?', answer: 'Yes, completely. BandUp IELTS is a non-profit community project. There are no payments and no ads. Everything is made and maintained by volunteers.' },
  { category: 'General', question: 'Who are the volunteers?', answer: 'Teachers, experienced IELTS test-takers and language lovers who donate their time. Every volunteer is verified by our team before they can give feedback.' },
  { category: 'General', question: 'How does Writing / Speaking feedback work?', answer: 'Submit your Writing or Speaking response from Practice and choose its visibility. The system publishes it to the matching Forum topic. Teacher / Volunteers can add grading comments with band scores directly on the post.' },
  { category: 'General', question: 'How long does grading take?', answer: 'Grading depends on Teacher / Volunteer availability. A fixed review-time commitment has not been confirmed. Check your Forum post and in-app notifications for new grading comments.' },
  { category: 'General', question: 'Can I look around without an account?', answer: 'Of course. You can browse every exercise as a guest. To start an exercise and save your results you need to create a free learner account.' },
  { category: 'General', question: 'Are the practice tests like the real exam?', answer: 'They follow the IELTS Academic format, with the same sections, timings and question types, so you can rehearse under realistic conditions.' },
  { category: 'General', question: 'How do I become a volunteer?', answer: 'Choose the Teacher / Volunteer application path and provide your qualification information. Evidence-file requirements and review timing are not configured in this prototype.' },
  { category: 'General', question: 'Can I share my own exercises?', answer: 'Send us your suggestion through the contact form, or apply as a volunteer to submit questions to the question bank.' },
  { category: 'Getting started', question: 'Do I need an account to practise?', answer: 'You can browse every exercise as a guest. Create a free student account to start exercises and save results.' },
  { category: 'Getting started', question: 'How do I start my first exercise?', answer: 'Open Practice, choose a skill, then press “Practice now”. Most learners start their first exercise in under five minutes.' },
  { category: 'Practice & exams', question: 'How do the filters work?', answer: 'Use the filter panel to narrow exercises by section, question type or source. Collapse the panel to see more cards.' },
  { category: 'Account', question: 'How do I reset my password?', answer: 'Choose “Forgot password” on the login page. This prototype only simulates the request: it does not send email or enforce a reset-token expiry policy.' },
];
