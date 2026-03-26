// pages/AssessmentHistory.jsx � Student quiz results dashboard
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History, CheckCircle, XCircle, Trophy, AlertCircle,
  Eye, ClipboardCheck, RotateCcw, ArrowUpDown
} from 'lucide-react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { SkeletonRow, SkeletonStat } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import notify from '../utils/notify';
import confirmAction from '../utils/confirm';

const PASS_THRESHOLD_DEFAULT = 60;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest attempts' },
  { value: 'highest', label: 'Highest score' },
  { value: 'lowest', label: 'Lowest score' },
];

const formatAttemptDate = (dateValue) => {
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

export default function AssessmentHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    api.get('/quizzes/history/me').then(r => setHistory(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const normalizedHistory = useMemo(() => {
    return history.map((item) => {
      const score = Number(item.score || 0);
      const passScore = Number(item.pass_score || PASS_THRESHOLD_DEFAULT);
      const isPassed = score >= passScore;
      return {
        ...item,
        score,
        passScore,
        isPassed,
      };
    });
  }, [history]);

  const sortedHistory = useMemo(() => {
    const rows = [...normalizedHistory];
    const getTime = (item) => new Date(item.taken_at || item.submitted_at || item.created_at || 0).getTime();

    if (sortBy === 'highest') {
      rows.sort((a, b) => (b.score - a.score) || (getTime(b) - getTime(a)));
      return rows;
    }
    if (sortBy === 'lowest') {
      rows.sort((a, b) => (a.score - b.score) || (getTime(b) - getTime(a)));
      return rows;
    }

    rows.sort((a, b) => getTime(b) - getTime(a));
    return rows;
  }, [normalizedHistory, sortBy]);

  const summary = useMemo(() => {
    const total = normalizedHistory.length;
    const passed = normalizedHistory.filter((h) => h.isPassed).length;
    const failed = total - passed;
    const avg = total
      ? normalizedHistory.reduce((sum, h) => sum + h.score, 0) / total
      : 0;
    const avgDisplay = Number.isInteger(avg) ? `${avg}%` : `${avg.toFixed(1)}%`;
    return { total, passed, failed, avgDisplay };
  }, [normalizedHistory]);

  const handleReviewAnswers = (attempt) => {
    navigate(`/assessment-result/${attempt.id}`);
  };

  const handleDeleteAttempt = async (id) => {
    const confirmed = await confirmAction({
      title: 'Delete attempt?',
      text: 'This assessment attempt will be permanently removed.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmButtonColor: '#dc2626',
    });

    if (!confirmed) return;

    try {
      await api.delete(`/quizzes/assessment/${id}`);
      setHistory(prev => prev.filter(attempt => attempt.id !== id));
      notify.success('Attempt deleted', 'Your assessment attempt has been deleted.');
    } catch (err) {
      console.error('[Delete Assessment]', err);
      notify.error('Delete failed', 'Failed to delete assessment attempt.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.02)] border border-slate-200 anim-fade-up">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-xl font-bold">
              Assessment<span className="text-[#2563EB] font-bold"> History</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Track your quiz performance over time</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {loading ? (
              <>
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
              </>
            ) : (
              <>
                <div className="px-5 py-4 rounded-xl bg-indigo-50/50 border border-indigo-100 min-w-[140px] transition-all hover:shadow-sm">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Attempts</p>
                  <p className="text-xl font-bold text-indigo-700 mt-1 leading-none">{summary.total}</p>
                </div>
                <div className="px-5 py-4 rounded-xl bg-emerald-50/50 border border-emerald-100 min-w-[140px] transition-all hover:shadow-sm">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Passed</p>
                  <p className="text-xl font-bold text-emerald-700 mt-1 leading-none">{summary.passed}</p>
                </div>
                <div className="px-5 py-4 rounded-xl bg-rose-50/50 border border-rose-100 min-w-[140px] transition-all hover:shadow-sm">
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Failed</p>
                  <p className="text-xl font-bold text-rose-700 mt-1 leading-none">{summary.failed}</p>
                </div>
                <div className="px-5 py-4 rounded-xl bg-amber-50/50 border border-amber-100 min-w-[140px] transition-all hover:shadow-sm">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Avg Score</p>
                  <p className="text-xl font-bold text-amber-700 mt-1 leading-none">{summary.avgDisplay}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Assessment Attempts</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Passing rule: score must be at least quiz pass mark (default {PASS_THRESHOLD_DEFAULT}%).</p>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
            <ArrowUpDown size={14} />
            Sort by
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table min-w-full">
            <thead>
              <tr>
                <th className="w-16">S.No</th>
                {['Quiz', 'Course', 'Score', 'Status', 'Date', 'Actions'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [1, 2, 3, 4].map(i => <tr key={i}><td colSpan={7}><SkeletonRow /></td></tr>)
                : sortedHistory.map((h, i) => (
                  <tr key={h.id} className="group">
                    <td className="text-xs font-bold text-slate-400">{i + 1}</td>
                    <td>
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[200px]">{h.quiz_title || 'Untitled Quiz'}</p>
                    </td>
                    <td><span className="text-sm text-[var(--text-secondary)] truncate max-w-[150px] block">{h.course_title || 'General Course'}</span></td>
                    <td>
                      <div className="min-w-[120px] py-1">
                        <div className="flex items-center justify-between mb-1.5 px-0.5">
                          <span className="text-[11px] font-bold text-slate-700">{Math.round(h.score)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                          <div
                            className={`h-full transition-all duration-700 ease-out ${h.isPassed ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(100, Math.max(0, h.score))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge 
                        variant={h.isPassed ? 'success' : 'danger'} 
                        size="sm" 
                        className={`font-bold ${h.isPassed ? 'text-emerald-700 border-emerald-200 bg-emerald-50' : 'text-rose-700 border-rose-200 bg-rose-50'}`}
                      >
                        {h.isPassed ? <CheckCircle size={10} /> : <XCircle size={10} />}
                        {h.isPassed ? 'Pass' : 'Fail'}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatAttemptDate(h.taken_at || h.submitted_at || h.created_at)}
                      </span>
                    </td>
                    <td>
                      <div className="flex min-w-[240px] items-center gap-2 flex-wrap">
                        <Button size="sm" variant="ghost" className="!text-slate-700 hover:!bg-slate-100" onClick={() => handleReviewAnswers(h)}>
                          <ClipboardCheck size={14} /> Review Answers
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="!text-red-600 hover:!bg-red-50 transition-opacity duration-200 md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto"
                          onClick={() => handleDeleteAttempt(h.id)}
                        >
                          <XCircle size={14} /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {summary.total === 0 && !loading && (
          <div className="text-center py-16 px-6">
            <History size={36} className="mx-auto text-[var(--text-muted)] mb-4" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">No quiz attempts yet</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1 mb-5">Complete assessments to see your results and trends here.</p>
            <Button size="sm" onClick={() => navigate('/assessments')}>
              Go to Assessments
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
