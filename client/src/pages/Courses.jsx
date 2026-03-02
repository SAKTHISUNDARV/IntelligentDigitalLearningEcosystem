// pages/Courses.jsx — Professional course browse
import { useState, useEffect } from 'react';
import { Search, BookOpen, ChevronRight, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';

const levelBadge = { beginner: 'success', intermediate: 'warning', advanced: 'danger' };
const levelColor = { beginner: 'from-teal-500 to-emerald-600', intermediate: 'from-amber-500 to-orange-600', advanced: 'from-rose-500 to-red-600' };

function CourseCard({ c, onEnroll, enrolling, navigate, isStudent }) {
  const gradient = levelColor[c.level] || 'from-indigo-500 to-violet-600';

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col
                 hover:shadow-lg hover:shadow-slate-200/80 hover:-translate-y-0.5
                 transition-all duration-200 cursor-pointer group"
      onClick={() => navigate(`/learn/${c.id}`)}
    >
      {/* Thumbnail */}
      <div className={`relative h-44 bg-gradient-to-br ${gradient} flex-shrink-0 overflow-hidden`}>
        {c.thumbnail_url ? (
          <img
            src={c.thumbnail_url}
            alt={c.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <GraduationCap size={28} className="text-white" />
            </div>
            <span className="text-white/60 text-xs font-medium">{c.category_name || 'Course'}</span>
          </div>
        )}
        {/* Level badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={levelBadge[c.level] || 'default'} size="sm" className="capitalize shadow-sm">
            {c.level || 'All levels'}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Domain */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
          <p className="text-[11px] font-semibold text-indigo-500 uppercase tracking-widest truncate">
            {c.category_name || 'General'}
          </p>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-bold text-slate-800 line-clamp-2 leading-snug mb-2">
          {c.title}
        </h3>

        {/* Description */}
        <p className="text-[13px] text-slate-500 line-clamp-2 leading-relaxed flex-1 mb-4">
          {c.description || 'Explore this course to learn new skills and advance your knowledge.'}
        </p>

        {/* Enroll button */}
        <div className="border-t border-slate-100 pt-4">
          {isStudent && (
            c.is_enrolled
              ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={e => { e.stopPropagation(); navigate(`/learn/${c.id}`); }}
                >
                  <ChevronRight size={14} /> Continue Learning
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
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const limit = 12;

  useEffect(() => {
    setLoading(true);
    api.get('/courses', { params: { search, page, limit } })
      .then(r => { setCourses(r.data.courses || r.data); setTotal(r.data.total || r.data.length); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, page]);

  const enroll = async (courseId, e) => {
    e.stopPropagation();
    if (enrolling) return;
    setEnrolling(courseId);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setCourses(cs => cs.map(c => c.id === courseId ? { ...c, is_enrolled: true } : c));
    } catch (err) { alert(err.response?.data?.error || 'Enrollment failed'); }
    finally { setEnrolling(null); }
  };

  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Header + Search bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex-shrink-0 pr-3 border-r border-slate-200">
          <h1 className="text-sm font-bold text-slate-800">Browse Courses</h1>
          <p className="text-[11px] text-slate-400">{total} available</p>
        </div>
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search courses…"
            className="w-full h-8 pl-8 pr-3 text-sm rounded-lg border border-slate-200 bg-slate-50
                       text-slate-800 placeholder:text-slate-400 outline-none
                       focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 transition-all"
          />
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            ← Prev
          </Button>
          <span className="text-sm text-slate-500 font-medium px-2">
            Page {page} of {pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}
