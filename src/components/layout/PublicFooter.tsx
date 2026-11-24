import { Link } from 'react-router-dom';
import { PUBLIC_ABOUT_ITEMS, PUBLIC_COMMUNITY_ITEMS, PUBLIC_HELP_ITEM, PUBLIC_JOIN_ITEMS, PUBLIC_PRACTICE_ITEMS } from '../../data/navigation';

const practiceLinks = PUBLIC_PRACTICE_ITEMS.map(({ label, to }) => ({ label, to }));
const exploreLinks = [...PUBLIC_COMMUNITY_ITEMS, ...PUBLIC_ABOUT_ITEMS, PUBLIC_HELP_ITEM].map(({ label, to }) => ({ label, to }));
const joinLinks = PUBLIC_JOIN_ITEMS.map(({ label, to }) => ({ label, to }));

function FooterColumn({ title, links }: { title: string; links: Array<{ label: string; to: string }> }) {
  return (
    <div>
      <h2 className="footer-column-title">{title}</h2>
      <ul className="footer-link-list">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PublicFooter({ onOpenLegal }: { onOpenLegal: (kind: 'privacy' | 'guidelines') => void }) {
  return (
    <footer className="public-footer">
      <div className="public-footer-grid">
        <div className="public-footer-about">
          <p className="footer-brand">
            <span className="logo-mark">BU</span>
            <span>BandUp IELTS</span>
          </p>
          <p>A non-profit IELTS practice community.</p>
        </div>
        <FooterColumn title="Practice" links={practiceLinks} />
        <FooterColumn title="Explore" links={exploreLinks} />
        <FooterColumn title="Join us" links={joinLinks} />
      </div>
      <div className="public-footer-bottom">
        <p>© 2026 BandUp IELTS Community · A non-profit, volunteer-run project</p>
        <div className="footer-legal-links">
          <Link to="/help">Help Center</Link>
          <button type="button" onClick={() => onOpenLegal('privacy')}>Privacy</button>
          <button type="button" onClick={() => onOpenLegal('guidelines')}>Guidelines</button>
        </div>
      </div>
    </footer>
  );
}
