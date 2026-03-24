import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, PlayCircle, FileText, ClipboardList,
  BookOpen, Loader2, AlertCircle, ChevronLeft, ChevronRight,
  Lock, Bot, ChevronDown, ChevronUp, Sparkles,
  Github, Link, NotebookPen, FileDown, Check, Play
} from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { LearningWorkspaceSkeleton } from '../components/ui/LoadingState';

function embedUrl(url) {
  if (!url) return null;
  if (url.includes('/embed/')) return url;
  const short = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (short) return `https://www.youtube.com/embed/${short[1]}?rel=0&modestbranding=1`;
  const watch = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}?rel=0&modestbranding=1`;
  return null;
}

export default function Learning() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [finalQuizzes, setFinalQuizzes] = useState([]);
  const [progressData, setProgressData] = useState({ completed_lessons: [], passed_quizzes: [], progress: 0, course_completed: false });

  const [activeItem, setActiveItem] = useState(null); // { type: 'lesson'|'material'|'quiz'|'final_quiz', data: object, module: object }
  const [expandedModules, setExpandedModules] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [mobileCurriculumOpen, setMobileCurriculumOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [lastSavedNotes, setLastSavedNotes] = useState('');
  const [notesStatus, setNotesStatus] = useState(''); // 'saving', 'saved', ''

  // Flatten the curriculum for Previous/Next navigation
  const [curriculumQueue, setCurriculumQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const fetchCourseData = useCallback(async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/progress/course/${courseId}`)
      ]);
      const data = cRes.data;
      setCourse(data);
      setModules(data.modules || []);
      setFinalQuizzes(data.finalQuizzes || []);

      const prog = pRes.data;
      setProgressData(prog);

      // Expand the first module by default
      if (data.modules && data.modules.length > 0) {
        setExpandedModules({ [data.modules[0].id]: true });
      }

      // Build flatten queue for Prev/Next
      const queue = [];
      data.modules?.forEach(mod => {
        mod.lessons?.forEach(l => queue.push({ type: 'lesson', data: l, module: mod }));
        mod.materials?.filter(m => m.file_url).forEach(m => queue.push({ type: 'material', data: m, module: mod }));
        if (mod.quiz) queue.push({ type: 'quiz', data: mod.quiz, module: mod });
      });
      data.finalQuizzes?.forEach(fq => queue.push({ type: 'final_quiz', data: fq, module: null }));
      setCurriculumQueue(queue);

      // Set active item to the first uncompleted lesson or first item
      if (queue.length > 0 && !activeItem) {
        let firstUnfinished = queue.findIndex(q => q.type === 'lesson' && !prog.completed_lessons.includes(q.data.id));
        if (firstUnfinished === -1) firstUnfinished = 0; // If all finished, start at beginning
        setActiveItem(queue[firstUnfinished]);
        setCurrentIndex(firstUnfinished);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  }, [courseId, activeItem]);

  useEffect(() => {
    if (courseId) {
      setLoading(true);
      fetchCourseData();
    }
  }, [courseId]);

  const toggleModule = (modId) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleSelectItem = (item, index) => {
    setActiveItem(item);
    setCurrentIndex(index);
    if (item.module) {
      setExpandedModules(prev => ({ ...prev, [item.module.id]: true }));
    }
  };

  const markComplete = async () => {
    if (saving || !activeItem || activeItem.type !== 'lesson') return;
    const lessonId = activeItem.data.id;
    if (progressData.completed_lessons.includes(lessonId)) return; // already done

    setSaving(true);
    try {
      const res = await api.post(`/progress/lesson/${lessonId}`);
      setProgressData(prev => ({
        ...prev,
        completed_lessons: [...prev.completed_lessons, lessonId],
        progress: res.data.progress,
        course_completed: res.data.course_completed
      }));
      // Auto-advance
      if (currentIndex < curriculumQueue.length - 1) {
        setTimeout(() => handleSelectItem(curriculumQueue[currentIndex + 1], currentIndex + 1), 600);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // MED-008: Auto-save notes
  useEffect(() => {
    if (!activeItem || activeItem.type !== 'lesson' || notes === lastSavedNotes) return;
    
    const timer = setTimeout(async () => {
      setNotesStatus('saving');
      try {
        // Mock save for now as there's no specific endpoint mentioned, 
        // or we could use user/profile/me if it supports notes, 
        // but typically notes are per-lesson. 
        // Assuming we persist to localStorage or a hypothetical endpoint.
        localStorage.setItem(`lesson_notes_${activeItem.data.id}`, notes);
        setLastSavedNotes(notes);
        setNotesStatus('saved');
        setTimeout(() => setNotesStatus(''), 2000);
      } catch (e) {
        setNotesStatus('error');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [notes, activeItem, lastSavedNotes]);

  // Load notes when active item changes
  useEffect(() => {
    if (activeItem?.type === 'lesson') {
      const saved = localStorage.getItem(`lesson_notes_${activeItem.data.id}`) || '';
      setNotes(saved);
      setLastSavedNotes(saved);
    }
  }, [activeItem]);

  // Helper logic for Locks
  const isModuleQuizUnlocked = (mod) => {
    if (!mod.lessons || mod.lessons.length === 0) return true;
    return mod.lessons.every(l => progressData.completed_lessons.includes(l.id));
  };

  const isFinalQuizUnlocked = () => {
    // Requires ALL module lessons to be completed, and ALL module quizzes to be passed
    const allLessonsCompleted = modules.every(m => m.lessons.every(l => progressData.completed_lessons.includes(l.id)));
    const allModQuizzesPassed = modules.every(m => !m.quiz || progressData.passed_quizzes.includes(m.quiz.id));
    return allLessonsCompleted && allModQuizzesPassed;
  };

  if (loading) return (
    <LearningWorkspaceSkeleton />
  );

  if (error || !course) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 max-w-md mx-auto text-center px-6">
      <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 shadow-inner">
        <AlertCircle size={40} />
      </div>
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Oops! Something went wrong</h2>
        <p className="text-slate-500 mt-2 text-[15px] leading-relaxed">{error || 'We couldn\'t find the requested course content.'}</p>
      </div>
      <Button variant="secondary" onClick={() => navigate('/my-courses')} className="rounded-xl border-slate-200 font-bold px-6">
        <ArrowLeft size={16} className="mr-2" /> Back to My Courses
      </Button>
    </div>
  );

  const pct = Math.max(0, Math.min(100, progressData.progress));

  const renderSidebarItem = (item, index) => {
    const isActive = currentIndex === index;
    const type = item.type;
    const data = item.data;

    let isDone = false;
    let isLocked = false;
    let Icon = BookOpen;
    let label = '';

    if (type === 'lesson') {
      isDone = progressData.completed_lessons.includes(data.id);
      Icon = PlayCircle;
      label = 'Video';
    } else if (type === 'material') {
      Icon = FileText;
      label = 'PDF';
    } else if (type === 'quiz') {
      isDone = progressData.passed_quizzes.includes(data.id);
      isLocked = !isModuleQuizUnlocked(item.module);
      Icon = ClipboardList;
      label = 'Module Quiz';
    } else if (type === 'final_quiz') {
      isDone = progressData.passed_quizzes.includes(data.id);
      isLocked = !isFinalQuizUnlocked();
      Icon = Sparkles;
      label = 'Final Exam';
    }

    return (
      <button
        key={index}
        disabled={isLocked}
        onClick={() => {
          handleSelectItem(item, index);
          setMobileCurriculumOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all relative group rounded-lg
          ${isActive ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-white border border-transparent'}
          ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-all
          ${isDone ? 'bg-emerald-100 text-emerald-600' : isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-400 group-hover:text-indigo-500'}`}>
          {isLocked ? <Lock size={14} /> : isDone ? <CheckCircle size={16} strokeWidth={3} /> : <Icon size={14} />}
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-[13px] font-semibold leading-tight truncate
            ${isActive ? 'text-indigo-900' : isDone ? 'text-slate-600' : 'text-slate-700'}`}>
            {data.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${isActive ? 'text-indigo-400' : 'text-slate-300'}`}>
              {label}
            </span>
            {type === 'lesson' && data.duration_min > 0 && <span className="w-1 h-1 rounded-full bg-slate-200" />}
            {type === 'lesson' && data.duration_min > 0 && <span className="text-[10px] font-semibold text-slate-300">{data.duration_min}m</span>}
          </div>
        </div>

        {isDone && <Check size={16} className="text-emerald-500" />}
      </button>
    );
  };

  const LearningLayout = ({ left, center, right }) => (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-[#F9FAFB]">
      {left}
      {center}
      {right}
    </div>
  );
  const CurriculumSidebar = ({ isMobile = false }) => (
    <div className={`${isMobile ? '' : 'hidden lg:flex'} w-80 flex-shrink-0 border-r border-[#E5E7EB] bg-white flex flex-col`}>
      <div className="px-4 py-3 border-b border-[#E5E7EB]">
        <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em]">Course Curriculum</h3>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-2">
        {modules.length === 0 && finalQuizzes.length === 0 ? (
          <div className="p-8 text-center">
            <BookOpen size={22} className="text-slate-300 mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-400">Empty Curriculum</p>
          </div>
        ) : null}

        {modules.map((mod, moduleIndex) => {
          const isExpanded = expandedModules[mod.id];
          const modItems = curriculumQueue.map((item, id) => ({ item, index: id })).filter(m => m.item.module?.id === mod.id);

          return (
            <div key={mod.id} className="border border-[#E5E7EB] rounded-lg overflow-hidden bg-white">
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors"
                onClick={() => toggleModule(mod.id)}
              >
                <div className="text-left flex-1 pr-4">
                  <h4 className="text-[13px] font-semibold text-slate-800 leading-snug">{`Module ${moduleIndex + 1}: ${mod.title}`}</h4>
                  <p className="text-[11px] text-slate-400">{modItems.length} lessons & items</p>
                </div>
                <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>
              <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                <div className="bg-[#F9FAFB] p-2 space-y-1.5">
                  {modItems.map((wrapped) => renderSidebarItem(wrapped.item, wrapped.index))}
                </div>
              </div>
            </div>
          );
        })}

        {finalQuizzes.length > 0 && (
          <div className="border border-indigo-100 rounded-lg overflow-hidden bg-indigo-50/40">
            <div className="px-4 py-2">
              <h4 className="text-[11px] font-semibold text-indigo-400 uppercase tracking-[0.1em]">Course Requirements</h4>
            </div>
            <div className="px-3 pb-3 space-y-1.5">
              {curriculumQueue
                .map((item, id) => ({ item, index: id }))
                .filter(m => m.item.type === 'final_quiz')
                .map((wrapped) => renderSidebarItem(wrapped.item, wrapped.index))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const LessonNavigation = () => (
    <div className="flex items-center gap-3 pt-4 mt-4 border-t border-[#E5E7EB]">
      <Button
        variant="secondary"
        disabled={currentIndex <= 0}
        onClick={() => handleSelectItem(curriculumQueue[currentIndex - 1], currentIndex - 1)}
        className="rounded-lg h-10 px-4 border-[#E5E7EB] bg-white"
      >
        <ChevronLeft size={18} className="mr-2" /> Previous
      </Button>

      {activeItem?.type === 'lesson' && (
        <Button
          className="flex-1 h-10 rounded-lg shadow-sm font-semibold text-sm"
          onClick={markComplete}
          disabled={saving || progressData.completed_lessons.includes(activeItem.data.id)}
          variant={progressData.completed_lessons.includes(activeItem.data.id) ? 'secondary' : 'primary'}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> :
            progressData.completed_lessons.includes(activeItem.data.id)
              ? <><CheckCircle size={18} className="mr-2" /> Completed</>
              : <><CheckCircle size={18} className="mr-2 text-indigo-200" /> Mark as Complete</>}
        </Button>
      )}

      <Button
        variant="secondary"
        disabled={currentIndex >= curriculumQueue.length - 1}
        onClick={() => handleSelectItem(curriculumQueue[currentIndex + 1], currentIndex + 1)}
        className="rounded-lg h-10 px-4 border-[#E5E7EB] bg-white ml-auto"
      >
        Next <ChevronRight size={18} className="ml-2" />
      </Button>
    </div>
  );

  const LessonViewer = () => {
    if (!activeItem) return null;
    const isQuizItem = activeItem.type === 'quiz' || activeItem.type === 'final_quiz';
    const quizLocked =
      (activeItem.type === 'quiz' && !isModuleQuizUnlocked(activeItem.module)) ||
      (activeItem.type === 'final_quiz' && !isFinalQuizUnlocked());

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em]">
            {isQuizItem ? 'Assessment' : 'Lesson'}
          </p>
          <h2 className="text-[20px] font-semibold text-slate-800 mt-0.5 leading-snug">{activeItem.data.title}</h2>
          <div className="mt-0.5 text-[12px] text-slate-500">
            <span className="font-semibold text-slate-700">{course.title}</span>
            {activeItem.module && <span className="mx-2 text-slate-300">•</span>}
            {activeItem.module && <span>Module: {activeItem.module.title}</span>}
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
          {activeItem.type === 'lesson' ? (
            <div className="aspect-video w-full bg-black">
              {embedUrl(activeItem.data.content_url) ? (
                <iframe
                  key={activeItem.data.id}
                  src={embedUrl(activeItem.data.content_url) || ''}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                  title={activeItem.data.title}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3 border border-slate-800">
                  <PlayCircle size={48} className="opacity-20" />
                  <p className="text-sm font-medium">Video format not supported for direct preview</p>
                  <a 
                    href={activeItem.data.content_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 transition-colors"
                  >
                    Open Content in New Tab
                  </a>
                </div>
              )}
            </div>          ) : activeItem.type === 'material' ? (
            <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em]">PDF Material</p>
                    <p className="text-sm font-semibold text-slate-800">{activeItem.data.title}</p>
                  </div>
                </div>
                <a
                  href={activeItem.data.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#6366F1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-600"
                >
                  Open PDF
                </a>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs text-slate-500">This lesson includes a PDF study guide. Open it in a new tab to read and download.</p>
              </div>
            </div>
          ) : (
            <div className="min-h-[24rem] flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.32),_transparent_45%),linear-gradient(135deg,#312E81_0%,#4338CA_55%,#4F46E5_100%)] text-indigo-100 gap-4 p-10 text-center relative overflow-hidden">
              <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                <ClipboardList size={34} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white mb-2">{activeItem.data.title}</h3>
                <p className="text-indigo-200/80">{activeItem.data.description}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {activeItem.data.time_limit ? (
                  <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-100">
                    {activeItem.data.time_limit} min
                  </div>
                ) : null}
                {activeItem.data.pass_score ? (
                  <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-100">
                    Pass score {activeItem.data.pass_score}%
                  </div>
                ) : null}
                <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-100">
                  {activeItem.type === 'final_quiz' ? 'Final assessment' : 'Module quiz'}
                </div>
              </div>
              {quizLocked ? (
                <div className="flex items-center gap-2 text-amber-100 font-semibold bg-amber-400/10 py-3 px-4 rounded-xl border border-amber-300/25">
                  <Lock size={16} /> Locked until prerequisites are met
                </div>
              ) : (
                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-indigo-700 shadow-[0_12px_30px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-indigo-50"
                  onClick={() => navigate(`/assessments/take/${activeItem.data.id}`)}
                >
                  Start Quiz
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          )}
        </div>

        {activeItem.type === 'lesson' && (
          <div className="rounded-xl border border-[#E5E7EB] bg-white px-6 py-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <NotebookPen size={18} className="text-indigo-500" />
                Lesson Notes
              </h3>
              {notesStatus && (
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  notesStatus === 'saving' ? 'text-amber-500 animate-pulse' : 
                  notesStatus === 'saved' ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {notesStatus === 'saving' ? 'Saving...' : 
                  notesStatus === 'saved' ? 'Saved' : 'Error'}
                </span>
              )}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write down important points from this lesson..."
              className="w-full h-32 p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
            />
          </div>
        )}

        <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-sm">
          <LessonNavigation />
        </div>
      </div>
    );
  };
  return (
    <div className="flex flex-col overflow-hidden bg-white">
      {/* —— Top Nav —— */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md px-6 h-16">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('/my-courses')} className="text-slate-400 hover:text-indigo-600">
            <ArrowLeft size={18} />
          </Button>
          <div className="h-6 w-px bg-slate-100" />
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.18em] leading-none">Learning Path</span>
            <h1 className="text-[16px] font-semibold text-slate-800 truncate leading-tight mt-1">{course.title}</h1>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <div className="flex flex-col items-end justify-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.18em] leading-none">Overall Progress</span>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-36 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-400 shadow-[0_0_8px_rgba(99,102,241,0.3)] transition-all duration-1000" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[12px] font-semibold text-slate-700">{pct}%</span>
            </div>
          </div>
        </div>
      </div>

      <LearningLayout
        left={<CurriculumSidebar />}
        center={
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="px-6 lg:px-10 pt-6 pb-10">
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <Button
                  variant="secondary"
                  className="rounded-lg h-10 border-[#E5E7EB] bg-white"
                  onClick={() => setMobileCurriculumOpen(true)}
                >
                  <BookOpen size={16} className="mr-2" /> Curriculum
                </Button>
              </div>
              <LessonViewer />
            </div>
          </div>
        }
        right={null}
      />

      {mobileCurriculumOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileCurriculumOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-white shadow-xl">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Curriculum</h3>
              <Button variant="ghost" size="sm" onClick={() => setMobileCurriculumOpen(false)}>
                <ChevronLeft size={18} />
              </Button>
            </div>
            <CurriculumSidebar isMobile />
          </div>
        </div>
      )}
    </div>
  );
}
