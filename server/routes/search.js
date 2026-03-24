const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { optionalAuth } = require('../middleware/auth');

// GET /api/search?q=searchterm
router.get('/', optionalAuth, async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length === 0) {
    return res.json({ courses: [], lessons: [] });
  }

  const searchTerm = `%${q.trim()}%`;

  try {
    // 1. Search Courses
    const [courses] = await pool.query(`
      SELECT c.id, c.title, c.description, c.thumbnail_url, c.level, 
             cat.name AS category_name, u.full_name AS instructor_name
      FROM courses c
      LEFT JOIN categories cat ON cat.id = c.category_id
      LEFT JOIN users u ON u.id = c.instructor_id
      WHERE c.is_published = TRUE 
        AND (c.title ILIKE $1 OR c.description ILIKE $1)
      LIMIT 10
    `, [searchTerm]);

    // 2. Search Lessons
    const [lessons] = await pool.query(`
      SELECT l.id, l.title, l.description, l.lesson_type, l.content_url,
             c.id AS course_id, c.title AS course_title
      FROM lessons l
      JOIN modules m ON m.id = l.module_id
      JOIN courses c ON c.id = m.course_id
      WHERE c.is_published = TRUE
        AND (l.title ILIKE $1 OR l.description ILIKE $1)
      LIMIT 10
    `, [searchTerm]);

    res.json({
      courses,
      lessons
    });
  } catch (err) {
    console.error('[GET /search]', err);
    res.status(500).json({ error: 'Server error during search' });
  }
});

module.exports = router;
