import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Trophy, CheckCircle, XCircle, Clock, AlertTriangle, Info, ArrowLeft
} from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import { AssessmentResultSkeleton } from '../components/ui/LoadingState';

const formatDuration = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
};

function CircularProgress({ percentage, size = 110, strokeWidth = 8, color = '#2563EB' }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#F1F5F9"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    style={{
                        strokeDashoffset: circumference,
                        animation: 'progress-anim 1.5s ease-out forwards 0.2s',
                    }}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-900 leading-none">{Math.round(percentage)}%</span>
            </div>
            <style jsx>{`
                @keyframes progress-anim {
                    from { stroke-dashoffset: ${circumference}; }
                    to { stroke-dashoffset: ${offset}; }
                }
            `}</style>
        </div>
    );
}

const formatAttemptDateTime = (dateValue) => {
    if (!dateValue) return '-';
    return new Date(dateValue).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
    });
};

export default function AssessmentResultPage() {
    const { attemptId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [resultData, setResultData] = useState(null);

    useEffect(() => {
        const loadResult = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data } = await api.get(`/quizzes/assessment/${attemptId}/review`);
                setResultData(data);
            } catch (err) {
                console.error('[AssessmentResultPage] Load error:', err);
                setError(err.response?.data?.error || 'Failed to load assessment result');
            } finally {
                setLoading(false);
            }
        };

        if (attemptId) {
            loadResult();
        }
    }, [attemptId]);

    if (loading) {
        return <AssessmentResultSkeleton />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#f1f4f9] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500 mb-6 shadow-sm border border-rose-100">
                    <AlertTriangle size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">{error}</h2>
                <Button className="mt-8 px-8 h-12 rounded-xl" onClick={() => navigate('/assessments')}>Back to Dashboard</Button>
            </div>
        );
    }

    if (!resultData) {
        return (
            <div className="min-h-screen bg-[#f1f4f9] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-6 shadow-sm border border-slate-200">
                    <AlertTriangle size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">No Result Found</h2>
                <Button className="mt-8 px-8 h-12 rounded-xl" onClick={() => navigate('/assessments')}>Back to Dashboard</Button>
            </div>
        );
    }

    const { attempt, summary, feedback } = resultData;
    const isPassed = attempt?.passed || summary?.passed;

    return (
        <div className="min-h-screen anim-fade-in custom-scrollbar">
            <main className="max-w-[1200px] mx-auto w-full p-4  space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 anim-fade-up">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
                        <div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate('/assessment-history')}
                                    className="h-10 w-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 transition-all hover:border-indigo-200 hover:text-indigo-600"
                                    aria-label="Back to assessment history"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <h1 className="text-xl font-bold">
                                    <span className="text-slate-900">Assessment</span>{' '}
                                    <span className="text-blue-600">Results</span>
                                </h1>
                            </div>
                            <p className="text-sm text-slate-500 mt-2">{attempt?.quiz_title}</p>
                            <p className="text-xs text-slate-500 mt-2">
                                Attempted on {formatAttemptDateTime(attempt?.taken_at)}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                                {attempt?.course_title ? `${attempt.course_title} • ` : ''}
                                {isPassed ? (
                                    <span className="text-emerald-600 font-semibold">Passed</span>
                                ) : (
                                    <span className="text-rose-600 font-semibold">Failed</span>
                                )}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="px-5 py-3 rounded-xl bg-white border border-slate-200 flex items-center gap-4">
                                <CircularProgress 
                                    percentage={attempt?.score || 0} 
                                    color={isPassed ? '#10b981' : '#f43f5e'}
                                />
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Final Result</p>
                                    <p className={`text-xl font-bold mt-0.5 leading-none ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {isPassed ? 'Passed' : 'Failed'}
                                    </p>
                                </div>
                            </div>
                            <div className="px-5 py-4 rounded-xl bg-emerald-50/50 border border-emerald-100 min-w-[120px]">
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Correct</p>
                                <p className="text-2xl font-bold text-emerald-700 mt-1 leading-none">{summary?.correct || 0}</p>
                            </div>
                            <div className="px-5 py-4 rounded-xl bg-indigo-50/50 border border-indigo-100 min-w-[120px]">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total</p>
                                <p className="text-2xl font-bold text-indigo-700 mt-1 leading-none">{summary?.total || 0}</p>
                            </div>
                            {attempt?.time_taken !== undefined && (
                                <div className="px-5 py-4 rounded-xl bg-amber-50/50 border border-amber-100 min-w-[120px]">
                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Time Taken</p>
                                    <p className="text-2xl font-bold text-amber-700 mt-1 leading-none">{formatDuration(attempt.time_taken)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-8 space-y-8">
                        <div className="flex items-center justify-between px-4">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Answer Review</h3>
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                    <div className="w-2 h-2 rounded-full bg-teal-500" /> Correct
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                    <div className="w-2 h-2 rounded-full bg-rose-500" /> Wrong
                                </span>
                            </div>
                        </div>

                        {feedback && Array.isArray(feedback) && feedback.map((f, i) => {
                            const chosenLabel = String(f.chosen || '').toUpperCase();
                            const correctLabel = String(f.correct || '').toUpperCase();

                            return (
                                <div key={i} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md">
                                    <div className="p-6 md:p-8 space-y-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`mt-1 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                                                f.is_correct ? 'bg-teal-50 text-teal-600 border border-teal-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                            }`}>
                                                {f.index || i + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-lg font-bold text-slate-800 leading-relaxed mb-4">
                                                    {f.question_text}
                                                </p>
                                            </div>
                                        </div>
                                        {f.is_correct ? (
                                            <CheckCircle className="text-teal-500 flex-shrink-0" size={24} />
                                        ) : (
                                            <XCircle className="text-rose-500 flex-shrink-0" size={24} />
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                                        {(f.options || []).map((opt, optIdx) => {
                                            const label = String(opt.label || String.fromCharCode(97 + optIdx)).toUpperCase();
                                            const isCorrect = label === correctLabel;
                                            const isChosen = label === chosenLabel;

                                            let stateClass = 'border-slate-100 bg-slate-50 text-slate-500';
                                            if (isCorrect) stateClass = 'border-teal-200 bg-teal-50 text-teal-700 font-bold ring-2 ring-teal-100';
                                            if (isChosen && !f.is_correct) stateClass = 'border-rose-200 bg-rose-50 text-rose-700 font-bold ring-2 ring-rose-100';

                                            return (
                                                <div key={optIdx} className={`p-4 rounded-2xl border flex items-center gap-3 transition-colors ${stateClass}`}>
                                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                                        isCorrect ? 'bg-teal-500 text-white' : isChosen ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500'
                                                    }`}>
                                                        {label}
                                                    </span>
                                                    <span className="text-sm">
                                                        {opt.text || opt}
                                                    </span>
                                                    {isCorrect && <CheckCircle size={14} className="ml-auto" />}
                                                    {isChosen && !f.is_correct && <XCircle size={14} className="ml-auto" />}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {!f.is_correct && (
                                        <div className="ml-12 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                                            <Info size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-amber-800 leading-relaxed">
                                                Your response was <span className="font-bold">({chosenLabel || 'Skipped'})</span>. The correct answer is <span className="font-bold text-teal-700">({correctLabel})</span>.
                                            </p>
                                        </div>
                                    )}

                                    <div className="ml-12 p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                                        <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-blue-800 leading-relaxed">
                                            <span className="font-bold">Explanation:</span>{' '}
                                            {String(f.explanation || '').trim() || 'No explanation available for this question.'}
                                        </p>
                                    </div>
                                </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
