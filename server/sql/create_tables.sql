-- ============================================================
-- IDLE (Intelligent Digital Learning Ecosystem) - MySQL Schema
-- Complete production schema with all tables and indexes
-- ============================================================

CREATE DATABASE IF NOT EXISTS idle_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE idle_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS assessments;
DROP TABLE IF EXISTS quiz_questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ========================
-- USERS
-- ========================
CREATE TABLE users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(255) UNIQUE NOT NULL,
  password     TEXT NOT NULL,            -- bcrypt hash
  full_name    VARCHAR(255) NOT NULL,
  role         ENUM('student','admin') NOT NULL DEFAULT 'student',
  is_approved  BOOLEAN NOT NULL DEFAULT TRUE,
  avatar_url   TEXT,
  bio          TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default admin seed
INSERT INTO users (email, password, full_name, role, is_approved) VALUES
  ('admin@idle.dev',
   '$2b$10$X7V5v1sFzqrPbPDcDaLEgOoHf6g7p9YMQ3A.fJGl8U/MWJwbbXGbW',  -- password: Admin@1234
   'System Admin', 'admin', TRUE),
  ('student@idle.dev',
   '$2b$10$X7V5v1sFzqrPbPDcDaLEgOoHf6g7p9YMQ3A.fJGl8U/MWJwbbXGbW',  -- password: Admin@1234
   'Demo Student', 'student', TRUE);

-- ========================
-- REFRESH TOKENS
-- ========================
CREATE TABLE refresh_tokens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  token      TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================
-- CATEGORIES
-- ========================
CREATE TABLE categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO categories (name, description) VALUES
  ('Web Development',    'HTML, CSS, JS, React, Node.js'),
  ('Data Science',       'Python, ML, Data Analysis'),
  ('Machine Learning',   'AI, Deep Learning, NLP'),
  ('Mobile Development', 'React Native, Flutter, iOS, Android'),
  ('DevOps',             'Docker, Kubernetes, CI/CD, Cloud'),
  ('Cybersecurity',      'Ethical Hacking, Network Security'),
  ('Database',           'MySQL, PostgreSQL, MongoDB, Redis'),
  ('UI/UX Design',       'Figma, Design Systems, Prototyping');

-- ========================
-- COURSES
-- ========================
CREATE TABLE courses (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  instructor_id   INT NOT NULL,
  category_id     INT,
  thumbnail_url   TEXT,
  level           ENUM('beginner','intermediate','advanced') DEFAULT 'beginner',
  duration_hours  DECIMAL(5,1) DEFAULT 0,
  is_approved     BOOLEAN DEFAULT FALSE,
  is_published    BOOLEAN DEFAULT FALSE,
  price           DECIMAL(8,2) DEFAULT 0.00,     -- 0 = free
  tags            JSON,                           -- array of strings
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES users(id),
  FOREIGN KEY (category_id)   REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed courses (instructor id=2)
INSERT INTO courses (title, description, instructor_id, category_id, thumbnail_url, level, duration_hours, is_approved, is_published, tags) VALUES
  ('React Masterclass', 'Learn React from zero to hero with hooks, context, and modern patterns.', 2, 1, 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80', 'intermediate', 12.5, TRUE, TRUE, '["react","javascript","frontend"]'),
  ('Python for Data Science', 'Master Python, Pandas, NumPy, and Matplotlib for data analysis.', 2, 2, 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80', 'beginner', 15.0, TRUE, TRUE, '["python","data science","pandas"]'),
  ('Machine Learning A-Z', 'Comprehensive ML course covering supervised, unsupervised, and deep learning.', 2, 3, 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80', 'advanced', 20.0, TRUE, TRUE, '["ml","ai","scikit-learn"]'),
  ('Node.js & Express API', 'Build RESTful APIs with Node.js, Express, JWT auth and MySQL.', 2, 1, 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80', 'intermediate', 10.0, TRUE, TRUE, '["nodejs","api","backend"]'),
  ('Docker & Kubernetes', 'Containerize apps and orchestrate with Kubernetes in production.', 2, 5, 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=1200&q=80', 'advanced', 8.0, TRUE, TRUE, '["docker","k8s","devops"]');

-- ========================
-- LESSONS
-- ========================
CREATE TABLE lessons (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  course_id    INT NOT NULL,
  title        VARCHAR(500) NOT NULL,
  description  TEXT,
  lesson_type  ENUM('video','pdf','text','youtube') DEFAULT 'video',
  content_url  TEXT,                          -- video URL, YouTube URL, or PDF URL
  duration_min INT DEFAULT 0,                 -- duration in minutes
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO lessons (course_id, title, description, lesson_type, content_url, duration_min, sort_order) VALUES
  -- React Masterclass (course 1)
  (1, 'Introduction to React', 'What is React and why use it', 'youtube', 'https://www.youtube.com/embed/SqcY0GlETPk', 15, 1),
  (1, 'JSX & Components', 'Understanding JSX syntax and component basics', 'youtube', 'https://www.youtube.com/embed/bMknfKXIFA8', 22, 2),
  (1, 'State & Props', 'Managing state and passing props', 'youtube', 'https://www.youtube.com/embed/O6P86uwfdR0', 18, 3),
  (1, 'React Hooks Deep Dive', 'useState, useEffect, useContext, custom hooks', 'youtube', 'https://www.youtube.com/embed/TNhaISOUy6Q', 30, 4),
  -- Python for DS (course 2)
  (2, 'Python Basics Refresher', 'Variables, loops, functions, and OOP', 'youtube', 'https://www.youtube.com/embed/_uQrJ0TkZlc', 45, 1),
  (2, 'NumPy Arrays', 'Working with N-dimensional arrays', 'youtube', 'https://www.youtube.com/embed/QUT1VHiLmmI', 25, 2),
  (2, 'Pandas DataFrames', 'Data manipulation and analysis with Pandas', 'youtube', 'https://www.youtube.com/embed/vmEHCJofslg', 30, 3),
  -- Node.js API (course 4)
  (4, 'Node.js Setup & Modules', 'Setting up Node.js, npm and CommonJS modules', 'youtube', 'https://www.youtube.com/embed/TlB_eWDSMt4', 20, 1),
  (4, 'Express.js Routing', 'Creating routes, middleware, and error handling', 'youtube', 'https://www.youtube.com/embed/L72fhGm1tfE', 25, 2);

-- ========================
-- ENROLLMENTS
-- ========================

-- ========================
-- LESSONS
-- ========================
CREATE TABLE lessons (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  course_id    INT NOT NULL,
  title        VARCHAR(500) NOT NULL,
  description  TEXT,
  lesson_type  ENUM('video','pdf','text','youtube') DEFAULT 'video',
  content_url  TEXT,                          -- video URL, YouTube URL, or PDF URL
  duration_min INT DEFAULT 0,                 -- duration in minutes
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO lessons (course_id, title, description, lesson_type, content_url, duration_min, sort_order) VALUES
  -- React Masterclass (course 1)
  (1, 'Introduction to React', 'What is React and why use it', 'youtube', 'https://www.youtube.com/embed/SqcY0GlETPk', 15, 1),
  (1, 'JSX & Components', 'Understanding JSX syntax and component basics', 'youtube', 'https://www.youtube.com/embed/bMknfKXIFA8', 22, 2),
  (1, 'State & Props', 'Managing state and passing props', 'youtube', 'https://www.youtube.com/embed/O6P86uwfdR0', 18, 3),
  (1, 'React Hooks Deep Dive', 'useState, useEffect, useContext, custom hooks', 'youtube', 'https://www.youtube.com/embed/TNhaISOUy6Q', 30, 4),
  -- Python for DS (course 2)
  (2, 'Python Basics Refresher', 'Variables, loops, functions, and OOP', 'youtube', 'https://www.youtube.com/embed/_uQrJ0TkZlc', 45, 1),
  (2, 'NumPy Arrays', 'Working with N-dimensional arrays', 'youtube', 'https://www.youtube.com/embed/QUT1VHiLmmI', 25, 2),
  (2, 'Pandas DataFrames', 'Data manipulation and analysis with Pandas', 'youtube', 'https://www.youtube.com/embed/vmEHCJofslg', 30, 3),
  -- Node.js API (course 4)
  (4, 'Node.js Setup & Modules', 'Setting up Node.js, npm and CommonJS modules', 'youtube', 'https://www.youtube.com/embed/TlB_eWDSMt4', 20, 1),
  (4, 'Express.js Routing', 'Creating routes, middleware, and error handling', 'youtube', 'https://www.youtube.com/embed/L72fhGm1tfE', 25, 2);

-- ========================
-- ENROLLMENTS
-- ========================
CREATE TABLE enrollments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  student_id   INT NOT NULL,
  course_id    INT NOT NULL,
  progress     DECIMAL(5,2) DEFAULT 0.00,    -- 0 to 100 percent
  completed    BOOLEAN DEFAULT FALSE,
  enrolled_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP DEFAULT NULL,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (course_id)  REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed: student (id=3) enrolled in course 1 and 2
INSERT INTO enrollments (student_id, course_id, progress) VALUES
  (3, 1, 65.00),
  (3, 2, 30.00);

-- ========================
-- QUIZZES
-- ========================
CREATE TABLE quizzes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  course_id    INT NOT NULL,
  module_id    INT NULL,
  quiz_type    ENUM('module','final') DEFAULT 'module',
  title        VARCHAR(500) NOT NULL,
  description  TEXT,
  time_limit   INT DEFAULT 10,               -- minutes, 0 = no limit
  pass_score   INT DEFAULT 60,               -- percentage to pass
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================
-- QUIZ QUESTIONS
-- ========================
CREATE TABLE quiz_questions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id       INT NOT NULL,
  course_id     INT NULL,
  module_id     INT NULL,
  quiz_type     ENUM('module','final') DEFAULT 'module',
  question_text TEXT NOT NULL,
  options       JSON NOT NULL,               -- array of {label, text}
  option_a      TEXT,
  option_b      TEXT,
  option_c      TEXT,
  option_d      TEXT,
  correct       VARCHAR(1) NOT NULL,         -- 'A', 'B', 'C', or 'D'
  correct_answer VARCHAR(1),
  explanation   TEXT,
  sort_order    INT DEFAULT 0,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed quizzes
INSERT INTO quizzes (course_id, title, description, time_limit, pass_score) VALUES
  (1, 'React Fundamentals Quiz', 'Test your knowledge of React basics', 10, 60),
  (2, 'Python & Pandas Quiz',    'Test your Python and data science skills', 15, 60);

INSERT INTO quiz_questions (quiz_id, question_text, options, correct, explanation, sort_order) VALUES
  (1, 'What hook is used to manage state in a functional component?',
   '[{"label":"A","text":"useRef"},{"label":"B","text":"useState"},{"label":"C","text":"useEffect"},{"label":"D","text":"useContext"}]',
   'B', 'useState is the primary hook for local component state.', 1),
  (1, 'What does JSX stand for?',
   '[{"label":"A","text":"JavaScript XML"},{"label":"B","text":"Java Syntax Extension"},{"label":"C","text":"JSON XML"},{"label":"D","text":"JavaScript Extended"}]',
   'A', 'JSX stands for JavaScript XML — it lets you write HTML-like syntax in JavaScript.', 2),
  (1, 'Which method is used to re-render a component when props change?',
   '[{"label":"A","text":"forceUpdate"},{"label":"B","text":"useEffect"},{"label":"C","text":"setState"},{"label":"D","text":"React re-renders automatically"}]',
   'D', 'React automatically re-renders when props or state change.', 3),
  (2, 'Which library is used for numerical computing in Python?',
   '[{"label":"A","text":"Pandas"},{"label":"B","text":"Matplotlib"},{"label":"C","text":"NumPy"},{"label":"D","text":"SciPy"}]',
   'C', 'NumPy (Numerical Python) is the foundational library for numerical computing.', 1),
  (2, 'What does df.head() return in Pandas?',
   '[{"label":"A","text":"Last 5 rows"},{"label":"B","text":"First 5 rows"},{"label":"C","text":"Column names"},{"label":"D","text":"DataFrame shape"}]',
   'B', 'head() returns the first N rows (default 5).', 2);

-- ========================
-- ASSESSMENTS (quiz submissions)
-- ========================
CREATE TABLE assessments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id     INT NOT NULL,
  user_id     INT NOT NULL,
  score       DECIMAL(5,2) NOT NULL,          -- percentage 0-100
  answers     JSON,                           -- {question_id: chosen_answer}
  passed      BOOLEAN DEFAULT FALSE,
  time_taken  INT DEFAULT 0,                  -- seconds
  taken_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id)  REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================
-- CERTIFICATES
-- ========================
CREATE TABLE certificates (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  course_id      INT NOT NULL,
  certificate_no VARCHAR(50) UNIQUE NOT NULL,
  issued_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cert (user_id, course_id),
  FOREIGN KEY (user_id)   REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================
-- TASKS (Todo List)
-- ========================
CREATE TABLE tasks (
  task_id     INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  priority    ENUM('low', 'medium', 'high') DEFAULT 'medium',
  status      ENUM('pending', 'completed') DEFAULT 'pending',
  due_date    DATE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- PERFORMANCE INDEXES
-- ========================
CREATE INDEX idx_courses_instructor  ON courses     (instructor_id);
CREATE INDEX idx_courses_category    ON courses     (category_id);
CREATE INDEX idx_lessons_course      ON lessons     (course_id, sort_order);
CREATE INDEX idx_enrollments_student ON enrollments (student_id);
CREATE INDEX idx_enrollments_course  ON enrollments (course_id);
CREATE INDEX idx_assessments_user    ON assessments (user_id);
CREATE INDEX idx_assessments_quiz    ON assessments (quiz_id);
CREATE INDEX idx_refresh_user        ON refresh_tokens (user_id);

-- ========================
-- POSTGRES RLS (Supabase)
-- ========================
-- Note: These are base commands. Specific policies should be added per table for production.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

SELECT 'IDLE schema updated successfully!' AS status;
