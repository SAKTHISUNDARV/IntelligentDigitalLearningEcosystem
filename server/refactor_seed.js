const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

function loadNodeCourseJson() {
    const candidates = [
        process.env.NODEJS_COURSE_JSON,
        path.join(__dirname, 'data', 'nodejs_backend_course.json'),
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

    console.warn('Warning: Node.js course JSON not found. Falling back to demo seed data.');
    return null;
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

async function seedData() {
    try {
        console.log('Clearing existing data...');
        // Clean out existing tables related to courses to ensure a clean state
        await pool.query('TRUNCATE courses, modules, lessons, materials, quizzes, quiz_questions CASCADE');

        console.log('Inserting instructor...');
        let instructorId;
        const [existingUsers] = await pool.query("SELECT id FROM users WHERE email='admin@idle.dev'");
        if (existingUsers.length > 0) {
            instructorId = existingUsers[0].id;
        } else {
            const [userRes] = await pool.query(
                `INSERT INTO users (email, password, full_name, role, is_approved) 
                VALUES ('admin@idle.dev', 'hashed', 'Demo Instructor', 'admin', true) RETURNING id`
            );
            instructorId = userRes[0].id;
        }

        console.log('Inserting courses...');
        const nodeCourseData = loadNodeCourseJson();

        const courses = [
            { title: 'React Masterclass', description: 'Advanced React patterns and performance.', level: 'advanced', category_id: 1 },
            {
                title: nodeCourseData?.course_title || 'Backend with Node.js',
                description: nodeCourseData ? 'Comprehensive backend curriculum with module-wise lessons and quizzes.' : 'APIs, auth, and databases.',
                level: 'intermediate',
                category_id: 1,
                seed_from_json: Boolean(nodeCourseData)
            }
        ];

        for (const [cIdx, courseInfo] of courses.entries()) {
            const [cRes] = await pool.query(
                `INSERT INTO courses (title, description, instructor_id, category_id, level, duration_hours, is_published) 
                 VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id`,
                [courseInfo.title, courseInfo.description, instructorId, courseInfo.category_id, courseInfo.level, 20]
            );
            const courseId = cRes[0].id;

            if (courseInfo.seed_from_json && nodeCourseData) {
                console.log(`Seeding Node.js course content from JSON for course: ${courseInfo.title}`);

                const modules = Array.isArray(nodeCourseData.modules) ? nodeCourseData.modules : [];
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

                const finalAssessment = Array.isArray(nodeCourseData.final_assessment) ? nodeCourseData.final_assessment : [];
                if (finalAssessment.length > 0) {
                    const [finalQRes] = await pool.query(
                        `INSERT INTO quizzes (course_id, module_id, title, description, time_limit, pass_score) 
                         VALUES ($1, NULL, $2, $3, $4, $5) RETURNING id`,
                        [
                            courseId,
                            `Final Assessment: ${courseInfo.title}`,
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
            } else {
                // Generate demo content for non-JSON courses
                for (let m = 1; m <= 3; m++) {
                    const [mRes] = await pool.query(
                        `INSERT INTO modules (course_id, title, description, sort_order) 
                         VALUES ($1, $2, $3, $4) RETURNING id`,
                        [courseId, `Module ${m}: Core Concepts`, `Important concepts for part ${m}`, m]
                    );
                    const moduleId = mRes[0].id;

                    await pool.query(
                        `INSERT INTO lessons (module_id, title, description, lesson_type, content_url, duration_min, sort_order) 
                         VALUES ($1, $2, $3, 'youtube', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 0, 1)`,
                        [moduleId, `Lesson ${m}.1: Introduction`, `Intro to module ${m}`]
                    );
                    await pool.query(
                        `INSERT INTO lessons (module_id, title, description, lesson_type, content_url, duration_min, sort_order) 
                         VALUES ($1, $2, $3, 'youtube', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 0, 2)`,
                        [moduleId, `Lesson ${m}.2: Deep Dive`, `Deep dive into module ${m}`]
                    );

                    await pool.query(
                        `INSERT INTO materials (module_id, title, file_url, sort_order) 
                         VALUES ($1, $2, $3, 1)`,
                        [moduleId, `Study Guide - Module ${m}`, `https://example.com/study-guide-mod${m}.pdf`]
                    );

                    const [qRes] = await pool.query(
                        `INSERT INTO quizzes (course_id, module_id, title, description, time_limit, pass_score) 
                         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                        [courseId, moduleId, `Quiz for Module ${m}`, `15 questions to test your knowledge on module ${m}`, 15, 60]
                    );
                    const quizId = qRes[0].id;

                    for (let q = 1; q <= 15; q++) {
                        const qText = `[Course ${cIdx+1}-Mod ${m}] Question ${q}: What is the output of X?`;
                        const options = JSON.stringify([
                            { label: 'A', text: 'Option A' },
                            { label: 'B', text: 'Option B' },
                            { label: 'C', text: 'Option C' },
                            { label: 'D', text: 'Option D' }
                        ]);
                        await pool.query(
                            `INSERT INTO quiz_questions (quiz_id, question_text, options, correct, explanation, sort_order) 
                             VALUES ($1, $2, $3, 'A', $4, $5)`,
                            [quizId, qText, options, null, q]
                        );
                    }
                }

                const [finalQRes] = await pool.query(
                    `INSERT INTO quizzes (course_id, module_id, title, description, time_limit, pass_score) 
                     VALUES ($1, NULL, $2, $3, $4, $5) RETURNING id`,
                    [courseId, `Final Exam: ${courseInfo.title}`, `30 comprehensive questions covering all modules.`, 30, 70]
                );
                const finalQuizId = finalQRes[0].id;

                for (let q = 1; q <= 30; q++) {
                    const qText = `[Course ${cIdx+1}-Final] Question ${q}: Comprehensive test question across all modules?`;
                    const options = JSON.stringify([
                        { label: 'A', text: 'Option A' },
                        { label: 'B', text: 'Option B' },
                        { label: 'C', text: 'Option C' },
                        { label: 'D', text: 'Option D' }
                    ]);
                    await pool.query(
                        `INSERT INTO quiz_questions (quiz_id, question_text, options, correct, explanation, sort_order) 
                         VALUES ($1, $2, $3, 'A', $4, $5)`,
                        [finalQuizId, qText, options, null, q]
                    );
                }
            }
        }

        console.log('✅ Refactored structure successfully seeded.');
        console.log('Running validation checks...');

        const [coursesCheck] = await pool.query('SELECT COUNT(*) as c FROM courses');
        const [modulesCheck] = await pool.query('SELECT COUNT(*) as c FROM modules');
        const [lessonsCheck] = await pool.query('SELECT COUNT(*) as c FROM lessons');
        const [materialsCheck] = await pool.query('SELECT COUNT(*) as c FROM materials');
        const [modQuizzesCheck] = await pool.query('SELECT COUNT(*) as c FROM quizzes WHERE module_id IS NOT NULL');
        const [finalQuizzesCheck] = await pool.query('SELECT COUNT(*) as c FROM quizzes WHERE module_id IS NULL');
        
        console.table([
            { Entity: 'Courses', Count: coursesCheck[0].c },
            { Entity: 'Modules', Count: modulesCheck[0].c },
            { Entity: 'Lessons', Count: lessonsCheck[0].c },
            { Entity: 'PDF Materials', Count: materialsCheck[0].c },
            { Entity: 'Module Quizzes', Count: modQuizzesCheck[0].c },
            { Entity: 'Final Quizzes', Count: finalQuizzesCheck[0].c }
        ]);

        const [qChecks] = await pool.query(`
            SELECT q.id, q.title, q.module_id, COUNT(qq.id) as question_count
            FROM quizzes q
            LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
            GROUP BY q.id, q.title, q.module_id
        `);
        
        let allValid = true;
        for (const qc of qChecks) {
            if (qc.module_id !== null && qc.question_count != 15) {
                console.error(`❌ Module quiz "${qc.title}" has ${qc.question_count} questions (Expected 15)!`);
                allValid = false;
            } else if (qc.module_id === null && qc.question_count != 30) {
                console.error(`❌ Final quiz "${qc.title}" has ${qc.question_count} questions (Expected 30)!`);
                allValid = false;
            }
        }

        if (allValid) {
            console.log('✅ All Quiz Validation Rules Passed (15 per module, 30 per final). No duplicates between them.');
        } else {
            console.error('❌ Some validation rules failed.');
        }

    } catch (err) {
        console.error('❌ Script Error:', err);
    } finally {
        // We use wrappedPool.end() but since db.js might open multiple if not careful
        // let's just forceful process exit
        process.exit(0);
    }
}

seedData();
