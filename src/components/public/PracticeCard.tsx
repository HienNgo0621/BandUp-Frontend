import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { PRACTICE_CARD_IMAGES, type PreviewItem, type PracticeSkill } from '../../data/practiceContent';

type PracticeCardSkill = PracticeSkill | 'Mock Test';

export function PracticeCard({ skill, item, sampleTo, onPractice }: { skill: PracticeCardSkill; item: PreviewItem; sampleTo?: string; onPractice: () => void }) {
  const pieces = item.meta.split(' · ');
  const metaItems = skill === 'Mock Test'
    ? [['clock', pieces[0]], ['help-circle', pieces[1]]]
    : skill === 'Listening' || skill === 'Reading'
    ? [['help-circle', pieces[0]], ['clock', pieces[1]]]
    : [['clock', skill === 'Speaking' ? pieces[1] : pieces[1]], ['user', 'Volunteer feedback']];

  return <article className="pc v10-skill-card" data-id={item.id} data-tags={item.tags.join('|')}>
    <div className="pc-visual" role="img" aria-label={`${skill} practice`} style={{ backgroundImage: `linear-gradient(90deg, rgba(17,42,30,.08), rgba(17,42,30,.2)), url('${PRACTICE_CARD_IMAGES[skill]}')` }}>
      <span>{skill}</span>
    </div>
    <div className="pc-body">
      <div className="pc-body-top"><span className="pc-tag">{item.tag}</span></div>
      <h3>{item.title}</h3>
      <p className="pc-d">{item.description}</p>
      <div className="pc-meta">{metaItems.map(([icon, value]) => <span key={`${icon}-${value}`}><Icon name={icon as 'help-circle' | 'clock' | 'user'} size={16} />{value}</span>)}</div>
      <div className="pc-foot v10-card-actions">{sampleTo && <Link className="btn b4" to={sampleTo}>View sample</Link>}<button className="btn b1" type="button" onClick={onPractice}>{skill === 'Mock Test' ? 'Start full mock test' : 'Practice'}</button></div>
    </div>
  </article>;
}
