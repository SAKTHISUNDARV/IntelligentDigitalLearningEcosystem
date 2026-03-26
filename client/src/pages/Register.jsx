import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, GraduationCap, ArrowRight } from 'lucide-react';
import api from '../services/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import notify from '../utils/notify';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm_password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(form.password)) {
      const message = 'Password must be at least 8 chars with uppercase, lowercase and numbers.';
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
            <h2 className="text-xl font-bold">Create <span className="text-[#6366f1]">Account</span></h2>
            <p className="text-sm text-slate-500 mt-0.5">Start your learning journey today</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} >
            <Input
              label="Full Name"
              type="text"
              placeholder="Your Name"
              icon={User}
              value={form.full_name}
              onChange={e => setF('full_name', e.target.value)}
              required
              disabled={loading}
              className="!bg-white !border-slate-200 focus:!border-[#6366f1] focus:!ring-4 focus:!ring-[#6366f1]/10 !rounded-xl !shadow-sm transition-all text-[15px]"
            />
            <Input
              label="Email address"
              type="email"
              placeholder="E-mail"
              icon={Mail}
              value={form.email}
              onChange={e => setF('email', e.target.value)}
              required
              disabled={loading}
              className="!bg-white !border-slate-200 focus:!border-[#6366f1] focus:!ring-4 focus:!ring-[#6366f1]/10 !rounded-xl !shadow-sm transition-all text-[15px]"
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
              onChange={e => setF('password', e.target.value)}
              required
              disabled={loading}
              className="!bg-white !border-slate-200 focus:!border-[#6366f1] focus:!ring-4 focus:!ring-[#6366f1]/10 !rounded-xl !shadow-sm transition-all text-[15px]"
            />
            <Input
              label="Confirm Password"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              icon={Lock}
              value={form.confirm_password}
              onChange={e => setF('confirm_password', e.target.value)}
              required
              disabled={loading}
              className="!bg-white !border-slate-200 focus:!border-[#6366f1] focus:!ring-4 focus:!ring-[#6366f1]/10 !rounded-xl !shadow-sm transition-all text-[15px]"
            />

            <div className="pt-4">
              <Button type="submit" size="lg" loading={loading} className="w-full !bg-[#6366f1] hover:!opacity-90 !text-white !border-transparent !shadow-lg flex items-center justify-center gap-2 group transition-all duration-300 !font-semibold !rounded-xl">
                {!loading && (
                  <>Create Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" strokeWidth={2.5} /></>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 flex flex-col items-center justify-center">
            <p className="text-[14px] text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[#6366f1] hover:opacity-80 transition-colors focus:outline-none">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
