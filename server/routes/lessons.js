// routes/lessons.js — CRUD for lessons within a module
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// ── GET /api/lessons?module_id=X — get lessons for a module ──
router.get('/', authenticateToken, async (req, res) => {
    const { module_id } = req.query;
    if (!module_id) return res.status(400).json({ error: 'module_id required' });

    try {
        // Security: Check if user is admin OR enrolled student
        if (req.user.role !== 'admin') {
            const [enrolled] = await pool.query(`
                SELECT e.id FROM enrollments e
                JOIN courses c ON c.id = e.course_id
                JOIN modules m ON m.course_id = c.id
                WHERE e.student_id = $1 AND m.id = $2`,
                [req.user.sub, module_id]
            );
            if (!enrolled.length) {
                return res.status(403).json({ error: 'Not enrolled in this course' });
            }
        }

        const [rows] = await pool.query('SELECT * FROM lessons WHERE module_id = $1 ORDER BY sort_order',
            [module_id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[GET /lessons]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/lessons — add lesson (admin only) ─────────────
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    const { module_id, title, description, lesson_type, content_url, duration_min, sort_order } = req.body;
    if (!module_id || !title) return res.status(400).json({ error: 'module_id and title required' });

    try {
        const [result] = await pool.query('INSERT INTO lessons (module_id, title, description, lesson_type, content_url, duration_min, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [module_id, title, description || null, lesson_type || 'video', content_url || null, duration_min || 0, sort_order || 0]
        );
        res.status(201).json({ id: result[0]?.id, title, module_id });
    } catch (err) {
        console.error('[POST /lessons]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── PUT /api/lessons/:id (admin only) ───────────────────────
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    const { title, description, lesson_type, content_url, duration_min, sort_order } = req.body;
    try {
        const [existing] = await pool.query('SELECT * FROM lessons WHERE id = $1', [req.params.id]);
        if (!existing.length) return res.status(404).json({ error: 'Lesson not found' });

        const lesson = existing[0];
        await pool.query('UPDATE lessons SET title=$1, description=$2, lesson_type=$3, content_url=$4, duration_min=$5, sort_order=$6 WHERE id=$7',
            [
                title !== undefined ? title : lesson.title,
                description !== undefined ? description : lesson.description,
                lesson_type !== undefined ? lesson_type : lesson.lesson_type,
                content_url !== undefined ? content_url : lesson.content_url,
                duration_min !== undefined ? duration_min : lesson.duration_min,
                sort_order !== undefined ? sort_order : lesson.sort_order,
                req.params.id
            ]
        );
        res.json({ message: 'Lesson updated' });
    } catch (err) {
        console.error('[PUT /lessons/:id]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── DELETE /api/lessons/:id (admin only) ───────────────────
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM lessons WHERE id = $1', [req.params.id]);
        res.json({ message: 'Lesson deleted' });
    } catch (err) {
        console.error('[DELETE /lessons/:id]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
