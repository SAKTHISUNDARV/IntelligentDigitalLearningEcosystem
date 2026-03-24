// pages/Profile.jsx - Premium SaaS profile dashboard
import { useState, useEffect, useMemo } from 'react';
import {
  User, Mail, Save, Pencil, X, Calendar, CheckCircle,
  BookOpen, Shield, Activity, Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { ProfilePageSkeleton } from '../components/ui/LoadingState';
import notify from '../utils/notify';

const roleMeta = {
  student: { label: 'Student', badge: 'bg-white/20 text-white border border-white/25' },
  admin: { label: 'Administrator', badge: 'bg-white/20 text-white border border-white/25' },
};

const cardUi = `
  rounded-[14px] border border-[#E5E7EB] bg-[#FFFFFF]
  shadow-[0_4px_12px_rgba(0,0,0,0.05)]
  transition-all duration-200 hover:-translate-y-[2px]
`;

const infoCardUi = 'rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4';

const formatDate = (dateValue) => {
  if (!dateValue) return '-';
  return new Date(dateValue).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (dateValue) => {
  if (!dateValue) return '-';
  return new Date(dateValue).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const activityIcon = {
  enrollment: BookOpen,
  assessment: CheckCircle,
  task: Activity,
};

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ full_name: '' });
  const [loading, setLoading] = useState(true);

  const rm = roleMeta[user?.role] || roleMeta.student;
  const initials = user?.full_name?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const joinedDate = user?.created_at ? formatDate(user.created_at) : '-';

  useEffect(() => {
    if (user) {
      setForm({ full_name: user.full_name || '' });
    }
    
    if (user?.role === 'student') {
      setLoading(true);
      Promise.all([
        api.get('/analytics/student').then((r) => setStats(r.data)).catch(() => {}),
        api.get('/courses/student/enrolled').then((r) => setEnrolledCourses(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
        api.post('/recommendations', {}).catch(() => { })
      ]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const recentActivity = useMemo(() => stats?.recent_activity || [], [stats]);
  const recentCompletedCourses = useMemo(() => {
    return enrolledCourses
      .filter(course => Boolean(course.completed) || Number(course.progress || 0) >= 100)
      .sort((a, b) => {
        const aTime = new Date(a.completed_at || a.updated_at || a.enrolled_at || 0).getTime();
        const bTime = new Date(b.completed_at || b.updated_at || b.enrolled_at || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 3)
      .map(course => ({
        title: course.title,
        timestamp: course.completed_at || course.updated_at || course.enrolled_at
      }));
  }, [enrolledCourses]);

  const lastActive = useMemo(() => {
    const latest = recentActivity[0]?.timestamp;
    return latest ? formatDateTime(latest) : 'No data';
  }, [recentActivity]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/users/profile/me', form);
      updateUser({ ...user, full_name: form.full_name });
      setSaved(true);
      setEditing(false);
      notify.success('Profile updated', 'Your changes were saved successfully.');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      notify.error('Save failed', err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10" >
      {loading ? (
        <ProfilePageSkeleton />
      ) : (
        <>
          {saved && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold">
              <CheckCircle size={16} /> Saved successfully
            </div>
          )}

          <Card
            padding={false}
            className="rounded-[16px] overflow-hidden shadow-[0_8px_20px_rgba(108,99,255,0.25)] border border-white/20"
          >
            <div
              className="p-6"
              style={{ background: 'linear-gradient(135deg,#6C63FF,#7C7AFF)', color: 'white' }}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                <div className="w-[72px] h-[72px] rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-2xl font-bold select-none">
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {editing ? (
                      <input
                        value={form.full_name}
                        onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                        className="h-10 px-3 rounded-lg border border-white/40 bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/60"
                        placeholder="Enter full name"
                      />
                    ) : (
                      <h2 className="text-xl font-bold truncate">{user?.full_name || 'User'}</h2>
                    )}
                    <Badge className={`${rm.badge} font-semibold text-xs px-3 py-1 rounded-full`}>{rm.label}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/90">
                    <span className="inline-flex items-center gap-2"><Mail size={14} /> {user?.email || '-'}</span>
                    <span className="inline-flex items-center gap-2"><Calendar size={14} /> Joined {joinedDate}</span>
                  </div>
                </div>

                {!editing ? (
                  <Button
                    variant="ghost"
                    onClick={() => setEditing(true)}
                    className="h-10 px-5 bg-[#5D55EC] text-white hover:bg-[#5149DD] border border-white/25 rounded-lg font-semibold"
                  >
                    <Pencil size={15} className="mr-2" /> Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={handleSave}
                      loading={saving}
                      className="h-10 px-4 bg-[#5D55EC] text-white hover:bg-[#5149DD] border border-white/25 rounded-lg font-semibold"
                    >
                      <Save size={14} className="mr-1.5" /> Save
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditing(false);
                        setForm({ full_name: user?.full_name || '' });
                      }}
                      className="h-10 px-4 bg-white/10 text-white hover:bg-white/20 border border-white/30 rounded-lg font-semibold"
                    >
                      <X size={14} className="mr-1.5" /> Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            <Card className={`${cardUi} p-6`}>
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Account Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: User, label: 'Full Name', value: user?.full_name || '-' },
                  { icon: Mail, label: 'Email', value: user?.email || '-' },
                  { icon: Shield, label: 'Account Type', value: rm.label },
                  { icon: Calendar, label: 'Joined Date', value: joinedDate },
                  { icon: Clock, label: 'Last Login', value: lastActive },
                  { icon: CheckCircle, label: 'Account Status', value: 'Active' },
                ].map((field) => (
                  <div key={field.label} className={infoCardUi}>
                    <div className="flex items-center gap-2 mb-2">
                      <field.icon size={14} className="text-[#6B7280]" />
                      <p className="text-[12px] tracking-[0.05em] uppercase text-[#6B7280]">{field.label}</p>
                    </div>
                    <p className="text-[15px] font-semibold text-[#111827] break-words">{field.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              <Card className={`${cardUi} p-5`}>
                <h3 className="text-base font-semibold text-[#111827] mb-3">Recent Activity</h3>
                {recentCompletedCourses.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <p className="text-[12px] tracking-[0.05em] uppercase text-[#6B7280]">Last Completed Courses</p>
                    {recentCompletedCourses.map((course, idx) => (
                      <div key={`${course.title}-${idx}`} className={infoCardUi}>
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center mt-0.5">
                            <CheckCircle size={14} className="text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#111827]">{course.title}</p>
                            <p className="text-xs text-[#6B7280] mt-0.5">{formatDateTime(course.timestamp)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {recentActivity.length > 0 ? recentActivity.slice(0, 8).map((item, idx) => {
                    const Icon = activityIcon[item.type] || Activity;
                    return (
                      <div key={`${item.type}-${idx}`} className={infoCardUi}>
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center mt-0.5">
                            <Icon size={14} className="text-[#6C63FF]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#111827]">{item.description}</p>
                            <p className="text-xs text-[#6B7280] mt-0.5 break-words">
                              {item.reference} - {formatDateTime(item.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }) : recentCompletedCourses.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#E5E7EB] p-4 text-sm text-[#6B7280]">
                      No recent activity yet. Start learning to track your progress.
                    </div>
                  ) : null}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
