// run_seed.js — executes seed.sql using multipleStatements mode
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createScriptConnection } = require('./db');

async function runSeed() {
    const conn = await createScriptConnection();

    const sql = fs.readFileSync(path.join(__dirname, 'sql', 'seed.sql'), 'utf8');

    try {
        console.log('Executing seed.sql…');
        await conn.query(sql);
        console.log('\n✅  Seed complete!');

        // Quick summary
        const [[rows]] = await conn.query(`
      SELECT
        (SELECT COUNT(*) FROM courses)      AS courses,
        (SELECT COUNT(*) FROM lessons)      AS lessons,
        (SELECT COUNT(*) FROM quizzes)      AS quizzes,
        (SELECT COUNT(*) FROM quiz_questions) AS questions,
        (SELECT COUNT(*) FROM enrollments)  AS enrollments,
        (SELECT COUNT(*) FROM assessments)  AS assessments,
        (SELECT COUNT(*) FROM users)        AS users
    `);
        console.table(rows);
    } catch (err) {
        console.error('❌  Seed error:', err.message);
    } finally {
        await conn.end();
    }
}

runSeed();
