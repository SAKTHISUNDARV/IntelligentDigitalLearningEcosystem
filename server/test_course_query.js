const { pool } = require('./db');

async function test() {
  try {
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
       FROM courses c
       JOIN users u ON u.id = c.instructor_id
       LEFT JOIN categories cat ON cat.id = c.category_id
       LEFT JOIN enrollments e ON e.course_id = c.id
       WHERE c.is_approved = TRUE AND c.is_published = TRUE
       GROUP BY c.id, u.full_name, cat.name
       ORDER BY c.created_at DESC
       LIMIT $1 OFFSET $2`,
      [12, 0]
    );
    console.log("SUCCESS");
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
test();
