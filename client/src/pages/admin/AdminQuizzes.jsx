// pages/admin/AdminQuizzes.jsx -- AI quiz generator for LMS admin
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BrainCircuit,
  Sparkles,
  Plus,
  Trash2,
  GripVertical,
  Save,
  AlertTriangle,
  Pencil
} from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const QUIZ_GENERATOR_STORAGE_KEY = 'idle_admin_quiz_generator_state';

const QUIZ_TYPE_OPTIONS = [
  { value: 'module', label: 'Module Quiz' },
  { value: 'final', label: 'Final Quiz' }
];

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function createEmptyQuestion() {
  return {
    id: `q_${Math.random().toString(36).slice(2, 10)}`,
    question_text: '',
    options: OPTION_LABELS.map(label => ({ label, text: '' })),
    correct: 'A',
    explanation: ''
  };
}

function extractApiError(err, fallback) {
  const error = err?.response?.data?.error;
  const detail = err?.response?.data?.detail;

  if (error && detail) return `${error} ${detail}`;
  if (error) return error;
  if (detail) return detail;
  if (err?.message === 'Network Error') return 'Network error. Check whether the backend server is running.';
  return fallback;
}

export default function AdminQuizzes() {
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [existingQuizzes, setExistingQuizzes] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedLessons, setSelectedLessons] = useState([]);

  const [quizType, setQuizType] = useState('module');
  const [topics, setTopics] = useState('');
  const [description, setDescription] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [passScore, setPassScore] = useState('60');

  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiError, setAiError] = useState('');
  const [editingQuizId, setEditingQuizId] = useState(null);

  const dragIndexRef = useRef(null);

  const requiredCount = quizType === 'final' ? 60 : 15;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(QUIZ_GENERATOR_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);

      setSelectedCategory(saved.selectedCategory || '');
      setSelectedCourse(saved.selectedCourse || '');
      setSelectedModule(saved.selectedModule || '');
      setSelectedLessons(Array.isArray(saved.selectedLessons) ? saved.selectedLessons : []);
      setQuizType(saved.quizType || 'module');
      setTopics(saved.topics || '');
      setDescription(saved.description || '');
      setQuizTitle(saved.quizTitle || '');
      setPassScore(saved.passScore || '60');
      setGeneratedQuestions(Array.isArray(saved.generatedQuestions) ? saved.generatedQuestions : []);
      setAiError('');
    } catch {
      sessionStorage.removeItem(QUIZ_GENERATOR_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data || [])).catch(() => {});
    api.get('/courses/admin/all').then(r => setCourses(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const courseIdFromQuery = searchParams.get('courseId');
    if (!courseIdFromQuery || !courses.length) return;

    const course = courses.find(c => String(c.id) === String(courseIdFromQuery));
    if (!course) return;

    setSelectedCourse(String(course.id));
    setSelectedCategory(course.category_id ? String(course.category_id) : '');
  }, [courses, searchParams]);

  useEffect(() => {
    if (!selectedCourse) {
      setModules([]);
      setExistingQuizzes([]);
      return;
    }

    api.get('/modules', { params: { course_id: selectedCourse } })
      .then(r => setModules(Array.isArray(r.data) ? r.data : []))
      .catch(() => setModules([]));

    api.get('/quizzes', { params: { course_id: selectedCourse } })
      .then(r => setExistingQuizzes(Array.isArray(r.data) ? r.data : []))
      .catch(() => setExistingQuizzes([]));
  }, [selectedCourse]);

  useEffect(() => {
    if (!selectedModule) {
      setLessons([]);
      return;
    }

    api.get('/lessons', { params: { module_id: selectedModule } })
      .then(r => setLessons(Array.isArray(r.data) ? r.data : []))
      .catch(() => setLessons([]));
  }, [selectedModule]);

  useEffect(() => {
    const payload = {
      selectedCategory,
      selectedCourse,
      selectedModule,
      selectedLessons,
      quizType,
      topics,
      description,
      quizTitle,
      passScore,
      generatedQuestions
    };

    sessionStorage.setItem(QUIZ_GENERATOR_STORAGE_KEY, JSON.stringify(payload));
  }, [
    selectedCategory,
    selectedCourse,
    selectedModule,
    selectedLessons,
    quizType,
    topics,
    description,
    quizTitle,
    passScore,
    generatedQuestions
  ]);

  const filteredCourses = useMemo(() => {
    if (!selectedCategory) return courses;
    return courses.filter(c => String(c.category_id) === String(selectedCategory));
  }, [courses, selectedCategory]);

  const selectedCourseObj = useMemo(
    () => courses.find(c => String(c.id) === String(selectedCourse)),
    [courses, selectedCourse]
  );

  const selectedModuleObj = useMemo(
    () => modules.find(m => String(m.id) === String(selectedModule)),
    [modules, selectedModule]
  );

  const resetQuestions = () => {
    setEditingQuizId(null);
    setGeneratedQuestions([]);
    setQuizTitle('');
    setPassScore('60');
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setSelectedCourse('');
    setSelectedModule('');
    setModules([]);
    setLessons([]);
    setSelectedLessons([]);
    resetQuestions();
  };

  const handleCourseChange = async (value) => {
    setSelectedCourse(value);
    setSelectedModule('');
    setModules([]);
    setLessons([]);
    setSelectedLessons([]);
    resetQuestions();

    if (!value) return;

    try {
      const { data } = await api.get('/modules', { params: { course_id: value } });
      setModules(Array.isArray(data) ? data : []);
    } catch {
      setModules([]);
    }
  };

  const handleModuleChange = async (value) => {
    setSelectedModule(value);
    setSelectedLessons([]);
    setLessons([]);
    resetQuestions();

    if (!value) return;

    try {
      const { data } = await api.get('/lessons', { params: { module_id: value } });
      setLessons(Array.isArray(data) ? data : []);
    } catch {
      setLessons([]);
    }
  };

  const handleToggleLesson = (lessonId) => {
    setSelectedLessons(prev => (
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    ));
  };

  const canGenerate = () => {
    if (!selectedCategory || !selectedCourse) return false;
    if (quizType === 'module' && !selectedModule) return false;
    if (!topics.trim()) return false;
    if (!selectedLessons.length) return false;
    return true;
  };

  const normalizeOptions = (options) => {
    if (!Array.isArray(options)) return OPTION_LABELS.map(label => ({ label, text: '' }));
    if (options.length === 4 && typeof options[0] === 'object') {
      return OPTION_LABELS.map((label, idx) => {
        const opt = options[idx] || {};
        return { label, text: String(opt.text || '') };
      });
    }
    return OPTION_LABELS.map((label, idx) => ({ label, text: options[idx] || '' }));
  };

  const generateWithAI = async () => {
    if (!canGenerate()) {
      setAiError('Please complete all required fields before generating.');
      return;
    }

    setGenerating(true);
    setAiError('');
    setGeneratedQuestions([]);

    try {
      const lessonTitles = lessons
        .filter(l => selectedLessons.includes(l.id))
        .map(l => l.title);

      const payload = {
        category_name: categories.find(c => String(c.id) === String(selectedCategory))?.name || '',
        course_id: selectedCourse,
        course_name: selectedCourseObj?.title || '',
        topic_name: topics,
        number_of_questions: requiredCount,
        module_id: selectedModule || null,
        module_name: selectedModuleObj?.title || '',
        quiz_type: quizType,
        topics,
        lessons: lessonTitles,
        description
      };

      const { data } = await api.post('/quizzes/ai-generate', payload);
      const questions = Array.isArray(data?.questions) ? data.questions : [];

      const normalized = questions.map(q => ({
        id: `q_${Math.random().toString(36).slice(2, 10)}`,
        question_text: q.question_text || '',
        options: normalizeOptions(q.options),
        correct: String(q.correct || 'A').toUpperCase(),
        explanation: q.explanation || ''
      }));

      setGeneratedQuestions(normalized);
      if (!quizTitle) {
        const titleBase = quizType === 'final' ? 'Final Assessment' : 'Module Quiz';
        setQuizTitle(`${selectedCourseObj?.title || 'Course'} - ${titleBase}`);
      }
    } catch (err) {
      setAiError(extractApiError(err, 'AI generation failed.'));
    } finally {
      setGenerating(false);
    }
  };

  const addManualQuestion = () => {
    setGeneratedQuestions(prev => [...prev, createEmptyQuestion()]);
  };

  const editQuiz = async (quizId) => {
    try {
      setAiError('');
      const { data } = await api.get(`/quizzes/${quizId}`);
      setEditingQuizId(data.id);
      setQuizType(data.quiz_type || (data.module_id ? 'module' : 'final'));
      setSelectedModule(data.module_id ? String(data.module_id) : '');
      setQuizTitle(data.title || '');
      setDescription(data.description || '');
      setPassScore(String(data.pass_score || 60));
      setGeneratedQuestions(
        Array.isArray(data.questions)
          ? data.questions.map(q => ({
              id: q.id || `q_${Math.random().toString(36).slice(2, 10)}`,
              question_text: q.question_text || '',
              options: normalizeOptions(q.options),
              correct: String(q.correct || 'A').toUpperCase(),
              explanation: q.explanation || ''
            }))
          : []
      );
    } catch (err) {
      setAiError(extractApiError(err, 'Failed to load quiz for editing.'));
    }
  };

  const updateQuestion = (index, field, value) => {
    setGeneratedQuestions(prev => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
  };

  const updateOption = (qIndex, optIndex, value) => {
    setGeneratedQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const nextOptions = q.options.map((opt, j) => (j === optIndex ? { ...opt, text: value } : opt));
      return { ...q, options: nextOptions };
    }));
  };

  const deleteQuestion = (index) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (index) => () => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (index) => () => {
    const from = dragIndexRef.current;
    if (from === null || from === undefined || from === index) return;

    setGeneratedQuestions(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });

    dragIndexRef.current = null;
  };

  const canSave = generatedQuestions.length === requiredCount;

  const saveQuiz = async () => {
    if (!selectedCourse) return;
    if (!quizTitle.trim()) {
      setAiError('Quiz title is required before saving.');
      return;
    }
    if (!canSave) {
      setAiError(`You must have exactly ${requiredCount} questions before saving.`);
      return;
    }

    setSaving(true);
    setAiError('');

    try {
      const payload = {
        course_id: selectedCourse,
        module_id: quizType === 'module' ? selectedModule : null,
        quiz_type: quizType,
        title: quizTitle,
        description: description || null,
        pass_score: Number(passScore || 60),
        questions: generatedQuestions.map((q, index) => ({
          question_text: q.question_text,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation || null,
          sort_order: index + 1
        }))
      };

      if (editingQuizId) {
        await api.put(`/quizzes/${editingQuizId}`, payload);
      } else {
        await api.post('/quizzes', payload);
      }

      setGeneratedQuestions([]);
      setQuizTitle('');
      setTopics('');
      setDescription('');
      setPassScore('60');
      setSelectedLessons([]);
      setSelectedModule('');
      setEditingQuizId(null);
      api.get('/quizzes', { params: { course_id: selectedCourse } })
        .then(r => setExistingQuizzes(Array.isArray(r.data) ? r.data : []))
        .catch(() => {});
      sessionStorage.removeItem(QUIZ_GENERATOR_STORAGE_KEY);
    } catch (err) {
      setAiError(extractApiError(err, 'Failed to save quiz.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 anim-fade-up">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <h1 className="text-xl font-bold">
              <span className="text-slate-900">Manage</span>{' '}
              <span className="text-blue-600">Quizzes</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Generate, review, and save quizzes to modules or final assessments.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <Card className="border-slate-200/60 shadow-sm rounded-[16px]">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <BrainCircuit size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Quiz Inputs</h2>
              <p className="text-xs text-[var(--text-muted)]">Complete all required fields before generating.</p>
            </div>
          </div>

          <div className="space-y-4">
            {selectedCourse && existingQuizzes.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Existing Quizzes</p>
                  {editingQuizId && (
                    <span className="text-[11px] font-semibold text-indigo-600">Editing quiz #{editingQuizId}</span>
                  )}
                </div>
                {existingQuizzes.map((quiz) => (
                  <button
                    key={quiz.id}
                    type="button"
                    onClick={() => editQuiz(quiz.id)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">{quiz.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {quiz.quiz_type === 'final' ? 'Final Quiz' : 'Module Quiz'} • Pass {quiz.pass_score || 60}%
                        </p>
                      </div>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <Pencil size={14} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Category *</label>
              <select
                value={selectedCategory}
                onChange={e => handleCategoryChange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg text-sm bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Select category --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Course *</label>
              <select
                value={selectedCourse}
                onChange={e => handleCourseChange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg text-sm bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Select course --</option>
                {filteredCourses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Module / Lesson *</label>
              <select
                value={selectedModule}
                onChange={e => handleModuleChange(e.target.value)}
                disabled={!selectedCourse}
                className="w-full h-10 px-3 rounded-lg text-sm bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              >
                <option value="">-- Select module --</option>
                {modules.map(mod => (
                  <option key={mod.id} value={mod.id}>{mod.title}</option>
                ))}
              </select>
              {quizType === 'final' && (
                <p className="text-xs text-[var(--text-muted)] mt-1">Module selection is used for lesson context only; final quizzes save at course level.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Quiz Type *</label>
              <select
                value={quizType}
                onChange={e => {
                  setQuizType(e.target.value);
                  resetQuestions();
                }}
                className="w-full h-10 px-3 rounded-lg text-sm bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-indigo-500"
              >
                {QUIZ_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <Input
              label="Pass Percentage *"
              type="number"
              min={0}
              max={100}
              value={passScore}
              onChange={e => setPassScore(e.target.value)}
              placeholder="60"
            />

            <Input
              label="Topics *"
              value={topics}
              onChange={e => setTopics(e.target.value)}
              placeholder="e.g. Hooks, Context API, Performance"
            />

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Lessons * (multi-select)</label>
              <div className="max-h-44 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                {!lessons.length && (
                  <p className="text-xs text-[var(--text-muted)] px-3 py-2">Select a module to load lessons.</p>
                )}
                {lessons.map(lesson => (
                  <label key={lesson.id} className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      checked={selectedLessons.includes(lesson.id)}
                      onChange={() => handleToggleLesson(lesson.id)}
                    />
                    {lesson.title}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Description (optional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                placeholder="Extra instructions for the AI..."
              />
            </div>

            <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/60 p-3 text-xs text-indigo-700">
              Quiz will generate exactly <strong>{requiredCount}</strong> questions.
            </div>

            {aiError && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                <AlertTriangle size={14} className="mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}

            <Button onClick={generateWithAI} loading={generating} disabled={!canGenerate()} className="w-full">
              {generating ? 'Generating quiz...' : <><Sparkles size={15} /> Generate with AI</>}
            </Button>
          </div>
        </Card>

        <Card className="border-slate-200/60 shadow-sm rounded-[16px]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Review Questions</h2>
              <p className="text-xs text-[var(--text-muted)]">
                {editingQuizId ? 'Editing existing quiz. Drag to reorder and update as needed.' : 'Drag to reorder. Edit inline. Add or remove as needed.'}
              </p>
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text-primary)]">{generatedQuestions.length}</span> / {requiredCount} questions
            </div>
          </div>

          <div className="mb-4">
            <Input
              label="Quiz Title *"
              value={quizTitle}
              onChange={e => setQuizTitle(e.target.value)}
              placeholder="e.g. React Hooks - Module Quiz"
            />
          </div>

          {generatedQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-10 text-center">
              <p className="text-sm font-semibold text-[var(--text-primary)]">No questions yet</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Generate with AI or add questions manually.</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={addManualQuestion}>
                <Plus size={14} /> Add Question Manually
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {generatedQuestions.map((q, index) => (
                <div
                  key={q.id}
                  draggable
                  onDragStart={handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop(index)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold">
                      <GripVertical size={14} /> Q{index + 1}
                    </div>
                    <textarea
                      value={q.question_text}
                      onChange={e => updateQuestion(index, 'question_text', e.target.value)}
                      rows={2}
                      className="flex-1 resize-none bg-transparent border-none outline-none text-sm text-[var(--text-primary)]"
                      placeholder="Question text"
                    />
                    <button
                      onClick={() => deleteQuestion(index)}
                      className="text-rose-500 hover:text-rose-600"
                      title="Delete question"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {q.options.map((opt, optIndex) => (
                      <div key={opt.label} className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">{opt.label}</span>
                        <input
                          value={opt.text}
                          onChange={e => updateOption(index, optIndex, e.target.value)}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs"
                          placeholder={`Option ${opt.label}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                    <label className="flex items-center gap-2">
                      Correct Answer
                      <select
                        value={q.correct}
                        onChange={e => updateQuestion(index, 'correct', e.target.value)}
                        className="h-8 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 text-xs"
                      >
                        {OPTION_LABELS.map(label => (
                          <option key={label} value={label}>{label}</option>
                        ))}
                      </select>
                    </label>
                    <input
                      value={q.explanation}
                      onChange={e => updateQuestion(index, 'explanation', e.target.value)}
                      className="flex-1 min-w-[220px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs"
                      placeholder="Optional explanation"
                    />
                  </div>
                </div>
              ))}

              <Button variant="ghost" size="sm" onClick={addManualQuestion}>
                <Plus size={14} /> Add Another Question
              </Button>
            </div>
          )}

          <div className="mt-6 border-t border-slate-100 pt-4">
            {!canSave && (
              <p className="text-xs text-rose-600 mb-3">
                You need exactly {requiredCount} questions to save this quiz.
              </p>
            )}
            <Button onClick={saveQuiz} loading={saving} disabled={!canSave} className="w-full">
              <Save size={15} /> {editingQuizId ? 'Update Quiz' : 'Save Quiz'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
