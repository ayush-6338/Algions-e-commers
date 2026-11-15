import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const inputClass = 'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15';
const errorMessage = (error) => error.response?.data?.message || 'Something went wrong. Please try again.';

function Spinner() { return <span aria-hidden="true" className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white align-[-3px]" />; }
function Banner({ children, success = false }) { return children ? <p role={success ? 'status' : 'alert'} className={`rounded-xl p-3 text-sm ${success ? 'bg-teal-50 text-teal-900' : 'bg-red-50 text-red-800'}`}>{children}</p> : null; }
function AuthCard({ eyebrow = 'Your SkyKart account', title, children }) { return <section className="mx-auto max-w-md rounded-3xl bg-white p-7 shadow-sm md:p-10"><p className="text-xs uppercase tracking-widest text-teal-800">{eyebrow}</p><h1 className="mt-2 text-3xl font-medium">{title}</h1>{children}</section>; }
function Field({ label, name, error, ...props }) { return <div><label className="block text-sm font-medium" htmlFor={name}>{label}</label><input id={name} name={name} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className={`${inputClass} ${error ? 'border-red-500' : ''}`} {...props} />{error && <p id={`${name}-error`} className="mt-1 text-sm text-red-700">{error}</p>}</div>; }
function validateEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function validatePassword(value) { return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value); }
function passwordError(value) { return value.length < 8 ? 'Use at least 8 characters.' : 'Include at least one letter and one number.'; }

export function LoginPage() {
  const { login } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' }); const [errors, setErrors] = useState({}); const [banner, setBanner] = useState(location.state?.message || ''); const [busy, setBusy] = useState(false);
  function change(event) { setValues({ ...values, [event.target.name]: event.target.value }); setErrors({ ...errors, [event.target.name]: '' }); }
  async function submit(event) {
    event.preventDefault(); const next = {};
    if (!validateEmail(values.email)) next.email = 'Enter a valid email address.';
    if (!values.password) next.password = 'Enter your password.';
    setErrors(next); setBanner(''); if (Object.keys(next).length) return;
    setBusy(true);
    try { await login(values); navigate(location.state?.from?.pathname || '/', { replace: true }); }
    catch (error) { setBanner(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <AuthCard title="Welcome back"><form className="mt-7 space-y-4" onSubmit={submit} noValidate><Banner>{banner}</Banner><Field label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={change} error={errors.email} /><Field label="Password" name="password" type="password" autoComplete="current-password" value={values.password} onChange={change} error={errors.password} /><div className="text-right text-sm"><Link className="underline" to="/forgot-password">Forgot password?</Link></div><button disabled={busy} className="w-full rounded-xl bg-stone-900 p-3 text-white disabled:cursor-wait disabled:opacity-60">{busy && <Spinner />}{busy ? 'Signing in…' : 'Sign in'}</button></form><p className="mt-5 text-sm text-stone-600">New here? <Link className="underline" to="/register">Create an account</Link></p></AuthCard>;
}

export function RegisterPage() {
  const { register } = useAuth(); const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' }); const [errors, setErrors] = useState({}); const [banner, setBanner] = useState(''); const [busy, setBusy] = useState(false); const [showPassword, setShowPassword] = useState(false);
  function change(event) { setValues({ ...values, [event.target.name]: event.target.value }); setErrors({ ...errors, [event.target.name]: '' }); }
  async function submit(event) {
    event.preventDefault(); const next = {};
    if (values.name.trim().length < 2) next.name = 'Enter your name (at least 2 characters).';
    if (!validateEmail(values.email)) next.email = 'Enter a valid email address.';
    if (!validatePassword(values.password)) next.password = passwordError(values.password);
    if (values.confirmPassword !== values.password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next); setBanner(''); if (Object.keys(next).length) return;
    setBusy(true);
    try { await register({ name: values.name.trim(), email: values.email, password: values.password }); navigate('/', { replace: true }); }
    catch (error) { setBanner(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <AuthCard title="Create an account"><form className="mt-7 space-y-4" onSubmit={submit} noValidate><Banner>{banner}</Banner><Field label="Name" name="name" autoComplete="name" value={values.name} onChange={change} error={errors.name} /><Field label="Email" name="email" type="email" autoComplete="email" value={values.email} onChange={change} error={errors.email} /><div><Field label="Password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={values.password} onChange={change} error={errors.password} /><label className="mt-2 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />Show password</label></div><Field label="Confirm password" name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={values.confirmPassword} onChange={change} error={errors.confirmPassword} /><p className="text-xs text-stone-500">Use at least 8 characters with one letter and one number.</p><button disabled={busy} className="w-full rounded-xl bg-stone-900 p-3 text-white disabled:cursor-wait disabled:opacity-60">{busy && <Spinner />}{busy ? 'Creating account…' : 'Create account'}</button></form><p className="mt-5 text-sm text-stone-600">Already have an account? <Link className="underline" to="/login">Sign in</Link></p></AuthCard>;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState(''); const [fieldError, setFieldError] = useState(''); const [banner, setBanner] = useState(''); const [success, setSuccess] = useState(false); const [busy, setBusy] = useState(false);
  async function submit(event) { event.preventDefault(); if (!validateEmail(email)) { setFieldError('Enter a valid email address.'); return; } setFieldError(''); setBanner(''); setSuccess(false); setBusy(true); try { const { data } = await api.post('/auth/forgot-password', { email }); setBanner(data.message); setSuccess(true); } catch (error) { setBanner(errorMessage(error)); } finally { setBusy(false); } }
  return <AuthCard title="Reset your password"><p className="mt-3 text-sm leading-6 text-stone-600">Enter your account email. If it exists, we’ll provide a password reset link.</p><form className="mt-6 space-y-4" onSubmit={submit} noValidate><Banner success={success}>{banner}</Banner><Field label="Email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setFieldError(''); }} error={fieldError} /><button disabled={busy} className="w-full rounded-xl bg-stone-900 p-3 text-white disabled:cursor-wait disabled:opacity-60">{busy && <Spinner />}{busy ? 'Sending…' : 'Send reset link'}</button></form><p className="mt-5 text-sm"><Link className="underline" to="/login">Back to sign in</Link></p></AuthCard>;
}

export function ResetPasswordPage() {
  const { token } = useParams(); const navigate = useNavigate();
  const [values, setValues] = useState({ password: '', confirmPassword: '' }); const [errors, setErrors] = useState({}); const [banner, setBanner] = useState(''); const [busy, setBusy] = useState(false); const [showPassword, setShowPassword] = useState(false);
  function change(event) { setValues({ ...values, [event.target.name]: event.target.value }); setErrors({ ...errors, [event.target.name]: '' }); }
  async function submit(event) {
    event.preventDefault(); const next = {};
    if (!validatePassword(values.password)) next.password = passwordError(values.password);
    if (values.confirmPassword !== values.password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next); setBanner(''); if (Object.keys(next).length) return;
    setBusy(true);
    try { const { data } = await api.post(`/auth/reset-password/${encodeURIComponent(token)}`, { password: values.password }); navigate('/login', { replace: true, state: { message: data.message } }); }
    catch (error) { setBanner(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <AuthCard title="Choose a new password"><form className="mt-7 space-y-4" onSubmit={submit} noValidate><Banner>{banner}</Banner><div><Field label="New password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={values.password} onChange={change} error={errors.password} /><label className="mt-2 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />Show password</label></div><Field label="Confirm new password" name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={values.confirmPassword} onChange={change} error={errors.confirmPassword} /><p className="text-xs text-stone-500">Use at least 8 characters with one letter and one number.</p><button disabled={busy} className="w-full rounded-xl bg-stone-900 p-3 text-white disabled:cursor-wait disabled:opacity-60">{busy && <Spinner />}{busy ? 'Saving…' : 'Set new password'}</button></form></AuthCard>;
}
