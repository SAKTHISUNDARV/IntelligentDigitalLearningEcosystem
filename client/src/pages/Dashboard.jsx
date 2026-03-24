// pages/Dashboard.jsx - Role-aware dashboard (Student, Admin)
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, TrendingUp, Users, Play, GraduationCap, ClipboardList,
  Zap, CheckCircle, AlertCircle, Calendar, Award, Server, ShieldCheck, Database, Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Skeleton, SkeletonStat } from '../components/ui/Skeleton';

/* Student Dashboard */
function StudentDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllActivities, setShowAllActivities] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get('/analytics/student').catch(() => ({ data: {} })),
      api.get('/courses/student/enrolled').catch(() => ({ data: [] })),
    ]).then(([s, t]) => {
      if (cancelled) return;
      setStats(s.data);
      setCourses(Array.isArray(t.data) ? t.data : []);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const enrolledCount = stats?.enrolled_count ?? courses.length;
  const lessonsCompleted = stats?.lessons_completed ?? 0;
  const avgQuizScore = stats?.avg_quiz_score ?? 0;
  const completedCount =
    stats?.completed_count ??
    courses.filter((course) => course.completed || Number(course.progress || 0) >= 100).length;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not available';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'Not available';
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const lastLoginTime = user?.last_login;

  const continueCourse = useMemo(() => {
    if (!courses.length) return null;
    return [...courses].sort((a, b) => Number(b.progress || 0) - Number(a.progress || 0))[0];
  }, [courses]);

  const overallProgress = Number(stats?.avg_progress ?? 0);

  const getLessonsRemaining = (course) => {
    if (!course) return null;
    const total = Number(course.total_lessons ?? course.lessons_count ?? 0);
    const completed = Number(course.completed_lessons ?? 0);
    if (!total) return null;
    return Math.max(0, total - completed);
  };

  const totalLessons = continueCourse
    ? Number(continueCourse.total_lessons ?? continueCourse.lessons_count ?? 0)
    : 0;
  const completedLessonsInCourse =
    continueCourse && totalLessons
      ? Math.max(0, totalLessons - (getLessonsRemaining(continueCourse) ?? 0))
      : 0;
  const estimatedHoursRemaining =
    continueCourse && totalLessons
      ? Math.max(1, Math.ceil(((getLessonsRemaining(continueCourse) ?? 0) * 8) / 60))
      : null;
  const continueProgress = Math.round(Number(continueCourse?.progress || overallProgress || 0));

  const metricCards = [
    {
      label: 'Courses Enrolled',
      value: enrolledCount,
      icon: BookOpen,
      gradient: 'from-indigo-50 to-indigo-100',
      iconBg: 'bg-indigo-500/10',
      iconColor: 'text-indigo-600',
    },
    {
      label: 'Lessons Completed',
      value: lessonsCompleted,
      icon: CheckCircle,
      gradient: 'from-emerald-50 to-emerald-100',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Average Score',
      value: `${avgQuizScore}%`,
      icon: Award,
      gradient: 'from-amber-50 to-amber-100',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Completed Courses',
      value: completedCount,
      icon: GraduationCap,
      gradient: 'from-rose-50 to-rose-100',
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-600',
    },
  ];

  const allActivityItems = Array.isArray(stats?.recent_activity) ? stats.recent_activity : [];
  const activityItems = showAllActivities ? allActivityItems : allActivityItems.slice(0, 5);
  const skills = Array.isArray(stats?.skills_progress) ? stats.skills_progress : [];
  const skillSkeletonItems = [1, 2, 3];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-12">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 anim-fade-up">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, <span className="text-blue-600">{user?.full_name?.split(' ')[0]}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Continue your learning journey today.
            </p>
          </div>

          <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 min-w-[220px]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Login</p>
            <p className="text-sm font-semibold text-slate-700 mt-1">{formatDate(lastLoginTime)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? [1, 2, 3, 4].map((index) => <SkeletonStat key={index} />) : metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-[14px] border border-slate-200/60 bg-gradient-to-br ${card.gradient} p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-2xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon size={20} className={card.iconColor} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 leading-none">{card.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{card.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] gap-5 items-start">
        <div>
          <Card className="anim-fade-up border-slate-200/60 shadow-sm bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                <SkeletonStat />
                <SkeletonStat />
              </div>
            ) : continueCourse ? (
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.24em]">Continue Learning</p>
                    <p className="mt-1 text-sm text-slate-600">A focused snapshot of your current course.</p>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    {continueProgress}% done
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="h-18 w-28 rounded-2xl overflow-hidden bg-slate-100 shadow-sm ring-1 ring-slate-200/70 flex-shrink-0">
                    {continueCourse.thumbnail_url ? (
                      <img src={continueCourse.thumbnail_url} alt={continueCourse.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 text-white">
                        <GraduationCap size={22} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold tracking-tight text-slate-900 line-clamp-2">{continueCourse.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Module: <span className="font-semibold text-slate-700">{continueCourse.current_module || 'In Progress'}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                        Remaining {getLessonsRemaining(continueCourse) ?? '-'}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                        ETA {estimatedHoursRemaining ? `${estimatedHoursRemaining}h` : '-'}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                        {totalLessons ? `${completedLessonsInCourse}/${totalLessons} lessons` : `${lessonsCompleted} lessons`}
                      </span>
                    </div>
                  </div>
                  <div className="sm:self-stretch sm:flex sm:items-end">
                    <Button
                      size="sm"
                      className="w-full sm:w-auto min-w-[112px] bg-slate-900 border-slate-900 hover:bg-slate-800 hover:border-slate-800 shadow-none"
                      onClick={() => navigate(`/learn/${continueCourse.id}`)}
                    >
                      <Play size={14} className="mr-1.5" /> Resume
                    </Button>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.35)]">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold uppercase tracking-[0.18em] text-slate-400">Progress</span>
                    <span className="font-bold text-slate-700">{continueProgress}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-700"
                      style={{ width: `${continueProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.24em]">Continue Learning</p>
                  <p className="mt-1 text-sm text-slate-600">Enroll in a course to start building momentum.</p>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.35)]">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                    <GraduationCap size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">No course in progress</p>
                    <p className="text-xs text-slate-500 mt-1">Browse the catalog and start your next learning path.</p>
                  </div>
                  <Button size="sm" className="bg-slate-900 border-slate-900 hover:bg-slate-800 hover:border-slate-800 shadow-none" onClick={() => navigate('/courses')}>
                    Browse
                  </Button>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.35)]">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold uppercase tracking-[0.18em] text-slate-400">Overall Progress</span>
                    <span className="font-bold text-slate-700">{continueProgress}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-700" style={{ width: `${continueProgress}%` }} />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="anim-fade-up border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-slate-100 bg-[linear-gradient(180deg,#f8fafc_0%,rgba(248,250,252,0.55)_100%)]">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.24em]">Skills Progress</p>
              <p className="mt-1 text-sm text-slate-600">Track how your core skills are improving.</p>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 gap-3 p-5">
                {skillSkeletonItems.map((index) => (
                  <div key={index} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.35)]">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-28 rounded-full" />
                        <Skeleton className="h-3 w-20 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="mt-3 h-2 w-full rounded-full" />
                  </div>
                ))}              </div>
            ) : skills.length ? (
              <div className="grid grid-cols-1 gap-3 p-5">
                {skills.map((skill, index) => {
                  const name = skill.name || skill.skill || `Skill ${index + 1}`;
                  const progress = Number(skill.progress ?? skill.percentage ?? 0);
                  const iconMap = {
                    'Node.js': Server,
                    'REST API': Globe,
                    'REST APIs': Globe,
                    Authentication: ShieldCheck,
                    Security: ShieldCheck,
                    'Database Design': Database,
                  };
                  const Icon = iconMap[name] || Server;
                  const iconBg = index % 4 === 0 ? 'bg-emerald-50' : index % 4 === 1 ? 'bg-indigo-50' : index % 4 === 2 ? 'bg-amber-50' : 'bg-blue-50';
                  const iconColor = index % 4 === 0 ? 'text-emerald-600' : index % 4 === 1 ? 'text-indigo-600' : index % 4 === 2 ? 'text-amber-600' : 'text-blue-600';
                  const barColor = index % 4 === 0 ? 'bg-emerald-500' : index % 4 === 1 ? 'bg-indigo-500' : index % 4 === 2 ? 'bg-amber-500' : 'bg-blue-500';

                  return (
                    <div key={name} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.35)]">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                          <Icon size={18} className={iconColor} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{name}</p>
                          <p className="text-xs text-slate-500">{progress}% completed</p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full ${barColor} transition-all duration-700`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-5">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.35)] flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                  <Award size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">No skill milestones yet</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Skills will appear after you complete lessons and assessments.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <div>
        <Card padding={false} className="anim-fade-up border-slate-200/60 shadow-sm h-full overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white rounded-lg shadow-sm ring-1 ring-slate-100">
                <Calendar size={16} className="text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Upcoming Tasks</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-indigo-600 font-semibold" onClick={() => navigate('/manage-tasks')}>
              View All Tasks
            </Button>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? (
              [1, 2, 3].map((index) => <SkeletonStat key={index} />)
            ) : (Array.isArray(stats?.upcoming_tasks) ? stats.upcoming_tasks : []).length ? (
              (Array.isArray(stats?.upcoming_tasks) ? stats.upcoming_tasks : []).map((task, index) => (
                <div key={index} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    task.type === 'Assessment' ? 'bg-red-50' : task.type === 'Project' ? 'bg-amber-50' : 'bg-blue-50'
                  }`}>
                    {task.type === 'Quiz' ? (
                      <Zap size={14} className="text-blue-600" />
                    ) : task.type === 'Assessment' ? (
                      <AlertCircle size={14} className="text-red-600" />
                    ) : (
                      <ClipboardList size={14} className="text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">{task.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Due {task.due || task.due_date}</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-full border ${
                    task.type === 'Assessment'
                      ? 'bg-red-50 text-red-600 border-red-100'
                      : task.type === 'Project'
                        ? 'bg-amber-50 text-amber-600 border-amber-100'
                        : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>{task.type}</span>
                </div>
              ))
            ) : (
              <div className="p-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                  <Calendar size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">You're all caught up!</p>
                  <p className="text-xs text-slate-500 mt-1">No tasks due right now.</p>
                </div>
                <Button size="sm" onClick={() => navigate('/courses')}>
                  Browse Courses
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div>
        <Card padding={false} className="anim-fade-up border-slate-200/60 shadow-sm overflow-hidden h-full">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
            {!loading && allActivityItems.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-indigo-600 font-semibold"
                onClick={() => setShowAllActivities((prev) => !prev)}
              >
                {showAllActivities ? 'Show Less' : 'View All'}
              </Button>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? (
              [1, 2, 3].map((index) => <SkeletonStat key={index} />)
            ) : activityItems.length ? (
              activityItems.map((item, index) => {
                const type = (item.type || item.activity_type || 'lesson').toLowerCase();
                const time = item.time || item.timestamp || 'Recently';
                const text = item.text
                  || item.title
                  || (item.description && item.reference ? `${item.description}: ${item.reference}` : item.description)
                  || item.reference
                  || 'Learning activity';
                const iconMap = {
                  lesson: CheckCircle,
                  assessment: CheckCircle,
                  enrollment: Play,
                  task: ClipboardList,
                };
                const Icon = iconMap[type] || CheckCircle;
                const color = type === 'assessment' ? 'text-blue-600' : type === 'enrollment' ? 'text-indigo-600' : type === 'task' ? 'text-amber-600' : 'text-emerald-600';
                const bg = type === 'assessment' ? 'bg-blue-50' : type === 'enrollment' ? 'bg-indigo-50' : type === 'task' ? 'bg-amber-50' : 'bg-emerald-50';

                return (
                  <div key={index} className="p-4 flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full ${bg} flex items-center justify-center`}>
                      <Icon size={16} className={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{text}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{typeof time === 'string' ? time : formatDate(time)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-sm text-slate-500">No recent activity yet.</div>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}

/* Admin Dashboard */
function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Not available';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'Not available';
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  useEffect(() => {
    api.get('/analytics/admin').then((response) => setData(response.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Welcome back, <span className="text-blue-600">{user?.full_name?.split(' ')[0]}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Monitor growth, performance, and platform health</p>
        </div>
        <div className="min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Login</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">{formatDateTime(user?.last_login || data?.users?.last_login)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? [1, 2, 3, 4].map((index) => <SkeletonStat key={index} />) : [
          {
            label: 'Total Students',
            value: data?.users?.total_students ?? 0,
            icon: Users,
            tone: 'indigo',
          },
          {
            label: 'Published Courses',
            value: data?.courses?.published_courses ?? 0,
            icon: BookOpen,
            tone: 'teal',
          },
          {
            label: 'Course Enrollments',
            value: data?.enrollments?.total_enrollments ?? 0,
            icon: TrendingUp,
            tone: 'violet',
          },
          {
            label: 'Completion Rate',
            value: `${Math.round(((data?.enrollments?.completions || 0) / (data?.enrollments?.total_enrollments || 1)) * 100) || 0}%`,
            icon: CheckCircle,
            tone: 'amber',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          const tones = {
            indigo: 'from-indigo-50 to-indigo-100 text-indigo-600',
            teal: 'from-teal-50 to-teal-100 text-teal-600',
            violet: 'from-violet-50 to-violet-100 text-violet-600',
            amber: 'from-amber-50 to-amber-100 text-amber-600',
          };

          return (
            <div
              key={stat.label}
              className={`rounded-[14px] border border-slate-200/60 bg-gradient-to-br ${tones[stat.tone]} p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-white/70 flex items-center justify-center">
                  <Icon size={18} className={tones[stat.tone].split(' ').pop()} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader><CardTitle>Category-wise Average Score</CardTitle></CardHeader>
          <div className="space-y-4">
            {(Array.isArray(data?.category_scores) && data.category_scores.length
              ? data.category_scores
              : Array.isArray(data?.avg_scores_by_category) && data.avg_scores_by_category.length
                ? data.avg_scores_by_category
                : []
            ).length ? (
              (Array.isArray(data?.category_scores) && data.category_scores.length
                ? data.category_scores
                : data.avg_scores_by_category
              ).map((category, index) => {
                const name = category.category || category.name || category.title || `Category ${index + 1}`;
                const score = Number(category.avg_score ?? category.average_score ?? category.score ?? 0);

                return (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                      <span className="font-medium text-slate-700">{name}</span>
                      <span className="text-slate-500 text-xs">{Math.round(score)}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="h-full rounded-full transition-all duration-1000 bg-indigo-500" style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-sm text-slate-500">
                No category score data yet.
              </div>
            )}
          </div>
        </Card>

        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader><CardTitle>Top Students Leaderboard</CardTitle></CardHeader>
          <div className="space-y-3">
            {Array.isArray(data?.top_students) && data.top_students.length ? (
              data.top_students.slice(0, 5).map((student, index) => (
                <div key={student.id || index} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-slate-100 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                    {index + 1}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                    {student.full_name?.[0]?.toUpperCase() || 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{student.full_name}</p>
                    <p className="text-xs text-slate-500">Courses: {student.completed_courses} | Score: {student.avg_score}%</p>
                  </div>
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, student.performance_score || 0)}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-sm text-slate-500">
                No leaderboard data yet. Student performance will appear here once quizzes and lessons are completed.
              </div>
            )}
            {user?.role === 'admin' && Array.isArray(data?.top_students) && data.top_students.length > 5 && (
              <div className="pt-2">
                <Button variant="ghost" size="sm" className="text-indigo-600 font-semibold" onClick={() => navigate('/admin/users')}>
                  View All
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader><CardTitle>High Performance Courses</CardTitle></CardHeader>
          <div className="space-y-3">
            {(data?.top_courses || []).slice(0, 5).map((course, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 w-6">#{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{course.title}</p>
                </div>
                <Badge variant="primary" size="sm">{course.enrollment_count}</Badge>
              </div>
            ))}
            {!data?.top_courses?.length && !loading && (
              <p className="text-sm text-slate-500 text-center py-6">No enrollment data yet</p>
            )}
          </div>
        </Card>

        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader><CardTitle>Platform Health</CardTitle></CardHeader>
          <div className="space-y-4">
            {[
              { label: 'Avg Course Progress', value: data?.enrollments?.avg_progress || 0, color: 'bg-indigo-500' },
              { label: 'Quiz Platform Avg', value: data?.assessments?.platform_avg_score || 0, color: 'bg-teal-500' },
              { label: 'Completion Rate', value: Math.round(((data?.enrollments?.completions || 0) / (data?.enrollments?.total_enrollments || 1)) * 100) || 0, color: 'bg-amber-500' },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between mb-1.5 text-sm">
                  <span className="font-medium text-slate-700">{metric.label}</span>
                  <span className="font-bold text-slate-900">{metric.value}%</span>
                </div>
                <div className="progress-track">
                  <div className={`h-full rounded-full ${metric.color} transition-all duration-1000`} style={{ width: `${metric.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* Main export */
export default function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboard user={user} />;
  return <StudentDashboard user={user} />;
}
