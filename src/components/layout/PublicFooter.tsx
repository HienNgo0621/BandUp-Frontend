import { Link } from 'react-router-dom';

const practiceLinks = [
  { label: 'Listening', to: '/practice/listening' },
  { label: 'Reading', to: '/practice/reading' },
  { label: 'Writing', to: '/practice/writing' },
  { label: 'Speaking', to: '/practice/speaking' },
  { label: 'Mock Tests', to: '/mocks' },
];

const exploreLinks = [
  { label: 'Forum', to: '/forum' },
  { label: 'About & volunteers', to: '/about' },
  { label: 'Contact & feedback', to: '/contact' },
];

const joinLinks = [
  { label: 'Log in', to: '/login' },
  { label: 'Join as a student', to: '/signup' },
  { label: 'Volunteer with us', to: '/apply' },
];

function FooterColumn({ title, links }: { title: string; links: typeof practiceLinks }) {
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

export function PublicFooter() {
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
          <Link to="/privacy">Privacy</Link>
          <Link to="/guidelines">Guidelines</Link>
        </div>
      </div>
    </footer>
  );
}
