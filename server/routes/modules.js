// routes/modules.js — CRUD for modules within a course
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// ── GET /api/modules?course_id=X ──────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
    const { course_id } = req.query;
    if (!course_id) return res.status(400).json({ error: 'course_id required' });

    try {
        const [rows] = await pool.query('SELECT * FROM modules WHERE course_id = $1 ORDER BY sort_order', [course_id]);
        res.json(rows);
    } catch (err) {
        console.error('[GET /modules]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/modules — add module (admin only) ───────────────
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    const { course_id, title, description, sort_order } = req.body;
    if (!course_id || !title) return res.status(400).json({ error: 'course_id and title required' });

    try {
        const [result] = await pool.query('INSERT INTO modules (course_id, title, description, sort_order) VALUES ($1, $2, $3, $4) RETURNING id',
            [course_id, title, description || null, sort_order || 0]
        );
        res.status(201).json({ id: result[0]?.id, title, course_id });
    } catch (err) {
        console.error('[POST /modules]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── PUT /api/modules/:id ──────────────────────────────────────
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    const { title, description, sort_order } = req.body;
    try {
        const [existing] = await pool.query('SELECT * FROM modules WHERE id = $1', [req.params.id]);
        if (!existing.length) return res.status(404).json({ error: 'Module not found' });

        const mod = existing[0];
        await pool.query('UPDATE modules SET title=$1, description=$2, sort_order=$3, updated_at=NOW() WHERE id=$4',
            [
                title !== undefined ? title : mod.title,
                description !== undefined ? description : mod.description,
                sort_order !== undefined ? sort_order : mod.sort_order,
                req.params.id
            ]
        );
        res.json({ message: 'Module updated' });
    } catch (err) {
        console.error('[PUT /modules/:id]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── DELETE /api/modules/:id ───────────────────────────────────
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM modules WHERE id = $1', [req.params.id]);
        res.json({ message: 'Module deleted' });
    } catch (err) {
        console.error('[DELETE /modules/:id]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
