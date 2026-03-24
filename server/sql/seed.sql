-- ============================================================
-- IDLE — Postgres Sample Data Seed
-- ============================================================

-- Extra courses to fill gaps
INSERT INTO courses (title, instructor_id, category_id, level) VALUES
  ('Cloud Architecture with AWS', 1, 1, 'advanced'),
  ('Data Analytics with Tableau', 1, 2, 'intermediate'),
  ('iOS Development with Swift', 1, 3, 'intermediate'),
  ('Network Security Essentials', 1, 4, 'beginner'),
  ('Frontend Performance Optimization', 1, 1, 'advanced'),
  ('Digital Marketing Fundamentals', 1, 1, 'beginner');

-- More lessons for Course 13
INSERT INTO lessons (module_id, title, lesson_type, content_url, sort_order) VALUES
  (101, 'Error Handling in APIs', 'youtube', 'https://www.youtube.com/embed/mbsmsi7l3r4', 2),
  (101, 'Authentication Basics', 'youtube', 'https://www.youtube.com/embed/mbsmsi7l3r4', 3);

-- Enrollment for demo student in Course 13
INSERT INTO enrollments (student_id, course_id, progress) VALUES (2, 13, 10.00);

-- Sync sequences
SELECT setval('courses_id_seq', (SELECT MAX(id) FROM courses));
SELECT setval('lessons_id_seq', (SELECT MAX(id) FROM lessons));
