// pages/TakeAssessment.jsx — Professional, Immersive Assessment Interface
import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import {
    Timer, ArrowLeft, ChevronRight, ChevronLeft, Send, AlertTriangle, Sparkles,
    Bookmark, Flag, Info, LayoutDashboard, HelpCircle, Eye, EyeOff, Trash2,
    Trophy, XCircle, CheckCircle
} from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { LearningWorkspaceSkeleton } from '../components/ui/LoadingState';

export default function TakeAssessment() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const storageKey = `idle_quiz_answers_${quizId}`;

    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [bookmarks, setBookmarks] = useState({});
    const [visited, setVisited] = useState(new Set([0]));
    const [timeLeft, setTimeLeft] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitStageText, setSubmitStageText] = useState('Submitting your test...');

    const timerRef = useRef(null);
    const answersRef = useRef({});
    const allowIntentionalNavigationRef = useRef(false);

    useEffect(() => {
        answersRef.current = answers;
        if (Object.keys(answers).length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(answers));
        }
    }, [answers, storageKey]);

    useEffect(() => {
        const loadQuiz = async () => {
            try {
                const [qResp, questionsResp] = await Promise.all([
                    api.get('/quizzes/available').then(r => r.data.find(q => q.id === parseInt(quizId))),
                    api.get(`/quizzes/${quizId}`)
                ]);

                if (!qResp) throw new Error('Quiz not found or not available.');

                setQuiz(qResp);
                setQuestions(questionsResp.data.questions || []);
                setTimeLeft((qResp.time_limit || 10) * 60);

                // Load saved answers
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    try {
                        setAnswers(JSON.parse(saved));
                    } catch (e) {
                        console.error('[TakeAssessment] Failed to parse saved answers');
                    }
                }
            } catch (err) {
                setError(err.message || 'Loading failed.');
            } finally {
                setLoading(false);
            }
        };
        loadQuiz();
    }, [quizId, storageKey]);

    useEffect(() => {
        if (!quiz || loading) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    submitQuiz(answersRef.current);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [quiz, loading]);

    // Track visited questions
    useEffect(() => {
        if (questions.length > 0) {
            setVisited(prev => new Set([...prev, currentIdx]));
        }
    }, [currentIdx, questions.length]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (quiz) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [quiz]);

    // Navigation blocker for path changes
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            quiz && !allowIntentionalNavigationRef.current && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (blocker.state === 'blocked') {
            setShowExitConfirm(true);
        }
    }, [blocker]);

    useEffect(() => {
        if (!showExitConfirm && blocker.state === 'blocked') {
            blocker.reset();
        }
    }, [showExitConfirm, blocker]);

    const submitQuiz = async (finalAnswers = answers) => {
        if (submitting) return;
        clearInterval(timerRef.current);
        setSubmitting(true);
        setSubmitError('');
        setSubmitStageText('Submitting your test...');
        try {
            allowIntentionalNavigationRef.current = true;
            const resp = await api.post(`/quizzes/${quizId}/submit`, {
                answers: finalAnswers,
                time_taken: (quiz.time_limit * 60) - timeLeft
            });
            // Redirect to result page
            if (resp.data?.assessment_id) {
                localStorage.removeItem(storageKey);
                setSubmitStageText('Preparing your result page...');
                navigate(`/assessment-result/${resp.data.assessment_id}`);
            } else {
                allowIntentionalNavigationRef.current = false;
                setSubmitError('Failed to save assessment. Please try again.');
            }
        } catch (e) {
            allowIntentionalNavigationRef.current = false;
            const message = e.response?.data?.error || e.message || 'Submission failed';
            console.error('[TakeAssessment] Submit failed:', {
                quizId,
                status: e.response?.status,
                data: e.response?.data,
                message
            });
            setSubmitError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleExit = () => {
        setShowExitConfirm(true);
    };

    const toggleBookmark = (idx) => {
        setBookmarks(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    const clearResponse = () => {
        if (!questions.length || !questions[currentIdx]) return;
        const qId = questions[currentIdx].id;
        const newAnswers = { ...answers };
        delete newAnswers[qId];
        setAnswers(newAnswers);
    };

    if (loading) return (
        <LearningWorkspaceSkeleton />
    );

    if (error) return (
        <div className="min-h-screen bg-[#f1f4f9] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500 mb-6 shadow-sm border border-rose-100">
                <AlertTriangle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">{error}</h2>
            <Button className="mt-8 px-8 h-12 rounded-xl" onClick={() => navigate('/assessments')}>Back to Dashboard</Button>
        </div>
    );

    const formatTime = (seconds) => {
        const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        return { h, m, s };
    };

    const t = formatTime(timeLeft);
    const urgent = timeLeft < 60 && timeLeft > 0;
    const currentQ = questions[currentIdx];
    const isLastQuestion = currentIdx >= questions.length - 1;

    // Stats
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).length;
    const bookmarkedCount = Object.values(bookmarks).filter(Boolean).length;
    const visitedCount = visited.size;
    const notVisitedCount = totalQuestions - visitedCount;
    const notAnsweredCount = visitedCount - answeredCount;

    return (
        <div className="min-h-screen bg-[#f1f4f9] flex flex-col font-sans select-none overflow-hidden anim-fade-in text-slate-800">
            {/* Professional Header matching the Image */}
            <header className="h-14 border-b border-slate-200 flex items-center justify-end px-6 bg-white sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowSubmitConfirm(true)}
                        disabled={submitting}
                        className="bg-[#1e293b] text-white text-xs font-bold px-6 py-2 rounded-lg hover:bg-slate-800 transition-all shadow-md shadow-slate-200 disabled:opacity-50"
                    >
                        End Test
                    </button>
                </div>
            </header>

            {/* Main Layout Area — 3 Columns */}
            <div className="flex-1 flex overflow-hidden">

                {/* 1. Left Sidebar: Question Navigator */}
                <aside className="w-72 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
                    {/* Assessment Info */}
                    {quiz && (
                        <div className="p-4 border-b border-slate-100 bg-indigo-50 space-y-3">
                            <h3 className="text-sm font-bold text-slate-900">{quiz.title}</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">{quiz.description || 'Assessment'}</p>
                        </div>
                    )}

                    {/* Question Navigator */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex flex-wrap gap-2">
                            {questions.map((_, idx) => {
                                const isAnswered = answers[questions[idx].id];
                                const isBookmarked = bookmarks[idx];
                                const isActive = currentIdx === idx;
                                const isVisited = visited.has(idx);

                                let bgColor = 'bg-white';
                                let borderCol = 'border-slate-200';
                                let textColor = 'text-slate-500';

                                if (isActive) {
                                    bgColor = 'bg-indigo-600';
                                    borderCol = 'border-indigo-600';
                                    textColor = 'text-white';
                                } else if (isAnswered) {
                                    bgColor = 'bg-green-500';
                                    borderCol = 'border-green-500';
                                    textColor = 'text-white';
                                } else if (isBookmarked) {
                                    bgColor = 'bg-purple-500';
                                    borderCol = 'border-purple-500';
                                    textColor = 'text-white';
                                } else if (isVisited) {
                                    bgColor = 'bg-orange-400';
                                    borderCol = 'border-orange-400';
                                    textColor = 'text-white';
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIdx(idx)}
                                        className={`w-9 h-9 rounded-lg text-[11px] font-bold border transition-all flex items-center justify-center
                                       ${bgColor} ${borderCol} ${textColor} hover:scale-105 active:scale-95`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Status Legend */}
                    <div className="p-6 space-y-3 mt-auto border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Answered</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-purple-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Bookmarked</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* 2. Center Column: Question Content */}
                <main className="flex-1 bg-white overflow-y-auto custom-scrollbar flex flex-col">
                    <div className="p-8 flex-1">
                        <div className="max-w-4xl mx-auto space-y-8">

                            {/* Question Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <span className="text-sm font-black text-slate-900">Q: {currentIdx + 1}</span>
                                <button className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-rose-500 transition-all flex items-center gap-1">
                                    Report
                                </button>
                            </div>

                            {submitError && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                                    {submitError}
                                </div>
                            )}

                            {/* Question Text */}
                            <div className="space-y-6">
                                <p className="text-lg font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {currentQ?.question_text}
                                </p>
                            </div>

                            {/* Options */}
                            <div className="space-y-3">
                                {(currentQ?.options || []).map((opt, i) => {
                                    const selected = answers[currentQ.id] === opt.label;
                                    const labelLetter = String.fromCharCode(97 + i); // a, b, c, d
                                    return (
                                        <button
                                            key={opt.label}
                                            onClick={() => {
                                                setSubmitError('');
                                                setAnswers(a => ({ ...a, [currentQ.id]: opt.label }));
                                            }}
                                            className={`w-full group flex items-start p-4 rounded-xl border transition-all duration-200 text-left
                                            ${selected
                                                    ? 'bg-white border-indigo-500 ring-4 ring-indigo-50 shadow-sm'
                                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'}`}
                                        >
                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold mr-4 transition-all
                                            ${selected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                                                {labelLetter})
                                            </span>
                                            <div className="flex-1 pt-1.5 flex justify-between items-center">
                                                <span className={`text-[15px] font-medium leading-relaxed ${selected ? 'text-slate-900' : 'text-slate-600'}`}>
                                                    {opt.label}: {opt.text}
                                                </span>
                                                {selected && <CheckCircle size={18} className="text-indigo-600 ml-2" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Question Actions */}
                            <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                                <button
                                    onClick={() => toggleBookmark(currentIdx)}
                                    className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all
                                    ${bookmarks[currentIdx] ? 'text-purple-600 bg-purple-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <Bookmark size={16} fill={bookmarks[currentIdx] ? "currentColor" : "none"} />
                                    Bookmark
                                </button>

                                <div className="flex gap-3">
                                    <button
                                        onClick={clearResponse}
                                        className="text-xs font-bold text-slate-400 hover:text-slate-700 px-6 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all"
                                    >
                                        Clear Response
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (isLastQuestion) {
                                                setShowSubmitConfirm(true);
                                                return;
                                            }
                                            const nextIdx = Math.min(questions.length - 1, currentIdx + 1);
                                            setCurrentIdx(nextIdx);
                                        }}
                                        className="bg-[#1e293b] text-white text-xs font-bold px-8 py-2 rounded-lg hover:bg-slate-800 transition-all shadow-md shadow-slate-200 flex items-center gap-2"
                                    >
                                        {isLastQuestion ? 'Submit Test' : 'Save and Next'} <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* 3. Right Sidebar: Timer & Summary */}
                <aside className="w-80 bg-white border-l border-slate-200 flex flex-col overflow-hidden">

                    {/* Timer Section */}
                    <div className="p-8 border-b border-slate-100 flex flex-col items-center">
                        <div className="flex items-center gap-4 text-4xl font-black text-slate-800 tabular-nums">
                            <div className="flex flex-col items-center">
                                <span>{t.h}</span>
                                <span className="text-[10px] font-bold text-slate-300 uppercase mt-1">Hrs</span>
                            </div>
                            <span className="text-slate-300 pb-4">:</span>
                            <div className="flex flex-col items-center">
                                <span className={urgent ? 'text-rose-500 animate-pulse' : ''}>{t.m}</span>
                                <span className="text-[10px] font-bold text-slate-300 uppercase mt-1">Min</span>
                            </div>
                            <span className="text-slate-300 pb-4">:</span>
                            <div className="flex flex-col items-center">
                                <span className={urgent ? 'text-rose-500 animate-pulse' : ''}>{t.s}</span>
                                <span className="text-[10px] font-bold text-slate-300 uppercase mt-1">Sec</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                        <h4 className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-6">Overview</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">Total Questions</span>
                                <span className="text-xs font-black text-slate-800">{totalQuestions}</span>
                            </div>
                            <div className="flex justify-between items-center text-green-500">
                                <span className="text-xs font-bold">Answered</span>
                                <span className="text-xs font-black">{answeredCount}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                                <span className="text-xs font-bold">Not Answered</span>
                                <span className="text-xs font-black">{notAnsweredCount}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                                <span className="text-xs font-bold">Bookmarked</span>
                                <span className="text-xs font-black">{bookmarkedCount}</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Exit Confirmation Dialog */}
            {showExitConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm anim-fade-in">
                    <Card padding={false} className="max-w-md w-full p-8 shadow-2xl border-0 rounded-2xl bg-white text-center relative overflow-hidden">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mx-auto mb-6">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">Abort Assessment?</h3>
                        <p className="text-sm text-slate-500 mt-3 leading-relaxed font-medium">
                            Terminating the session now will result in zero progress being recorded. Progress will NOT be saved.
                        </p>
                        <div className="flex flex-col gap-2 mt-8">
                            <button
                                onClick={() => {
                                    if (blocker.state === 'blocked') blocker.proceed();
                                    navigate('/assessments');
                                }}
                                className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-600 transition-all"
                            >
                                Yes, Abandon Now
                            </button>
                            <button
                                onClick={() => {
                                    if (blocker.state === 'blocked') blocker.reset();
                                    setShowExitConfirm(false);
                                }}
                                className="w-full py-3 bg-slate-50 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                            >
                                No, Continue Test
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            {showSubmitConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm anim-fade-in">
                    <Card padding={false} className="max-w-md w-full p-8 shadow-2xl border-0 rounded-2xl bg-white text-center relative overflow-hidden">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mx-auto mb-6">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">Confirm to Submit the Test</h3>
                        <p className="text-sm text-slate-500 mt-3 leading-relaxed font-medium">
                            Are you sure you want to end the test and submit your answers? You will not be able to change them after submission.
                        </p>
                        <div className="flex flex-col gap-2 mt-8">
                            <button
                                onClick={() => setShowSubmitConfirm(false)}
                                className="w-full py-3 bg-slate-50 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowSubmitConfirm(false);
                                    submitQuiz();
                                }}
                                disabled={submitting}
                                className="w-full py-3 bg-[#1e293b] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                            >
                                Submit
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            {submitting && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/45 backdrop-blur-sm anim-fade-in">
                    <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 shadow-2xl p-8 text-center">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                            <Skeleton className="h-8 w-8 rounded-xl" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800">{submitStageText}</h3>
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                            Please wait while we save your answers and load the assessment result.
                        </p>
                        <div className="mt-5 space-y-2">
                            <Skeleton className="h-3 w-full rounded-full" />
                            <Skeleton className="h-3 w-5/6 rounded-full mx-auto" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
