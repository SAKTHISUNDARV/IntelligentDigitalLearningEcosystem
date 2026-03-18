// routes/quizzes.js — Quiz CRUD + AI generation via OpenRouter + student submit
const express = require('express');
const fs = require('fs');
const path = require('path');
const LOG_FILE = path.join(__dirname, '../server_debug.log');
function logToFile(msg) {
  const ts = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${ts}] ${msg}\n`);
}
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createChatCompletion } = require('../utils/openrouter');

function resolveQuizType(quizType, moduleId) {
    const normalized = String(quizType || '').toLowerCase();
    if (normalized === 'final') return 'final';
    if (normalized === 'module') return 'module';
    return moduleId ? 'module' : 'final';
}

function requiredQuestionCount(quizType) {
    return quizType === 'final' ? 60 : 15;
}

function normalizeOptions(options) {
    if (!Array.isArray(options)) return [];
    if (options.length === 4 && typeof options[0] === 'object') {
        return options.map((opt, idx) => ({
            label: String(opt.label || ['A', 'B', 'C', 'D'][idx]).toUpperCase(),
            text: String(opt.text || '')
        }));
    }
    return options.slice(0, 4).map((text, idx) => ({
        label: ['A', 'B', 'C', 'D'][idx],
        text: String(text || '')
    }));
}

// ── GET /api/quizzes?course_id=X ──────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
    const course_id = parseInt(req.query.course_id, 10);
    if (isNaN(course_id)) return res.status(400).json({ error: 'Valid course_id required' });
    try {
        const [rows] = await pool.query('SELECT id, module_id, quiz_type, title, description, time_limit, pass_score FROM quizzes WHERE course_id = $1 ORDER BY id DESC',
            [course_id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[GET /quizzes]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── GET /api/quizzes/available — quizzes for student's enrolled courses ─
// MUST be defined BEFORE /:id to avoid Express matching "available" as an id
router.get('/available', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT q.id, q.module_id, q.title, q.description, q.time_limit, q.pass_score,
                    c.title AS course_title, c.id AS course_id
             FROM quizzes q
             JOIN courses c ON c.id = q.course_id
             JOIN enrollments e ON e.course_id = q.course_id
             WHERE e.student_id = $1
             ORDER BY e.enrolled_at DESC, q.id ASC`,
            [parseInt(req.user.sub, 10)]
        );
        res.json(rows);
    } catch (err) {
        console.error('[GET /quizzes/available]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── GET /api/quizzes/:id — quiz with questions ─────────────────
router.get('/:id', authenticateToken, async (req, res) => {
    const quizId = parseInt(req.params.id, 10);
    if (isNaN(quizId)) return res.status(400).json({ error: 'Invalid quiz ID' });
    try {
        const [quiz] = await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
        if (!quiz.length) return res.status(404).json({ error: 'Quiz not found' });

        const [questions] = await pool.query('SELECT id, question_text, options, correct, explanation, sort_order FROM quiz_questions WHERE quiz_id = $1 ORDER BY sort_order',
            [quizId]
        );
        res.json({ ...quiz[0], questions });
    } catch (err) {
        console.error('[GET /quizzes/:id]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/quizzes — create quiz (admin only) ───────────────
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    const { course_id, module_id, quiz_type, title, description, time_limit, pass_score, questions } = req.body;
    if (!course_id || !title) return res.status(400).json({ error: 'course_id and title required' });

    const resolvedQuizType = resolveQuizType(quiz_type, module_id);
    const requiredCount = requiredQuestionCount(resolvedQuizType);

    if (resolvedQuizType === 'module' && !module_id) {
        return res.status(400).json({ error: 'module_id is required for module quizzes' });
    }

    if (resolvedQuizType === 'final' && module_id) {
        return res.status(400).json({ error: 'module_id must be empty for final quizzes' });
    }

    if (!Array.isArray(questions) || questions.length !== requiredCount) {
        return res.status(400).json({ error: `Quiz must contain exactly ${requiredCount} questions` });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const [result] = await client.query(
            'INSERT INTO quizzes (course_id, module_id, quiz_type, title, description, time_limit, pass_score) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [course_id, module_id || null, resolvedQuizType, title, description || null, time_limit || 10, pass_score || 60]
        );
        const quizId = result[0]?.id;

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const options = normalizeOptions(q.options);
            const correct = String(q.correct || '').toUpperCase();

            if (!q.question_text || options.length !== 4 || !['A', 'B', 'C', 'D'].includes(correct)) {
                throw new Error('Invalid question payload');
            }

            await client.query(
                `INSERT INTO quiz_questions
                 (quiz_id, course_id, module_id, quiz_type, question_text, options,
                  option_a, option_b, option_c, option_d, correct, correct_answer, explanation, sort_order)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                [
                    quizId,
                    course_id,
                    module_id || null,
                    resolvedQuizType,
                    q.question_text,
                    JSON.stringify(options),
                    options[0]?.text || '',
                    options[1]?.text || '',
                    options[2]?.text || '',
                    options[3]?.text || '',
                    correct,
                    correct,
                    q.explanation || null,
                    i + 1
                ]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ id: quizId, title, question_count: questions?.length || 0 });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[POST /quizzes]', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    const quizId = parseInt(req.params.id, 10);
    const { course_id, module_id, quiz_type, title, description, time_limit, pass_score, questions } = req.body;

    if (isNaN(quizId)) return res.status(400).json({ error: 'Invalid quiz ID' });
    if (!course_id || !title) return res.status(400).json({ error: 'course_id and title required' });

    const resolvedQuizType = resolveQuizType(quiz_type, module_id);
    const requiredCount = requiredQuestionCount(resolvedQuizType);

    if (resolvedQuizType === 'module' && !module_id) {
        return res.status(400).json({ error: 'module_id is required for module quizzes' });
    }

    if (resolvedQuizType === 'final' && module_id) {
        return res.status(400).json({ error: 'module_id must be empty for final quizzes' });
    }

    if (!Array.isArray(questions) || questions.length !== requiredCount) {
        return res.status(400).json({ error: `Quiz must contain exactly ${requiredCount} questions` });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const [existing] = await client.query('SELECT id FROM quizzes WHERE id = $1', [quizId]);
        if (!existing.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Quiz not found' });
        }

        await client.query(
            'UPDATE quizzes SET course_id = $1, module_id = $2, quiz_type = $3, title = $4, description = $5, time_limit = $6, pass_score = $7 WHERE id = $8',
            [course_id, module_id || null, resolvedQuizType, title, description || null, time_limit || 10, pass_score || 60, quizId]
        );

        await client.query('DELETE FROM quiz_questions WHERE quiz_id = $1', [quizId]);

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const options = normalizeOptions(q.options);
            const correct = String(q.correct || '').toUpperCase();

            if (!q.question_text || options.length !== 4 || !['A', 'B', 'C', 'D'].includes(correct)) {
                throw new Error('Invalid question payload');
            }

            await client.query(
                `INSERT INTO quiz_questions
                 (quiz_id, course_id, module_id, quiz_type, question_text, options,
                  option_a, option_b, option_c, option_d, correct, correct_answer, explanation, sort_order)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                [
                    quizId,
                    course_id,
                    module_id || null,
                    resolvedQuizType,
                    q.question_text,
                    JSON.stringify(options),
                    options[0]?.text || '',
                    options[1]?.text || '',
                    options[2]?.text || '',
                    options[3]?.text || '',
                    correct,
                    correct,
                    q.explanation || null,
                    i + 1
                ]
            );
        }

        await client.query('COMMIT');
        res.json({ id: quizId, title, question_count: questions.length });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[PUT /quizzes/:id]', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

// ── DELETE /api/quizzes/assessment/:id — student/admin deletes assessment ──
router.delete('/assessment/:id', authenticateToken, async (req, res) => {
    const assessmentId = parseInt(req.params.id, 10);
    if (isNaN(assessmentId)) return res.status(400).json({ error: 'Invalid assessment ID' });
    try {
        const [assessment] = await pool.query('SELECT user_id FROM assessments WHERE id = $1', [assessmentId]);
        if (!assessment.length) return res.status(404).json({ error: 'Assessment not found' });

        // Ownership check: Students can only delete their own, Admins can delete any
        if (req.user.role !== 'admin' && parseInt(assessment[0].user_id, 10) !== parseInt(req.user.sub, 10)) {
            return res.status(403).json({ error: 'Unauthorized to delete this assessment' });
        }

        await pool.query('DELETE FROM assessments WHERE id = $1', [assessmentId]);
        res.json({ message: 'Assessment attempt deleted successfully' });
    } catch (err) {
        console.error('[DELETE /quizzes/assessment/:id]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── GET /api/quizzes/assessment/:id/review — attempt details + answer review ──
router.get('/assessment/:id/review', authenticateToken, async (req, res) => {
    const assessmentId = parseInt(req.params.id, 10);
    if (isNaN(assessmentId)) return res.status(400).json({ error: 'Invalid assessment ID' });
    try {
        const [rows] = await pool.query(`SELECT a.id, a.quiz_id, a.user_id, a.score, a.passed, a.answers, a.time_taken, a.taken_at,
              q.title AS quiz_title, q.pass_score,
              c.title AS course_title
       FROM assessments a
       JOIN quizzes q ON q.id = a.quiz_id
       JOIN courses c ON c.id = q.course_id
       WHERE a.id = $1`,
            [assessmentId]
        );

        if (!rows.length) return res.status(404).json({ error: 'Assessment not found' });

        const attempt = rows[0];
        if (req.user.role !== 'admin' && parseInt(attempt.user_id, 10) !== parseInt(req.user.sub, 10)) {
            return res.status(403).json({ error: 'Unauthorized to view this assessment' });
        }

        const [questions] = await pool.query('SELECT id, question_text, options, correct, explanation, sort_order FROM quiz_questions WHERE quiz_id = $1 ORDER BY sort_order',
            [attempt.quiz_id]
        );

        let answers = {};
        try {
            answers = attempt.answers ? JSON.parse(attempt.answers) : {};
        } catch {
            answers = {};
        }

        let correctCount = 0;
        const feedback = questions.map((q, index) => {
            const chosen = answers[q.id] ?? null;
            const isCorrect = String(chosen) === String(q.correct);
            if (isCorrect) correctCount += 1;

            let parsedOptions = [];
            try {
                parsedOptions = Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]');
            } catch {
                parsedOptions = [];
            }

            return {
                index: index + 1,
                id: q.id,
                question_text: q.question_text,
                options: parsedOptions,
                chosen,
                correct: q.correct,
                is_correct: isCorrect,
                explanation: q.explanation || ''
            };
        });

        res.json({
            attempt: {
                id: attempt.id,
                quiz_id: attempt.quiz_id,
                quiz_title: attempt.quiz_title,
                course_title: attempt.course_title,
                score: attempt.score,
                passed: attempt.passed,
                pass_score: attempt.pass_score,
                time_taken: attempt.time_taken,
                taken_at: attempt.taken_at
            },
            summary: {
                correct: correctCount,
                total: questions.length,
                score: attempt.score,
                passed: attempt.score >= (attempt.pass_score || 50)
            },
            feedback
        });
    } catch (err) {
        console.error('[GET /quizzes/assessment/:id/review]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── DELETE /api/quizzes/:id — delete quiz (admin only) ──────────
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM quizzes WHERE id = $1', [req.params.id]);
        res.json({ message: 'Quiz deleted' });
    } catch (err) {
        console.error('[DELETE /quizzes/:id]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/quizzes/ai-generate — AI quiz generation via OpenRouter ─
router.post('/ai-generate', authenticateToken, requireRole('admin'), async (req, res) => {
    const {
        category_name,
        course_id,
        course_name,
        module_id,
        module_name,
        quiz_type,
        topics,
        lessons,
        description
    } = req.body;

    const resolvedQuizType = resolveQuizType(quiz_type, module_id);
    const requiredCount = requiredQuestionCount(resolvedQuizType);

    if (!course_id || !course_name || !topics) {
        return res.status(400).json({ error: 'course_id, course_name, and topics are required' });
    }

    if (resolvedQuizType === 'module' && !module_id) {
        return res.status(400).json({ error: 'module_id is required for module quizzes' });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
        return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    const lessonList = Array.isArray(lessons) ? lessons.filter(Boolean).join(', ') : '';
    const moduleLine = resolvedQuizType === 'module' ? `Module: "${module_name || 'Selected Module'}"` : 'Final course assessment';
    const categoryLine = category_name ? `Category: "${category_name}"` : '';
    const descriptionLine = description ? `Instructor notes: ${description}` : '';

    const prompt = `You are an expert academic assessment generator.

Create exactly ${requiredCount} multiple-choice questions (MCQs).
Course: "${course_name}"
${categoryLine}
${moduleLine}
Topics: ${topics}
Lessons: ${lessonList || 'N/A'}
${descriptionLine}

Requirements:
- Return response strictly as a JSON array (no markdown, no extra text)
- Each question object must include:
  - "question_text": string
  - "options": array of 4 objects with "label" (A/B/C/D) and "text"
  - "correct": string (A, B, C, or D)
  - "explanation": string (brief explanation of the correct answer, optional)
- Ensure questions are unique, accurate, and aligned with the topics/lessons
- Keep the difficulty balanced and appropriate for an LMS assessment

Return ONLY a valid JSON array like:
[
  {
    "question_text": "...",
    "options": [
      {"label": "A", "text": "..."},
      {"label": "B", "text": "..."},
      {"label": "C", "text": "..."},
      {"label": "D", "text": "..."}
    ],
    "correct": "A",
    "explanation": "..."
  }
]`;

    const parseQuestions = (rawContent) => {
        const cleaned = rawContent.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        let questions = JSON.parse(cleaned);
        if (!Array.isArray(questions)) throw new Error('Expected array');
        questions = questions.filter(q =>
            q.question_text &&
            Array.isArray(q.options) &&
            q.options.length >= 4 &&
            q.correct &&
            ['A', 'B', 'C', 'D'].includes(String(q.correct).toUpperCase())
        ).map(q => ({
            question_text: q.question_text,
            options: normalizeOptions(q.options),
            correct: String(q.correct).toUpperCase(),
            explanation: q.explanation || ''
        }));
        return questions;
    };

    const fetchQuestions = async (count, avoidList = []) => {
        const avoidText = avoidList.length
            ? `Avoid duplicating these questions:\n${avoidList.map((q, i) => `${i + 1}. ${q.question_text}`).join('\n')}\n`
            : '';

        const followupPrompt = `You are an expert academic assessment generator.

Create exactly ${count} NEW multiple-choice questions (MCQs).
Course: "${course_name}"
${categoryLine}
${moduleLine}
Topics: ${topics}
Lessons: ${lessonList || 'N/A'}
${descriptionLine}
${avoidText}

Requirements:
- Return response strictly as a JSON array (no markdown, no extra text)
- Each question object must include:
  - "question_text": string
  - "options": array of 4 objects with "label" (A/B/C/D) and "text"
  - "correct": string (A, B, C, or D)
  - "explanation": string (brief explanation of the correct answer, optional)
- Ensure questions are unique, accurate, and aligned with the topics/lessons

Return ONLY a valid JSON array.`;

        const data = await createChatCompletion({
            apiKey: OPENROUTER_API_KEY,
            messages: [{ role: 'user', content: followupPrompt }],
            temperature: 0.6,
            maxTokens: 3500,
            referer: process.env.CLIENT_URL || 'http://localhost:5173',
            title: 'IDLE Learning Platform',
            timeout: 45000
        });
        const rawContent = data.choices?.[0]?.message?.content || '';
        return { questions: parseQuestions(rawContent), model: data.model };
    };

    try {
        const initial = await createChatCompletion({
            apiKey: OPENROUTER_API_KEY,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            maxTokens: 3500,
            referer: process.env.CLIENT_URL || 'http://localhost:5173',
            title: 'IDLE Learning Platform',
            timeout: 45000
        });
        const rawContent = initial.choices?.[0]?.message?.content || '';

        let questions;
        try {
            questions = parseQuestions(rawContent);
        } catch (parseErr) {
            console.error('[AI generate] Parse error:', parseErr, 'Raw:', rawContent);
            return res.status(502).json({ error: 'AI returned invalid JSON or malformed content', detail: parseErr.message });
        }

        let modelsUsed = [initial.model].filter(Boolean);
        let guard = 0;
        while (questions.length < requiredCount && guard < 3) {
            const remaining = requiredCount - questions.length;
            const { questions: more, model } = await fetchQuestions(remaining, questions);
            modelsUsed = [...modelsUsed, model].filter(Boolean);
            questions = [...questions, ...more];
            guard += 1;
        }

        if (questions.length < Math.max(1, requiredCount - 2)) {
            return res.status(502).json({
                error: `AI returned ${questions.length} questions (expected ~${requiredCount})`,
                detail: 'Tried multiple attempts, still significantly short.'
            });
        }

        if (questions.length > requiredCount) {
            questions = questions.slice(0, requiredCount);
        }

        res.json({ questions, model: modelsUsed[0] || initial.model, models_used: modelsUsed });
    } catch (err) {
        if (err.status) {
            console.error('[AI generate] OpenRouter fallback error:', err.detail || err.message);
            return res.status(err.status).json({ error: err.message });
        }
        console.error('[POST /quizzes/ai-generate]', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// ── POST /api/quizzes/:id/submit — student submits answers ────
router.post('/:id/submit', authenticateToken, requireRole('student'), async (req, res) => {
    const quizId = parseInt(req.params.id, 10);
    const userId = parseInt(req.user.sub, 10);
    const { answers, time_taken } = req.body;
    
    if (isNaN(quizId)) return res.status(400).json({ error: 'Invalid quiz ID' });
    if (!answers) return res.status(400).json({ error: 'answers required' });

    try {
        const [quiz] = await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
        if (!quiz.length) return res.status(404).json({ error: 'Quiz not found' });

        const [questions] = await pool.query('SELECT id, correct, explanation FROM quiz_questions WHERE quiz_id = $1',
            [quizId]
        );

        let correct = 0;
        const feedback = questions.map(q => {
            const chosen = answers[q.id];
            const isCorrect = String(chosen) === String(q.correct);
            if (isCorrect) correct++;
            return {
                id: q.id,
                correct: q.correct,
                chosen,
                is_correct: isCorrect,
                explanation: q.explanation
            };
        });

        const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
        const passed = score >= (quiz[0].pass_score || 60);

        const [result] = await pool.query('INSERT INTO assessments (quiz_id, user_id, score, answers, passed, time_taken) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [quizId, userId, score, JSON.stringify(answers), passed, time_taken || 0]
        );

        // Check for course completion: Score >= 80 AND Progress >= 80
        const courseId = quiz[0].course_id;
        const [enrollment] = await pool.query('SELECT progress FROM enrollments WHERE student_id = $1 AND course_id = $2',
            [userId, courseId]
        );

        let completed = false;
        if (enrollment.length && enrollment[0].progress >= 80 && score >= 80) {
            completed = true;
            await pool.query('UPDATE enrollments SET completed = TRUE, completed_at = NOW() WHERE student_id = $1 AND course_id = $2 AND completed = FALSE',
                [userId, courseId]
            );
        }

        res.json({
            assessment_id: result[0]?.id,
            score,
            passed,
            correct,
            total: questions.length,
            feedback,
            course_completed: completed
        });
    } catch (err) {
        const errorData = {
            message: err.message,
            stack: err.stack,
            quizId,
            userId,
            body: req.body
        };
        logToFile(`[POST /quizzes/:id/submit] CRITICAL ERROR: ${JSON.stringify(errorData, null, 2)}`);
        console.error('[POST /quizzes/:id/submit] CRITICAL ERROR:', errorData);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// ── GET /api/quizzes/history/me — student assessment history ──
router.get('/history/me', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT a.id, a.quiz_id, a.score, a.passed, a.time_taken, a.taken_at,
              q.title AS quiz_title, q.pass_score,
              c.title AS course_title
       FROM assessments a
       JOIN quizzes q ON q.id = a.quiz_id
       JOIN courses c ON c.id = q.course_id
       WHERE a.user_id = $1
       ORDER BY a.taken_at DESC`,
            [req.user.sub]
        );
        res.json(rows);
    } catch (err) {
        console.error('[GET /quizzes/history/me]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
