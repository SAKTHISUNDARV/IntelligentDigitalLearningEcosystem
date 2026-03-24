// components/Topbar.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const roleMeta = {
    student: { label: 'Student', dot: 'bg-indigo-500' },
    admin: { label: 'Admin', dot: 'bg-rose-500' },
};

export default function Topbar({ onMenuClick, title = '' }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    const rm = roleMeta[user?.role] || roleMeta.student;
    const initials = user?.full_name
        ?.split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';

    useEffect(() => {
    }, [user]);

    return (
        <header className="topbar px-6 relative">
            {/* Left -- hamburger + page title */}
            <div className="flex items-center gap-4">
                <button
                    className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl
                      text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                    onClick={onMenuClick}
                    aria-label="Toggle sidebar"
                >
                    <Menu size={20} />
                </button>

                {title && (
                    <div className="flex items-center gap-2 select-none">
                        <div className="w-1 h-6 bg-indigo-500/20 rounded-full hidden sm:block" />
                        <h1 className="text-sm font-bold text-slate-800 tracking-tight">
                            {title}
                        </h1>
                    </div>
                )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right -- user card */}
            <div className="flex items-center gap-4">
                {/* User card */}
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="hidden sm:flex flex-col text-right leading-tight">
                        <span className="text-[13px] font-bold text-slate-800 tracking-tight">
                            {user?.full_name || 'User'}
                        </span>
                        <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest opacity-80">
                            {rm.label}
                        </span>
                    </div>
                    {/* Avatar */}
                    <div className="relative group cursor-pointer" onClick={() => navigate('/profile')}>
                        <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white text-[14px] font-black select-none shadow-lg shadow-indigo-500/10 group-hover:scale-105 transition-transform duration-200">
                            {initials}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${rm.dot}`} />
                    </div>
                </div>
            </div>
        </header>
    );
}
