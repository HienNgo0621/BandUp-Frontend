import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';
import { ROLE_BASE_PATH } from '../data/navigation';

export function LoginPage() {
  const { user, login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  if (user) return <Navigate to={ROLE_BASE_PATH[user.role]} replace />;

  const finish = async () => {
    setError(''); setBusy(true);
    const result = await login(identifier, password);
    setBusy(false);
    if (!result.ok) {
      const message = result.reason === 'blocked' ? 'This account has been blocked. Please contact support.' : result.reason === 'pending' ? 'Please verify your email before signing in.' : result.reason === 'unavailable' ? 'This browser could not save your session.' : 'The email or user ID and password do not match.';
      setError(message); showToast(message, 'error'); return;
    }
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    navigate(from || ROLE_BASE_PATH[result.user.role], { replace: true });
  };

  return <AuthLayout eyebrow="BandUp IELTS" title="Welcome back" description="Log in to continue your IELTS journey.">
    <form className="auth-form" onSubmit={(event) => { event.preventDefault(); void finish(); }}>
      <Input label="User ID or email" value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" required />
      <div className="password-field"><Input label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /><button className="password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div>
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
      <Button type="submit" busy={busy}>Log in</Button>
    </form>
    <div className="auth-link-row"><Link to="/signup">Create an account</Link><Link to="/forgot-password">Forgot password?</Link></div>
  </AuthLayout>;
}
