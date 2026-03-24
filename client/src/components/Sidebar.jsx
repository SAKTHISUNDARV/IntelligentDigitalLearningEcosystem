// components/Sidebar.jsx — Role-aware sidebar (admin + student only)
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, BookMarked, ClipboardList, History,
  User, Users, Tag,
  LogOut, ChevronRight, Sparkles, GraduationCap, BrainCircuit, Bot, ListTodo
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navConfig = {
  student: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/courses', icon: BookOpen, label: 'Browse Courses' },
    { to: '/my-courses', icon: BookMarked, label: 'My Courses' },
    { to: '/manage-tasks', icon: ListTodo, label: 'Manage Tasks' },
    { to: '/assessments', icon: ClipboardList, label: 'Assessments' },
    { to: '/assessment-history', icon: History, label: 'Results' },
    { to: '/ai-tutor', icon: Bot, label: 'AI Assistant' },
    { to: '/profile', icon: User, label: 'Profile' },
  ],
  admin: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
    { to: '/admin/quizzes', icon: BrainCircuit, label: 'AI Quizzes' },
    { to: '/admin/categories', icon: Tag, label: 'Categories' },
    { to: '/ai-tutor', icon: Bot, label: 'AI Assistant' },
    { to: '/profile', icon: User, label: 'Profile' },
  ],
};

// Extra path-prefix overrides: if current path starts with prefix, treat `to` as active
const activeOverrides = [
  { prefix: '/learn/', highlightTo: '/my-courses' },
  { prefix: '/courses/', highlightTo: '/courses' },
  { prefix: '/assessment-result/', highlightTo: '/assessment-history' },
];

const roleConfig = {
  student: { label: 'Student', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  admin: { label: 'Admin', color: 'text-rose-600', bg: 'bg-rose-50' },
};

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role || 'student';
  const links = navConfig[role] || navConfig.student;
  const rc = roleConfig[role] || roleConfig.student;

  // Determine if a link should be forced-active based on overrides
  const isForceActive = (to) =>
    activeOverrides.some(o => location.pathname.startsWith(o.prefix) && o.highlightTo === to);

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
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {role !== 'admin' && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-2">
                Menu
              </p>
              <div className="space-y-0.5">
                {links.map(({ to, icon: Icon, label }) => {
                  const forced = isForceActive(to);
                    return (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === '/'}
                      onClick={onClose}
                      className={({ isActive }) => {
                        const active = isActive || forced;
                        return `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                          transition-all duration-150
                          ${active
                            ? 'bg-[rgba(108,99,255,0.12)] text-[#6C63FF] rounded-[10px]'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                          }`;
                      }}
                    >
                      {({ isActive }) => {
                        const active = isActive || forced;
                        return (
                          <>
                            {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#6C63FF]" />}
                            <Icon size={16} className={active ? 'text-[#6C63FF]' : 'text-slate-400 group-hover:text-slate-600'} />
                            <span className="flex-1">{label}</span>
                            {active && <ChevronRight size={12} className="text-[#6C63FF]" />}
                          </>
                        );
                      }}
                    </NavLink>
                  );
                })}
              </div>
            </>
          )}

          {role === 'admin' && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-2">
                Menu
              </p>
              <div className="space-y-0.5">
                {links.map(({ to, icon: Icon, label }) => {
                  const forced = isForceActive(to);
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === '/'}
                      onClick={onClose}
                      className={({ isActive }) => {
                        const active = isActive || forced;
                        return `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                          transition-all duration-150
                          ${active
                            ? 'bg-[rgba(108,99,255,0.12)] text-[#6C63FF] rounded-[10px]'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                          }`;
                      }}
                    >
                      {({ isActive }) => {
                        const active = isActive || forced;
                        return (
                          <>
                            {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#6C63FF]" />}
                            <Icon size={16} className={active ? 'text-[#6C63FF]' : 'text-slate-400 group-hover:text-slate-600'} />
                            <span className="flex-1">{label}</span>
                            {active && <ChevronRight size={12} className="text-[#6C63FF]" />}
                          </>
                        );
                      }}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          )}
        </nav>


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
