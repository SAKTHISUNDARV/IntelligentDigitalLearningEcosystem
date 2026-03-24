// pages/Login.jsx — with dev quick-fill credentials
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, GraduationCap, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import notify from '../utils/notify';

const DEV_ACCOUNTS = [
  { label: 'Admin', email: 'admin@idle.dev', password: 'Admin@1234' },
  { label: 'Student', email: 'student@idle.dev', password: 'Admin@1234' },
];

const isLocalHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
const showDevLogin = import.meta.env.DEV || isLocalHost;


export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const runLogin = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password.trim());
      notify.success('Login successful', 'Welcome back to IDLE.');
      navigate('/');
    } catch (err) {
      const message = err.response?.data?.error || 'Invalid email or password';
      setError(message);
      notify.error('Login failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    await runLogin(form.email, form.password);
  };

  const handleDevLogin = async account => {
    setForm({ email: account.email, password: account.password });
    await runLogin(account.email, account.password);
  };


  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-slate-100"
      style={{
        '--bg': '#f1f5f9', '--surface': '#ffffff', '--surface-2': '#f8fafc',
        '--surface-3': '#e2e8f0', '--border': '#e2e8f0', '--border-focus': '#6366f1',
        '--text-primary': '#1e293b', '--text-secondary': '#475569', '--text-muted': '#94a3b8',
      }}
    >
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow shadow-indigo-200">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 tracking-tight leading-none">IDLE</p>
              <p className="text-[10px] font-semibold text-indigo-500 tracking-widest uppercase">Learning Platform</p>
            </div>
          </div>

          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-800">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-0.5">Sign in to continue learning</p>
          </div>


          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="E-mail"
              icon={Mail}
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              icon={Lock}
              iconRight={
                <button type="button" onClick={() => setShowPw(s => !s)} className="cursor-pointer text-slate-400 hover:text-slate-600 flex items-center">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              autoComplete="current-password"
            />
            <Button type="submit" size="lg" loading={loading} className="w-full">
              {!loading && 'Sign In'}
            </Button>
          </form>

          {showDevLogin && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
              <div className="flex items-center gap-2 text-amber-900">
                <Zap size={15} />
                <p className="text-sm font-semibold">Quick dev login</p>
              </div>
              <p className="mt-1 text-xs text-amber-800">
                Use the seeded demo accounts for local testing.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {DEV_ACCOUNTS.map(account => (
                  <Button
                    key={account.email}
                    type="button"
                    variant="outline"
                    size="md"
                    disabled={loading}
                    onClick={() => handleDevLogin(account)}
                    className="w-full border-amber-300 bg-white text-amber-900 hover:bg-amber-100 hover:border-amber-400"
                  >
                    {account.label}
                  </Button>
                ))}
              </div>
            </div>
          )}


          <p className="text-center text-sm text-slate-500 mt-5">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
