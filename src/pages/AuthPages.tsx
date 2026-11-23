import * as React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAppData } from '../hooks/useAppData';
import { saveApplication, saveRegistration } from '../services/appDataService';

function AuthFrame({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <section className="auth-page"><div className="auth-page-inner"><div className="auth-intro"><Link to="/" className="brand-lockup"><span className="logo-mark">BU</span><span>BandUp IELTS</span></Link><span className="public-eyebrow">{eyebrow}</span><h1 className="serif">{title}</h1><p>{description}</p><div className="auth-back-link"><Link to="/">← Back to BandUp IELTS</Link></div></div><Card className="auth-card">{children}</Card></div></section>;
}

export function SignUpPage() {
  return <AuthFrame eyebrow="Join our community" title="Choose how you would like to join" description="BandUp is free for learners and powered by volunteers. Pick the path that fits you."><div className="account-type-list"><Link to="/register/student" className="account-type"><span className="account-type-icon">S</span><span><b>Join as a student</b><small>Practise IELTS, save your progress and request feedback.</small></span><b>→</b></Link><Link to="/apply" className="account-type"><span className="account-type-icon">V</span><span><b>Apply as a Teacher / Volunteer</b><small>Share your skills and support IELTS learners.</small></span><b>→</b></Link></div><p className="auth-smallprint">Already have an account? <Link to="/login">Log in</Link></p></AuthFrame>;
}

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  return <AuthFrame eyebrow="Account recovery" title="Forgot your password?" description="Enter your account email to see the prototype recovery confirmation."><form className="auth-form" onSubmit={(event) => { event.preventDefault(); setSent(true); }}><Input label="Email address" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /><button className="btn b1 auth-submit" type="submit">Continue</button>{sent && <div className="auth-notice" role="status">Demo only: the recovery request was simulated. No email was sent.</div>}<p className="auth-smallprint"><Link to="/login">Back to log in</Link></p></form></AuthFrame>;
}

export function StudentRegistrationPage() {
  const navigate = useNavigate();
  const { refresh } = useAppData();
  const [error, setError] = useState('');
  const [values, setValues] = useState({ first: '', last: '', email: '', password: '' });
  const set = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, [key]: event.target.value }));
  return <AuthFrame eyebrow="Student registration" title="Create your learner account" description="Set up your free account to practise and save your IELTS progress."><form className="auth-form" onSubmit={(event) => { event.preventDefault(); setError(''); const id = `reg-${Date.now().toString(36)}`; const registration = { id, first: values.first.trim(), last: values.last.trim(), email: values.email.trim().toLowerCase(), status: 'pending_verification' as const, createdAt: Date.now() }; if (!saveRegistration(registration)) { setError('Unable to save this registration in browser storage.'); return; } try { window.sessionStorage.setItem('bandup_registration_id', id); } catch { setError('Unable to save the registration reference for this browser.'); return; } refresh(); navigate('/verify'); }}><div className="contact-fields"><Input label="First name" autoComplete="given-name" required value={values.first} onChange={set('first')} /><Input label="Last name" autoComplete="family-name" required value={values.last} onChange={set('last')} /></div><Input label="Email address" type="email" autoComplete="email" required value={values.email} onChange={set('email')} /><Input label="Password" type="password" autoComplete="new-password" required minLength={8} value={values.password} onChange={set('password')} helperText="At least 8 characters. This demo does not save the password." />{error && <p className="auth-error" role="alert">{error}</p>}<button className="btn b1 auth-submit" type="submit">Continue to email verification</button><p className="auth-smallprint">Already registered? <Link to="/login">Log in</Link></p></form></AuthFrame>;
}

export function VerifyPage() {
  const navigate = useNavigate();
  let id = ''; try { id = window.sessionStorage.getItem('bandup_registration_id') ?? ''; } catch { /* Storage can be unavailable. */ }
  const registration = useAppData().data.registrations.find((item) => item.id === id);
  return <AuthFrame eyebrow="Email verification result" title="Check your registration" description="This verification step is simulated in this local prototype.">{registration ? <><div className="auth-notice"><b>Demo state:</b> registration details were recorded locally. No email or OTP is sent; this page does not change the stored registration state or activate an account.</div><p className="auth-copy">{registration.first} {registration.last} · {registration.email}<br />Registration ID: {registration.id}<br />Stored registration status: {registration.status.replaceAll('_', ' ')}<br />This status alone does not grant Student access.</p><div className="auth-link-row"><Link to="/login">Back to login</Link><Link to="/signup">Back to account paths</Link></div></> : <div className="auth-notice">No pending registration was found for this browser. <Link to="/register/student">Start student registration</Link>.</div>}<p className="auth-smallprint"><button className="text-link" type="button" onClick={() => navigate('/')}>Continue browsing</button></p></AuthFrame>;
}

export function VolunteerApplicationPage() {
  const navigate = useNavigate();
  const { refresh } = useAppData();
  const [error, setError] = useState('');
  const [values, setValues] = useState({ first: '', last: '', email: '', password: '', qualification: '' });
  const set = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setValues((current) => ({ ...current, [key]: event.target.value }));
  return <AuthFrame eyebrow="Volunteer with us" title="Volunteer as a teacher" description="Tell us about your experience. Your application status will be shown here in this browser prototype."><form className="auth-form" onSubmit={(event) => { event.preventDefault(); setError(''); const id = `app-${Date.now().toString(36)}`; const app = { id, first: values.first.trim(), last: values.last.trim(), email: values.email.trim().toLowerCase(), qualification: values.qualification.trim(), status: 'pending' as const, submittedAt: Date.now(), decidedBy: null, decidedAt: null, decisionReason: '', evidence: 'not-collected-policy-pending' }; if (!saveApplication(app)) { setError('Unable to save the application in browser storage.'); return; } try { window.sessionStorage.setItem('bandup_application_id', id); } catch { setError('Unable to save an application reference for this browser.'); return; } refresh(); navigate('/application-status'); }}><div className="contact-fields"><Input label="First name" autoComplete="given-name" required value={values.first} onChange={set('first')} /><Input label="Last name" autoComplete="family-name" required value={values.last} onChange={set('last')} /></div><Input label="Email address" type="email" autoComplete="email" required value={values.email} onChange={set('email')} /><Input label="Password" type="password" autoComplete="new-password" required minLength={8} value={values.password} onChange={set('password')} helperText="At least 8 characters. This demo does not save the password." /><div className="auth-notice"><b>Evidence upload is not enabled.</b><br />Accepted file formats, size limits and replacement rules are awaiting approval.</div><Input label="Qualifications" required placeholder="IELTS score (e.g. 8.0) or TEFL/CELTA" value={values.qualification} onChange={(event) => setValues((current) => ({ ...current, qualification: event.target.value }))} />{error && <p className="auth-error" role="alert">{error}</p>}<button className="btn b1 auth-submit" type="submit">Submit my application</button><p className="form-note">Review timing is not configured. No email is sent.</p></form><p className="auth-smallprint"><Link to="/signup">← Back to account paths</Link></p></AuthFrame>;
}

export function ApplicationStatusPage() {
  const { data } = useAppData();
  let id = ''; try { id = window.sessionStorage.getItem('bandup_application_id') ?? ''; } catch { /* Storage can be unavailable. */ }
  const application = data.applications.find((item) => item.id === id);
  if (!application) return <AuthFrame eyebrow="Application status" title="No application found" description="No application is associated with this browser session."><p className="auth-copy">Submit an application first, then return here to check its status.</p><Link className="btn b1 auth-submit" to="/apply">Start an application</Link></AuthFrame>;
  const status = application.status;
  return <AuthFrame eyebrow="Application status" title={`Application ${status}`} description="Your saved Teacher / Volunteer application from this browser."><div className={`application-status status-${status}`}><b>{status === 'pending' ? 'Pending review' : status === 'approved' ? 'Approved' : status === 'rejected' ? 'Not approved' : 'Status unavailable'}</b><span>Application ID: {application.id}</span><span>Submitted {new Date(application.submittedAt).toLocaleString()}</span><span>{application.first} {application.last} · {application.email}</span>{application.decisionReason && <p>Decision reason: {application.decisionReason}</p>}</div><Link className="btn b4 auth-submit" to="/">Return to home</Link></AuthFrame>;
}

export function GuestLockModal() {
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState('this exercise');
  const [verb, setVerb] = useState('start this exercise');
  return <>
    <span className="sr-only" aria-live="polite">{open ? 'Sign-in required dialog opened' : ''}</span>
    <GuestLockListener onOpen={(title, action) => { setItem(title || 'this exercise'); setVerb(action || 'start this exercise'); setOpen(true); }} />
    <Modal open={open} title={`Join us to ${verb}${item ? `: “${item}”` : ''}`} description="BandUp IELTS is a free, volunteer-run community. Create a learner account or log in to do exercises, save results and follow your progress." onClose={() => setOpen(false)}><div className="guest-lock-actions"><Link className="btn b1" to="/signup" onClick={() => setOpen(false)}>Create a free account</Link><Link className="btn b4" to="/login" onClick={() => setOpen(false)}>I already have an account</Link><button className="text-link" type="button" onClick={() => setOpen(false)}>Keep browsing</button></div></Modal>
  </>;
}
function GuestLockListener({ onOpen }: { onOpen: (title: string, verb?: string) => void }) {
  React.useEffect(() => { const listener = (event: Event) => { const detail = (event as CustomEvent<{ title?: string; verb?: string }>).detail; onOpen(detail?.title ?? 'this exercise', detail?.verb); }; window.addEventListener('guest-lock', listener); return () => window.removeEventListener('guest-lock', listener); }, [onOpen]);
  return null;
}
