const { pool } = require('./db');
require('./config/loadEnv');

async function testSubmission() {
    const quizId = 16; // From user's screenshot
    const userId = 1;  // Admin user from previous checks

    try {
        console.log(`Testing submission for Quiz ${quizId}, User ${userId}...`);
        
        // 1. Fetch quiz
        const [quiz] = await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
        if (!quiz.length) {
            console.error('Quiz not found. Let\'s check available quizzes:');
            const [all] = await pool.query('SELECT id, title FROM quizzes LIMIT 10');
            console.table(all);
            return;
        }
        console.log('Quiz found:', quiz[0].title);

        // 2. Fetch questions
        const [questions] = await pool.query('SELECT id, correct FROM quiz_questions WHERE quiz_id = $1', [quizId]);
        console.log(`Found ${questions.length} questions.`);

        // 3. Simulate answers
        const answers = {};
        questions.forEach(q => {
            answers[q.id] = q.correct; // All correct for test
        });

        const correctCount = questions.length;
        const time_taken = 300;
        const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
        const passed = score >= (quiz[0].pass_score || 60);

        console.log(`Calculated score: ${score}, passed: ${passed}`);

        // 4. Try Insert
        console.log('Attempting INSERT into assessments...');
        const [result] = await pool.query(
            'INSERT INTO assessments (quiz_id, user_id, score, answers, passed, time_taken) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [quizId, userId, score, JSON.stringify(answers), passed, time_taken]
        );
        console.log('INSERT SUCCESS. New assessment ID:', result[0]?.id);

        // 5. Check enrollment update
        const courseId = quiz[0].course_id;
        console.log(`Checking enrollment for Course ${courseId}...`);
        const [enrollment] = await pool.query('SELECT progress FROM enrollments WHERE student_id = $1 AND course_id = $2',
            [userId, courseId]
        );
        
        if (enrollment.length) {
            console.log(`Enrollment found. Current progress: ${enrollment[0].progress}`);
            if (enrollment[0].progress >= 80 && score >= 80) {
                console.log('Attempting to update enrollment to completed...');
                await pool.query('UPDATE enrollments SET completed = TRUE, completed_at = NOW() WHERE student_id = $1 AND course_id = $2 AND completed = FALSE',
                    [userId, courseId]
                );
                console.log('Enrollment update success.');
            }
        } else {
            console.log('No enrollment found for this user in this course. (This might be why if the UI assumes one exists)');
        }

        console.log('FULL TEST SUCCESS.');

    } catch (err) {
        console.error('TEST FAILED:', err);
    } finally {
        process.exit(0);
    }
}

testSubmission();
