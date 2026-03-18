const { pool } = require('./db');
async function test() {
  try {
    const userId = 2; // Assuming 2 is a valid user
    const title = 'Test Task 2';
    
    console.log("Inserting task...");
    const [result] = await pool.query('INSERT INTO tasks (user_id, title, description, priority, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING task_id',
        [userId, title, null, 'medium', null]
    );
    console.log(result);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
