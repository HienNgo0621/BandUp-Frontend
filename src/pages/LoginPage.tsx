import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';
import { demoUsers } from '../services/demo/seedData';
import { ROLE_BASE_PATH, ROLE_LABELS } from '../data/navigation';

export function LoginPage() {
  const { user, login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  if (user) return <Navigate to={ROLE_BASE_PATH[user.role]} replace />;
  const finish = async (id: string) => {
    setBusy(true);
    const result = await login(id);
    setBusy(false);
    if (!result.ok) {
      showToast(result.reason === 'blocked' ? 'This account has been blocked by an administrator.' : result.reason === 'not-found' ? 'No demo account matches that ID or email.' : 'This browser could not save the session.', 'error');
      return;
    }
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    navigate(from || ROLE_BASE_PATH[result.user.role], { replace: true });
  };
  return <div className="placeholder-page"><div className="mx-auto max-w-xl"><Card className="p-6 md:p-8">
    <span className="placeholder-section-label">BANDUP IELTS · DEMO</span><h1 className="serif placeholder-title">Log in</h1>
    <p className="placeholder-description">Choose a demo account or enter its user ID or email. Demo accounts do not use passwords.</p>
    <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); void finish(identifier); }}>
      <Input label="User ID or email" value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" required />
      <Button type="submit" busy={busy}>Continue</Button>
    </form>
    <div className="mt-7 border-t border-slate-200 pt-5"><h2 className="text-sm font-bold text-slate-900">Explore as a demo account</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{demoUsers.filter((item) => ['s1', 'v1', 'v2', 'a1', 'sx7'].includes(item.id)).map((item) =>
        <Button key={item.id} variant="outline" disabled={busy} onClick={() => void finish(item.id)}>
          {ROLE_LABELS[item.role]}{item.id === 'sx7' ? ' · Blocked example' : item.role === 'teacher' ? ` · ${item.profile?.shortName}` : ''}
        </Button>)}</div>
      <p className="mt-3 text-xs text-slate-500">Account selection is a local prototype flow. No password or authentication server is used.</p>
    </div>
  </Card></div></div>;
}
