import * as React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout as AuthFrame } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAppData } from '../hooks/useAppData';
import { addUser, saveApplication, saveRegistration, updateRegistration } from '../services/appDataService';
import { hashPassword } from '../services/auth/passwordService';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordHelp = 'Use at least 8 characters, including a letter and a number.';
function validPassword(value: string) { return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value); }
function PasswordInput({ value, onChange, confirmation = false, error }: { value: string; onChange: React.ChangeEventHandler<HTMLInputElement>; confirmation?: boolean; error?: string }) {
  const [shown, setShown] = useState(false);
  return <div className="password-field"><Input label={confirmation ? 'Confirm password' : 'Password'} type={shown ? 'text' : 'password'} autoComplete={confirmation ? 'new-password' : 'new-password'} required value={value} onChange={onChange} helperText={confirmation ? undefined : passwordHelp} error={error}/><button className="password-toggle" type="button" onClick={() => setShown((state) => !state)} aria-label={shown ? 'Hide password' : 'Show password'}>{shown ? 'Hide' : 'Show'}</button></div>;
}

export function SignUpPage() {
  return <AuthFrame eyebrow="Join our community" title="Choose how you would like to join" description="BandUp is free for learners and powered by volunteers. Pick the path that fits you."><div className="account-type-list"><Link to="/register/student" className="account-type"><span className="account-type-icon">S</span><span><b>Join as a student</b><small>Practise IELTS, save your progress and request feedback.</small></span><b>→</b></Link><Link to="/apply" className="account-type"><span className="account-type-icon">V</span><span><b>Apply as a Teacher / Volunteer</b><small>Share your skills and support IELTS learners.</small></span><b>→</b></Link></div><p className="auth-smallprint">Already have an account? <Link to="/login">Log in</Link></p></AuthFrame>;
}

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false); const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false);
  return <AuthFrame eyebrow="Account recovery" title="Forgot your password?" description="Enter the email address for your account."><form className="auth-form" onSubmit={(event) => { event.preventDefault(); setBusy(true); window.setTimeout(() => { setBusy(false); setSent(true); }, 350); }}><Input label="Email address" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /><Button type="submit" busy={busy}>Continue</Button>{sent && <div className="auth-notice" role="status">If this address belongs to an account, password reset instructions will be available when email delivery is connected.</div>}<p className="auth-smallprint"><Link to="/login">Back to log in</Link></p></form></AuthFrame>;
}

export function StudentRegistrationPage() {
  const navigate = useNavigate(); const { data, refresh } = useAppData();
  const [values, setValues] = useState({ first: '', last: '', email: '', password: '', confirm: '' }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError('');
    if (!emailPattern.test(values.email)) return setError('Enter a valid email address.');
    if (!validPassword(values.password)) return setError(passwordHelp);
    if (values.password !== values.confirm) return setError('Passwords do not match.');
    if (data.users.some((user) => user.email?.toLowerCase() === values.email.trim().toLowerCase())) return setError('An account already uses this email address.');
    setBusy(true); const id = `student-${crypto.randomUUID()}`; const createdAt = Date.now();
    const saved = addUser({ id, name: `${values.first.trim()} ${values.last.trim()}`, email: values.email.trim().toLowerCase(), role: 'student', status: 'pending', label: 'Learner', profile: { shortName: values.first.trim(), passwordHash: await hashPassword(values.password), joinedAt: createdAt } }) && saveRegistration({ id, first: values.first.trim(), last: values.last.trim(), email: values.email.trim().toLowerCase(), status: 'pending_verification', createdAt });
    setBusy(false); if (!saved) return setError('Unable to save your registration in this browser.');
    window.sessionStorage.setItem('bandup_registration_id', id); refresh(); navigate('/verify');
  };
  return <AuthFrame eyebrow="Student registration" title="Create your learner account" description="Set up your account to practise and save your IELTS progress."><form className="auth-form" onSubmit={submit}><div className="contact-fields"><Input label="First name" autoComplete="given-name" required value={values.first} onChange={set('first')} /><Input label="Last name" autoComplete="family-name" required value={values.last} onChange={set('last')} /></div><Input label="Email address" type="email" autoComplete="email" required value={values.email} onChange={set('email')} /><PasswordInput value={values.password} onChange={set('password')} /><PasswordInput confirmation value={values.confirm} onChange={set('confirm')} error={values.confirm && values.confirm !== values.password ? 'Passwords do not match.' : undefined}/>{error && <p className="auth-error" role="alert">{error}</p>}<Button type="submit" busy={busy}>Continue to email verification</Button><p className="auth-smallprint">Already registered? <Link to="/login">Log in</Link></p></form></AuthFrame>;
}

export function VerifyPage() {
  const navigate = useNavigate(); const { data, refresh, updateUser } = useAppData(); let id = ''; try { id = window.sessionStorage.getItem('bandup_registration_id') ?? ''; } catch { /* storage unavailable */ }
  const registration = data.registrations.find((item) => item.id === id);
  const verify = () => { if (!registration) return; const saved = updateRegistration(id, { status: 'verified' }) && updateUser(id, { status: 'active' }); if (!saved) return; refresh(); navigate('/login'); };
  return <AuthFrame eyebrow="Email verification" title="Verify your email" description="Confirm your email address to activate your learner account.">{registration ? <><div className="auth-notice"><b>{registration.email}</b><br/>Your account is ready to be verified.</div><Button onClick={verify}>Verify email and continue</Button><p className="auth-smallprint"><Link to="/login">Back to log in</Link></p></> : <div className="auth-notice">No pending registration was found. <Link to="/register/student">Start student registration</Link>.</div>}</AuthFrame>;
}

type Evidence = { name: string; type: string; size: number };
const allowedEvidence = ['application/pdf', 'image/jpeg', 'image/png']; const maxEvidenceBytes = 5 * 1024 * 1024;
export function VolunteerApplicationPage() {
  const navigate = useNavigate(); const { data, refresh } = useAppData(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [values, setValues] = useState({ first: '', last: '', email: '', password: '', confirm: '', qualification: '' }); const [files, setFiles] = useState<Evidence[]>([]);
  const set = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, [key]: event.target.value }));
  const chooseFiles = (event: React.ChangeEvent<HTMLInputElement>) => { const incoming = Array.from(event.target.files ?? []); const invalid = incoming.find((file) => !allowedEvidence.includes(file.type) || file.size > maxEvidenceBytes); if (invalid) { setError('Choose PDF, JPG, or PNG files up to 5 MB each.'); event.target.value = ''; return; } setError(''); setFiles(incoming.map((file) => ({ name: file.name, type: file.type, size: file.size }))); };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(''); if (!emailPattern.test(values.email)) return setError('Enter a valid email address.'); if (!validPassword(values.password)) return setError(passwordHelp); if (values.password !== values.confirm) return setError('Passwords do not match.'); if (!files.length) return setError('Add at least one certificate or evidence file.'); if (data.users.some((user) => user.email?.toLowerCase() === values.email.trim().toLowerCase())) return setError('An account already uses this email address.');
    setBusy(true); const id = `application-${crypto.randomUUID()}`; const saved = addUser({ id, name: `${values.first.trim()} ${values.last.trim()}`, email: values.email.trim().toLowerCase(), role: 'teacher', status: 'pending', label: 'Teacher / Volunteer', profile: { shortName: values.first.trim(), passwordHash: await hashPassword(values.password) } }) && saveApplication({ id, first: values.first.trim(), last: values.last.trim(), email: values.email.trim().toLowerCase(), qualification: values.qualification.trim(), status: 'pending', submittedAt: Date.now(), decidedBy: null, decidedAt: null, decisionReason: '', evidence: JSON.stringify(files) });
    setBusy(false); if (!saved) return setError('Unable to save the application in this browser.'); window.sessionStorage.setItem('bandup_application_id', id); refresh(); navigate('/application-status');
  };
  return <AuthFrame eyebrow="Volunteer with us" title="Volunteer as a teacher" description="Tell us about your experience and supporting qualifications."><form className="auth-form" onSubmit={submit}><div className="contact-fields"><Input label="First name" autoComplete="given-name" required value={values.first} onChange={set('first')} /><Input label="Last name" autoComplete="family-name" required value={values.last} onChange={set('last')} /></div><Input label="Email address" type="email" autoComplete="email" required value={values.email} onChange={set('email')} /><PasswordInput value={values.password} onChange={set('password')} /><PasswordInput confirmation value={values.confirm} onChange={set('confirm')} error={values.confirm && values.confirm !== values.password ? 'Passwords do not match.' : undefined}/><Input label="Qualifications" required placeholder="IELTS score (e.g. 8.0) or TEFL/CELTA" value={values.qualification} onChange={set('qualification')} /><label className="evidence-upload"><span>Certificate or evidence</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple onChange={chooseFiles}/><small>PDF, JPG, or PNG. Up to 5 MB per file.</small></label>{files.length ? <ul className="evidence-list">{files.map((file) => <li key={file.name}><span>{file.name} · {file.type.split('/')[1].toUpperCase()} · {(file.size / 1024 / 1024).toFixed(1)} MB</span><button type="button" onClick={() => setFiles((current) => current.filter((item) => item.name !== file.name))}>Remove</button></li>)}</ul> : null}{error && <p className="auth-error" role="alert">{error}</p>}<Button type="submit" busy={busy}>Submit my application</Button></form><p className="auth-smallprint"><Link to="/signup">← Back to account paths</Link></p></AuthFrame>;
}

export function ApplicationStatusPage() { const { data } = useAppData(); let id = ''; try { id = window.sessionStorage.getItem('bandup_application_id') ?? ''; } catch { /* storage unavailable */ } const application = data.applications.find((item) => item.id === id); if (!application) return <AuthFrame eyebrow="Application status" title="No application found" description="Submit an application first, then return here to check its status."><Link className="btn b1 auth-submit" to="/apply">Start an application</Link></AuthFrame>; return <AuthFrame eyebrow="Application status" title="Application received" description="Your Teacher / Volunteer application is awaiting review."><div className="application-status status-pending"><b>Pending review</b><span>Submitted {new Date(application.submittedAt).toLocaleString()}</span><span>{application.first} {application.last} · {application.email}</span></div><Link className="btn b4 auth-submit" to="/">Return to home</Link></AuthFrame>; }

export function GuestLockModal() { const [open, setOpen] = useState(false); const [item, setItem] = useState('this exercise'); React.useEffect(() => { const listener = (event: Event) => { setItem((event as CustomEvent<{ title?: string }>).detail?.title ?? 'this exercise'); setOpen(true); }; window.addEventListener('guest-lock', listener); return () => window.removeEventListener('guest-lock', listener); }, []); return <Modal open={open} title={`Join us to continue: “${item}”`} description="Create a learner account or log in to do exercises, save results and follow your progress." onClose={() => setOpen(false)}><div className="guest-lock-actions"><Link className="btn b1" to="/signup" onClick={() => setOpen(false)}>Create a free account</Link><Link className="btn b4" to="/login" onClick={() => setOpen(false)}>I already have an account</Link></div></Modal>; }
