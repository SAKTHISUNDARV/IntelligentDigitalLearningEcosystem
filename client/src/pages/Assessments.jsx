import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, Trophy } from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function Assessments() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/quizzes/available').then(r => setQuizzes(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const startQuiz = (q) => {
    navigate(`/assessments/take/${q.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 stagger-children">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Assessments</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Test your knowledge and earn certifications.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><span className="spinner w-8 h-8 text-indigo-500" /></div>
      ) : quizzes.length === 0 ? (
        <Card className="py-24 text-center border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-6">
            <ClipboardList size={28} className="text-slate-300" />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">No assessments available</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2 mb-8 max-w-sm mx-auto">
            Enroll in courses with active quizzes to start your assessments.
          </p>
          <Button size="lg" onClick={() => window.location.href = '/courses'}>Browse Courses</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map(q => (
            <Card key={q.id} hover className="flex flex-col gap-5 anim-fade-up">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={22} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-[var(--text-primary)] leading-snug">{q.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] font-medium mt-1 truncate uppercase tracking-tighter">
                    {q.course_title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg">
                  <Clock size={14} className="text-indigo-500" /> {q.time_limit} MIN
                </span>
                <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg">
                  <Trophy size={14} className="text-amber-500" /> {q.pass_score}% PASS
                </span>
              </div>

              <Button size="md" className="w-full mt-auto" onClick={() => startQuiz(q)}>
                Start Assessment
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
