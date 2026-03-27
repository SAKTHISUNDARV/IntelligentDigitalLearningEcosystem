import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, Trophy, Lock, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { AssessmentGridSkeleton } from '../components/ui/LoadingState';
import { getCachedValue, setCachedValue } from '../utils/requestCache';

const ASSESSMENTS_CACHE_KEY = '/quizzes/available';

export default function Assessments() {
  const navigate = useNavigate();
  const cachedQuizzes = getCachedValue(ASSESSMENTS_CACHE_KEY);
  const [quizzes, setQuizzes] = useState(() => cachedQuizzes?.data || []);
  const [loading, setLoading] = useState(() => !cachedQuizzes);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedValue(ASSESSMENTS_CACHE_KEY);
    if (cached) {
      queueMicrotask(() => {
        if (cancelled) return;
        setQuizzes(Array.isArray(cached.data) ? cached.data : []);
        setLoading(false);
      });
    }

    api.get('/quizzes/available')
      .then((response) => {
        if (cancelled) return;
        const nextQuizzes = Array.isArray(response.data) ? response.data : [];
        setCachedValue(ASSESSMENTS_CACHE_KEY, nextQuizzes);
        setQuizzes(nextQuizzes);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'ready', label: 'Ready to Attend' },
    { id: 'locked', label: 'Need to Learn' },
  ];

  const filteredQuizzes = useMemo(() => {
    if (statusFilter === 'ready') return quizzes.filter((quiz) => quiz.unlocked);
    if (statusFilter === 'locked') return quizzes.filter((quiz) => !quiz.unlocked);
    return quizzes;
  }, [quizzes, statusFilter]);

  const startQuiz = (quiz) => {
    if (quiz.unlocked) {
      navigate(`/assessments/take/${quiz.id}`);
      return;
    }

    navigate(`/learn/${quiz.course_id}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 stagger-children">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.02)] anim-fade-up">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-xl">
              My <span className="text-blue-600">Assessments</span>
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              View all assessments and filter quizzes by attendance readiness.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {filterOptions.map((option) => {
              const active = statusFilter === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setStatusFilter(option.id)}
                  className={`rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-[0_10px_25px_rgba(79,70,229,0.28)]'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <AssessmentGridSkeleton />
      ) : quizzes.length === 0 ? (
        <Card className="py-24 text-center border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-6">
            <ClipboardList size={28} className="text-slate-300" />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">No assessments available</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2 mb-8 max-w-sm mx-auto">
            Enroll in courses with active quizzes to start your assessments.
          </p>
          <Button size="lg" onClick={() => navigate('/courses')}>Browse Courses</Button>
        </Card>
      ) : filteredQuizzes.length === 0 ? (
        <Card className="py-24 text-center border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-6">
            <ClipboardList size={28} className="text-slate-300" />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">No assessments in this filter</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-sm mx-auto">
            Switch to another filter to view available or upcoming assessments.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} hover className="flex flex-col gap-5 anim-fade-up">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={22} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-[var(--text-primary)] leading-snug">{quiz.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] font-medium mt-1 truncate uppercase tracking-tighter">
                    {quiz.course_title}
                  </p>
                  {quiz.module_title && (
                    <p className="text-xs text-slate-400 mt-1">
                      Module: {quiz.module_title}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1">
                  <Clock size={14} className="text-indigo-500" /> {quiz.time_limit} MIN
                </span>
                <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1">
                  <Trophy size={14} className="text-amber-500" /> {quiz.pass_score}% PASS
                </span>
              </div>

              <div className="mt-auto space-y-3">
                <div className={`rounded-2xl border px-4 py-4 text-sm ${
                  quiz.unlocked
                    ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700'
                    : 'border-indigo-100 bg-slate-50 text-slate-700'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl ${
                      quiz.unlocked ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      {quiz.unlocked ? <CheckCircle2 size={16} className="flex-shrink-0" /> : <Lock size={16} className="flex-shrink-0" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[var(--text-primary)]">
                        {quiz.unlocked ? 'Ready to attend' : 'Non-ready to attend'}
                      </p>
                      <p className={`mt-1 text-xs leading-5 ${
                        quiz.unlocked ? 'text-emerald-700' : 'text-slate-500'
                      }`}>
                        {quiz.unlocked ? 'You have completed the required progress and can start anytime.' : (quiz.unlock_message || 'Complete 80% of the module to attend this quiz')}
                      </p>

                      {!quiz.unlocked && (
                        <>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"
                              style={{ width: `${Math.min(100, Math.max(0, Number(quiz.progress_percent || 0)))}%` }}
                            />
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-slate-500">
                            <span>Progress {Math.round(Number(quiz.progress_percent || 0))}%</span>
                            <span>Required {Math.round(Number(quiz.required_percent || 80))}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  size="md"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => startQuiz(quiz)}
                >
                  {quiz.unlocked ? (quiz.has_attempts ? 'Retake Quiz' : 'Start Quiz') : 'Continue Learning'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}




