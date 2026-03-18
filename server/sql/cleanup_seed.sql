-- ============================================================
-- IDLE — Database Cleanup Script
-- Removes ALL seed/fake data while keeping:
--   ✅ admin@idle.dev  (system admin)
--   ✅ student@idle.dev (demo student account)
--   ✅ Any accounts the real user registered
--   ✅ All courses, lessons, quizzes, quiz questions (real content)
-- Removes:
--   ❌ Fake seed users: alice, bob, carol, instructor2
--   ❌ ALL enrollments (start fresh — real user re-enrolls naturally)
--   ❌ ALL assessments / quiz submissions
--   ❌ ALL certificates
-- ============================================================
USE idle_db;

SET FOREIGN_KEY_CHECKS = 0;

-- Remove fake seed users (cascades will NOT work here because FK_CHECKS is OFF,
-- so we delete their dependent data first)

-- Delete assessments for fake users
DELETE FROM assessments
WHERE user_id IN (
  SELECT id FROM users WHERE email IN (
    'alice@idle.dev','bob@idle.dev','carol@idle.dev','instructor2@idle.dev'
  )
);

-- Delete certificates for fake users
DELETE FROM certificates
WHERE user_id IN (
  SELECT id FROM users WHERE email IN (
    'alice@idle.dev','bob@idle.dev','carol@idle.dev','instructor2@idle.dev'
  )
);

-- Delete enrollments for fake users
DELETE FROM enrollments
WHERE student_id IN (
  SELECT id FROM users WHERE email IN (
    'alice@idle.dev','bob@idle.dev','carol@idle.dev','instructor2@idle.dev'
  )
);

-- Now delete the fake user accounts themselves
DELETE FROM users
WHERE email IN ('alice@idle.dev','bob@idle.dev','carol@idle.dev','instructor2@idle.dev');

-- ── Clear all transactional data that was seeded ──────────────
-- This resets ALL enrollments/assessments/certificates so only
-- real user actions remain going forward.

DELETE FROM certificates;
DELETE FROM assessments;
DELETE FROM enrollments;

SET FOREIGN_KEY_CHECKS = 1;

-- ── Summary ───────────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM users)          AS remaining_users,
  (SELECT COUNT(*) FROM courses)        AS courses_kept,
  (SELECT COUNT(*) FROM lessons)        AS lessons_kept,
  (SELECT COUNT(*) FROM quizzes)        AS quizzes_kept,
  (SELECT COUNT(*) FROM quiz_questions) AS questions_kept,
  (SELECT COUNT(*) FROM enrollments)    AS enrollments_remaining,
  (SELECT COUNT(*) FROM assessments)    AS assessments_remaining,
  (SELECT COUNT(*) FROM certificates)   AS certificates_remaining;

SELECT '✅ Database cleaned! All seed data removed. Courses and quizzes kept.' AS status;
