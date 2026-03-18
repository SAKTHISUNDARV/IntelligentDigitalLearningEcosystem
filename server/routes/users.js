// routes/users.js — User management (profile, admin CRUD) — no instructor role
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// ── GET /api/users — admin: list all users ────────────────────
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
    const { role, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        const where = [];
        const params = [];

        if (role) {
            params.push(role);
            where.push(`role = $${params.length}`);
        }
        if (search) {
            params.push(`%${search}%`);
            params.push(`%${search}%`);
            where.push(`(full_name ILIKE $${params.length - 1} OR email ILIKE $${params.length})`);
        }

        const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
        
        params.push(parseInt(limit));
        const limitParam = `$${params.length}`;
        params.push(offset);
        const offsetParam = `$${params.length}`;

        const [rows] = await pool.query(`SELECT id, email, full_name, role, is_approved, avatar_url, created_at
       FROM users ${whereClause} ORDER BY created_at DESC LIMIT ${limitParam} OFFSET ${offsetParam}`,
            params
        );

        const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users ${whereClause}`, params.slice(0, -2));
        res.json({ users: rows, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (err) {
        console.error('[GET /users]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── GET /api/users/profile/me — get own profile ───────────────
router.get('/profile/me', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, email, full_name, role, is_approved, avatar_url, bio, created_at, last_login FROM users WHERE id = $1',
            [req.user.sub]
        );
        if (!rows.length) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('[GET /users/profile/me]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── GET /api/users/:id — get user detail (admin or self) ──────
router.get('/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin' && String(req.user.sub) !== String(req.params.id)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        const [rows] = await pool.query('SELECT id, email, full_name, role, is_approved, avatar_url, bio, created_at, last_login FROM users WHERE id = $1',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('[GET /users/:id]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── PUT /api/users/profile/me — update own profile ────────────
router.put('/profile/me', authenticateToken, async (req, res) => {
    const { full_name, bio, avatar_url } = req.body;
    try {
        await pool.query('UPDATE users SET full_name=$1, bio=$2, avatar_url=$3, updated_at=NOW() WHERE id=$4',
            [full_name, bio, avatar_url, req.user.sub]
        );
        res.json({ message: 'Profile updated' });
    } catch (err) {
        console.error('[PUT /users/profile]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── PUT /api/users/password/me — change own password ──────────
router.put('/password/me', authenticateToken, async (req, res) => {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
        return res.status(400).json({ error: 'current_password and new_password required' });
    }
    try {
        const [rows] = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.sub]);
        const ok = await bcrypt.compare(current_password, rows[0].password);
        if (!ok) return res.status(400).json({ error: 'Current password incorrect' });

        const hash = await bcrypt.hash(new_password, 10);
        await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hash, req.user.sub]);
        res.json({ message: 'Password changed' });
    } catch (err) {
        console.error('[PUT /users/password]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── PATCH /api/users/:id/role — admin changes role ─
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    const { full_name, password } = req.body;
    const trimmedName = typeof full_name === 'string' ? full_name.trim() : '';

    if (!trimmedName) {
        return res.status(400).json({ error: 'full_name is required' });
    }
    if (password && password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    try {
        const [existing] = await pool.query('SELECT id FROM users WHERE id = $1', [req.params.id]);
        if (!existing.length) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (password) {
            const hash = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE users SET full_name = $1, password = $2, updated_at = NOW() WHERE id = $3',
                [trimmedName, hash, req.params.id]
            );
        } else {
            await pool.query(
                'UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2',
                [trimmedName, req.params.id]
            );
        }

        res.json({ message: 'User updated' });
    } catch (err) {
        console.error('[PUT /users/:id]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.patch('/:id/role', authenticateToken, requireRole('admin'), async (req, res) => {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Allowed: student, admin' });
    }
    try {
        await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
        res.json({ message: `Role updated to ${role}` });
    } catch (err) {
        console.error('[PATCH /users/:id/role]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── PATCH /api/users/:id/approve — admin approves user ─────────────────
router.patch('/:id/approve', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const [result] = await pool.query('UPDATE users SET is_approved = TRUE WHERE id = $1',
            [req.params.id]
        );
        res.json({ message: 'User approved' });
    } catch (err) {
        console.error('[PATCH /users/:id/approve]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── DELETE /api/users/:id — admin delete user ──────────────────────────
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        if (String(req.user.sub) === String(req.params.id)) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error('[DELETE /users/:id]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
