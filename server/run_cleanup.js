// run_cleanup.js — clears seed/fake data from idle_db, keeps courses & quizzes
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createScriptConnection } = require('./db');

async function runCleanup() {
    const conn = await createScriptConnection();

    const sql = fs.readFileSync(path.join(__dirname, 'sql', 'cleanup_seed.sql'), 'utf8');

    try {
        console.log('🧹 Running cleanup_seed.sql…');
        await conn.query(sql);

        // Print summary
        const [[summary]] = await conn.query(`
            SELECT
              (SELECT COUNT(*) FROM users)          AS users,
              (SELECT COUNT(*) FROM courses)        AS courses,
              (SELECT COUNT(*) FROM lessons)        AS lessons,
              (SELECT COUNT(*) FROM quizzes)        AS quizzes,
              (SELECT COUNT(*) FROM enrollments)    AS enrollments,
              (SELECT COUNT(*) FROM assessments)    AS assessments,
              0                                     AS certificates
        `);

        console.log('\n✅  Cleanup complete! Database state:');
        console.table(summary);

        const [users] = await conn.query('SELECT id, email, full_name, role FROM users ORDER BY id');
        console.log('\n👥  Remaining users:');
        console.table(users);

    } catch (err) {
        console.error('❌  Cleanup error:', err.message);
    } finally {
        await conn.end();
    }
}

runCleanup();
