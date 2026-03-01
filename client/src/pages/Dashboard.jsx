// pages/Dashboard.jsx — Role-aware dashboard (Student, Instructor, Admin)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, CheckCircle, TrendingUp, Award, Users, BarChart2,
  ClipboardList, ArrowRight, Sparkles, Play, Clock, Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Card, { StatCard } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SkeletonStat, SkeletonCard } from '../components/ui/Skeleton';

/* ── Student Dashboard ─────────────────────────────────── */
function StudentDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [ai, setAi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/student'),
      api.post('/recommendations', {}).catch(() => ({ data: null })),
    ]).then(([s, r]) => {
      setStats(s.data);
      setAi(r.data);
    }).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Enrolled', value: stats?.enrolled_count, icon: BookOpen, color: 'indigo' },
    { label: 'Completed', value: stats?.completed_count, icon: CheckCircle, color: 'teal' },
    { label: 'Avg Score', value: stats?.avg_quiz_score != null ? `${Math.round(stats.avg_quiz_score)}%` : '—', icon: TrendingUp, color: 'amber' },
    { label: 'Certificates', value: stats?.total_certificates, icon: Award, color: 'violet' },
  ];

  return (
    <div className="space-y-6 stagger-children">
      {/* Welcome */}
      <div className="anim-fade-up">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Good morning, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Here's where you left off</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? [1, 2, 3, 4].map(i => <SkeletonStat key={i} />) :
          statCards.map(s => <StatCard key={s.label} {...s} />)
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Continue learning */}
        <div className="lg:col-span-2">
          <Card padding={false} className="anim-fade-up overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Continue Learning</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/my-courses')}>
                View all <ArrowRight size={13} />
              </Button>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {loading ? [1, 2].map(i => <SkeletonCard key={i} />) :
                (stats?.recent_courses?.length ? stats.recent_courses.slice(0, 3).map(c => (
                  <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-[var(--surface-2)] transition-colors cursor-pointer group"
                    onClick={() => navigate(`/learn/${c.id}`)}>
                    <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
                      <Play size={14} className="text-white ml-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{c.title}</p>
                      <div className="progress-track mt-2 w-full">
                        <div className="progress-fill" style={{ width: `${c.progress || 0}%` }} />
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{Math.round(c.progress || 0)}% complete</p>
                    </div>
                    <ArrowRight size={14} className="text-[var(--text-muted)] group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                  </div>
                )) : (
                  <div className="p-8 text-center">
                    <BookOpen size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
                    <p className="text-sm text-[var(--text-secondary)]">No courses yet.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/courses')}>
                      Browse Courses
                    </Button>
                  </div>
                ))
              }
            </div>
          </Card>
        </div>

        {/* AI Recommendations */}
        <div className="space-y-4">
          <Card className="anim-fade-up bg-gradient-to-br from-indigo-600 to-violet-600 border-0" padding={false}>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-indigo-200" />
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">AI Insight</span>
              </div>
              <p className="text-white text-sm font-medium leading-relaxed">
                {ai?.next_lesson || 'Keep up the great work! You\'re making excellent progress.'}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-indigo-500/50">
                  <div className="h-full rounded-full bg-white" style={{ width: `${(ai?.confidence_score || 0.5) * 100}%` }} />
                </div>
                <span className="text-xs text-indigo-200">{Math.round((ai?.confidence_score || 0.5) * 100)}% confidence</span>
              </div>
            </div>
          </Card>

          {ai?.suggested_courses?.length > 0 && (
            <Card padding={false} className="anim-fade-up overflow-hidden">
              <div className="p-4 border-b border-[var(--border)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Suggested For You</h3>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {ai.suggested_courses.slice(0, 3).map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                    onClick={() => navigate('/courses')}>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <Star size={13} className="text-indigo-500" />
                    </div>
                    <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2 flex-1">{c.title}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="anim-fade-up">
            <div className="flex items-center gap-3 mb-4">
              <ClipboardList size={16} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/courses')}>
                <BookOpen size={14} /> Browse Courses
              </Button>
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/assessments')}>
                <ClipboardList size={14} /> Take a Quiz
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Instructor Dashboard ──────────────────────────────── */
function InstructorDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/instructor').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 stagger-children">
      <div className="flex items-start justify-between gap-4 anim-fade-up">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Instructor Hub</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Hi {user?.full_name?.split(' ')[0]}, here's your performance</p>
        </div>
        <Button onClick={() => navigate('/instructor/create')}>
          <BookOpen size={15} /> New Course
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? [1, 2, 3].map(i => <SkeletonStat key={i} />) : [
          { label: 'Total Courses', value: stats?.total_courses || 0, icon: BookOpen, color: 'indigo' },
          { label: 'Total Students', value: stats?.total_students || 0, icon: Users, color: 'teal' },
          { label: 'Avg Completion', value: `${Math.round((stats?.course_stats || []).reduce((s, c) => s + (c.avg_progress || 0), 0) / (stats?.course_stats?.length || 1) || 0)}%`, icon: TrendingUp, color: 'violet' },
        ].map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card padding={false} className="anim-fade-up overflow-hidden">
          <div className="p-5 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)]">Course Performance</h3>
          </div>
          <div className="p-5 space-y-5">
            {(stats?.course_stats || []).slice(0, 4).map(c => (
              <div key={c.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-[var(--text-primary)] truncate flex-1">{c.title}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-2 flex-shrink-0">{c.enrolled_students || 0} students</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="progress-track flex-1">
                    <div className="progress-fill" style={{ width: `${c.avg_progress || 0}%` }} />
                  </div>
                  <span className="text-xs font-bold text-indigo-600  w-10 text-right">{c.avg_progress || 0}%</span>
                </div>
              </div>
            ))}
            {!stats?.course_stats?.length && !loading && (
              <div className="text-center py-6">
                <p className="text-sm text-[var(--text-secondary)]">No courses yet.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/instructor/create')}>
                  Create First Course
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card padding={false} className="anim-fade-up overflow-hidden">
          <div className="p-5 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)]">Recent Submissions</h3>
          </div>
          <div className="divide-y divide-[var(--border)] max-h-72 overflow-y-auto">
            {(stats?.recent_submissions || []).map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${s.passed ? 'bg-teal-500' : 'bg-red-500'}`}>
                  {Math.round(s.score)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{s.student_name}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{s.quiz_title}</p>
                </div>
                <Badge variant={s.passed ? 'success' : 'danger'} size="sm">{s.passed ? 'Pass' : 'Fail'}</Badge>
              </div>
            ))}
            {!stats?.recent_submissions?.length && !loading && (
              <p className="text-center text-sm text-[var(--text-secondary)] py-8">No submissions yet</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── Admin Dashboard ───────────────────────────────────── */
function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/admin').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 stagger-children">
      <div className="flex items-start justify-between gap-4 anim-fade-up">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Admin Console</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Platform overview — {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/admin/analytics')}>
          <BarChart2 size={15} /> Full Analytics
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? [1, 2, 3, 4].map(i => <SkeletonStat key={i} />) : [
          { label: 'Total Users', value: data?.users?.total_users || 0, icon: Users, color: 'indigo', sub: `+${data?.users?.new_users_30d || 0} this month` },
          { label: 'Courses Published', value: data?.courses?.published_courses || 0, icon: BookOpen, color: 'teal' },
          { label: 'Enrollments', value: data?.enrollments?.total_enrollments || 0, icon: TrendingUp, color: 'amber' },
          { label: 'Pending Approvals', value: (data?.courses?.pending_courses || 0) + (data?.users?.pending_instructors || 0), icon: ClipboardList, color: 'rose' },
        ].map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* User distribution */}
        <Card padding={false} className="anim-fade-up overflow-hidden">
          <div className="p-5 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)]">User Distribution</h3>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Students', val: data?.users?.total_students || 0, total: data?.users?.total_users || 1, color: 'bg-indigo-500' },
              { label: 'Instructors', val: data?.users?.total_instructors || 0, total: data?.users?.total_users || 1, color: 'bg-violet-500' },
              { label: 'Admins', val: data?.users?.total_admins || 0, total: data?.users?.total_users || 1, color: 'bg-rose-500' },
            ].map(r => {
              const pct = Math.round((r.val / (r.total || 1)) * 100) || 0;
              return (
                <div key={r.label}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="font-medium text-[var(--text-primary)]">{r.label}</span>
                    <span className="text-[var(--text-muted)]">{r.val} <span className="text-[11px]">({pct}%)</span></span>
                  </div>
                  <div className="progress-track">
                    <div className={`h-full rounded-full transition-all duration-1000 ${r.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top courses */}
        <Card padding={false} className="anim-fade-up overflow-hidden">
          <div className="p-5 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)]">Most Popular Courses</h3>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {(data?.top_courses || []).slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <span className="text-sm font-bold text-[var(--text-muted)] w-5 text-center flex-shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{c.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">{c.instructor}</p>
                </div>
                <Badge variant="primary">{c.enrollment_count} enrolled</Badge>
              </div>
            ))}
            {!data?.top_courses?.length && !loading && (
              <p className="text-center text-sm text-[var(--text-secondary)] py-8">No enrollment data yet</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── Main export ───────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'instructor') return <InstructorDashboard user={user} />;
  if (user?.role === 'admin') return <AdminDashboard user={user} />;
  return <StudentDashboard user={user} />;
}
