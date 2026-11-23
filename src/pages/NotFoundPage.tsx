import { Link } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <div className="not-found-card card">
        <span className="not-found-icon"><Icon name="search" size={26} /></span>
        <p className="placeholder-section-label">ERROR 404</p>
        <h1 className="serif">Page not found</h1>
        <p>The address may be incorrect, or this route has not been added to the application.</p>
        <Link to="/" className="btn b1">
          Back to home <Icon name="arrow-right" size={17} />
        </Link>
      </div>
    </main>
  );
}
