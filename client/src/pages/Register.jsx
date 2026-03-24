// pages/Register.jsx — Student registration only
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, GraduationCap } from 'lucide-react';
import api from '../services/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import notify from '../utils/notify';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(form.password)) {
      const message = 'Password must be at least 8 characters, with uppercase, lowercase and numbers.';
      setError(message);
      notify.warning('Weak password', message);
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', { full_name: form.full_name, email: form.email, password: form.password });
      notify.success('Registration successful', 'Your account has been created. Please sign in.');
      navigate('/login');
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed';
      setError(message);
      notify.error('Registration failed', message);
    } finally {
      setLoading(false);
    }
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
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">

          {/* Logo inside card */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow shadow-indigo-200">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 tracking-tight leading-none">IDLE</p>
              <p className="text-[10px] font-semibold text-indigo-500 tracking-widest uppercase">Learning Platform</p>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-800">Create your account</h2>
            <p className="text-sm text-slate-500 mt-0.5">Start your learning journey today</p>
          </div>

          {error && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              label="Full Name"
              type="text"
              placeholder="Your Name"
              icon={User}
              value={form.full_name}
              onChange={e => setF('full_name', e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="E-mail"
              icon={Mail}
              value={form.email}
              onChange={e => setF('email', e.target.value)}
              required
            />
            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              icon={Lock}
              iconRight={
                <button type="button" onClick={() => setShowPw(s => !s)} className="cursor-pointer text-slate-400 hover:text-slate-600 flex items-center">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
              value={form.password}
              onChange={e => setF('password', e.target.value)}
              required
            />

            <Button type="submit" size="lg" loading={loading} className="w-full">
              {!loading && 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
