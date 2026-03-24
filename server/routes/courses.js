// routes/courses.js — Full CRUD for courses (admin only creates) + enroll/progress for students
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');

// ── GET /api/courses — list/search approved published courses ──
router.get('/', optionalAuth, async (req, res) => {
  const { search, category, level, page = 1, limit = 12 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let where = ['c.is_approved = TRUE', 'c.is_published = TRUE'];
    const params = [];
    const coursesFromClause = `
      FROM courses c
      JOIN users u ON u.id = c.instructor_id
      LEFT JOIN categories cat ON cat.id = c.category_id
    `;
    const countFromClause = `
      FROM courses c
      LEFT JOIN categories cat ON cat.id = c.category_id
    `;

    if (search) {
      params.push(`%${search}%`);
      where.push(`(c.title ILIKE $${params.length} OR c.description ILIKE $${params.length})`);
    }
    if (category) {
      params.push(category);
      where.push(`cat.name = $${params.length}`);
    }
    if (level) {
      params.push(level);
      where.push(`c.level = $${params.length}`);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    params.push(parseInt(limit));
    const limitParam = `$${params.length}`;
    params.push(offset);
    const offsetParam = `$${params.length}`;

    const [rows] = await pool.query(`SELECT c.id, c.title, c.description, c.level, c.duration_hours,
              c.thumbnail_url, c.tags, c.price, c.created_at,
              (
                SELECT l.content_url
                FROM lessons l
                JOIN modules m ON m.id = l.module_id
                WHERE m.course_id = c.id
                ORDER BY m.sort_order ASC, l.sort_order ASC, l.id ASC
                LIMIT 1
              ) AS preview_content_url,
              u.full_name AS instructor_name,
              cat.name AS category_name,
              COUNT(DISTINCT e.id) AS enrollment_count
       ${coursesFromClause}
       LEFT JOIN enrollments e ON e.course_id = c.id
       ${whereClause}
       GROUP BY c.id, u.full_name, cat.name
       ORDER BY c.created_at DESC
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params
    );

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${countFromClause} ${whereClause}`,
      params.slice(0, -2) // remove limit and offset
    );

    let enrolled = new Set();
    if (req.user) {
      const studentId = parseInt(req.user.sub, 10);
      const [enrs] = await pool.query('SELECT course_id FROM enrollments WHERE student_id = $1', [studentId]
      );
      enrolled = new Set(enrs.map(e => e.course_id));
    }

    res.json({
      courses: rows.map(c => ({ ...c, is_enrolled: enrolled.has(c.id) })),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error('[GET /courses]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/courses/student/enrolled — my enrolled courses ────
router.get('/student/enrolled', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT c.id, c.title, c.description, c.thumbnail_url, c.level, c.duration_hours,
              (
                SELECT COUNT(*)
                FROM lessons l
                JOIN modules m ON m.id = l.module_id
                WHERE m.course_id = c.id
              ) AS total_lessons,
              (
                SELECT COUNT(*)
                FROM lesson_progress lp
                JOIN lessons l ON l.id = lp.lesson_id
                JOIN modules m ON m.id = l.module_id
                WHERE m.course_id = c.id
                  AND lp.user_id = e.student_id
                  AND lp.completed = TRUE
              ) AS completed_lessons,
              (
                SELECT l.content_url
                FROM lessons l
                JOIN modules m ON m.id = l.module_id
                WHERE m.course_id = c.id
                ORDER BY m.sort_order ASC, l.sort_order ASC, l.id ASC
                LIMIT 1
              ) AS preview_content_url,
              u.full_name AS instructor_name,
              cat.name AS category_name,
              e.progress, e.completed, e.enrolled_at, e.completed_at
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       JOIN users u ON u.id = c.instructor_id
       LEFT JOIN categories cat ON cat.id = c.category_id
       WHERE e.student_id = $1
       ORDER BY e.enrolled_at DESC`,
      [parseInt(req.user.sub, 10)]
    );
    res.json(rows);
  } catch (err) {
    console.error('[GET student/enrolled]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/courses/admin/all — admin/course admin: all courses (any status) ─
router.get('/admin/all', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT c.*, cat.name AS category_name,
              COUNT(DISTINCT e.id) AS enrollment_count,
              ROUND(AVG(a.score), 1) AS avg_quiz_score
       FROM courses c
       LEFT JOIN categories cat ON cat.id = c.category_id
       LEFT JOIN enrollments e ON e.course_id = c.id
       LEFT JOIN quizzes q ON q.course_id = c.id
       LEFT JOIN assessments a ON a.quiz_id = q.id
       GROUP BY c.id, cat.name
       ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[GET admin/all]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/courses/:id — single course detail ────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT c.*, u.full_name AS instructor_name, u.avatar_url AS instructor_avatar,
              u.bio AS instructor_bio,
              cat.name AS category_name,
              (
                SELECT l.content_url
                FROM lessons l
                JOIN modules m ON m.id = l.module_id
                WHERE m.course_id = c.id
                ORDER BY m.sort_order ASC, l.sort_order ASC, l.id ASC
                LIMIT 1
              ) AS preview_content_url
       FROM courses c
       JOIN users u ON u.id = c.instructor_id
       LEFT JOIN categories cat ON cat.id = c.category_id
       WHERE c.id = $1`,
      [parseInt(req.params.id, 10)]
    );
    if (!rows.length) return res.status(404).json({ error: 'Course not found' });

    const course = rows[0];

    const [modules] = await pool.query('SELECT * FROM modules WHERE course_id = $1 ORDER BY sort_order', [parseInt(req.params.id, 10)]);

    const [lessons] = await pool.query(`
      SELECT l.id, l.module_id, l.title, l.description, l.lesson_type, l.content_url, l.duration_min, l.sort_order 
      FROM lessons l
      JOIN modules m ON m.id = l.module_id
      WHERE m.course_id = $1
      ORDER BY l.sort_order`, [parseInt(req.params.id, 10)]);

    const [materials] = await pool.query(`
      SELECT mat.id, mat.module_id, mat.title, mat.file_url, mat.sort_order 
      FROM materials mat
      JOIN modules m ON m.id = mat.module_id
      WHERE m.course_id = $1
      ORDER BY mat.sort_order`, [parseInt(req.params.id, 10)]);

    const [quizzes] = await pool.query('SELECT id, module_id, title, description, time_limit, pass_score FROM quizzes WHERE course_id = $1', [parseInt(req.params.id, 10)]);

    // Grouping content under modules
    const structuredModules = modules.map(mod => ({
        ...mod,
        lessons: lessons.filter(l => l.module_id === mod.id),
        materials: materials.filter(m => m.module_id === mod.id),
        quiz: quizzes.find(q => q.module_id === mod.id) || null
    }));

    const finalQuizzes = quizzes.filter(q => q.module_id === null);

    let enrollment = null;
    if (req.user) {
      const studentId = parseInt(req.user.sub, 10);
      const courseId = parseInt(req.params.id, 10);
      const [enrs] = await pool.query('SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2',
        [studentId, courseId]
      );
      enrollment = enrs[0] || null;
    }

    res.json({ ...course, modules: structuredModules, finalQuizzes, enrollment });
  } catch (err) {
    console.error('[GET /courses/:id]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/courses — create course (admin/course admin) ─────────────
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  const { title, description, category_id, level, duration_hours, thumbnail_url, price, tags, is_published } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  try {
    const [result] = await pool.query(`INSERT INTO courses (title, description, instructor_id, category_id, level, duration_hours, thumbnail_url, price, tags, is_approved, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [
        title, description || null, parseInt(req.user.sub, 10),
        category_id || null, level || 'beginner',
        duration_hours || 0, thumbnail_url || null,
        price || 0.00, JSON.stringify(tags || []),
        true, // admin-created courses are auto-approved
        is_published !== undefined ? !!is_published : true
      ]
    );
    res.status(201).json({
      id: result[0]?.id,
      title,
      message: is_published === false ? 'Course created as draft.' : 'Course created and published.'
    });
  } catch (err) {
    console.error('[POST /courses]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/courses/:id — update course (admin/course admin) ──────────
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const { title, description, category_id, level, duration_hours, thumbnail_url, price, tags, is_published } = req.body;
  const courseId = parseInt(req.params.id, 10);
  try {
    const [existing] = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (!existing.length) return res.status(404).json({ error: 'Course not found' });

    const course = existing[0];
    let currentTags = [];
    if (course.tags) {
      if (typeof course.tags === 'string') {
        try { currentTags = JSON.parse(course.tags); } catch { currentTags = []; }
      } else if (Array.isArray(course.tags)) {
        currentTags = course.tags;
      }
    }

    const nextPublished = is_published !== undefined ? !!is_published : course.is_published;
    const nextApproved = nextPublished ? true : course.is_approved;

    await pool.query(`UPDATE courses SET title=$1, description=$2, category_id=$3, level=$4, duration_hours=$5,
       thumbnail_url=$6, price=$7, tags=$8, is_published=$9, is_approved=$10, updated_at=NOW() WHERE id=$11`,
      [
        title !== undefined ? title : course.title,
        description !== undefined ? description : course.description,
        category_id !== undefined ? category_id : course.category_id,
        level !== undefined ? level : course.level,
        duration_hours !== undefined ? duration_hours : course.duration_hours,
        thumbnail_url !== undefined ? thumbnail_url : course.thumbnail_url,
        price !== undefined ? price : course.price,
        tags !== undefined ? JSON.stringify(tags) : JSON.stringify(currentTags),
        nextPublished,
        nextApproved,
        courseId
      ]
    );
    res.json({ message: 'Course updated' });
  } catch (err) {
    console.error('[PUT /courses/:id]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/courses/:id (admin/course admin) ───────────────────────
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM courses WHERE id = $1', [parseInt(req.params.id, 10)]);
    res.json({ message: 'Course deleted' });
  } catch (err) {
    console.error('[DELETE /courses/:id]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/courses/:id/enroll ───────────────────────────────
router.post('/:id/enroll', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const studentId = parseInt(req.user.sub, 10);
    const courseId = parseInt(req.params.id, 10);
    const [existing] = await pool.query('SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [studentId, courseId]
    );
    if (existing.length) return res.status(409).json({ error: 'Already enrolled' });

    await pool.query('INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2) RETURNING id',
      [studentId, courseId]
    );
    res.status(201).json({ message: 'Enrolled successfully' });
  } catch (err) {
    console.error('[POST enroll]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH /api/courses/:id/progress ────────────────────────────
router.delete('/:id/enroll', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const studentId = parseInt(req.user.sub, 10);
    const courseId = parseInt(req.params.id, 10);
    const [existing] = await pool.query(
      'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [studentId, courseId]
    );
    if (!existing.length) return res.status(404).json({ error: 'Enrollment not found' });

    await pool.query(
      'DELETE FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [studentId, courseId]
    );

    res.json({ message: 'Unenrolled successfully' });
  } catch (err) {
    console.error('[DELETE enroll]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/progress', authenticateToken, requireRole('student'), async (req, res) => {
  const { progress } = req.body;
  if (progress === undefined) return res.status(400).json({ error: 'progress required' });

  try {
    const studentId = parseInt(req.user.sub, 10);
    const courseId = parseInt(req.params.id, 10);
    const prog = Math.min(100, Math.max(0, parseFloat(progress)));
    const isCompleted = prog >= 100;
    
    await pool.query(`UPDATE enrollments 
       SET progress = $1,
           completed = CASE WHEN $2 THEN TRUE ELSE completed END,
           completed_at = CASE WHEN $3 AND completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE completed_at END
       WHERE student_id = $4 AND course_id = $5`,
      [prog, isCompleted, isCompleted, studentId, courseId]
    );

    res.json({ message: 'Progress updated', progress: prog });
  } catch (err) {
    console.error('[PATCH progress]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
