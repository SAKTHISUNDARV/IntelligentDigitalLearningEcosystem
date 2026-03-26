// routes/analytics.js — Analytics for student, instructor, and admin
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// ── GET /api/analytics/student — personal stats ───────────────
router.get('/student', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const userId = parseInt(req.user.sub, 10);
    const [[userMeta]] = await pool.query(
      'SELECT email, full_name FROM users WHERE id = $1',
      [userId]
    );
    const isDemoStudent = userMeta?.email === 'student@idle.dev';

    // Stats: Enrolled, Completed, In-Progress
    const [[stats]] = await pool.query(`SELECT
         COUNT(*)::int AS enrolled_count,
         COALESCE(SUM(CASE WHEN completed = TRUE OR progress = 100 THEN 1 ELSE 0 END), 0)::int AS completed_count,
         COALESCE(SUM(CASE WHEN progress > 0 AND progress < 100 AND completed = FALSE THEN 1 ELSE 0 END), 0)::int AS in_progress_count,
         COALESCE(ROUND(AVG(progress), 1), 0) AS avg_progress
       FROM enrollments WHERE student_id = $1`,
      [userId]
    );

    // Pending tasks count
    const [[taskStats]] = await pool.query(`SELECT COUNT(*)::int AS pending_tasks FROM tasks WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    );

    // Average quiz score
    const [[scoreStats]] = await pool.query(`SELECT COALESCE(ROUND(AVG(score), 1), 0) AS avg_score, COUNT(*)::int AS quizzes_taken
       FROM assessments WHERE user_id = $1`,
      [userId]
    );

    // Lessons completed
    const [[lessonStats]] = await pool.query(`SELECT COUNT(*)::int AS lessons_completed
       FROM lesson_progress
       WHERE user_id = $1 AND completed = TRUE`,
      [userId]
    );

    // Upcoming tasks
    const [upcomingTasks] = await pool.query(`SELECT
         title,
         due_date,
         priority,
         CASE
           WHEN priority = 'high' THEN 'Assessment'
           WHEN priority = 'medium' THEN 'Project'
           ELSE 'Quiz'
         END AS type
       FROM tasks
       WHERE user_id = $1 AND status = 'pending'
       ORDER BY due_date NULLS LAST, created_at DESC
       LIMIT 5`,
      [userId]
    );

    // Recent courses (Continue Learning)
    const [recentCourses] = await pool.query(`SELECT c.id, c.title, c.thumbnail_url, COALESCE(e.progress, 0) AS progress,
              e.completed, e.enrolled_at, COALESCE(e.completed_at, e.enrolled_at) AS updated_at,
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
                SELECT m.title
                FROM modules m
                WHERE m.course_id = c.id
                  AND EXISTS (
                    SELECT 1
                    FROM lessons l
                    LEFT JOIN lesson_progress lp
                      ON lp.lesson_id = l.id
                     AND lp.user_id = e.student_id
                    WHERE l.module_id = m.id
                      AND COALESCE(lp.completed, FALSE) = FALSE
                  )
                ORDER BY m.sort_order ASC, m.id ASC
                LIMIT 1
              ) AS current_module
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.student_id = $1
       ORDER BY COALESCE(e.completed_at, e.enrolled_at) DESC, e.enrolled_at DESC LIMIT 6`,
      [userId]
    );

    // Completed Courses
    const [completedCourses] = await pool.query(`SELECT c.id, c.title, c.thumbnail_url, e.completed_at, COALESCE(e.completed_at, e.enrolled_at) AS updated_at
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.student_id = $1 AND (e.completed = TRUE OR e.progress = 100)
       ORDER BY e.completed_at DESC LIMIT 5`,
      [userId]
    );

    // Unified Recent Activity Feed
    const activityQuery = `
      SELECT 'enrollment' as type, c.title as reference,
             CASE WHEN e.progress = 100 THEN 'Completed course' ELSE 'Started course' END as description,
             COALESCE(e.completed_at, e.enrolled_at) as created_at
      FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.student_id = $1
      UNION ALL
      SELECT 'lesson' as type, l.title as reference,
             'Completed lesson' as description,
             lp.completed_at as created_at
      FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id
      WHERE lp.user_id = $2 AND lp.completed = TRUE
      UNION ALL
      SELECT 'assessment' as type, q.title as reference,
             CONCAT('Finished quiz: ', ROUND(a.score::numeric), '%') as description,
             a.taken_at as created_at
      FROM assessments a JOIN quizzes q ON q.id = a.quiz_id WHERE a.user_id = $3
      UNION ALL
      SELECT 'task' as type, t.title as reference,
             CASE WHEN t.status = 'completed' THEN 'Completed task' ELSE 'Created task' END as description,
             t.updated_at as created_at
      FROM tasks t WHERE t.user_id = $4
      ORDER BY created_at DESC LIMIT 10
    `;
    const [recentActivity] = await pool.query(activityQuery, [userId, userId, userId, userId]);

    // Temporary demo skill progression for the seeded student account until
    // a full skills engine is added on the backend.
    const skillsProgress = isDemoStudent
      ? [
          { name: 'Node.js', progress: 92 },
          { name: 'REST APIs', progress: 88 },
          { name: 'Authentication', progress: 81 },
          { name: 'Database Design', progress: 76 }
        ]
      : [];

    res.json({
      ...stats,
      pending_tasks_count: taskStats.pending_tasks || 0,
      avg_quiz_score: scoreStats.avg_score || 0,
      quizzes_taken: scoreStats.quizzes_taken || 0,
      lessons_completed: lessonStats.lessons_completed || 0,
      upcoming_tasks: upcomingTasks,
      recent_courses: recentCourses,
      completed_courses: completedCourses,
      recent_activity: recentActivity,
      skills_progress: skillsProgress
    });
  } catch (err) {
    console.error('[GET /analytics/student]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/analytics/admin — platform-wide stats ────────────
router.get('/admin', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [[userStats]] = await pool.query(`SELECT
         COUNT(*) AS total_users,
         COUNT(NULLIF(role = 'student', FALSE)) AS total_students,
         COUNT(NULLIF(role = 'admin', FALSE)) AS total_admins,
         COUNT(NULLIF(created_at >= NOW() - INTERVAL '30 days', FALSE)) AS new_users_30d
       FROM users`
    );

    const [[courseStats]] = await pool.query(`SELECT
         COUNT(*) AS total_courses,
         COUNT(NULLIF(is_approved = TRUE, FALSE)) AS approved_courses,
         COUNT(NULLIF(is_approved = FALSE, FALSE)) AS pending_courses,
         COUNT(NULLIF(is_published = TRUE, FALSE)) AS published_courses
       FROM courses`
    );

    const [[enrollStats]] = await pool.query(`SELECT
         COUNT(*) AS total_enrollments,
         ROUND(AVG(progress), 1) AS avg_progress,
         COUNT(NULLIF(completed = TRUE, FALSE)) AS completions
       FROM enrollments`
    );

    const [[assessStats]] = await pool.query(`SELECT COUNT(*) AS total_assessments, ROUND(AVG(score), 1) AS platform_avg_score FROM assessments`
    );

    // Top 5 courses by enrollment
    const [topCourses] = await pool.query(`SELECT c.title, COUNT(e.id) AS enrollment_count, u.full_name AS instructor
       FROM courses c
       JOIN enrollments e ON e.course_id = c.id
       JOIN users u ON u.id = c.instructor_id
       GROUP BY c.id, u.full_name ORDER BY enrollment_count DESC LIMIT 5`
    );

    const [categoryScores] = await pool.query(`
      SELECT
        cat.name AS category,
        COALESCE(ROUND(AVG(a.score), 1), 0) AS avg_score
      FROM categories cat
      JOIN courses c ON c.category_id = cat.id
      LEFT JOIN quizzes q ON q.course_id = c.id
      LEFT JOIN assessments a ON a.quiz_id = q.id
      GROUP BY cat.id, cat.name
      ORDER BY avg_score DESC, cat.name ASC
    `);

    const [topStudents] = await pool.query(`
      SELECT
        u.id,
        u.full_name,
        COUNT(DISTINCT CASE WHEN e.completed = TRUE OR e.progress = 100 THEN e.course_id END)::int AS completed_courses,
        COALESCE(ROUND(AVG(a.score), 1), 0) AS avg_score,
        ROUND(
          (
            COALESCE(AVG(a.score), 0) * 0.7
          ) + (
            COALESCE(AVG(e.progress), 0) * 0.3
          ),
          1
        ) AS performance_score
      FROM users u
      LEFT JOIN enrollments e ON e.student_id = u.id
      LEFT JOIN assessments a ON a.user_id = u.id
      WHERE u.role = 'student'
      GROUP BY u.id, u.full_name
      HAVING COUNT(a.id) > 0 OR COUNT(e.id) > 0
      ORDER BY performance_score DESC, avg_score DESC, completed_courses DESC, u.full_name ASC
      LIMIT 10
    `);

    res.json({
      users: userStats,
      courses: courseStats,
      enrollments: enrollStats,
      assessments: assessStats,
      top_courses: topCourses,
      category_scores: categoryScores,
      top_students: topStudents
    });
  } catch (err) {
    console.error('[GET /analytics/admin]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
