import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const roleMeta = {
  student: { label: 'Student' },
  admin: { label: 'Admin' },
};

export default function Topbar({ onMenuClick, title = '' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const rm = roleMeta[user?.role] || roleMeta.student;
  const firstName = user?.full_name?.split(' ')?.[0] || 'User';
  const initials = user?.full_name
    ?.split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <header className="topbar relative flex items-center justify-between gap-3 px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-400 shadow-sm transition-all hover:border-indigo-200 hover:text-slate-600 lg:hidden"
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        {title && (
          <div className="min-w-0 select-none">
            <div className="flex items-center gap-2">
              <div className="hidden h-7 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-sky-400 sm:block" />
              <div className="min-w-0">
                <p className="hidden text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 sm:block">
                  Workspace
                </p>
                <h1 className="truncate text-sm font-bold tracking-tight text-slate-900 sm:text-[15px]">
                  {title}
                </h1>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate('/profile')}
        className="ml-auto flex items-center gap-3 rounded-2xl px-1 py-1 text-left"
      >
        <div className="hidden min-w-0 sm:flex sm:flex-col sm:items-end sm:leading-tight">
          <span className="truncate text-[13px] font-bold tracking-tight text-slate-900">
            {user?.full_name || 'User'}
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            {rm.label}
          </span>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-500 text-[14px] font-black text-white shadow-[0_10px_24px_-12px_rgba(79,70,229,0.65)]">
          {initials}
        </div>

        <div className="flex min-w-0 flex-col text-left leading-tight sm:hidden">
          <span className="max-w-[82px] truncate text-[12px] font-bold tracking-tight text-slate-900">
            {firstName}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            {rm.label}
          </span>
        </div>
      </button>
    </header>
  );
}
