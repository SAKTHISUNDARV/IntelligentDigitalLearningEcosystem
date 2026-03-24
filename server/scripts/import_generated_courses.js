const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

const DEFAULT_ADMIN_EMAIL = 'admin@idle.dev';

function loadFile(filePath) {
  if (!filePath) {
    throw new Error('Usage: node server/scripts/import_generated_courses.js <path-to-courses-json>');
  }

  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Courses JSON not found: ${resolvedPath}`);
  }

  return {
    resolvedPath,
    data: JSON.parse(fs.readFileSync(resolvedPath, 'utf8'))
  };
}

function normalizeTags(tags) {
  return Array.isArray(tags) ? tags.filter(Boolean).map((tag) => String(tag).trim()).filter(Boolean) : [];
}

function normalizeOptions(optionMap) {
  return ['A', 'B', 'C', 'D'].map((label) => ({
    label,
    text: String(optionMap?.[label] || '').trim()
  }));
}

function guessCategory(course) {
  const haystack = [
    course?.title,
    course?.description,
    ...(Array.isArray(course?.tags) ? course.tags : [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (haystack.includes('devops')) {
    return {
      name: 'DevOps',
      description: 'Courses covering CI/CD, deployment, infrastructure, automation, and operations.'
    };
  }

  if (
    haystack.includes('sql') ||
    haystack.includes('database') ||
    haystack.includes('postgres') ||
    haystack.includes('mysql') ||
    haystack.includes('mongodb') ||
    haystack.includes('redis') ||
    haystack.includes('nosql')
  ) {
    return {
      name: 'Database',
      description: 'Courses covering SQL, NoSQL, data modeling, optimization, and database systems.'
    };
  }

  return {
    name: 'Web Development',
    description: 'Courses related to frontend, backend, and modern web application development.'
  };
}

async function getAdminUserId() {
  const [admins] = await pool.query(
    `SELECT id
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

async function getOrCreateCategoryId(category) {
  const [existing] = await pool.query(
    `SELECT id FROM categories WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    [category.name]
  );

  if (existing.length) {
    return existing[0].id;
  }

  const [created] = await pool.query(
    `INSERT INTO categories (name, description)
     VALUES ($1, $2)
     RETURNING id`,
    [category.name, category.description || null]
  );

  return created[0].id;
}

async function removeExistingCourse(title) {
  const [existing] = await pool.query(
    `SELECT id FROM courses WHERE LOWER(title) = LOWER($1)`,
    [title]
  );

  for (const row of existing) {
    await pool.query(`DELETE FROM courses WHERE id = $1`, [row.id]);
  }
}

async function insertQuestions(quizId, questions) {
  const safeQuestions = Array.isArray(questions) ? questions : [];

  for (let index = 0; index < safeQuestions.length; index += 1) {
    const question = safeQuestions[index];
    await pool.query(
      `INSERT INTO quiz_questions (quiz_id, question_text, options, correct, explanation, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        quizId,
        String(question.question_text || '').trim(),
        JSON.stringify(normalizeOptions(question.options)),
        String(question.correct || 'A').trim().toUpperCase(),
        question.explanation || null,
        question.sort_order || index + 1
      ]
    );
  }
}

async function importSingleCourse(entry, instructorId) {
  const course = entry?.course;
  const modules = Array.isArray(entry?.modules) ? entry.modules : [];
  const finalAssessment = entry?.final_assessment || null;

  if (!course?.title) {
    throw new Error('Each generated course must include course.title.');
  }

  const category = guessCategory(course);
  const categoryId = await getOrCreateCategoryId(category);

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
      Number(course.duration_hours || 0),
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
          Number(lesson.duration_min || 0),
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
          Number(moduleItem.quiz.time_limit || 15),
          Number(moduleItem.quiz.pass_score || 60)
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
        Number(finalAssessment.time_limit || 45),
        Number(finalAssessment.pass_score || 70)
      ]
    );

    await insertQuestions(quizRows[0].id, finalAssessment.questions);
  }

  return {
    title: course.title,
    modules: modules.length
  };
}

async function importGeneratedCourses(filePath) {
  const { resolvedPath, data } = loadFile(filePath);
  const generatedCourses = Array.isArray(data?.generated_courses) ? data.generated_courses : [];

  if (!generatedCourses.length) {
    throw new Error('No generated_courses array found in the JSON file.');
  }

  const instructorId = await getAdminUserId();
  console.log(`Importing ${generatedCourses.length} courses from ${resolvedPath}`);

  const imported = [];

  try {
    await pool.query('BEGIN');

    for (const entry of generatedCourses) {
      const result = await importSingleCourse(entry, instructorId);
      imported.push(result);
      console.log(`Imported: ${result.title}`);
    }

    await pool.query('COMMIT');
    console.log(`Imported ${imported.length} courses successfully.`);
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  } finally {
    await pool.end();
  }
}

importGeneratedCourses(process.argv[2]).catch(async (error) => {
  console.error('Import failed:', error.message);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
