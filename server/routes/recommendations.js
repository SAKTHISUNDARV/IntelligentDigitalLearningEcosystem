// routes/recommendations.js — Proxy to AI FastAPI service for recommendations
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createChatCompletion } = require('../utils/openrouter');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

function extractJsonObject(raw) {
  const text = String(raw || '').trim();
  if (!text) throw new Error('Empty AI response');

  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in AI response');
  }

  return candidate.slice(start, end + 1);
}

function parseRecommendations(raw) {
  const parsed = JSON.parse(extractJsonObject(raw));
  return {
    next_lesson: typeof parsed.next_lesson === 'string' ? parsed.next_lesson : 'Continue learning with your current plan.',
    suggested_courses: Array.isArray(parsed.suggested_courses) ? parsed.suggested_courses : [],
    focus_areas: Array.isArray(parsed.focus_areas) ? parsed.focus_areas : [],
    difficulty_level: typeof parsed.difficulty_level === 'string' ? parsed.difficulty_level : 'intermediate',
    confidence_score: Number.isFinite(Number(parsed.confidence_score)) ? Number(parsed.confidence_score) : 0.5
  };
}

// ── POST /api/recommendations — get AI-powered recommendations ─
router.post('/', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const userId = parseInt(req.user.sub, 10);

    // 1. Gather student data
    const [[stats]] = await pool.query(`SELECT
         ROUND(AVG(a.score), 1)      AS avg_quiz_score,
         ROUND(AVG(e.progress), 1)   AS avg_progress,
         COUNT(DISTINCT e.course_id) AS enrolled_count,
         COUNT(NULLIF(e.completed, FALSE)) AS completed_count
       FROM enrollments e
       LEFT JOIN quizzes q ON q.course_id = e.course_id
       LEFT JOIN assessments a ON a.quiz_id = q.id AND a.user_id = e.student_id
       WHERE e.student_id = $1`,
      [userId]
    );

    const [enrolled] = await pool.query('SELECT course_id FROM enrollments WHERE student_id = $1', [userId]
    );
    const enrolledIds = enrolled.map(e => parseInt(e.course_id, 10));

    const [allCourses] = await pool.query(`SELECT c.id, c.title, c.description, c.level, cat.name AS category
       FROM courses c
       LEFT JOIN categories cat ON cat.id = c.category_id
       WHERE c.is_approved = TRUE AND c.is_published = TRUE`
    );

    // 2. Prepare Prompt
    const systemPrompt = `You are the IDLE Recommendation Engine. Analyze student performance and provide structured learning advice.
Output MUST be valid JSON with this structure:
{
  "next_lesson": "Brief encouragement or next specific topic",
  "suggested_courses": [{"id": 1, "title": "Course Name"}],
  "focus_areas": ["Area 1", "Area 2"],
  "difficulty_level": "beginner/intermediate/advanced",
  "confidence_score": 0.0-1.0
}
Current Student Stats:
- Avg Quiz Score: ${stats.avg_quiz_score || 0}%
- Avg Progress: ${stats.avg_progress || 0}%
- Courses Enrolled: ${stats.enrolled_count || 0}
- Courses Completed: ${stats.completed_count || 0}

Available Courses Pool:
${allCourses.map(c => `- [ID ${c.id}] ${c.title} (${c.level}): ${c.description}`).join('\n')}

Rules:
1. Don't suggest courses already enrolled (IDs: ${enrolledIds.join(', ') || 'None'}).
2. Keep suggestions relevant to their level/performance.`;

    // 3. Call OpenRouter
    if (!OPENROUTER_API_KEY) throw new Error('AI_CONFIG_MISSING');

    const aiResponse = await createChatCompletion({
      apiKey: OPENROUTER_API_KEY,
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.4,
      referer: process.env.CLIENT_URL || 'http://localhost:5173',
      title: 'IDLE Recommendation Engine',
      timeout: 20000
    });

    const content = aiResponse.choices?.[0]?.message?.content;
    const recommendations = parseRecommendations(content);

    res.json({ ...recommendations, source: 'cloud_ai' });

  } catch (err) {
    console.error('[recommendations] AI Cloud service error:', err.response?.data || err.message);
    console.warn('[recommendations] Using fallback recommendations');

    // Rule-based fallback
    const userId = parseInt(req.user.sub, 10);
    let fallbackConfidence = 0.5;
    try {
      if (userId) {
        const [[s]] = await pool.query(`SELECT ROUND(AVG(a.score), 1) AS avg_quiz_score FROM assessments a WHERE a.user_id = $1`,
          [userId]
        );
        if (s?.avg_quiz_score) fallbackConfidence = s.avg_quiz_score / 100;
      }
    } catch (_) { }

    return res.json({
      next_lesson: 'Continue exploring your current courses and stay consistent!',
      suggested_courses: [],
      focus_areas: ['Review recent quiz topics', 'Complete pending modules'],
      difficulty_level: 'intermediate',
      confidence_score: fallbackConfidence,
      source: 'fallback'
    });
  }
});

// ── GET /api/recommendations — get latest recommendations ─────
router.get('/', authenticateToken, requireRole('student'), async (req, res) => {
  // Simple GET version — returns suggested unenrolled courses
  try {
    const userId = parseInt(req.user.sub, 10);

    const [enrolled] = await pool.query('SELECT course_id FROM enrollments WHERE student_id = $1', [userId]
    );
    const enrolledIds = enrolled.map(e => parseInt(e.course_id, 10));

    let query = `
      SELECT c.id, c.title, c.description, c.level, c.thumbnail_url,
             u.full_name AS instructor_name, cat.name AS category_name,
             COUNT(DISTINCT e2.id) AS enrollment_count
      FROM courses c
      JOIN users u ON u.id = c.instructor_id
      LEFT JOIN categories cat ON cat.id = c.category_id
      LEFT JOIN enrollments e2 ON e2.course_id = c.id
      WHERE c.is_approved = TRUE AND c.is_published = TRUE
    `;

    if (enrolledIds.length > 0) {
      query += ` AND c.id NOT IN (${enrolledIds.join(',')})`;
    }

    query += ' GROUP BY c.id, u.full_name, cat.name ORDER BY enrollment_count DESC LIMIT 4';

    const [courses] = await pool.query(query);
    res.json({ suggested_courses: courses, source: 'popularity' });
  } catch (err) {
    console.error('[GET /recommendations]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
