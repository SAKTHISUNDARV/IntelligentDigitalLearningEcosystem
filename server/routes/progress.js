// routes/progress.js — Track granular progress for module-based LMS
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// ── GET /api/progress/course/:courseId ─────────────────────────
// Returns completed lessons, passed quizzes, and overall completion
router.get('/course/:courseId', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const studentId = parseInt(req.user.sub, 10);
        const courseId = parseInt(req.params.courseId, 10);

        // 1. Get completed lessons for this course
        const [lessonRows] = await pool.query(`
            SELECT lp.lesson_id 
            FROM lesson_progress lp
            JOIN lessons l ON l.id = lp.lesson_id
            JOIN modules m ON m.id = l.module_id
            WHERE lp.user_id = $1 AND m.course_id = $2 AND lp.completed = TRUE
        `, [studentId, courseId]);
        const completedLessons = lessonRows.map(r => r.lesson_id);

        // 2. Get passed assessments for quizzes in this course
        const [quizRows] = await pool.query(`
            SELECT a.quiz_id 
            FROM assessments a
            JOIN quizzes q ON q.id = a.quiz_id
            WHERE a.user_id = $1 AND q.course_id = $2 AND a.passed = TRUE
        `, [studentId, courseId]);
        const passedQuizzes = [...new Set(quizRows.map(r => r.quiz_id))];

        // 3. Get overall enrollment progress
        const [enrRows] = await pool.query(`
            SELECT progress, completed 
            FROM enrollments 
            WHERE student_id = $1 AND course_id = $2
        `, [studentId, courseId]);
        const enrollment = enrRows[0] || { progress: 0, completed: false };

        res.json({
            completed_lessons: completedLessons,
            passed_quizzes: passedQuizzes,
            progress: enrollment.progress,
            course_completed: enrollment.completed
        });
    } catch (err) {
        console.error('[GET /progress/course/:courseId]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/progress/lesson/:lessonId ─────────────────────────
// Mark a lesson as completed
router.post('/lesson/:lessonId', authenticateToken, requireRole('student'), async (req, res) => {
    try {
        const studentId = parseInt(req.user.sub, 10);
        const lessonId = parseInt(req.params.lessonId, 10);

        // Insert or ignore if it already exists
        await pool.query(`
            INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at)
            VALUES ($1, $2, TRUE, NOW())
            ON CONFLICT (user_id, lesson_id) 
            DO UPDATE SET completed = TRUE, completed_at = NOW()
        `, [studentId, lessonId]);

        // Automatically update the overall course progress percentage.
        // Identify course
        const [courseInfo] = await pool.query(`
            SELECT m.course_id 
            FROM lessons l
            JOIN modules m ON m.id = l.module_id
            WHERE l.id = $1
        `, [lessonId]);

        if (courseInfo.length > 0) {
            const courseId = courseInfo[0].course_id;

            // Recalculate progress:
            // Let's say progress is determined by lessons + module quizzes + final quiz
            // Or simpler: just % of total lessons watched and passed quizzes
            const [totalItems] = await pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = $1) +
                    (SELECT COUNT(*) FROM quizzes WHERE course_id = $1)
                AS total
            `, [courseId]);

            const [completedItems] = await pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN modules m ON m.id = l.module_id WHERE lp.user_id = $2 AND m.course_id = $1 AND lp.completed = TRUE) +
                    (SELECT COUNT(DISTINCT a.quiz_id) FROM assessments a JOIN quizzes q ON q.id = a.quiz_id WHERE a.user_id = $2 AND q.course_id = $1 AND a.passed = TRUE)
                AS completed
            `, [courseId, studentId]);

            const total = parseInt(totalItems[0].total, 10);
            const comp = parseInt(completedItems[0].completed, 10);
            const progressPct = total > 0 ? Math.round((comp / total) * 100) : 0;
            const isCompleted = progressPct >= 100;

            await pool.query(`
                UPDATE enrollments 
                SET progress = $1, 
                    completed = CASE WHEN $2 THEN TRUE ELSE completed END,
                    completed_at = CASE WHEN $3 AND completed_at IS NULL THEN NOW() ELSE completed_at END
                WHERE student_id = $4 AND course_id = $5
            `, [progressPct, isCompleted, isCompleted, studentId, courseId]);

            res.json({ message: 'Lesson marked as completed', progress: progressPct, course_completed: isCompleted });
        } else {
            res.json({ message: 'Lesson marked as completed (no course info found)' });
        }

    } catch (err) {
        console.error('[POST /progress/lesson/:lessonId]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
