// middleware/auth.js — JWT authentication and role-based authorization
const jwt = require('jsonwebtoken');
const { requireEnv } = require('../config/env');

const JWT_SECRET = requireEnv('JWT_SECRET');

/**
 * Verifies the Bearer JWT token from the Authorization header.
 * Attaches decoded payload to req.user = { sub, role, iat, exp }
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { sub: userId, role, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    // Changed from 403 to 401 for invalid tokens to signal auth failure correctly
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Role authorization middleware factory.
 * Usage: requireRole('admin')
 * NOTE: 'admin' role bypasses all checks.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    // Admins are allowed to bypass role restrictions for testing and management
    if (!roles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
    next();
  };
}

/**
 * Optional auth — does NOT fail if no token, just sets req.user = null
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

module.exports = { authenticateToken, requireRole, optionalAuth };
