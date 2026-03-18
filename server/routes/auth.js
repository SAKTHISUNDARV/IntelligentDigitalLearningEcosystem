// routes/auth.js — Authentication routes: register, login, refresh, logout, me
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { requireEnv } = require('../config/env');
require('../config/loadEnv');

const JWT_SECRET = requireEnv('JWT_SECRET');
const JWT_REFRESH_SECRET = requireEnv('JWT_REFRESH_SECRET');
const SALT_ROUNDS = 10;

/** Generate access token — expires in 1 hour */
function makeAccessToken(user) {
  return jwt.sign(
    { sub: String(user.id), role: user.role, name: user.full_name },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/** Generate refresh token — expires in 7 days */
function makeRefreshToken(user) {
  return jwt.sign(
    { sub: String(user.id) },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

// ── POST /api/auth/register ─────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, full_name } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'email, password, and full_name are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  // Students only — admin accounts are created manually in the DB
  const userRole = 'student';

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query('INSERT INTO users (email, password, full_name, role, is_approved) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [email, hash, full_name, userRole, true]
    );

    res.status(201).json({
      id: result[0]?.id,
      email,
      full_name,
      role: userRole,
      is_approved: true,
      message: 'Registration successful.'
    });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/auth/login ────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const [rows] = await pool.query('SELECT id, full_name, email, password, role, is_approved, avatar_url, last_login FROM users WHERE email = $1',
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = makeAccessToken(user);
    const refreshToken = makeRefreshToken(user);

    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    const [updatedUsers] = await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1 RETURNING last_login',
      [user.id]
    );
    await pool.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING id',
      [user.id, refreshToken, expiresAt]
    );

    const lastLogin = updatedUsers[0]?.last_login || new Date().toISOString();

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_approved: user.is_approved,
        avatar_url: user.avatar_url,
        last_login: lastLogin
      }
    });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/auth/refresh ──────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ error: 'refresh_token required' });
  }

  try {
    const decoded = jwt.verify(refresh_token, JWT_REFRESH_SECRET);

    const [rows] = await pool.query('SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND expires_at > NOW() LIMIT 1',
      [refresh_token, decoded.sub]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Refresh token invalid or expired' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.sub]);
    if (!users.length) return res.status(401).json({ error: 'User not found' });

    const user = users[0];
    const accessToken = makeAccessToken(user);
    res.json({ access_token: accessToken });
  } catch (err) {
    console.error('[refresh]', err);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ── POST /api/auth/logout ───────────────────────────────────
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.sub]);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('[logout]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/auth/me ────────────────────────────────────────
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, email, full_name, role, is_approved, avatar_url, bio, created_at, last_login FROM users WHERE id = $1',
      [req.user.sub]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[me]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
