-- ============================================================
-- IDLE (Intelligent Digital Learning Ecosystem) - PostgreSQL Schema
-- Optimized for Supabase/PostgreSQL
-- ============================================================

-- Drop existing tables (if any)
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id           SERIAL PRIMARY KEY,
    email        VARCHAR(255) UNIQUE NOT NULL,
    password     TEXT NOT NULL,
    full_name    VARCHAR(255) NOT NULL,
    role         VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')) DEFAULT 'student',
    is_approved  BOOLEAN NOT NULL DEFAULT TRUE,
    avatar_url   TEXT,
    bio          TEXT,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- COURSES
-- ============================================================
CREATE TABLE courses (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    instructor_id   INTEGER NOT NULL REFERENCES users(id),
    category_id     INTEGER REFERENCES categories(id),
    thumbnail_url   TEXT,
    level           VARCHAR(20) DEFAULT 'beginner' CHECK (level IN ('beginner','intermediate','advanced')),
    duration_hours  DECIMAL(10,2) DEFAULT 0,
    is_approved     BOOLEAN DEFAULT TRUE,
    is_published    BOOLEAN DEFAULT TRUE,
    price           DECIMAL(10,2) DEFAULT 0.00,
    tags            JSON,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- MODULES
-- ========================
CREATE TABLE modules (
    id          SERIAL PRIMARY KEY,
    course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title       VARCHAR(500) NOT NULL,
    description TEXT,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- LESSONS
-- ========================
CREATE TABLE lessons (
    id           SERIAL PRIMARY KEY,
    module_id    INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title        VARCHAR(500) NOT NULL,
    description  TEXT,
    lesson_type  VARCHAR(20) DEFAULT 'video' CHECK (lesson_type IN ('video','pdf','text','youtube')),
    content_url  TEXT,
    duration_min INTEGER DEFAULT 0,
    sort_order   INTEGER DEFAULT 0,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- LESSON PROGRESS
-- ========================
CREATE TABLE lesson_progress (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id    INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed    BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, lesson_id)
);

-- ========================
-- MATERIALS (PDFs)
-- ========================
CREATE TABLE materials (
    id          SERIAL PRIMARY KEY,
    module_id   INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title       VARCHAR(500) NOT NULL,
    file_url    TEXT NOT NULL,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- QUIZZES
-- ========================
CREATE TABLE quizzes (
    id           SERIAL PRIMARY KEY,
    course_id    INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_id    INTEGER REFERENCES modules(id) ON DELETE CASCADE, -- NULL for final course quiz
    quiz_type    VARCHAR(20) DEFAULT 'module' CHECK (quiz_type IN ('module','final')),
    title        VARCHAR(500) NOT NULL,
    description  TEXT,
    time_limit   INTEGER DEFAULT 10,
    pass_score   INTEGER DEFAULT 60,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- QUIZ QUESTIONS
-- ========================
CREATE TABLE quiz_questions (
    id            SERIAL PRIMARY KEY,
    quiz_id       INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options       JSON NOT NULL, -- [{"label":"A","text":"..."}, ...]
    correct       VARCHAR(1) NOT NULL, -- 'A', 'B', 'C', 'D'
    explanation   TEXT,
    sort_order    INTEGER DEFAULT 0
);

-- ========================
-- ENROLLMENTS
-- ========================
CREATE TABLE enrollments (
    id           SERIAL PRIMARY KEY,
    student_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id    INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    progress     DECIMAL(5,2) DEFAULT 0.00,
    completed    BOOLEAN DEFAULT FALSE,
    enrolled_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(student_id, course_id)
);

-- ========================
-- ASSESSMENTS (Quiz Results)
-- ========================
CREATE TABLE assessments (
    id          SERIAL PRIMARY KEY,
    quiz_id     INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score       DECIMAL(5,2) NOT NULL,
    answers     JSON, -- {"question_id": "A", ...}
    passed      BOOLEAN DEFAULT FALSE,
    time_taken  INTEGER DEFAULT 0,
    taken_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- TASKS (Todo)
-- ========================
CREATE TABLE tasks (
    task_id     SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    priority    VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
    status      VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed')),
    due_date    DATE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INITIAL SEED (Mini)
-- ============================================================
INSERT INTO users (email, password, full_name, role) VALUES
('admin@idle.dev',   '$2b$10$X7V5v1sFzqrPbPDcDaLEgOoHf6g7p9YMQ3A.fJGl8U/MWJwbbXGbW', 'System Admin', 'admin'),
('student@idle.dev', '$2b$10$X7V5v1sFzqrPbPDcDaLEgOoHf6g7p9YMQ3A.fJGl8U/MWJwbbXGbW', 'Demo Student', 'student');

INSERT INTO categories (name) VALUES 
('Web Development'), ('Data Science'), ('Mobile Development'), ('Cybersecurity');

-- Courses 1-5
INSERT INTO courses (title, instructor_id, category_id, level) VALUES
('React Masterclass', 1, 1, 'beginner'),
('Python for Data Science', 1, 2, 'beginner'),
('Advanced Node.js', 1, 1, 'advanced'),
('UI/UX Fundamentals', 1, 1, 'intermediate'),
('Ethical Hacking 101', 1, 4, 'beginner');

-- Core Course 13 (The one reported as missing)
INSERT INTO courses (id, title, instructor_id, category_id, level) OVERRIDING SYSTEM VALUE VALUES
(13, 'Introduction to Backend Development', 1, 1, 'beginner');

-- Modules for Course 13
INSERT INTO modules (id, course_id, title, sort_order) OVERRIDING SYSTEM VALUE VALUES
(100, 13, 'Basic Architecture', 1),
(101, 13, 'API Design', 2);

-- Lessons for Course 13
INSERT INTO lessons (module_id, title, lesson_type, content_url, sort_order) VALUES
(100, 'What is a Server?', 'youtube', 'https://www.youtube.com/embed/TlB_eWDSMt4', 1),
(100, 'HTTP Protocol', 'youtube', 'https://www.youtube.com/embed/iYM2zFP3Zn0', 2),
(101, 'Restful Principles', 'youtube', 'https://www.youtube.com/embed/L72fhGm1tfE', 1);

-- Quiz 16 for Course 13 (Reported as failing)
INSERT INTO quizzes (id, course_id, module_id, quiz_type, title, pass_score) OVERRIDING SYSTEM VALUE VALUES
(16, 13, 100, 'module', 'Introduction to Backend Quiz', 80);

-- Questions for Quiz 16
INSERT INTO quiz_questions (quiz_id, question_text, options, correct) VALUES
(16, 'What is the primary role of a backend server?', '[{"label":"A","text":"Rendering CSS"},{"label":"B","text":"Processing requests and managing data"},{"label":"C","text":"Displaying animations"},{"label":"D","text":"Handling browser history"}]', 'B'),
(16, 'Which HTTP method is most appropriate for creating a resource?', '[{"label":"A","text":"GET"},{"label":"B","text":"POST"},{"label":"C","text":"PUT"},{"label":"D","text":"DELETE"}]', 'B');

-- Ensure SERIAL sequences are synchronized if we manually provided IDs
SELECT setval('courses_id_seq', (SELECT MAX(id) FROM courses));
SELECT setval('modules_id_seq', (SELECT MAX(id) FROM modules));
SELECT setval('quizzes_id_seq', (SELECT MAX(id) FROM quizzes));
