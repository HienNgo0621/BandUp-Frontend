import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { GuestAccessBanner } from '../components/public/GuestAccessBanner';
import { PracticeCard } from '../components/public/PracticeCard';
import { PracticeFilters, type PracticeFilterState } from '../components/public/PracticeFilters';
import { PageHeading } from './PublicPages';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { ROLE_BASE_PATH } from '../data/navigation';
import { FULL_IELTS_MOCK_TEST, LISTENING_SAMPLE_CONTEXT, PRACTICE_FILTERS, PRACTICE_SAMPLE_INSTRUCTIONS, practiceItems, type PreviewItem, type PracticeSkill } from '../data/practiceContent';

const SKILLS: PracticeSkill[] = ['Listening', 'Reading', 'Writing', 'Speaking'];
function normalizeAnswer(value: string) { return value.trim().toLowerCase().replace(/[.,!?]/g, ''); }

function useStartAction(skill: PracticeSkill | 'Mock Test') {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  return (title: string) => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('guest-lock', { detail: { title, verb: skill === 'Mock Test' ? 'start this test' : 'start this exercise' } }));
      return;
    }
    if (user.role !== 'student') {
      showToast('Practice is available in the Student workspace.', 'info');
      return;
    }
    const route = skill === 'Mock Test' ? 'mocks' : `practice/${skill.toLowerCase()}`;
    navigate(`${ROLE_BASE_PATH.student}/${route}`);
  };
}

export function PracticeLibraryPage({ skill }: { skill: PracticeSkill }) {
  const [filter, setFilter] = useState<PracticeFilterState>({ search: '', group: 'All', checked: {} });
  const [collapsed, setCollapsed] = useState(false);
  const start = useStartAction(skill);
  const definition = PRACTICE_FILTERS[skill];
  const items = practiceItems[skill].filter((item) => {
    const textMatches = `${item.title} ${item.description} ${item.tags.join(' ')}`.toLowerCase().includes(filter.search.toLowerCase());
    const groupMatches = filter.group === 'All' || item.tags.includes(filter.group);
    const categoriesMatch = definition.filters.every((category) => {
      const active = filter.checked[category.label] ?? [];
      return active.length === 0 || active.some((tag) => item.tags.includes(tag));
    });
    return textMatches && groupMatches && categoriesMatch;
  });
  const intro = skill === 'Listening'
    ? 'Browse free, volunteer-made exercises. Log in to start one and save your result.'
    : skill === 'Reading'
      ? 'Browse free passages and question sets. Log in to start one and save your result.'
      : skill === 'Writing'
        ? 'Write to real exam-style prompts and receive feedback from a volunteer.'
        : 'Record your answer, then send it to a volunteer for personal feedback.';
  return <>
    <PageHeading title={`${skill} Practice`} description={intro} />
    <div className="public-container guest-practice-page"><GuestAccessBanner />
      <div className="lib-wrap" data-fc={collapsed ? '1' : '0'}><PracticeFilters definition={definition} value={filter} onChange={setFilter} onCollapseChange={setCollapsed} />
        <div className="practice-results"><p className="practice-result-count" aria-live="polite">{items.length} {items.length === 1 ? 'exercise' : 'exercises'}</p>
          {items.length ? <div className="cgrid">{items.map((item) => <PracticeCard key={item.id} skill={skill} item={item} sampleTo={`/sample/${skill.toLowerCase()}/${item.id}`} onPractice={() => start(item.title)} />)}</div> : <div className="empty"><b>No items match these filters.</b><button className="btn b4 mt-4" type="button" onClick={() => setFilter({ search: '', group: 'All', checked: {} })}>Clear all filters</button></div>}
        </div>
      </div>
    </div>
  </>;
}

export function MockTestsPage() {
  const start = useStartAction('Mock Test');
  const item: PreviewItem = { id: 'full-ielts', title: FULL_IELTS_MOCK_TEST.title, description: FULL_IELTS_MOCK_TEST.description, meta: `${FULL_IELTS_MOCK_TEST.duration} · ${FULL_IELTS_MOCK_TEST.questions}`, tag: FULL_IELTS_MOCK_TEST.tag, tags: ['Full Test'] };
  return <><PageHeading title="Mock Tests" description="A complete Listening paper followed by a complete Reading paper, in the prescribed IELTS order."/><div className="public-container guest-practice-page"><GuestAccessBanner /><div className="mock-test-layout"><PracticeCard skill="Mock Test" item={item} onPractice={() => start(item.title)} /><Card className="mock-structure"><h2>Test structure</h2><ol>{FULL_IELTS_MOCK_TEST.sections.map((section, index) => <li key={section.name}><b>{index + 1}</b><span><strong>{section.name} · {section.duration}</strong><small>{section.structure} ({section.questions})</small></span></li>)}</ol><p>{FULL_IELTS_MOCK_TEST.note}</p></Card></div></div></>;
}

function SimulatedAudio({ item }: { item: PreviewItem }) {
  const words = item.sampleAnswer?.join(' ').split(/\s+/).length ?? 0;
  const duration = item.id.startsWith('s') ? Math.round(words / 2.4) : (() => { const card = item.meta.match(/(\d+):(\d+)/); return card ? Number(card[1]) * 60 + Number(card[2]) : 300; })();
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => setElapsed((time) => Math.min(duration, time + 1)), 1000);
    return () => window.clearInterval(timer);
  }, [duration, playing]);
  useEffect(() => { if (playing && elapsed >= duration) setPlaying(false); }, [duration, elapsed, playing]);
  const time = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
  return <section className="card sample-player" aria-label={item.id.startsWith('s') ? 'Simulated recording' : 'Demo audio'}><div><span className="bdg bdg-orange">{item.id.startsWith('s') ? 'Simulated recording' : 'Demo audio'}</span><small>{item.id.startsWith('s') ? 'A sample answer is not recorded or played in this prototype.' : 'No real recording plays in this prototype.'}</small></div><div className="sample-player-controls"><button className="sample-player-toggle" type="button" aria-label={playing ? 'Pause demo audio' : 'Play demo audio'} onClick={() => { if (elapsed >= duration) setElapsed(0); setPlaying((state) => !state); }}><Icon name={playing ? 'pause' : 'play'} size={18} /></button><progress max={duration} value={elapsed} aria-label="Demo playback position"/><time>{time(elapsed)} / {time(duration)}</time></div></section>;
}

function RainShadowDiagram() {
  return <svg className="rain-shadow-diagram" viewBox="0 0 320 150" role="img" aria-label="Simplified rain-shadow desert diagram"><rect width="320" height="150" rx="10" fill="#F6F8F9"/><rect y="118" width="90" height="32" fill="#9AD7E4"/><text x="8" y="138" fontSize="10" fill="#155A6A">SEA</text><path d="M90 118 L170 28 L250 118Z" fill="#94A1AD"/><rect x="250" y="118" width="70" height="32" fill="#fde68a"/><text x="256" y="138" fontSize="9" fill="#78350f">DESERT</text><path d="M30 100 Q80 90 120 70" fill="none" stroke="#ea580c" strokeWidth="2"/><text x="14" y="92" fontSize="9" fill="#36434F">1 Moist winds</text><text x="130" y="20" fontSize="9" fill="#36434F">2 Rain falls</text><text x="215" y="80" fontSize="9" fill="#36434F">3 Dry air</text></svg>;
}

export function SamplePreviewPage() {
  const { skill: slug, sampleId } = useParams<{ skill: string; sampleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const skill = SKILLS.find((item) => item.toLowerCase() === slug) ?? 'Listening';
  const item = practiceItems[skill].find((entry) => entry.id === sampleId);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  if (!item) return <main className="public-container guest-practice-page"><div className="empty"><b>Sample unavailable.</b><Link className="btn b4 mt-4" to={`/practice/${skill.toLowerCase()}`}>Back to {skill} Practice</Link></div></main>;
  const section = LISTENING_SAMPLE_CONTEXT.find((value) => value.id === item.id);
  const questions = item.questions ?? [];
  const score = questions.reduce((count, question, index) => count + (question.answer.split('|').some((answer) => normalizeAnswer(answer) === normalizeAnswer(answers[index] ?? '')) ? 1 : 0), 0);
  const start = () => {
    if (!user) { window.dispatchEvent(new CustomEvent('guest-lock', { detail: { title: item.title, verb: 'start this exercise' } })); return; }
    if (user.role !== 'student') { showToast('Practice is available in the Student workspace.', 'info'); return; }
    navigate(`${ROLE_BASE_PATH.student}/practice/${skill.toLowerCase()}`);
  };
  const wordCount = item.sampleAnswer?.join(' ').trim().split(/\s+/).length ?? 0;
  return <>
    <PageHeading eyebrow={`${skill} · Sample preview`} title={item.title} description={`${item.tag} · ${item.meta}`} />
    <div className="public-container sample-page"><GuestAccessBanner /><button className="btn b4 sample-back" type="button" onClick={() => navigate(`/practice/${skill.toLowerCase()}`)}><Icon name="chevron-left" size={16} /> Back to {skill} practice</button>
      <div className="sample-notice" role="note"><Icon name="info" size={18} /><span><b>Sample preview.</b> Nothing here is timed, saved or sent to a volunteer.{skill === 'Listening' ? ' The audio player is a demo and does not play a real recording.' : skill === 'Speaking' ? ' The recording player is simulated.' : ''}</span></div>
      {skill === 'Listening' && section && <div className="sample-column-layout"><div className="sample-main-column"><SimulatedAudio item={item} /><Card className="sample-paper"><h2>{item.tag}: {section.context}</h2><p>{section.intro}</p><details className="sample-transcript" open><summary>Demo transcript excerpt</summary><p>{item.transcript}</p><small>Written for this prototype to match the sample questions below.</small></details></Card><SampleQuestionSection instructions={PRACTICE_SAMPLE_INSTRUCTIONS[item.id]} questions={questions} answers={answers} checked={checked} score={score} onChange={(index, answer) => setAnswers((current) => ({ ...current, [index]: answer }))} onCheck={() => setChecked(true)} onReset={() => { setAnswers({}); setChecked(false); }} /></div><aside className="sample-side-column"><Card className="sample-guidance"><h2>What you will hear</h2><ul>{section.whatYouWillHear.map((line) => <li key={line}>{line}</li>)}</ul></Card></aside></div>}
      {skill === 'Reading' && <div className="sample-column-layout reading-sample"><div className="sample-main-column"><Card className="sample-paper"><div className="sample-paper-title"><h2>{item.title.replace(/^Passage \d+: /, '')}</h2><span className="bdg bdg-slate">Excerpt: paragraphs {item.passages?.slice(0, 2).map(([letter]) => letter).join('–')}</span></div><div className="sample-passage-text">{item.passages?.slice(0, 2).map(([letter, paragraph]) => <p key={letter}><b>{letter}</b> {paragraph}</p>)}</div></Card></div><div className="sample-side-column"><SampleQuestionSection instructions={PRACTICE_SAMPLE_INSTRUCTIONS[item.id]} questions={questions} answers={answers} checked={checked} score={score} onChange={(index, answer) => setAnswers((current) => ({ ...current, [index]: answer }))} onCheck={() => setChecked(true)} onReset={() => { setAnswers({}); setChecked(false); }} /></div></div>}
      {skill === 'Writing' && <div className="sample-column-layout writing-sample"><div className="sample-main-column"><Card className="sample-paper"><span className="bdg bdg-blue">{item.tag}</span><h2>Task prompt</h2><p>{item.prompt}</p>{item.id === 'w1' && <RainShadowDiagram />}</Card><Card className="sample-paper"><div className="sample-paper-title"><h2>Sample response</h2><span className="bdg bdg-slate">{wordCount} words</span></div>{item.sampleAnswer?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</Card></div><aside className="sample-side-column"><Card className="sample-guidance"><h2>What the examiner looks for</h2><ul>{item.criteria?.map(([title, detail]) => <li key={title}><b>{title}</b><span>{detail}</span></li>)}</ul></Card><Card className="sample-guidance"><h2>Response guidance</h2><ul><li>Recommended: {item.meta.split(' · ')[1]}.</li><li>This sample has {wordCount} words{wordCount < (item.id === 'w1' ? 150 : 250) ? ': a condensed model. Your own response should reach the recommended length.' : '.'}</li><li>{item.id === 'w1' ? 'Start with a clear overview of the main stages or trends.' : 'State your position in the introduction and repeat it in the conclusion.'}</li></ul></Card></aside></div>}
      {skill === 'Speaking' && <div className="sample-column-layout speaking-sample"><div className="sample-main-column"><SimulatedAudio item={item} />{item.prompts?.map((prompt, index) => <Card className="sample-paper" key={prompt}><div className="sample-paper-title"><span className="bdg bdg-blue">{item.tag}</span><span>Question {index + 1} of {item.prompts?.length}</span></div><h2>{prompt}</h2><p className="sample-subheading">Sample answer</p><p>{item.sampleAnswer?.[index]}</p></Card>)}</div><aside className="sample-side-column"><Card className="sample-guidance"><h2>Useful phrases</h2><div className="sample-phrases">{item.phrases?.map((phrase) => <span className="bdg bdg-blue" key={phrase}>{phrase}</span>)}</div></Card><Card className="sample-guidance"><h2>Response tips</h2><ul>{item.tips?.map((tip) => <li key={tip}>{tip}</li>)}</ul></Card></aside></div>}
      <Card className="sample-start"><div><h2>Ready to try the real exercise?</h2><p>{user?.role === 'student' ? 'Your answers and result will be saved to your history.' : 'Log in to start this exercise and save your result.'}</p></div><div><Link className="btn b4" to={`/practice/${skill.toLowerCase()}`}>Back</Link><button className="btn b1" type="button" onClick={start}>Start this exercise</button></div></Card>
    </div>
  </>;
}

function SampleQuestionSection({ instructions, questions, answers, checked, score, onChange, onCheck, onReset }: { instructions?: string; questions: PreviewItem['questions']; answers: Record<number, string>; checked: boolean; score: number; onChange: (index: number, value: string) => void; onCheck: () => void; onReset: () => void }) {
  if (!questions) return null;
  return <Card className="sample-paper sample-questions"><h2>Sample questions</h2><p>{instructions ?? 'Choose the correct answer.'}</p><div>{questions.map((question, index) => <fieldset className="sample-question" key={question.text}><legend><span className="exn">{index + 1}</span><span>{question.text.replace(/____/g, '_____')}</span></legend>{question.type === 'choice' ? <div className="sample-answer-options">{question.options?.map((option, optionIndex) => <label className="exmc" key={option}><input className="sr-only" type="radio" name={`sample-question-${index}`} value={option} checked={answers[index] === option} onChange={() => onChange(index, option)} /><b>{String.fromCharCode(65 + optionIndex)}</b><span>{option}</span></label>)}</div> : <input className="exfill" aria-label={`Answer for question ${index + 1}`} value={answers[index] ?? ''} onChange={(event) => onChange(index, event.target.value)} />}{checked && <p className={`sample-answer-status ${question.answer.split('|').some((answer) => normalizeAnswer(answer) === normalizeAnswer(answers[index] ?? '')) ? 'is-correct' : 'is-incorrect'}`}>{question.answer.split('|').some((answer) => normalizeAnswer(answer) === normalizeAnswer(answers[index] ?? '')) ? 'Correct' : `Answer: ${question.answer.split('|')[0]}`}</p>}</fieldset>)}</div><div className="sample-question-actions"><button className="btn b3" type="button" onClick={onCheck}>Check my answers</button><button className="btn b4" type="button" onClick={onReset}>Reset</button></div><div aria-live="polite">{checked && <p className="sample-check-result">{score} of {questions.length} sample questions correct. Your answers are not timed, saved, or added to your history.</p>}</div></Card>;
}
