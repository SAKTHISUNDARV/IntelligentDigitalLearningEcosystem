const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// ── GET /api/tasks — get all tasks for current user ─────
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.sub;
        const [rows] = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        res.json(rows);
    } catch (err) {
        console.error('[GET /tasks]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/tasks — create new task ───────────────────
router.post('/', authenticateToken, async (req, res) => {
    const { title, description, priority, due_date } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    try {
        const userId = req.user.sub;
        const [result] = await pool.query('INSERT INTO tasks (user_id, title, description, priority, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING task_id',
            [userId, title, description || null, priority || 'medium', due_date || null]
        );
        res.status(201).json({ task_id: result[0]?.task_id, title, message: 'Task created' });
    } catch (err) {
        console.error('[POST /tasks]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── PUT /api/tasks/:id — update task ────────────────────
router.put('/:id', authenticateToken, async (req, res) => {
    const { title, description, priority, due_date, status } = req.body;
    try {
        const userId = req.user.sub;
        const [existing] = await pool.query('SELECT * FROM tasks WHERE task_id=$1 AND user_id=$2', [req.params.id, userId]);
        if (!existing.length) return res.status(404).json({ error: 'Task not found' });

        const task = existing[0];
        await pool.query('UPDATE tasks SET title=$1, description=$2, priority=$3, due_date=$4, status=$5 WHERE task_id=$6 AND user_id=$7',
            [
                title !== undefined ? title : task.title,
                description !== undefined ? description : task.description,
                priority !== undefined ? priority : task.priority,
                due_date !== undefined ? due_date : task.due_date,
                status !== undefined ? status : task.status,
                req.params.id,
                userId
            ]
        );
        res.json({ message: 'Task updated' });
    } catch (err) {
        console.error('[PUT /tasks/:id]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── PATCH /api/tasks/:id/complete — toggle status ──────
router.patch('/:id/complete', authenticateToken, async (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status required' });
    try {
        const userId = req.user.sub;
        await pool.query('UPDATE tasks SET status=$1 WHERE task_id=$2 AND user_id=$3',
            [status, req.params.id, userId]
        );
        res.json({ message: `Task marked as ${status}`, status });
    } catch (err) {
        console.error('[PATCH /tasks/:id/complete]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── DELETE /api/tasks/:id — delete task ─────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.sub;
        await pool.query('DELETE FROM tasks WHERE task_id=$1 AND user_id=$2', [req.params.id, userId]);
        res.json({ message: 'Task deleted' });
    } catch (err) {
        console.error('[DELETE /tasks/:id]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
