const { pool } = require('./db');

async function fixConstraints() {
    console.log('⏳ Updating database constraints for cascade deletion...');
    
    // Explicit list of constraints to update for true cascade support
    const queries = [
        // Courses -> Users (Instructor)
        {
            name: 'Courses (Instructor)',
            sql: `ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_instructor_id_fkey; 
                  ALTER TABLE courses ADD CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE;`
        },
        // Enrollments -> Users (Student)
        {
            name: 'Enrollments (Student)',
            sql: `ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_student_id_fkey; 
                  ALTER TABLE enrollments ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;`
        },
        // Enrollments -> Courses
        {
            name: 'Enrollments (Course)',
            sql: `ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_course_id_fkey; 
                  ALTER TABLE enrollments ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;`
        },
        // Modules -> Courses
        {
            name: 'Modules (Course)',
            sql: `ALTER TABLE modules DROP CONSTRAINT IF EXISTS modules_course_id_fkey; 
                  ALTER TABLE modules ADD CONSTRAINT modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;`
        },
        // Lessons -> Modules
        {
            name: 'Lessons (Module)',
            sql: `ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_module_id_fkey; 
                  ALTER TABLE lessons ADD CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;`
        },
        // Assessments -> Users
        {
            name: 'Assessments (User)',
            sql: `ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_user_id_fkey; 
                  ALTER TABLE assessments ADD CONSTRAINT assessments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;`
        },
        // Lesson Progress -> Users
        {
            name: 'Lesson Progress (User)',
            sql: `ALTER TABLE lesson_progress DROP CONSTRAINT IF EXISTS lesson_progress_user_id_fkey; 
                  ALTER TABLE lesson_progress ADD CONSTRAINT lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;`
        }
    ];

    for (const item of queries) {
        try {
            await pool.query(item.sql);
            console.log(`✅ Success: ${item.name}`);
        } catch (err) {
            console.error(`❌ Failed: ${item.name} - ${err.message}`);
        }
    }

    console.log('✅ All constraints updated. PLEASE RESTART THE SERVER.');
    process.exit(0);
}

fixConstraints();
