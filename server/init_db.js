const { pool } = require('./db');
const bcrypt = require('bcrypt');

const DEMO_USERS = [
    {
        email: 'admin@idle.dev',
        password: 'Admin@1234',
        full_name: 'System Admin',
        role: 'admin'
    },
    {
        email: 'student@idle.dev',
        password: 'Admin@1234',
        full_name: 'Demo Student',
        role: 'student'
    }
];

async function ensureDemoUsers() {
    for (const demoUser of DEMO_USERS) {
        const passwordHash = await bcrypt.hash(demoUser.password, 10);
        await pool.query(
            `INSERT INTO users (email, password, full_name, role, is_approved)
             VALUES ($1, $2, $3, $4, TRUE)
             ON CONFLICT (email) DO UPDATE SET
               password = EXCLUDED.password,
               full_name = EXCLUDED.full_name,
               role = EXCLUDED.role,
               is_approved = TRUE`,
            [demoUser.email, passwordHash, demoUser.full_name, demoUser.role]
        );
    }
}

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

        const [quizzesExist] = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quizzes'");
        if (quizzesExist.length > 0) {
            await pool.query(`
        ALTER TABLE quizzes
        ADD COLUMN IF NOT EXISTS module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE;

        ALTER TABLE quizzes
        ADD COLUMN IF NOT EXISTS quiz_type VARCHAR(20) DEFAULT 'module';

        ALTER TABLE quizzes
        ALTER COLUMN pass_score SET DEFAULT 60;
      `);

            await pool.query(`
        UPDATE quizzes
        SET quiz_type = CASE WHEN module_id IS NULL THEN 'final' ELSE 'module' END
        WHERE quiz_type IS NULL OR quiz_type NOT IN ('module', 'final');

        UPDATE quizzes
        SET pass_score = 60
        WHERE pass_score IS DISTINCT FROM 60;
      `);
        }

        const [quizQuestionsExist] = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quiz_questions'");
        if (quizQuestionsExist.length > 0) {
            await pool.query(`
        ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS explanation TEXT;
        ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
        ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS option_a TEXT;
        ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS option_b TEXT;
        ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS option_c TEXT;
        ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS option_d TEXT;
        ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS correct_answer VARCHAR(1);
      `);
        }

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

        await ensureDemoUsers();

        console.log('Database tables verified/created.');
    } catch (err) {
        console.error('Database initialization error:', err.message);
        throw err;
    }
}

module.exports = initDb;
