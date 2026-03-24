// pages/CourseDetail.jsx - Full course detail preview before enrolling
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Clock, Play, Layers,
  CheckCircle, Lock, FileQuestion, ChevronDown, ChevronUp, Award, FileText, Sparkles
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { CourseDetailSkeleton } from '../components/ui/LoadingState';
import { getCourseImage, getFallbackBanner } from '../utils/courseImages';
import notify from '../utils/notify';
import confirmAction from '../utils/confirm';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [removingEnrollment, setRemovingEnrollment] = useState(false);
  const [openModules, setOpenModules] = useState({});

  const isStudent = user?.role === 'student';

  useEffect(() => {
    api.get(`/courses/${courseId}`)
      .then(r => {
        setCourse(r.data);
        const firstModuleId = r.data?.modules?.[0]?.id;
        setOpenModules(firstModuleId ? { [firstModuleId]: true } : {});
      })
      .catch(() => setError('Course not found or unavailable.'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleEnroll = async () => {
    if (enrolling) return;
    setEnrolling(true);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setCourse(c => ({ ...c, enrollment: { progress: 0, completed: false } }));
      notify.success('Enrollment successful', 'The course has been added to your learning path.');
    } catch (err) {
      notify.error('Enrollment failed', err.response?.data?.error || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    if (removingEnrollment) return;
    const confirmed = await confirmAction({
      title: 'Remove Enrollment?',
      text: 'This course will be removed from your enrolled courses, and your saved progress for this course will also be removed.',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      confirmButtonColor: '#dc2626',
    });
    if (!confirmed) return;

    setRemovingEnrollment(true);
    try {
      await api.delete(`/courses/${courseId}/enroll`);
      setCourse((current) => ({ ...current, enrollment: null }));
      notify.info('Enrollment removed', 'The course was removed from your enrolled courses.');
    } catch (err) {
      notify.error('Unable to remove enrollment', err.response?.data?.error || 'Unable to remove enrollment');
    } finally {
      setRemovingEnrollment(false);
    }
  };

  if (loading) {
    return <CourseDetailSkeleton />;
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <BookOpen size={40} className="text-[var(--text-muted)]" />
        <p className="text-[var(--text-secondary)]">{error || 'Course not found.'}</p>
        <Button variant="outline" onClick={() => navigate('/courses')}>
          <ArrowLeft size={14} /> Back to Courses
        </Button>
      </div>
    );
  }

  const isEnrolled = !!course.enrollment;
  const tags = (() => {
    if (Array.isArray(course.tags)) return course.tags.filter(Boolean);
    if (typeof course.tags === 'string') {
      try {
        const parsed = JSON.parse(course.tags || '[]');
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch {
        return [];
      }
    }
    return [];
  })();
  const modules = Array.isArray(course.modules)
    ? course.modules.map((module) => ({
      ...module,
      lessons: Array.isArray(module?.lessons) ? module.lessons : [],
      materials: Array.isArray(module?.materials) ? module.materials : [],
      quiz: module?.quiz ?? null,
    }))
    : [];
  const finalQuizzes = Array.isArray(course.finalQuizzes) ? course.finalQuizzes : [];
  const derivedPreviewContentUrl =
    course.preview_content_url ||
    modules.flatMap((module) => module.lessons).find((lesson) => lesson?.content_url)?.content_url ||
    '';
  const courseImage = getCourseImage({ ...course, preview_content_url: derivedPreviewContentUrl });
  const totalLessons = modules.reduce((sum, mod) => sum + (mod.lessons?.length || 0), 0);
  const totalMaterials = modules.reduce((sum, mod) => sum + (mod.materials?.length || 0), 0);
  const moduleQuizCount = modules.reduce((sum, mod) => sum + (mod.quiz ? 1 : 0), 0);
  const totalQuizzes = moduleQuizCount + finalQuizzes.length;

  const toggleModule = (moduleId) => {
    setOpenModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/courses')}
        className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-indigo-500 transition-colors group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Browse Courses
      </button>

      <div className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_55%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_40%)]" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
          <div className="relative w-full aspect-[16/9] overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-slate-100 mx-auto lg:mx-0">
            <img
              src={courseImage}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={e => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = getFallbackBanner(course);
              }}
            />
            {isEnrolled && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/95 text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                <CheckCircle size={12} /> Enrolled
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/25 to-transparent pointer-events-none" />
          </div>

          <div className="relative flex flex-col justify-between gap-4 py-1">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.24em]">
                  {course.category_name || 'General'}
                </p>
                <h1 className="text-2xl lg:text-[2rem] font-bold text-[var(--text-primary)] tracking-tight leading-tight">
                  {course.title}
                </h1>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="mb-1 flex items-center gap-2 text-slate-500">
                    <Layers size={14} />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Modules</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{modules.length} structured</p>
                </div>
                {course.duration_hours > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                    <div className="mb-1 flex items-center gap-2 text-slate-500">
                      <Clock size={14} />
                      <span className="text-[11px] font-bold uppercase tracking-widest">Duration</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">{course.duration_hours}h total</p>
                  </div>
                )}
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="mb-1 flex items-center gap-2 text-slate-500">
                    <BookOpen size={14} />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Lessons</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{totalLessons} total</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="mb-1 flex items-center gap-2 text-slate-500">
                    <FileQuestion size={14} />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Assessments</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{totalQuizzes} quiz{totalQuizzes === 1 ? '' : 'zes'}</p>
                </div>
              </div>

              {course.description && (
                <p className="max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                  {course.description}
                </p>
              )}

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(t => (
                    <span key={t} className="px-3 py-1 text-xs rounded-full bg-indigo-50 text-indigo-600 font-semibold border border-indigo-100">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {isStudent && (
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                {isEnrolled ? (
                  <>
                    <Button
                      className="w-full sm:w-auto min-w-[220px]"
                      onClick={() => navigate(`/learn/${courseId}`)}
                    >
                      <Play size={14} /> Continue Learning
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      loading={removingEnrollment}
                      onClick={handleUnenroll}
                    >
                      Remove Enrollment
                    </Button>
                  </>
                ) : (
                  <Button
                    className="w-full sm:w-auto min-w-[220px]"
                    loading={enrolling}
                    onClick={handleEnroll}
                  >
                    Enroll Now - It&apos;s Free
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-indigo-500">Course Blueprint</p>
                <h2 className="mt-1.5 text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  Module-by-module journey
                </h2>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                  Preview exactly how this course flows, including lessons, downloadable materials, and assessments.
                </p>
              </div>
            </div>

            {modules.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <Layers size={24} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-600">Modules have not been added yet.</p>
              </div>
            ) : (
                <div className="space-y-3">
                {modules.map((module, index) => {
                  const lessonCount = module.lessons?.length || 0;
                  const materialCount = module.materials?.length || 0;
                  const isOpen = !!openModules[module.id];

                  return (
                    <div key={module.id} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                      <button
                        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
                        onClick={() => toggleModule(module.id)}
                      >
                        <div className="flex min-w-0 gap-4">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-sm font-black text-indigo-600">
                            {String(index + 1).padStart(2, '0')}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-bold tracking-tight text-slate-900">{module.title}</h3>
                              <Badge variant="secondary" size="sm" className="rounded-full border-slate-200 bg-slate-50 text-slate-600">
                                {lessonCount + materialCount + (module.quiz ? 1 : 0)} items
                              </Badge>
                            </div>
                            {module.description && (
                              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">{module.description}</p>
                            )}
                            <div className="mt-2.5 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                              <span className="rounded-full bg-slate-100 px-3 py-1">{lessonCount} lessons</span>
                              <span className="rounded-full bg-slate-100 px-3 py-1">{materialCount} resources</span>
                              <span className="rounded-full bg-slate-100 px-3 py-1">{module.quiz ? '1 module quiz' : 'No module quiz'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                          <div className="space-y-2.5">
                            {module.lessons?.map((lesson, lessonIndex) => (
                              <div key={lesson.id} className="flex items-start gap-4 rounded-2xl border border-white bg-white px-4 py-3.5 shadow-sm">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
                                  {isEnrolled ? <Play size={16} /> : <Lock size={15} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-slate-800">{lessonIndex + 1}. {lesson.title}</p>
                                    {lesson.lesson_type && (
                                      <Badge variant="secondary" size="sm" className="capitalize rounded-full border-indigo-100 bg-indigo-50 text-indigo-600">
                                        {lesson.lesson_type}
                                      </Badge>
                                    )}
                                  </div>
                                  {lesson.description && (
                                    <p className="mt-1 text-sm leading-5 text-slate-500">{lesson.description}</p>
                                  )}
                                </div>
                                {lesson.duration_min > 0 && (
                                  <div className="whitespace-nowrap text-xs font-semibold text-slate-400">{lesson.duration_min} min</div>
                                )}
                              </div>
                            ))}

                            {module.materials?.map((material) => (
                              <div key={material.id} className="flex items-start gap-4 rounded-2xl border border-white bg-white px-4 py-3.5 shadow-sm">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
                                  <FileText size={16} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-slate-800">{material.title}</p>
                                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Study material</p>
                                </div>
                              </div>
                            ))}

                            {module.quiz && (
                              <div className="flex items-start gap-4 rounded-2xl border border-violet-100 bg-violet-50/80 px-4 py-3.5">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-violet-500 shadow-sm">
                                  <FileQuestion size={16} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-slate-800">{module.quiz.title}</p>
                                    <Badge variant="secondary" size="sm" className="rounded-full border-violet-200 bg-white text-violet-600">
                                      Module quiz
                                    </Badge>
                                  </div>
                                  {module.quiz.description && (
                                    <p className="mt-1 text-sm leading-5 text-slate-500">{module.quiz.description}</p>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-1 text-xs font-semibold text-slate-500">
                                  {module.quiz.pass_score && <span className="flex items-center gap-1"><Award size={12} /> {module.quiz.pass_score}% pass</span>}
                                  {module.quiz.time_limit && <span className="flex items-center gap-1"><Clock size={12} /> {module.quiz.time_limit} min</span>}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {finalQuizzes.length > 0 && (
            <div className="rounded-[2rem] border border-indigo-100 bg-[linear-gradient(135deg,rgba(238,242,255,0.95),rgba(255,255,255,1))] p-5 sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-indigo-500 shadow-sm">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-indigo-500">Final Challenge</p>
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">Course assessments</h2>
                </div>
              </div>

              <div className="space-y-2.5">
                {finalQuizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center gap-4 rounded-2xl border border-white bg-white/90 px-4 py-3.5 shadow-sm">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
                      <FileQuestion size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">{quiz.title}</p>
                      {quiz.description && <p className="mt-1 text-sm text-slate-500">{quiz.description}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs font-semibold text-slate-500">
                      {quiz.pass_score && <span className="flex items-center gap-1"><Award size={12} /> {quiz.pass_score}% pass</span>}
                      {quiz.time_limit && <span className="flex items-center gap-1"><Clock size={12} /> {quiz.time_limit} min</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
