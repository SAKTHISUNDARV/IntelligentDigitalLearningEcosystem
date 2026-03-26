import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Search, BookOpen, PlayCircle, ChevronRight } from 'lucide-react';
import api from '../services/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';

const emptyResults = { courses: [], lessons: [] };

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [searchState, setSearchState] = useState({ query: '', data: emptyResults });

  useEffect(() => {
    if (!query) return;

    let cancelled = false;

    api.get(`/search?q=${encodeURIComponent(query)}`)
      .then((res) => {
        if (!cancelled) {
          setSearchState({ query, data: res.data });
        }
      })
      .catch((err) => {
        console.error('Search failed', err);
        if (!cancelled) {
          setSearchState({ query, data: emptyResults });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const isLoading = Boolean(query) && searchState.query !== query;
  const activeResults = !query || isLoading ? emptyResults : searchState.data;
  const hasResults = activeResults.courses.length > 0 || activeResults.lessons.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 anim-fade-up">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Search size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Search Results</h1>
            <p className="text-slate-500">
              {isLoading ? 'Searching...' : `Found ${activeResults.courses.length + activeResults.lessons.length} results for "${query}"`}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : !hasResults ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center anim-fade-up">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">No results found</h2>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            We couldn't find anything matching "{query}". Try checking your spelling or using more general terms.
          </p>
          <Button className="mt-6" variant="outline" onClick={() => navigate('/courses')}>
            Browse All Courses
          </Button>
        </div>
      ) : (
        <>
          {activeResults.courses.length > 0 && (
            <section className="space-y-4 anim-fade-up">
              <div className="flex items-center gap-2 px-1">
                <BookOpen size={20} className="text-indigo-500" />
                <h2 className="text-lg font-bold text-slate-800">Courses</h2>
                <Badge variant="primary" size="sm" className="ml-2">{activeResults.courses.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeResults.courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    <div className="flex flex-col h-full">
                      <div className="mb-3">
                        <Badge variant="info" size="sm">{course.category_name || 'General'}</Badge>
                      </div>
                      <h3 className="font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                        {course.description}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                        <span className="text-xs font-medium text-slate-400 capitalize">{course.level}</span>
                        <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeResults.lessons.length > 0 && (
            <section className="space-y-4 anim-fade-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 px-1">
                <PlayCircle size={20} className="text-emerald-500" />
                <h2 className="text-lg font-bold text-slate-800">Lessons</h2>
                <Badge variant="success" size="sm" className="ml-2">{activeResults.lessons.length}</Badge>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                {activeResults.lessons.map((lesson) => (
                  <Link
                    to={`/learn/${lesson.course_id}`}
                    key={lesson.id}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b last:border-0 border-slate-100 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <PlayCircle size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                        {lesson.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        In course: <span className="font-medium text-slate-600">{lesson.course_title}</span>
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
