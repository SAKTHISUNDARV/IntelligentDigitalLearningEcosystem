import { useState, useEffect, useMemo } from 'react';
import { BookOpen, Play, CheckCircle, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { SkeletonCard, SkeletonStat } from '../components/ui/Skeleton';
import { getCourseImage, getFallbackBanner } from '../utils/courseImages';
import confirmAction from '../utils/confirm';
import notify from '../utils/notify';
import { getCachedValue, setCachedValue, invalidateCache } from '../utils/requestCache';

const levelColor = {
  beginner: 'from-teal-500 to-emerald-600',
  intermediate: 'from-amber-500 to-orange-600',
  advanced: 'from-rose-500 to-red-600',
};

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

const getProgress = (course) => Math.max(0, Math.min(100, Math.round(Number(course.progress || 0))));
const isCompleted = (course) => Boolean(course.completed) || getProgress(course) >= 100;
const MY_COURSES_CACHE_KEY = '/courses/student/enrolled';

function CourseCard({ course, navigate }) {
  const pct = getProgress(course);
  const completed = isCompleted(course);
  const gradient = levelColor[course.level] || 'from-indigo-500 to-violet-600';
  const courseImage = getCourseImage(course);

  return (
    <Card
      padding={false}
      hover
      className="overflow-hidden flex flex-col h-full border-slate-200/80"
      onClick={() => navigate(`/learn/${course.id}`)}
    >
      <div className={`relative h-44 bg-gradient-to-br ${gradient} flex-shrink-0 overflow-hidden`}>
        {courseImage ? (
          <img
            src={courseImage}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getFallbackBanner(course);
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <GraduationCap size={28} className="text-white" />
            </div>
            <span className="text-white/70 text-xs font-medium uppercase tracking-widest">
              {course.category_name || 'Course'}
            </span>
          </div>
        )}

        {completed && (
          <div className="absolute top-3 right-3">
            <Badge variant="success" size="sm" className="shadow-sm">Completed</Badge>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="primary" size="sm" className="max-w-[75%] truncate">
            {course.category_name || 'General'}
          </Badge>
        </div>

        <div>
          <h3 className="text-[15px] font-bold text-slate-800 line-clamp-2 leading-snug mb-2">
            {course.title}
          </h3>
          <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed">
            {course.description || 'Explore this course to learn new skills and advance your knowledge.'}
          </p>
        </div>

        <div className="mt-auto space-y-4">
          <div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-tight">
              <span>Progress</span>
              <span className={completed ? 'text-teal-600' : 'text-indigo-600'}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${completed ? 'bg-teal-500' : 'bg-indigo-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              variant={completed ? 'secondary' : 'primary'}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/learn/${course.id}`);
              }}
            >
              {completed ? <><CheckCircle size={14} /> Continue</> : <><Play size={14} className="fill-current" /> Continue</>}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function MyCourses() {
  const navigate = useNavigate();
  const cachedCourses = getCachedValue(MY_COURSES_CACHE_KEY);
  const [courses, setCourses] = useState(() => cachedCourses?.data || []);
  const [loading, setLoading] = useState(() => !cachedCourses);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedValue(MY_COURSES_CACHE_KEY);
    if (cached) {
      queueMicrotask(() => {
        if (cancelled) return;
        setCourses(Array.isArray(cached.data) ? cached.data : []);
        setLoading(false);
      });
    }

    api.get('/courses/student/enrolled')
      .then((r) => {
        if (cancelled) return;
        const nextCourses = Array.isArray(r.data) ? r.data : [];
        setCachedValue(MY_COURSES_CACHE_KEY, nextCourses);
        setCourses(nextCourses);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeCourses = useMemo(
    () => courses.filter((course) => !isCompleted(course)),
    [courses]
  );
  const completedCourses = useMemo(
    () => courses.filter((course) => isCompleted(course)),
    [courses]
  );

  const handleUnenroll = async (courseId) => {
    const confirmed = await confirmAction({
      title: 'Unenroll from course?',
      text: 'Your progress in this course will be saved if you re-enroll, but it will be removed from your library.',
      confirmText: 'Yes, Unenroll',
      confirmButtonColor: '#dc2626',
    });

    if (!confirmed) return;

    try {
      await api.delete(`/courses/${courseId}/enroll`);
      const nextCourses = courses.filter(c => c.id !== courseId);
      setCourses(nextCourses);
      setCachedValue(MY_COURSES_CACHE_KEY, nextCourses);
      invalidateCache('/analytics/student');
      invalidateCache(`/courses/${courseId}`);
      notify.success('Unenrolled successfully');
    } catch (err) {
      notify.error('Failed to unenroll', err.response?.data?.error || 'Error');
    }
  };

  const filteredCourses = useMemo(() => {
    if (tab === 'in-progress') return activeCourses;
    if (tab === 'completed') return completedCourses;
    return courses;
  }, [tab, courses, activeCourses, completedCourses]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 anim-fade-up">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <h1 className="text-xl font-bold">
              <span className="text-slate-900">My</span>{' '}
              <span className="text-blue-600">Courses</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Your enrolled courses and learning progress.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {loading ? (
              <>
                <SkeletonStat />
                <SkeletonStat />
              </>
            ) : (
              <>
                <div className="px-4 py-3 bg-indigo-50 rounded-xl border border-indigo-100 min-w-[130px]">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Courses</p>
                  <p className="text-xl font-bold text-indigo-700 mt-1 leading-none">{activeCourses.length}</p>
                </div>
                <div className="px-4 py-3 bg-teal-50 rounded-xl border border-teal-100 min-w-[130px]">
                  <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Completed Courses</p>
                  <p className="text-xl font-bold text-teal-700 mt-1 leading-none">{completedCourses.length}</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 flex-wrap">
          {TABS.map((item) => {
            const selected = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`px-4 h-9 rounded-lg text-sm font-semibold transition-colors border ${
                  selected
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : courses.length === 0 ? (
        <Card className="py-20 text-center border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-6">
            <BookOpen size={28} className="text-slate-300" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">No enrolled courses yet</h2>
          <p className="text-sm text-slate-500 mt-2 mb-8 max-w-sm mx-auto">
            You can enroll from Browse Courses. Enrolled courses will appear here for quick access.
          </p>
          <Button size="lg" className="rounded-xl px-8" onClick={() => navigate('/courses')}>
            Browse Courses
          </Button>
        </Card>
      ) : filteredCourses.length === 0 ? (
        <Card className="py-20 text-center">
          <p className="text-sm font-semibold text-slate-700">No courses found in this filter.</p>
          <p className="text-sm text-slate-500 mt-1">Try switching to another tab.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} navigate={navigate} onUnenroll={handleUnenroll} />
          ))}
        </div>
      )}
    </div>
  );
}




