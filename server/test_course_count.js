const { pool } = require('./db');

async function test() {
  try {
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM courses c WHERE c.is_approved = TRUE AND c.is_published = TRUE`, []);
    console.log("SUCCESS:", total);
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
test();
