const { pool } = require('./db');
async function test() {
  try {
    const userId = 2; // test student

    // Stats: Enrolled, Completed, In-Progress
    const statsQuery = `SELECT
         COUNT(*) AS enrolled_count,
         COALESCE(COUNT(NULLIF(completed = TRUE OR progress = 100, FALSE)), 0) AS completed_count,
         COALESCE(COUNT(NULLIF(progress > 0 AND progress < 100, FALSE)), 0) AS in_progress_count,
         COALESCE(ROUND(AVG(progress), 1), 0) AS avg_progress
       FROM enrollments WHERE student_id = $1`;
       
    console.log("Running stats query...");
    const [[stats]] = await pool.query(statsQuery, [userId]);
    console.log("Stats ok.");

    // Pending tasks count
    console.log("Running tasks query...");
    const [[taskStats]] = await pool.query(`SELECT COUNT(*) AS pending_tasks FROM tasks WHERE user_id = $1 AND status = 'pending'`, [userId]);
    console.log("Tasks ok.");

    // Average quiz score
    console.log("Running quizzes...");
    const [[scoreStats]] = await pool.query(`SELECT COALESCE(ROUND(AVG(score), 1), 0) AS avg_score, COUNT(*) AS quizzes_taken
       FROM assessments WHERE user_id = $1`, [userId]);
    console.log("Quizzes ok.");

    // Recent courses (Continue Learning)
    console.log("Running recent...");
    const [recentCourses] = await pool.query(`SELECT c.id, c.title, c.thumbnail_url, COALESCE(e.progress, 0) AS progress, e.enrolled_at, e.updated_at
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.student_id = $1
       ORDER BY e.updated_at DESC, e.enrolled_at DESC LIMIT 6`, [userId]);
    console.log("Recent ok.");

    // Completed Courses
    console.log("Running completed...");
    const [completedCourses] = await pool.query(`SELECT c.id, c.title, c.thumbnail_url, e.completed_at, e.updated_at
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.student_id = $1 AND (e.completed = TRUE OR e.progress = 100)
       ORDER BY COALESCE(e.completed_at, e.updated_at) DESC LIMIT 5`, [userId]);
    console.log("Completed ok.");

    // Unified Recent Activity Feed
    console.log("Running activity feed...");
    const activityQuery = `
      (SELECT 'enrollment' as type, c.title as reference, 
              CASE WHEN e.progress = 100 THEN 'Completed course' ELSE 'Started course' END as description, 
              e.updated_at as timestamp
       FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.student_id = $1)
      UNION ALL
      (SELECT 'assessment' as type, q.title as reference, 
              CONCAT('Finished quiz: ', ROUND(a.score), '%') as description, 
              a.taken_at as timestamp
       FROM assessments a JOIN quizzes q ON q.id = a.quiz_id WHERE a.user_id = $2)
      UNION ALL
      (SELECT 'task' as type, t.title as reference, 
              CASE WHEN t.status = 'completed' THEN 'Completed task' ELSE 'Created task' END as description, 
              t.updated_at as timestamp
       FROM tasks t WHERE t.user_id = $3)
      ORDER BY timestamp DESC LIMIT 10
    `;
    const [recentActivity] = await pool.query(activityQuery, [userId, userId, userId]);
    console.log("Activity ok.");

    console.log("SUCCESS");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
