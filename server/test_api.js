const { pool } = require('./db');
async function test() {
  try {
    const search=''; const category=''; const level='';
    const limit=12; const offset=0;
    let where = ['c.is_approved = TRUE', 'c.is_published = TRUE'];
    const params = [];
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
	
	const sql = `SELECT c.id, c.title, c.description, c.level, c.duration_hours,
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
       ${whereClause}
       GROUP BY c.id, u.full_name, cat.name
       ORDER BY c.created_at DESC
       LIMIT ${limitParam} OFFSET ${offsetParam}`;
	
    console.log("SQL:", sql, params);
    const [rows] = await pool.query(sql, params);
    
    const countSql = `SELECT COUNT(*) AS total FROM courses c ${whereClause}`;
    console.log("Count SQL:", countSql, params.slice(0, -2));
    const [[{ total }]] = await pool.query(countSql, params.slice(0, -2));
    
    console.log("SUCCESS:", rows.length, total);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
