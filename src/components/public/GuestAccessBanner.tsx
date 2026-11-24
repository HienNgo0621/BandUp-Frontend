import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { useAuth } from '../../hooks/useAuth';

export function GuestAccessBanner() {
  const { user } = useAuth();
  if (user) return null;
  return <div className="guest-access-banner"><p><Icon name="info" size={20} /><span><b>You are browsing as a guest.</b> Look around freely. Log in to start exercises and save your results.</span></p><div><Link className="btn b4" to="/login">Log in</Link><Link className="btn b1" to="/signup">Join us</Link></div></div>;
}
