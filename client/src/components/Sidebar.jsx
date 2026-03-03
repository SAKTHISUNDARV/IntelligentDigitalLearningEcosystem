// components/Sidebar.jsx — Role-aware sidebar (admin + student only)
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, BookMarked, ClipboardList, History,
  User, BarChart2, Users, Tag,
  LogOut, ChevronRight, Sparkles, GraduationCap, BrainCircuit, MessageSquare, Bot
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navConfig = {
  student: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/courses', icon: BookOpen, label: 'Browse Courses' },
    { to: '/my-courses', icon: BookMarked, label: 'My Courses' },
    { to: '/assessments', icon: ClipboardList, label: 'Assessments' },
    { to: '/assessment-history', icon: History, label: 'My Results' },
    { to: '/ai-tutor', icon: Bot, label: 'AI Chat Assist' },
    { to: '/forum', icon: MessageSquare, label: 'Community Forum' },
    { to: '/profile', icon: User, label: 'Profile' },
  ],
  admin: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
    { to: '/admin/quizzes', icon: BrainCircuit, label: 'AI Quizzes' },
    { to: '/admin/categories', icon: Tag, label: 'Categories' },
    { to: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
    { to: '/ai-tutor', icon: Bot, label: 'AI Chat Assist' },
    { to: '/forum', icon: MessageSquare, label: 'Community Forum' },
    { to: '/profile', icon: User, label: 'Profile' },
  ],
};


const roleConfig = {
  student: { label: 'Student', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  admin: { label: 'Admin', color: 'text-rose-600', bg: 'bg-rose-50' },
};

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'student';
  const links = navConfig[role] || navConfig.student;
  const rc = roleConfig[role] || roleConfig.student;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar-fixed flex flex-col ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div className="h-[60px] flex items-center gap-3 px-5 border-b border-slate-200 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
            <GraduationCap size={16} className="text-white" />
          </div>
          <div className="leading-none">
            <div className="text-sm font-bold text-slate-800 tracking-tight">IDLE</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Learning Platform</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-2">
            Menu
          </p>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) => `
                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150
                ${isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={12} className="text-indigo-200" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* AI tip — student only */}
        {role === 'student' && (
          <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={12} className="text-indigo-500" />
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">AI Powered</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Get personalized course recommendations from our AI engine.
            </p>
          </div>
        )}

        {/* Role badge */}
        <div className={`mx-3 mb-2 px-3 py-1.5 rounded-lg ${rc.bg} flex items-center gap-2`}>
          <span className={`text-xs font-bold ${rc.color}`}>{rc.label}</span>
          <span className="text-xs text-slate-400 truncate">{user?.full_name}</span>
        </div>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-slate-200 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
          >
            <LogOut size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
