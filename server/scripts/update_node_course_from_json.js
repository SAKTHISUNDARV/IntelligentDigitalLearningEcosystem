const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

function loadNodeCourseJson() {
  const candidates = [
    process.env.NODEJS_COURSE_JSON,
    path.join(__dirname, '..', 'data', 'nodejs_backend_course.json'),
    'C:\\Users\\sunda\\Downloads\\nodejs_backend_course.json'
  ].filter(Boolean);

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn(`Warning: Failed to read ${p}: ${err.message}`);
    }
  }

  throw new Error('Node.js course JSON not found in expected locations.');
}

function normalizeQuizOptions(options, correctAnswer) {
  const safeOptions = Array.isArray(options) ? options.slice(0, 4) : [];
  const labels = ['A', 'B', 'C', 'D'];

  const mapped = safeOptions.map((text, idx) => ({
    label: labels[idx],
    text: String(text || '').trim()
  }));

  let correctLabel = 'A';
  if (safeOptions.length > 0 && correctAnswer !== undefined && correctAnswer !== null) {
    const correctIndex = safeOptions.findIndex(
      opt => String(opt).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase()
    );
    if (correctIndex >= 0) {
      correctLabel = labels[correctIndex] || 'A';
    }
  }

  return { mapped, correctLabel };
}

async function updateNodeCourse() {
  const data = loadNodeCourseJson();
  const courseTitle = data.course_title || 'Backend with Node.js';

  console.log(`Loading course data for: ${courseTitle}`);

  try {
    await pool.query('BEGIN');

    const [courses] = await pool.query(
      `SELECT id, title FROM courses WHERE title ILIKE $1 ORDER BY id ASC`,
      [courseTitle]
    );

    if (!courses.length) {
      throw new Error(`Course not found with title: ${courseTitle}`);
    }

    const courseId = courses[0].id;
    console.log(`Updating course id ${courseId} (${courses[0].title})`);

    await pool.query(
      `UPDATE courses SET title = $1, description = $2, updated_at = NOW() WHERE id = $3`,
      [courseTitle, 'Comprehensive backend curriculum with module-wise lessons and quizzes.', courseId]
    );

    // Remove existing quizzes (module and final), modules, and dependent content
    await pool.query('DELETE FROM quizzes WHERE course_id = $1', [courseId]);
    await pool.query('DELETE FROM modules WHERE course_id = $1', [courseId]);

    const modules = Array.isArray(data.modules) ? data.modules : [];
    for (let m = 0; m < modules.length; m++) {
      const moduleInfo = modules[m];
      const [mRes] = await pool.query(
        `INSERT INTO modules (course_id, title, description, sort_order) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [courseId, moduleInfo.module_title, moduleInfo.description || null, m + 1]
      );
      const moduleId = mRes[0].id;

      const lessons = Array.isArray(moduleInfo.lessons) ? moduleInfo.lessons : [];
      for (let l = 0; l < lessons.length; l++) {
        const lesson = lessons[l];
        await pool.query(
          `INSERT INTO lessons (module_id, title, description, lesson_type, content_url, duration_min, sort_order) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            moduleId,
            lesson.lesson_title,
            null,
            'youtube',
            lesson.youtube_video || null,
            0,
            l + 1
          ]
        );

        if (lesson.pdf_material) {
          await pool.query(
            `INSERT INTO materials (module_id, title, file_url, sort_order) 
             VALUES ($1, $2, $3, $4)`,
            [
              moduleId,
              `Lesson PDF - ${lesson.lesson_title}`,
              lesson.pdf_material,
              l + 1
            ]
          );
        }
      }

      const moduleQuiz = Array.isArray(moduleInfo.quiz) ? moduleInfo.quiz : [];
      if (moduleQuiz.length > 0) {
        const [qRes] = await pool.query(
          `INSERT INTO quizzes (course_id, module_id, title, description, time_limit, pass_score) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [
            courseId,
            moduleId,
            `Quiz: ${moduleInfo.module_title}`,
            `Module quiz for ${moduleInfo.module_title}`,
            15,
            60
          ]
        );
        const quizId = qRes[0].id;

        for (let q = 0; q < moduleQuiz.length; q++) {
          const question = moduleQuiz[q];
          const { mapped, correctLabel } = normalizeQuizOptions(question.options, question.correct_answer);

          await pool.query(
            `INSERT INTO quiz_questions (quiz_id, question_text, options, correct, explanation, sort_order) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              quizId,
              question.question,
              JSON.stringify(mapped),
              correctLabel,
              null,
              q + 1
            ]
          );
        }
      }
    }

    const finalAssessment = Array.isArray(data.final_assessment) ? data.final_assessment : [];
    if (finalAssessment.length > 0) {
      const [finalQRes] = await pool.query(
        `INSERT INTO quizzes (course_id, module_id, title, description, time_limit, pass_score) 
         VALUES ($1, NULL, $2, $3, $4, $5) RETURNING id`,
        [
          courseId,
          `Final Assessment: ${courseTitle}`,
          'Comprehensive assessment across all modules.',
          30,
          70
        ]
      );
      const finalQuizId = finalQRes[0].id;

      for (let q = 0; q < finalAssessment.length; q++) {
        const question = finalAssessment[q];
        const { mapped, correctLabel } = normalizeQuizOptions(question.options, question.correct_answer);

        await pool.query(
          `INSERT INTO quiz_questions (quiz_id, question_text, options, correct, explanation, sort_order) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            finalQuizId,
            question.question,
            JSON.stringify(mapped),
            correctLabel,
            null,
            q + 1
          ]
        );
      }
    }

    await pool.query('COMMIT');
    console.log('✅ Course updated from JSON successfully.');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('❌ Update failed:', err.message);
  } finally {
    await pool.end();
  }
}

updateNodeCourse();
