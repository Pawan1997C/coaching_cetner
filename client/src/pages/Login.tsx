import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../lib/api';
import { Field, Notice } from '../components/ui';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      nav('/admin');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="graph relative hidden overflow-hidden border-r border-line lg:block">
        <div className="absolute inset-0 bg-brand-dark/95" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <span className="font-display text-2xl">Coaching Platform</span>
          <div>
            <div className="stamp mb-8 inline-block -rotate-12 rounded-lg border-4 border-pen px-5 py-2 font-display text-5xl text-pen">A+</div>
            <h2 className="max-w-md font-display text-4xl leading-tight">Attendance, fees and results, all in one place.</h2>
            <p className="mt-3 max-w-sm text-white/70">Sign in to manage students, collect fees and keep your website up to date.</p>
          </div>
          <span className="text-sm text-white/50">Staff access only</span>
        </div>
      </div>
      <div className="grid place-items-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="text-3xl">Welcome back</h1>
            <p className="mt-1 text-sm text-mute">Sign in with your staff account.</p>
          </div>
          <Notice error={error} />
          <Field label="Email"><input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Password"><input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          <button className="btn btn-primary btn-lg w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          <a href="/" className="block text-center text-sm text-mute hover:text-ink">Back to website</a>
        </form>
      </div>
    </div>
  );
}
