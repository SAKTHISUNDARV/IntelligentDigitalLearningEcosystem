// server/index.js — Express server entry point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('./config/loadEnv');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'server_debug.log');
function logToFile(msg) {
  const ts = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${ts}] ${msg}\n`);
}

// Route imports
const authRoutes = require('./routes/auth');
const coursesRoutes = require('./routes/courses');
const lessonsRoutes = require('./routes/lessons');
const quizzesRoutes = require('./routes/quizzes');
const usersRoutes = require('./routes/users');
const modulesRoutes = require('./routes/modules');
const materialsRoutes = require('./routes/materials');
const uploadRoutes = require('./routes/upload');
const categoriesRoutes = require('./routes/categories');
const analyticsRoutes = require('./routes/analytics');
const recommendationsRoutes = require('./routes/recommendations');
const chatRoutes = require('./routes/chat');
const tasksRoutes = require('./routes/tasks');
const progressRoutes = require('./routes/progress');

const app = express();
const initDb = require('./init_db');

// Request Logger
app.use((req, res, next) => {
  logToFile(`${req.method} ${req.path}`);
  next();
});

const PORT = process.env.PORT || 5000;

// ── Security middleware ─────────────────────────────────────────
app.use(helmet());

// Rate limiting — 1000 requests per 15 minutes
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── CORS ────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true
}));

// ── Body parsers ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/quizzes', quizzesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/progress', progressRoutes);

// Restoring previously deleted routes:
app.use('/api/categories', categoriesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tasks', tasksRoutes);

// ── Health check ────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    service: 'IDLE Backend',
    status: 'running'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'IDLE Backend' });
});

// ── 404 handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ────────────────────────────────────────────────────────
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, "127.0.0.1", () => {
      console.log(`✅ IDLE Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
