const { createScriptConnection } = require('../db');

const DEMO_EMAIL = 'student@idle.dev';

async function ensureEnrollment(db, userId, courseId) {
  const [existing] = await db.query(
    'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
    [userId, courseId]
  );

  if (!existing.length) {
    await db.query(
      'INSERT INTO enrollments (student_id, course_id, progress, completed) VALUES ($1, $2, 0, FALSE)',
      [userId, courseId]
    );
  }
}

async function markLessonsComplete(db, userId, lessonIds) {
  for (const lessonId of lessonIds) {
    await db.query(
      `INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at)
       VALUES ($1, $2, TRUE, NOW())
       ON CONFLICT (user_id, lesson_id)
       DO UPDATE SET completed = TRUE, completed_at = NOW()`,
      [userId, lessonId]
    );
  }
}

async function ensurePassedAssessment(db, userId, quiz) {
  const [existing] = await db.query(
    'SELECT id, passed FROM assessments WHERE user_id = $1 AND quiz_id = $2 ORDER BY taken_at DESC LIMIT 1',
    [userId, quiz.id]
  );

  if (existing[0]?.passed) {
    return false;
  }

  const [questionRows] = await db.query(
    'SELECT id, correct FROM quiz_questions WHERE quiz_id = $1 ORDER BY sort_order ASC, id ASC',
    [quiz.id]
  );

  if (!questionRows.length) {
    return false;
  }

  const answers = {};
  questionRows.forEach((question) => {
    answers[question.id] = String(question.correct || 'A').toUpperCase();
  });

  await db.query(
    `INSERT INTO assessments (quiz_id, user_id, score, answers, passed, time_taken, taken_at)
     VALUES ($1, $2, $3, $4, TRUE, $5, NOW())`,
    [quiz.id, userId, 100, JSON.stringify(answers), Math.max(300, questionRows.length * 45)]
  );

  return true;
}

async function updateEnrollmentProgress(db, userId, courseId) {
  const [[totals]] = await db.query(
    `SELECT
        (SELECT COUNT(*)
         FROM lessons l
         JOIN modules m ON m.id = l.module_id
         WHERE m.course_id = $1) +
        (SELECT COUNT(*)
         FROM quizzes q
         WHERE q.course_id = $1) AS total_items,
        (SELECT COUNT(*)
         FROM lesson_progress lp
         JOIN lessons l ON l.id = lp.lesson_id
         JOIN modules m ON m.id = l.module_id
         WHERE lp.user_id = $2 AND lp.completed = TRUE AND m.course_id = $1) +
        (SELECT COUNT(DISTINCT a.quiz_id)
         FROM assessments a
         JOIN quizzes q ON q.id = a.quiz_id
         WHERE a.user_id = $2 AND a.passed = TRUE AND q.course_id = $1) AS completed_items`,
    [courseId, userId]
  );

  const totalItems = Number(totals?.total_items || 0);
  const completedItems = Number(totals?.completed_items || 0);
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const completed = totalItems > 0 && completedItems >= totalItems;

  await db.query(
    `UPDATE enrollments
     SET progress = $1,
         completed = $2,
         completed_at = CASE WHEN $2 THEN COALESCE(completed_at, NOW()) ELSE completed_at END
     WHERE student_id = $3 AND course_id = $4`,
    [progress, completed, userId, courseId]
  );

  return { progress, completed };
}

async function main() {
  const db = await createScriptConnection();

  try {
    const [users] = await db.query(
      'SELECT id, email, full_name FROM users WHERE email = $1',
      [DEMO_EMAIL]
    );

    if (!users[0]) {
      throw new Error(`Demo user not found: ${DEMO_EMAIL}`);
    }

    const user = users[0];
    const [courseRows] = await db.query(
      `SELECT c.id, c.title
       FROM courses c
       WHERE EXISTS (
         SELECT 1
         FROM modules m
         JOIN lessons l ON l.module_id = m.id
         WHERE m.course_id = c.id
       )
       AND EXISTS (
         SELECT 1
         FROM quizzes q
         WHERE q.course_id = c.id
       )
       ORDER BY CASE WHEN c.id = 13 THEN 0 ELSE 1 END, c.id ASC
       LIMIT 2`
    );

    if (!courseRows.length) {
      throw new Error('No course with lessons and quizzes is available to seed demo progress.');
    }

    const summary = [];

    for (const course of courseRows) {
      await ensureEnrollment(db, user.id, course.id);

      const [lessons] = await db.query(
        `SELECT l.id
         FROM lessons l
         JOIN modules m ON m.id = l.module_id
         WHERE m.course_id = $1
         ORDER BY m.sort_order ASC, l.sort_order ASC, l.id ASC`,
        [course.id]
      );

      const [quizzes] = await db.query(
        `SELECT id, title, quiz_type, module_id
         FROM quizzes
         WHERE course_id = $1
         ORDER BY CASE WHEN quiz_type = 'module' THEN 0 ELSE 1 END, id ASC`,
        [course.id]
      );

      await markLessonsComplete(db, user.id, lessons.map((lesson) => lesson.id));

      let passedQuizCount = 0;
      for (const quiz of quizzes) {
        const created = await ensurePassedAssessment(db, user.id, quiz);
        if (created || !created) {
          passedQuizCount += 1;
        }
      }

      const progressState = await updateEnrollmentProgress(db, user.id, course.id);
      summary.push({
        course_id: course.id,
        title: course.title,
        lessons_completed: lessons.length,
        quizzes_passed: passedQuizCount,
        progress: progressState.progress,
        completed: progressState.completed
      });
    }

    console.log(JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      },
      seeded_courses: summary
    }, null, 2));
  } finally {
    db.end();
  }
}

main().catch((err) => {
  console.error('SEED_FAILED:', err.message);
  process.exit(1);
});
