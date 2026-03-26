// pages/Login.jsx — with dev quick-fill credentials
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, GraduationCap, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import notify from '../utils/notify';


export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const runLogin = async (email, password) => {
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password.trim());
      notify.success('Login successful', 'Welcome back to IDLE.');
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.error || 'Invalid email or password';
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
            <h2 className="text-xl font-bold ">Welcome <span className="text-blue-600">Back</span></h2>
            <p className="text-sm text-slate-500 mt-0.5">Sign in to continue learning</p>
        </div>



          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="E-mail"
              icon={Mail}
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
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
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              disabled={loading}
              className="!bg-white !border-slate-200 focus:!border-[#6366f1] focus:!ring-4 focus:!ring-[#6366f1]/10 !rounded-xl !shadow-sm transition-all text-[15px]"
            />

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => notify.info('Contact Admin', 'Please contact your administrator to reset your password.')}
                className="text-[13px] font-semibold text-[#6366f1] hover:opacity-80 transition-colors focus:outline-none"
              >
                Forgot password?
              </button>
            </div>

            <div className="pt-4">
              <Button type="submit" size="lg" loading={loading} className="w-full !bg-[#6366f1] hover:!opacity-90 !text-white !border-transparent !shadow-lg flex items-center justify-center gap-2 group transition-all duration-300 !font-semibold !rounded-xl">
                {!loading && (
                  <>Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" strokeWidth={2.5} /></>
                )}
              </Button>
            </div>
          </form>

          \

          <div className="mt-4 border-t border-slate-100 flex flex-col items-center justify-center">
            <p className="text-[14px] text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-[#6366f1] hover:opacity-80 transition-colors focus:outline-none">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

