import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';

export function AuthLayout({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return <section className="auth-page"><div className="auth-page-inner"><div className="auth-intro"><Link to="/" className="brand-lockup"><span className="logo-mark">BU</span><span>BandUp IELTS</span></Link><span className="public-eyebrow">{eyebrow}</span><h1 className="serif">{title}</h1><p>{description}</p><div className="auth-back-link"><Link to="/">← Back to BandUp IELTS</Link></div></div><Card className="auth-card">{children}</Card></div></section>;
}
