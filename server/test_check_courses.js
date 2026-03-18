const { pool } = require('./db');
async function test() {
  try {
    const [rows] = await pool.query('SELECT * FROM courses');
    console.log("Total courses:", rows.length);
    console.log(rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
