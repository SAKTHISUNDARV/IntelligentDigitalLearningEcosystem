// routes/materials.js — CRUD for materials within a module
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// ── GET /api/materials?module_id=X ────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
    const { module_id } = req.query;
    if (!module_id) return res.status(400).json({ error: 'module_id required' });

    try {
        const [rows] = await pool.query('SELECT * FROM materials WHERE module_id = $1 ORDER BY sort_order', [module_id]);
        res.json(rows);
    } catch (err) {
        console.error('[GET /materials]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/materials — add material (admin only) ───────────
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    // Note: The actual file upload (to Supabase Storage) happens in upload.js
    // This endpoint just saves the returned public file_url to the DB.
    const { module_id, title, file_url, sort_order } = req.body;
    if (!module_id || !title || !file_url) return res.status(400).json({ error: 'module_id, title, and file_url required' });

    try {
        const [result] = await pool.query('INSERT INTO materials (module_id, title, file_url, sort_order) VALUES ($1, $2, $3, $4) RETURNING id',
            [module_id, title, file_url, sort_order || 0]
        );
        res.status(201).json({ id: result[0]?.id, title, file_url });
    } catch (err) {
        console.error('[POST /materials]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── DELETE /api/materials/:id ─────────────────────────────────
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM materials WHERE id = $1', [req.params.id]);
        res.json({ message: 'Material deleted from database' });
    } catch (err) {
        console.error('[DELETE /materials/:id]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
