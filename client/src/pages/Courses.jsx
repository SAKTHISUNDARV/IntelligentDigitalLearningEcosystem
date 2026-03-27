import { useState, useEffect } from 'react';
import { Search, BookOpen, GraduationCap, ChevronDown, Play, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Skeleton';
import { getCourseImage, getFallbackBanner } from '../utils/courseImages';
import notify from '../utils/notify';
import { getCachedValue, setCachedValue, invalidateCache } from '../utils/requestCache';

const levelColor = {
  beginner: 'from-teal-500 to-emerald-600',
  intermediate: 'from-amber-500 to-orange-600',
  advanced: 'from-rose-500 to-red-600'
};

const categoryColors = {
  'Web Development': 'primary',
  'Mobile Development': 'info',
  'Data Science': 'success',
  'Machine Learning': 'warning',
  'UI/UX Design': 'purple',
  'Cloud Computing': 'danger',
  'DevOps': 'info',
  'Cybersecurity': 'danger',
  'Python': 'success',
  'JavaScript': 'warning',
  'React': 'primary',
  'Node.js': 'success',
  'Database': 'info',
  'API Development': 'primary',
  'General': 'default',
};

const getCategoryBadgeVariant = (categoryName) => {
  return categoryColors[categoryName] || 'default';
};

function CourseCard({ c, onEnroll, enrolling, navigate, isStudent }) {
  const gradient = levelColor[c.level] || 'from-indigo-500 to-violet-600';
  const courseImage = getCourseImage(c);
  const badgeVariant = getCategoryBadgeVariant(c.category_name);

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col
                 hover:shadow-lg hover:shadow-slate-200/80 hover:-translate-y-0.5
                 transition-all duration-200 cursor-pointer group"
      onClick={() => navigate(`/courses/${c.id}`)}
    >
      <div className={`relative h-44 bg-gradient-to-br ${gradient} flex-shrink-0 overflow-hidden`}>
        {courseImage ? (
          <img
            src={courseImage}
            alt={c.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getFallbackBanner(c);
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <GraduationCap size={28} className="text-white" />
            </div>
            <span className="text-white/60 text-xs font-medium">{c.category_name || 'Course'}</span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="mb-3">
          <Badge variant={badgeVariant} size="sm">
            {c.category_name || 'General'}
          </Badge>
        </div>
        <h3 className="text-[15px] font-bold text-slate-800 line-clamp-2 leading-snug mb-2">
          {c.title}
        </h3>
        <p className="text-[13px] text-slate-500 line-clamp-2 leading-relaxed flex-1 mb-4">
          {c.description || 'Explore this course to learn new skills and advance your knowledge.'}
        </p>
        <div className="border-t border-slate-100 pt-4">
          {isStudent && (
            c.is_enrolled
              ? (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={e => { e.stopPropagation(); navigate(`/learn/${c.id}`); }}
                >
                  <Play size={14} /> Continue Learning
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  loading={enrolling === c.id}
                  onClick={e => { e.stopPropagation(); onEnroll(c.id, e); }}
                >
                  Enroll Now
                </Button>
              )
          )}
        </div>
      </div>
    </div>
  );
}

export default function Courses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [enrolling, setEnrolling] = useState(null);
  const [category, setCategory] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const limit = 12;

  const cacheKey = `/courses::${debouncedSearch}::${page}::${limit}::${category}`;
  const cachedCourses = getCachedValue(cacheKey);
  const [courses, setCourses] = useState(() => cachedCourses?.data?.courses || []);
  const [total, setTotal] = useState(() => cachedCourses?.data?.total || 0);
  const [loading, setLoading] = useState(() => !cachedCourses);

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'Web Development', label: 'Web Development' },
    { value: 'Data Science', label: 'Data Science' },
    { value: 'Machine Learning', label: 'Machine Learning' },
    { value: 'Mobile Development', label: 'Mobile Development' },
    { value: 'DevOps', label: 'DevOps' },
    { value: 'Cybersecurity', label: 'Cybersecurity' },
    { value: 'Database', label: 'Database' },
    { value: 'UI/UX Design', label: 'UI/UX Design' },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const cached = getCachedValue(cacheKey);
    if (cached) {
      setCourses(cached.data.courses || []);
      setTotal(cached.data.total || 0);
      setLoading(false);
    } else {
      setLoading(true);
    }

    let cancelled = false;

    api.get('/courses', { params: { search: debouncedSearch, page, limit, category } })
      .then(r => {
        if (cancelled) return;
        const nextCourses = r.data.courses || r.data;
        const nextTotal = r.data.total || r.data.length;
        setCachedValue(cacheKey, { courses: nextCourses, total: nextTotal });
        setCourses(nextCourses);
        setTotal(nextTotal);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, debouncedSearch, page, category]);

  const enroll = async (courseId, e) => {
    e.stopPropagation();
    if (enrolling) return;
    setEnrolling(courseId);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setCourses(cs => cs.map(c => c.id === courseId ? { ...c, is_enrolled: true } : c));
      invalidateCache('/courses/student/enrolled');
      invalidateCache('/analytics/student');
      invalidateCache(`/courses/${courseId}`);
      notify.success('Enrollment successful', 'The course is now available in My Courses.');
    } catch (err) {
      notify.error('Enrollment failed', err.response?.data?.error || 'Enrollment failed');
    } finally {
      setEnrolling(null);
    }
  };

  const pages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 anim-fade-up relative z-20 overflow-visible">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <h1 className="text-xl font-bold">
              <span className="text-slate-900">Browse</span>{' '}
              <span className="text-blue-600">Courses</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Explore available courses and start learning</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search courses or topics..."
                className="w-full h-10 pl-11 pr-3.5 text-sm rounded-lg border border-slate-200 bg-white
                           text-slate-800 placeholder:text-slate-400 outline-none
                           focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                style={{ height: '42px' }}
              />
            </div>

            <div className="relative z-30">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700
                           transition-all hover:border-slate-300 hover:bg-slate-50 whitespace-nowrap"
                style={{ height: '42px' }}
              >
                <SlidersHorizontal size={16} className="text-slate-500" />
                <span>Filter</span>
                <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${showFilterMenu ? 'rotate-180' : ''}`} />
              </button>

              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-[0_20px_45px_-20px_rgba(15,23,42,0.28)] z-[70]">
                  <div className="p-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 px-3 py-1">Categories</p>
                    {categories.map(cat => (
                      <button
                        key={cat.value}
                        onClick={() => { setCategory(cat.value); setShowFilterMenu(false); setPage(1); }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          category === cat.value
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {!loading && (
        <div className="text-sm text-slate-600 font-medium pl-1">
          Showing {courses.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} courses
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-6">
        {loading
          ? [1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)
          : courses.length === 0
            ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <BookOpen size={28} className="text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700">No courses found</p>
                <p className="text-sm text-slate-400 mt-1">Try a different search term</p>
              </div>
            )
            : courses.map(c => (
              <CourseCard
                key={c.id}
                c={c}
                onEnroll={enroll}
                enrolling={enrolling}
                navigate={navigate}
                isStudent={user?.role === 'student'}
              />
            ))
        }
      </div>

      {pages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            Prev
          </Button>
          <span className="text-sm text-slate-500 font-medium px-2">
            Page {page} of {pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
