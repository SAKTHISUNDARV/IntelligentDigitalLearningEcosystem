// components/Topbar.jsx
import { Menu, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const roleMeta = {
    student: { label: 'Student', dot: 'bg-indigo-500' },
    admin: { label: 'Admin', dot: 'bg-rose-500' },
};

export default function Topbar({ onMenuClick, title = '' }) {
    const { user } = useAuth();
    const rm = roleMeta[user?.role] || roleMeta.student;
    const initials = user?.full_name
        ?.split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';

    return (
        <header className="topbar border-b border-slate-200 bg-white px-5">
            {/* Left — hamburger + page title */}
            <div className="flex items-center gap-3">
                <button
                    className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg
                      text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    onClick={onMenuClick}
                    aria-label="Toggle sidebar"
                >
                    <Menu size={18} />
                </button>

                {title && (
                    <h1 className="text-[15px] font-semibold text-slate-700 tracking-tight">
                        {title}
                    </h1>
                )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right — user card */}
            <div className="flex items-center gap-2.5 pl-4 border-l border-slate-200">
                {/* Avatar */}
                <div className="relative">
                    <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-white text-[13px] font-bold select-none">
                        {initials}
                    </div>
                    {/* Online dot */}
                    {/* <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${rm.dot}`} /> */}
                </div>

                {/* Name + role */}
                <div className="hidden sm:flex flex-col leading-tight">
                    <span className="text-[13px] font-semibold text-slate-800">
                        {user?.full_name || 'User'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                        {rm.label}
                    </span>
                </div>

                {/* <ChevronDown size={14} className="text-slate-400 hidden sm:block" /> */}
            </div>
        </header>
    );
}
