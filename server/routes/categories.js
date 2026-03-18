// routes/categories.js — Category management
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// ── GET /api/categories — list all (public) ───────────────────
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT cat.*, COUNT(c.id) AS course_count
       FROM categories cat
       LEFT JOIN courses c ON c.category_id = cat.id AND c.is_approved = TRUE AND c.is_published = TRUE
       GROUP BY cat.id
       ORDER BY cat.name`
        );
        res.json(rows);
    } catch (err) {
        console.error('[GET /categories]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/categories — create (admin) ─────────────────────
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    try {
        const [result] = await pool.query('INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id',
            [name, description || null]
        );
        res.status(201).json({ id: result[0]?.id, name });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Category already exists' });
        console.error('[POST /categories]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── PUT /api/categories/:id ───────────────────────────────────
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    const { name, description } = req.body;
    try {
        await pool.query('UPDATE categories SET name=$1, description=$2 WHERE id=$3',
            [name, description, req.params.id]
        );
        res.json({ message: 'Category updated' });
    } catch (err) {
        console.error('[PUT /categories/:id]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── DELETE /api/categories/:id ────────────────────────────────
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        // Check if any courses reference this category first
        const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM courses WHERE category_id = $1',
            [req.params.id]
        );
        if (count > 0) {
            return res.status(409).json({
                error: `Cannot delete: this category has ${count} course${count > 1 ? 's' : ''} assigned to it. Reassign or delete those courses first.`
            });
        }
        await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
        res.json({ message: 'Category deleted' });
    } catch (err) {
        console.error('[DELETE /categories/:id]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
