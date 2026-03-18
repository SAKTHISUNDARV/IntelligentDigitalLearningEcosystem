const { pool } = require('./db');

/**
 * Ensures critical tables exist.
 * This is a safeguard for environments where the full SQL dump was not run.
 */
async function initDb() {
    console.log('Checking database tables...');
    try {
        // 0. Ensure users table exists (pre-requisite for foreign keys)
        const [usersExist] = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'");
        if (usersExist.length === 0) {
            console.warn('Users table not found. Skipping dependent tables creation (tasks).');
            return;
        }

        await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL;
    `);

        // 1. Tasks Table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        task_id     SERIAL PRIMARY KEY,
        user_id     INT NOT NULL,
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        priority    VARCHAR(50) DEFAULT 'medium',
        status      VARCHAR(50) DEFAULT 'pending',
        due_date    DATE,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

        await pool.query(`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);`);

        console.log('Database tables verified/created.');
    } catch (err) {
        console.error('Database initialization error:', err.message);
        // We don't exit process here so the app can still try to run
    }
}

module.exports = initDb;
