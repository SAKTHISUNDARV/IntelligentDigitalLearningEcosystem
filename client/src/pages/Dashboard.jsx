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
import { SkeletonStat } from '../components/ui/Skeleton';
import { getCachedValue, setCachedValue } from '../utils/requestCache';

const STUDENT_DASHBOARD_STATS_CACHE_KEY = '/analytics/student';
const STUDENT_DASHBOARD_COURSES_CACHE_KEY = '/courses/student/enrolled';
const ADMIN_DASHBOARD_CACHE_KEY = '/analytics/admin';

/* Student Dashboard */
function StudentDashboard({ user }) {
  const navigate = useNavigate();
  const cachedStats = getCachedValue(STUDENT_DASHBOARD_STATS_CACHE_KEY);
  const cachedCourses = getCachedValue(STUDENT_DASHBOARD_COURSES_CACHE_KEY);
  const [stats, setStats] = useState(() => cachedStats?.data || null);
  const [courses, setCourses] = useState(() => cachedCourses?.data || []);
  const [loading, setLoading] = useState(() => !(cachedStats && cachedCourses));
  const [showAllActivities, setShowAllActivities] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get('/analytics/student').catch(() => ({ data: {} })),
      api.get('/courses/student/enrolled').catch(() => ({ data: [] })),
    ]).then(([s, t]) => {
      if (cancelled) return;
      const nextStats = s.data || {};
      const nextCourses = Array.isArray(t.data) ? t.data : [];
      setCachedValue(STUDENT_DASHBOARD_STATS_CACHE_KEY, nextStats);
      setCachedValue(STUDENT_DASHBOARD_COURSES_CACHE_KEY, nextCourses);
      setStats(nextStats);
      setCourses(nextCourses);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const enrolledCount = Number(stats?.enrolled_count ?? courses.length ?? 0);
  const derivedLessonsCompleted = courses.reduce((sum, course) => sum + Number(course.completed_lessons || 0), 0);
  const lessonsCompleted = Number(stats?.lessons_completed ?? derivedLessonsCompleted ?? 0);
  const avgQuizScore = Number(stats?.avg_quiz_score ?? 0);
  const avgQuizScoreDisplay = Number.isInteger(avgQuizScore)
    ? `${avgQuizScore}%`
    : `${avgQuizScore.toFixed(1)}%`;
  const completedCount = Number(
    stats?.completed_count ??
    courses.filter((course) => course.completed || Number(course.progress || 0) >= 100).length
  );

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

  const continueCourses = useMemo(() => {
    if (!courses.length) return null;

    const inProgressCourses = courses.filter((course) => !course.completed && Number(course.progress || 0) < 100);
    if (!inProgressCourses.length) return null;

    return [...inProgressCourses].sort((a, b) => {
      const progressDiff = Number(b.progress || 0) - Number(a.progress || 0);
      if (progressDiff !== 0) return progressDiff;

      const aUpdated = new Date(a.updated_at || a.enrolled_at || 0).getTime();
      const bUpdated = new Date(b.updated_at || b.enrolled_at || 0).getTime();
      return bUpdated - aUpdated;
    }).slice(0, 2);
  }, [courses]);

  const overallProgress = Math.round(Number(
    stats?.avg_progress ??
    (courses.length
      ? courses.reduce((sum, course) => sum + Number(course.progress || 0), 0) / courses.length
      : 0)
  ));

  const getLessonsRemaining = (course) => {
    if (!course) return null;
    const total = Number(course.total_lessons ?? course.lessons_count ?? 0);
    const completed = Number(course.completed_lessons ?? 0);
    if (!total) return null;
    return Math.max(0, total - completed);
  };

  const getCourseProgress = (course) => Math.round(Number(course?.progress || overallProgress || 0));
  const getCourseLessonSummary = (course) => {
    const totalLessons = Number(course?.total_lessons ?? course?.lessons_count ?? 0);
    const remainingLessons = getLessonsRemaining(course);
    const completedLessonsInCourse =
      course && totalLessons
        ? Math.max(0, totalLessons - (remainingLessons ?? 0))
        : 0;
    const estimatedHoursRemaining =
      course && totalLessons
        ? Math.max(1, Math.ceil(((remainingLessons ?? 0) * 8) / 60))
        : null;

    return { totalLessons, completedLessonsInCourse, remainingLessons, estimatedHoursRemaining };
  };

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
      value: avgQuizScoreDisplay,
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

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-6">
      <div className="anim-fade-up rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, <span className="text-blue-600">{user?.full_name?.split(' ')[0]}</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Continue your learning journey today.
            </p>
          </div>

          <div className="min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Login</p>
            <p className="text-sm font-semibold text-slate-700 mt-1">{formatDate(lastLoginTime)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? [1, 2, 3, 4].map((index) => <SkeletonStat key={index} />) : metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-[14px] border border-slate-200/60 bg-gradient-to-br ${card.gradient} p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.iconBg}`}>
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

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] gap-4 xl:items-stretch">
        <div>
          <Card className="anim-fade-up h-full border-slate-200/60 shadow-sm bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] overflow-hidden">
            {loading ? (
              <div className="space-y-3 p-4">
                <SkeletonStat />
                <SkeletonStat />
              </div>
            ) : continueCourses?.length ? (
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.24em]">Continue Learning</p>
                    <p className="mt-1 text-sm text-slate-600">Pick up where you left off in your top active courses.</p>
                  </div>
                </div>

                <div className="mt-3 space-y-2.5">
                  {continueCourses.map((course) => {
                    const courseProgress = getCourseProgress(course);
                    const {
                      totalLessons,
                      completedLessonsInCourse,
                      remainingLessons,
                      estimatedHoursRemaining,
                    } = getCourseLessonSummary(course);

                    return (
                      <div key={course.id} className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="h-15 w-22 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-sm ring-1 ring-slate-200/70">
                            {course.thumbnail_url ? (
                              <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 text-white">
                                <GraduationCap size={22} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="line-clamp-2 text-lg font-bold leading-tight tracking-tight text-slate-900">{course.title}</p>
                              
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              Module: <span className="font-semibold text-slate-700">{course.current_module || 'In Progress'}</span>
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                                Remaining {remainingLessons ?? '-'}
                              </span>
                              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                                ETA {estimatedHoursRemaining ? `${estimatedHoursRemaining}h` : '-'}
                              </span>
                              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                                {totalLessons ? `${completedLessonsInCourse}/${totalLessons} lessons` : `${lessonsCompleted} lessons`}
                              </span>
                            </div>
                          </div>
                          <div className="sm:flex sm:self-stretch sm:items-end">
                            <Button
                              size="sm"
                              className="min-w-[108px] w-full border-slate-900 bg-slate-900 shadow-none hover:border-slate-800 hover:bg-slate-800 sm:w-auto"
                              onClick={() => navigate(`/learn/${course.id}`)}
                            >
                              <Play size={14} className="mr-1.5" /> Resume
                            </Button>
                          </div>
                        </div>

                        <div className="mt-2.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-semibold uppercase tracking-[0.18em] text-slate-400">Progress</span>
                            <span className="font-bold text-slate-700">{courseProgress}%</span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-700"
                              style={{ width: `${courseProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 p-4">
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
                    <span className="font-bold text-slate-700">{overallProgress}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-700" style={{ width: `${overallProgress}%` }} />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="anim-fade-up border-slate-200/60 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-3">
                <div className="border-b border-slate-100 bg-[linear-gradient(180deg,#f8fafc_0%,rgba(248,250,252,0.55)_100%)] px-4 pt-3 pb-3">
                  <div className="skeleton h-3 w-32 rounded-full" />
                  <div className="mt-2 skeleton h-4 w-52 rounded-full" />
                </div>
                <div className="grid grid-cols-1 gap-2.5 pt-3">
                  {[1, 2, 3].map((index) => <SkeletonStat key={index} />)}
                </div>
              </div>
            ) : skills.length ? (
              <>
                <div className="border-b border-slate-100  px-4 pt-3 pb-2.5">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.24em]">Skills Progress</p>
                  <p className="mt-1 text-sm text-slate-600">Track how your core skills are improving.</p>
                </div>
                <div className="grid grid-cols-1 gap-2 p-3">
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
                    <div key={name} className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.35)]">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8.5 w-8.5 items-center justify-center rounded-xl ${iconBg}`}>
                          <Icon size={18} className={iconColor} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{name}</p>
                          <p className="text-xs text-slate-500">{progress}% completed</p>
                        </div>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full ${barColor} transition-all duration-700`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  );
                })}
                </div>
              </>
            ) : (
              <>
                <div className="border-b border-slate-100 bg-[linear-gradient(180deg,#f8fafc_0%,rgba(248,250,252,0.55)_100%)] px-4 pt-3 pb-2.5">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.24em]">Skills Progress</p>
                  <p className="mt-1 text-sm text-slate-600">Track how your core skills are improving.</p>
                </div>
                <div className="p-3">
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
              </>
            )}
          </Card>
        </div>
      </div>

      <div>
        <Card padding={false} className="anim-fade-up border-slate-200/60 shadow-sm h-full overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4">
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
                <div key={index} className="flex items-center gap-3 p-3.5 transition-colors hover:bg-slate-50">
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
              <div className="flex items-center gap-3 p-5">
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
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-4">
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
                  <div key={index} className="flex items-center gap-2.5 p-3.5">
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
  const cachedAdminData = getCachedValue(ADMIN_DASHBOARD_CACHE_KEY);
  const [data, setData] = useState(() => cachedAdminData?.data || null);
  const [loading, setLoading] = useState(() => !cachedAdminData);

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
    let cancelled = false;

    api.get('/analytics/admin').then((response) => {
      if (cancelled) return;
      setCachedValue(ADMIN_DASHBOARD_CACHE_KEY, response.data);
      setData(response.data);
    }).catch(console.error).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
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
                <div key={student.id || index} className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-[0_1_220px]">
                    <p className="text-sm font-semibold text-slate-900 truncate">{student.full_name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>Courses: {student.completed_courses}</span>
                      <span>Score: {student.avg_score}%</span>
                    </div>
                  </div>
                  <div className="ml-auto w-[112px] flex-shrink-0">
                    <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      <span>Performance</span>
                      <span>{Math.round(Math.min(100, student.performance_score || 0))}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, student.performance_score || 0)}%` }} />
                    </div>
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


