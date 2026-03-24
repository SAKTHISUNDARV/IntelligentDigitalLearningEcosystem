const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

const CATEGORY_NAME = 'Web Development';
const DEFAULT_ADMIN_EMAIL = 'admin@idle.dev';

function loadSchema(filePath) {
  if (!filePath) {
    throw new Error('Usage: node server/scripts/import_course_schema.js <path-to-course-json>');
  }

  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Course JSON not found: ${resolvedPath}`);
  }

  return {
    resolvedPath,
    data: JSON.parse(fs.readFileSync(resolvedPath, 'utf8'))
  };
}

function normalizeOptions(optionMap) {
  const labels = ['A', 'B', 'C', 'D'];
  return labels.map((label) => ({
    label,
    text: String(optionMap?.[label] || '').trim()
  }));
}

function normalizeTags(tags) {
  return Array.isArray(tags) ? tags.filter(Boolean) : [];
}

async function getAdminUserId() {
  const [admins] = await pool.query(
    `SELECT id, email
     FROM users
     WHERE role = 'admin'
     ORDER BY CASE WHEN LOWER(email) = LOWER($1) THEN 0 ELSE 1 END, id ASC
     LIMIT 1`,
    [DEFAULT_ADMIN_EMAIL]
  );

  if (!admins.length) {
    throw new Error('No admin user found. Create an admin account before importing courses.');
  }

  return admins[0].id;
}

async function getOrCreateCategoryId() {
  const [existing] = await pool.query(
    `SELECT id FROM categories WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    [CATEGORY_NAME]
  );

  if (existing.length) {
    return existing[0].id;
  }

  const [created] = await pool.query(
    `INSERT INTO categories (name, description)
     VALUES ($1, $2)
     RETURNING id`,
    [CATEGORY_NAME, 'Courses related to frontend, backend, and modern web application development.']
  );

  return created[0].id;
}

async function removeExistingCourse(title) {
  const [existing] = await pool.query(
    `SELECT id FROM courses WHERE LOWER(title) = LOWER($1)`,
    [title]
  );

  for (const course of existing) {
    await pool.query(`DELETE FROM courses WHERE id = $1`, [course.id]);
  }
}

async function insertQuestions(quizId, questions) {
  const safeQuestions = Array.isArray(questions) ? questions : [];

  for (let index = 0; index < safeQuestions.length; index += 1) {
    const question = safeQuestions[index];
    const options = normalizeOptions(question.options);

    await pool.query(
      `INSERT INTO quiz_questions (quiz_id, question_text, options, correct, explanation, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        quizId,
        question.question_text,
        JSON.stringify(options),
        String(question.correct || 'A').trim().toUpperCase(),
        question.explanation || null,
        question.sort_order || index + 1
      ]
    );
  }
}

async function importCourseSchema(filePath) {
  const { resolvedPath, data } = loadSchema(filePath);
  const course = data?.course;
  const modules = Array.isArray(data?.modules) ? data.modules : [];
  const finalAssessment = data?.final_assessment || null;

  if (!course?.title) {
    throw new Error('Invalid schema: course.title is required.');
  }

  const instructorId = await getAdminUserId();
  const categoryId = await getOrCreateCategoryId();

  console.log(`Importing course from ${resolvedPath}`);
  console.log(`Course: ${course.title}`);

  try {
    await pool.query('BEGIN');
    await removeExistingCourse(course.title);

    const [courseRows] = await pool.query(
      `INSERT INTO courses (
         title, description, instructor_id, category_id, thumbnail_url,
         level, duration_hours, is_approved, is_published, price, tags
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        course.title,
        course.description || null,
        instructorId,
        categoryId,
        course.thumbnail_url || null,
        course.level || 'beginner',
        course.duration_hours || 0,
        Boolean(course.is_approved),
        Boolean(course.is_published),
        Number(course.price || 0),
        JSON.stringify(normalizeTags(course.tags))
      ]
    );

    const courseId = courseRows[0].id;

    for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex += 1) {
      const moduleItem = modules[moduleIndex];
      const [moduleRows] = await pool.query(
        `INSERT INTO modules (course_id, title, description, sort_order)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          courseId,
          moduleItem.title,
          moduleItem.description || null,
          moduleItem.sort_order || moduleIndex + 1
        ]
      );

      const moduleId = moduleRows[0].id;
      const lessons = Array.isArray(moduleItem.lessons) ? moduleItem.lessons : [];

      for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex += 1) {
        const lesson = lessons[lessonIndex];
        await pool.query(
          `INSERT INTO lessons (module_id, title, description, lesson_type, content_url, duration_min, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            moduleId,
            lesson.title,
            lesson.description || null,
            lesson.lesson_type || 'video',
            lesson.content_url || null,
            lesson.duration_min || 0,
            lesson.sort_order || lessonIndex + 1
          ]
        );

        if (lesson.material?.title && lesson.material?.file_url) {
          await pool.query(
            `INSERT INTO materials (module_id, title, file_url, sort_order)
             VALUES ($1, $2, $3, $4)`,
            [
              moduleId,
              lesson.material.title,
              lesson.material.file_url,
              lesson.material.sort_order || lessonIndex + 1
            ]
          );
        }
      }

      if (moduleItem.quiz?.title) {
        const [quizRows] = await pool.query(
          `INSERT INTO quizzes (course_id, module_id, quiz_type, title, description, time_limit, pass_score)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            courseId,
            moduleId,
            moduleItem.quiz.quiz_type || 'module',
            moduleItem.quiz.title,
            moduleItem.quiz.description || null,
            moduleItem.quiz.time_limit || 15,
            moduleItem.quiz.pass_score || 60
          ]
        );

        await insertQuestions(quizRows[0].id, moduleItem.quiz.questions);
      }
    }

    if (finalAssessment?.title) {
      const [quizRows] = await pool.query(
        `INSERT INTO quizzes (course_id, module_id, quiz_type, title, description, time_limit, pass_score)
         VALUES ($1, NULL, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          courseId,
          finalAssessment.quiz_type || 'final',
          finalAssessment.title,
          finalAssessment.description || null,
          finalAssessment.time_limit || 45,
          finalAssessment.pass_score || 70
        ]
      );

      await insertQuestions(quizRows[0].id, finalAssessment.questions);
    }

    await pool.query('COMMIT');
    console.log(`Imported "${course.title}" successfully.`);
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  } finally {
    await pool.end();
  }
}

importCourseSchema(process.argv[2]).catch(async (error) => {
  console.error('Import failed:', error.message);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
