-- ============================================================
-- IDLE — Rich Sample Data Seed
-- Run AFTER create_tables.sql has been executed
-- Adds: more courses, video lessons, 5 quizzes, questions,
--       sample assessment submissions, enrollments, certificate
-- ============================================================
USE idle_db;

-- ============================================================
-- EXTRA USERS (students + one more instructor)
-- password for all: Admin@1234
-- ============================================================
INSERT IGNORE INTO users (email, password, full_name, role, is_approved) VALUES
  ('alice@idle.dev',   '$2b$10$X7V5v1sFzqrPbPDcDaLEgOoHf6g7p9YMQ3A.fJGl8U/MWJwbbXGbW', 'Alice Johnson',  'student',    TRUE),
  ('bob@idle.dev',     '$2b$10$X7V5v1sFzqrPbPDcDaLEgOoHf6g7p9YMQ3A.fJGl8U/MWJwbbXGbW', 'Bob Williams',   'student',    TRUE),
  ('carol@idle.dev',   '$2b$10$X7V5v1sFzqrPbPDcDaLEgOoHf6g7p9YMQ3A.fJGl8U/MWJwbbXGbW', 'Carol Smith',    'student',    TRUE);

-- ============================================================
-- MORE COURSES (instructor id=2, approved & published)
-- ============================================================
INSERT IGNORE INTO courses (title, description, instructor_id, category_id, thumbnail_url, level, duration_hours, is_approved, is_published, tags) VALUES
  ('Full Stack Web Development',
   'Build complete web apps using React, Node.js, Express and MySQL. Covers REST APIs, JWT auth, deployment, and best practices.',
   2, 1, 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80', 'intermediate', 18.0, TRUE, TRUE, '["react","nodejs","mysql","fullstack"]'),

  ('Deep Learning with TensorFlow',
   'Master neural networks, CNNs, RNNs and transformers using TensorFlow 2 and Keras. Includes real-world projects.',
   2, 3, 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80', 'advanced', 16.0, TRUE, TRUE, '["tensorflow","deep learning","keras","ai"]'),

  ('Flutter Mobile App Development',
   'Build beautiful cross-platform iOS & Android apps using Flutter and Dart. State management, navigation, and Firebase integration.',
   2, 4, 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80', 'beginner', 14.0, TRUE, TRUE, '["flutter","dart","mobile","firebase"]'),

  ('MySQL Database Mastery',
   'From basics to advanced SQL — joins, stored procedures, transactions, indexing and query optimization.',
   2, 7, 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80', 'beginner', 9.0, TRUE, TRUE, '["mysql","sql","database","queries"]'),

  ('Ethical Hacking & Penetration Testing',
   'Learn to think like a hacker. Covers Kali Linux, network scanning, exploitation, and writing security reports.',
   2, 6, 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?auto=format&fit=crop&w=1200&q=80', 'advanced', 22.0, TRUE, TRUE, '["security","hacking","kali","pentesting"]'),

  ('UI/UX Design Fundamentals',
   'Learn design thinking, wireframing, prototyping in Figma, color theory, typography and creating design systems.',
   2, 8, 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80', 'beginner', 11.0, TRUE, TRUE, '["figma","ux","design","ui"]');

UPDATE courses
SET thumbnail_url = CASE title
  WHEN 'React Masterclass' THEN 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80'
  WHEN 'Python for Data Science' THEN 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80'
  WHEN 'Machine Learning A-Z' THEN 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80'
  WHEN 'Node.js & Express API' THEN 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80'
  WHEN 'Docker & Kubernetes' THEN 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=1200&q=80'
  WHEN 'Full Stack Web Development' THEN 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80'
  WHEN 'Deep Learning with TensorFlow' THEN 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80'
  WHEN 'Flutter Mobile App Development' THEN 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80'
  WHEN 'MySQL Database Mastery' THEN 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80'
  WHEN 'Ethical Hacking & Penetration Testing' THEN 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?auto=format&fit=crop&w=1200&q=80'
  WHEN 'UI/UX Design Fundamentals' THEN 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80'
  ELSE thumbnail_url
END
WHERE title IN (
  'React Masterclass',
  'Python for Data Science',
  'Machine Learning A-Z',
  'Node.js & Express API',
  'Docker & Kubernetes',
  'Full Stack Web Development',
  'Deep Learning with TensorFlow',
  'Flutter Mobile App Development',
  'MySQL Database Mastery',
  'Ethical Hacking & Penetration Testing',
  'UI/UX Design Fundamentals'
);

-- ============================================================
-- VIDEO LESSONS — real YouTube embed URLs
-- ============================================================

-- Course 1: React Masterclass (already has lessons 1-4, adding more)
INSERT IGNORE INTO lessons (course_id, title, description, lesson_type, content_url, duration_min, sort_order) VALUES
  (1, 'React Router v6', 'Client-side routing with React Router v6', 'youtube', 'https://www.youtube.com/embed/Ul3y1LXxzdU', 20, 5),
  (1, 'Context API & useReducer', 'Global state management without Redux', 'youtube', 'https://www.youtube.com/embed/5LrDIWkK_Bc', 25, 6),
  (1, 'React Query Basics', 'Server-state management with TanStack Query', 'youtube', 'https://www.youtube.com/embed/novnyCaa7To', 22, 7);

-- Course 2: Python for Data Science (already has 3, adding more)
INSERT IGNORE INTO lessons (course_id, title, description, lesson_type, content_url, duration_min, sort_order) VALUES
  (2, 'Matplotlib & Seaborn', 'Data visualization techniques', 'youtube', 'https://www.youtube.com/embed/a9UrKTVEeZA', 28, 4),
  (2, 'Scikit-Learn Basics', 'Machine learning with Python scikit-learn', 'youtube', 'https://www.youtube.com/embed/0B5eIE_1vpU', 35, 5);

-- Course 3: Machine Learning A-Z
INSERT IGNORE INTO lessons (course_id, title, description, lesson_type, content_url, duration_min, sort_order) VALUES
  (3, 'What is Machine Learning?', 'Introduction to supervised and unsupervised learning', 'youtube', 'https://www.youtube.com/embed/ukzFI9rgwfU', 18, 1),
  (3, 'Linear Regression Explained', 'Gradient descent and cost function intuition', 'youtube', 'https://www.youtube.com/embed/nk2CQITm_eo', 24, 2),
  (3, 'Decision Trees & Random Forests', 'Ensemble methods and feature importance', 'youtube', 'https://www.youtube.com/embed/J4Wdy0Wc_xQ', 22, 3),
  (3, 'Neural Networks from Scratch', 'Backpropagation and activation functions', 'youtube', 'https://www.youtube.com/embed/aircAruvnKk', 30, 4),
  (3, 'K-Means Clustering', 'Unsupervised learning with K-Means', 'youtube', 'https://www.youtube.com/embed/4b5d3muPQmA', 20, 5);

-- Course 4: Node.js & Express (already has 2, adding more)
INSERT IGNORE INTO lessons (course_id, title, description, lesson_type, content_url, duration_min, sort_order) VALUES
  (4, 'JWT Authentication', 'Secure your API with JSON Web Tokens', 'youtube', 'https://www.youtube.com/embed/mbsmsi7l3r4', 28, 3),
  (4, 'MySQL with Node.js', 'Connecting and querying MySQL from Node', 'youtube', 'https://www.youtube.com/embed/EN6Dx22cY4E', 22, 4),
  (4, 'File Uploads with Multer', 'Handling multipart form data and file uploads', 'youtube', 'https://www.youtube.com/embed/ezywITRHlcI', 18, 5);

-- Course 5: Docker & Kubernetes
INSERT IGNORE INTO lessons (course_id, title, description, lesson_type, content_url, duration_min, sort_order) VALUES
  (5, 'Docker Basics', 'What is Docker, containers vs VMs', 'youtube', 'https://www.youtube.com/embed/3c-iBn73dDE', 20, 1),
  (5, 'Writing Dockerfiles', 'Build custom Docker images', 'youtube', 'https://www.youtube.com/embed/EYNwNlOrpr0', 18, 2),
  (5, 'Docker Compose', 'Multi-container apps with Docker Compose', 'youtube', 'https://www.youtube.com/embed/HG6yIjZapSA', 22, 3),
  (5, 'Kubernetes Architecture', 'Pods, nodes, deployments and services', 'youtube', 'https://www.youtube.com/embed/X48VuDVv0do', 35, 4);

-- Course 6: Full Stack Web Development
INSERT IGNORE INTO lessons (course_id, title, description, lesson_type, content_url, duration_min, sort_order) VALUES
  (6, 'Project Setup & Folder Structure', 'Organizing a full-stack monorepo', 'youtube', 'https://www.youtube.com/embed/SqcY0GlETPk', 15, 1),
  (6, 'Building the React Frontend', 'Componentization and routing', 'youtube', 'https://www.youtube.com/embed/bMknfKXIFA8', 25, 2),
  (6, 'REST API with Express', 'CRUD endpoints and middleware', 'youtube', 'https://www.youtube.com/embed/L72fhGm1tfE', 22, 3),
  (6, 'JWT Auth End-to-End', 'Login, register, protected routes', 'youtube', 'https://www.youtube.com/embed/mbsmsi7l3r4', 30, 4),
  (6, 'Deploying to Railway & Vercel', 'Free hosting for full-stack apps', 'youtube', 'https://www.youtube.com/embed/bnCOyGaSe84', 20, 5);

-- Course 7: Deep Learning
INSERT IGNORE INTO lessons (course_id, title, description, lesson_type, content_url, duration_min, sort_order) VALUES
  (7, 'Introduction to Neural Networks', 'Perceptrons and multilayer networks', 'youtube', 'https://www.youtube.com/embed/aircAruvnKk', 25, 1),
  (7, 'TensorFlow & Keras Setup', 'Installing and configuring TensorFlow 2', 'youtube', 'https://www.youtube.com/embed/tPYj3fFJGjk', 18, 2),
  (7, 'Convolutional Neural Networks', 'Image classification with CNNs', 'youtube', 'https://www.youtube.com/embed/ArPaAX_PhIs', 30, 3),
  (7, 'Transfer Learning', 'Using pre-trained models (ResNet, VGG)', 'youtube', 'https://www.youtube.com/embed/LsdxvjLWkIY', 22, 4);

-- Course 8: Flutter
INSERT IGNORE INTO lessons (course_id, title, description, lesson_type, content_url, duration_min, sort_order) VALUES
  (8, 'Dart Language Basics', 'Variables, functions, classes in Dart', 'youtube', 'https://www.youtube.com/embed/5xlVyn_vpNI', 20, 1),
  (8, 'Flutter Widgets', 'Stateless vs Stateful widgets', 'youtube', 'https://www.youtube.com/embed/x0uinJvhNxI', 25, 2),
  (8, 'Navigation & Routing', 'Named routes and Navigator 2.0', 'youtube', 'https://www.youtube.com/embed/yvRWL6MBBek', 20, 3),
  (8, 'Firebase Integration', 'Auth, Firestore and Cloud Storage', 'youtube', 'https://www.youtube.com/embed/dHvAPLohxe0', 28, 4);

-- Course 9: MySQL
INSERT IGNORE INTO lessons (course_id, title, description, lesson_type, content_url, duration_min, sort_order) VALUES
  (9, 'SQL SELECT Basics', 'SELECT, WHERE, ORDER BY, LIMIT', 'youtube', 'https://www.youtube.com/embed/HXV3zeQKqGY', 18, 1),
  (9, 'JOINs Explained', 'INNER, LEFT, RIGHT, CROSS joins', 'youtube', 'https://www.youtube.com/embed/9URM1_2S0ho', 20, 2),
  (9, 'Indexes & Performance', 'How indexes speed up queries', 'youtube', 'https://www.youtube.com/embed/HubezKbFL7E', 15, 3),
  (9, 'Stored Procedures', 'Creating reusable SQL procedures', 'youtube', 'https://www.youtube.com/embed/gkCKlXPvfbQ', 18, 4);

-- ============================================================
-- ADDITIONAL QUIZZES
-- ============================================================
INSERT IGNORE INTO quizzes (course_id, title, description, time_limit, pass_score) VALUES
  (3, 'Machine Learning Concepts Quiz',  'Core ML concepts — supervised, unsupervised, overfitting', 15, 60),
  (4, 'Node.js & Express Quiz',          'Test your backend API knowledge', 10, 60),
  (6, 'Full Stack Development Quiz',     'Frontend + backend integration concepts', 15, 70),
  (9, 'MySQL Fundamentals Quiz',         'SQL syntax, joins, and indexing', 10, 60);

-- ============================================================
-- QUIZ QUESTIONS
-- Quiz 1: React (already has 3 questions — adding 2 more)
-- ============================================================
INSERT IGNORE INTO quiz_questions (quiz_id, question_text, options, correct, explanation, sort_order) VALUES
  (1, 'What is the Virtual DOM in React?',
   '[{"label":"A","text":"A server-side rendered DOM"},{"label":"B","text":"A lightweight copy of the real DOM in memory"},{"label":"C","text":"A browser extension"},{"label":"D","text":"A CSS framework"}]',
   'B', 'React uses a Virtual DOM to batch and minimise real DOM updates for performance.', 4),
  (1, 'Which hook replaces componentDidMount?',
   '[{"label":"A","text":"useState"},{"label":"B","text":"useCallback"},{"label":"C","text":"useEffect with empty dependency array"},{"label":"D","text":"useMemo"}]',
   'C', 'useEffect(() => { ... }, []) runs once after the first render, equivalent to componentDidMount.', 5);

-- Quiz 2: Python (already has 2 — adding more)
INSERT IGNORE INTO quiz_questions (quiz_id, question_text, options, correct, explanation, sort_order) VALUES
  (2, 'How do you create a DataFrame from a dictionary in Pandas?',
   '[{"label":"A","text":"pd.DataFrame.from_dict()"},{"label":"B","text":"pd.DataFrame()"},{"label":"C","text":"pd.read_dict()"},{"label":"D","text":"pd.Series()"}]',
   'B', 'pd.DataFrame(dict) directly converts a Python dictionary to a DataFrame.', 3),
  (2, 'What does the shape attribute of a NumPy array return?',
   '[{"label":"A","text":"The data type"},{"label":"B","text":"The number of dimensions"},{"label":"C","text":"A tuple of dimensions"},{"label":"D","text":"The total element count"}]',
   'C', 'arr.shape returns a tuple like (rows, cols) representing each dimension.', 4);

-- Quiz 3: Machine Learning
INSERT IGNORE INTO quiz_questions (quiz_id, question_text, options, correct, explanation, sort_order) VALUES
  (3, 'What is overfitting?',
   '[{"label":"A","text":"Model performs well on training but poorly on test data"},{"label":"B","text":"Model performs poorly on all data"},{"label":"C","text":"Model learns too slowly"},{"label":"D","text":"Model has too few parameters"}]',
   'A', 'Overfitting happens when the model memorises training data and fails to generalise.', 1),
  (3, 'Which of the following is an unsupervised learning algorithm?',
   '[{"label":"A","text":"Linear Regression"},{"label":"B","text":"Random Forest"},{"label":"C","text":"K-Means Clustering"},{"label":"D","text":"SVM"}]',
   'C', 'K-Means is unsupervised — it groups data without labelled examples.', 2),
  (3, 'What does the learning rate control in gradient descent?',
   '[{"label":"A","text":"Number of training epochs"},{"label":"B","text":"Size of the step taken toward the minimum"},{"label":"C","text":"Number of features"},{"label":"D","text":"Batch size"}]',
   'B', 'The learning rate α determines how large each gradient descent step is.', 3),
  (3, 'What is a confusion matrix used for?',
   '[{"label":"A","text":"Visualising model weights"},{"label":"B","text":"Evaluating classification model performance"},{"label":"C","text":"Plotting learning curves"},{"label":"D","text":"Selecting hyperparameters"}]',
   'B', 'A confusion matrix shows TP, TN, FP, FN counts to evaluate classifier performance.', 4),
  (3, 'Which activation function is most commonly used in hidden layers of deep networks?',
   '[{"label":"A","text":"Sigmoid"},{"label":"B","text":"Tanh"},{"label":"C","text":"ReLU"},{"label":"D","text":"Softmax"}]',
   'C', 'ReLU (Rectified Linear Unit) is fast, avoids vanishing gradients and is the default choice.', 5);

-- Quiz 4: Node.js
INSERT IGNORE INTO quiz_questions (quiz_id, question_text, options, correct, explanation, sort_order) VALUES
  (4, 'What does npm stand for?',
   '[{"label":"A","text":"Node Package Module"},{"label":"B","text":"Node Project Manager"},{"label":"C","text":"Network Package Manager"},{"label":"D","text":"Node Package Manager"}]',
   'D', 'npm = Node Package Manager, the default package manager for Node.js.', 1),
  (4, 'Which method in Express defines a GET route?',
   '[{"label":"A","text":"app.use()"},{"label":"B","text":"app.get()"},{"label":"C","text":"app.route()"},{"label":"D","text":"app.fetch()"}]',
   'B', 'app.get(path, handler) registers a handler for GET requests on the given path.', 2),
  (4, 'What is middleware in Express?',
   '[{"label":"A","text":"A database library"},{"label":"B","text":"A function that runs between request and response"},{"label":"C","text":"A type of HTTP method"},{"label":"D","text":"A templating engine"}]',
   'B', 'Middleware functions have access to req, res, and the next function in the pipeline.', 3),
  (4, 'What does JWT stand for?',
   '[{"label":"A","text":"JavaScript Web Token"},{"label":"B","text":"JSON Web Token"},{"label":"C","text":"Java Web Toolkit"},{"label":"D","text":"JSON Wrapper Type"}]',
   'B', 'JWT = JSON Web Token, used for stateless authentication.', 4);

-- Quiz 5: Full Stack
INSERT IGNORE INTO quiz_questions (quiz_id, question_text, options, correct, explanation, sort_order) VALUES
  (5, 'What is CORS?',
   '[{"label":"A","text":"A type of database"},{"label":"B","text":"Cross-Origin Resource Sharing — browser security policy for cross-domain requests"},{"label":"C","text":"A CSS framework"},{"label":"D","text":"A React hook"}]',
   'B', 'CORS controls how browsers allow cross-domain API calls for security.', 1),
  (5, 'Which HTTP status code means "Resource Created"?',
   '[{"label":"A","text":"200"},{"label":"B","text":"204"},{"label":"C","text":"201"},{"label":"D","text":"400"}]',
   'C', '201 Created is returned when a new resource is successfully created.', 2),
  (5, 'What does useEffect cleanup function do?',
   '[{"label":"A","text":"Clears localStorage"},{"label":"B","text":"Runs before the component re-renders or unmounts"},{"label":"C","text":"Resets form state"},{"label":"D","text":"Cancels fetch requests automatically"}]',
   'B', 'The cleanup function returned from useEffect runs before the next effect or on unmount.', 3);

-- Quiz 6: MySQL
INSERT IGNORE INTO quiz_questions (quiz_id, question_text, options, correct, explanation, sort_order) VALUES
  (6, 'Which SQL keyword removes duplicate rows from results?',
   '[{"label":"A","text":"UNIQUE"},{"label":"B","text":"DISTINCT"},{"label":"C","text":"GROUP BY"},{"label":"D","text":"FILTER"}]',
   'B', 'SELECT DISTINCT removes duplicate rows from the result set.', 1),
  (6, 'What type of JOIN returns all rows from both tables, matched where possible?',
   '[{"label":"A","text":"INNER JOIN"},{"label":"B","text":"LEFT JOIN"},{"label":"C","text":"RIGHT JOIN"},{"label":"D","text":"FULL OUTER JOIN"}]',
   'D', 'FULL OUTER JOIN returns all rows from both tables, with NULLs where no match exists.', 2),
  (6, 'Which clause filters results AFTER GROUP BY aggregation?',
   '[{"label":"A","text":"WHERE"},{"label":"B","text":"FILTER"},{"label":"C","text":"HAVING"},{"label":"D","text":"ORDER BY"}]',
   'C', 'HAVING is used to filter aggregated groups, while WHERE filters before aggregation.', 3),
  (6, 'What does an INDEX do in MySQL?',
   '[{"label":"A","text":"Adds a new column"},{"label":"B","text":"Speeds up data retrieval by creating a lookup structure"},{"label":"C","text":"Encrypts table data"},{"label":"D","text":"Backs up table rows"}]',
   'B', 'Indexes create B-tree lookup structures that make SELECT queries faster.', 4);

-- ============================================================
-- MORE ENROLLMENTS
-- ============================================================
INSERT IGNORE INTO enrollments (student_id, course_id, progress) VALUES
  (3, 3,  45.00),  -- demo student in ML A-Z
  (3, 4,  80.00),  -- demo student in Node.js (near complete)
  (4, 1,  55.00),  -- alice in React
  (4, 2,  20.00),  -- alice in Python
  (4, 6, 100.00),  -- alice completed Full Stack
  (5, 3,  70.00),  -- bob in ML
  (5, 7,  40.00),  -- bob in Deep Learning
  (6, 8,  90.00),  -- carol in Flutter
  (6, 9,  60.00);  -- carol in MySQL

-- Mark alice's Full Stack as completed
UPDATE enrollments SET completed = TRUE, completed_at = NOW()
WHERE student_id = 4 AND course_id = 6;

-- ============================================================
-- SAMPLE ASSESSMENT SUBMISSIONS
-- ============================================================
INSERT IGNORE INTO assessments (quiz_id, user_id, score, answers, passed, time_taken) VALUES
  -- Demo student (id=3) took React quiz — passed
  (1, 3, 80.00,
   '{"1":"B","2":"A","3":"D","4":"B","5":"C"}',
   TRUE, 420),
  -- Demo student (id=3) took Python quiz — passed
  (2, 3, 75.00,
   '{"6":"C","7":"B","8":"B","9":"C"}',
   TRUE, 510),
  -- Demo student (id=3) took ML quiz — failed
  (3, 3, 40.00,
   '{"10":"B","11":"A","12":"A","13":"C","14":"B"}',
   FALSE, 380),
  -- Alice (id=4) took React quiz — passed with high score
  (1, 4, 100.00,
   '{"1":"B","2":"A","3":"D","4":"B","5":"C"}',
   TRUE, 300),
  -- Alice (id=4) took Full Stack quiz — passed
  (5, 4, 66.67,
   '{"...":"B","...":"C","...":"B"}',
   TRUE, 480),
  -- Bob (id=5) took ML quiz — passed
  (3, 5, 80.00,
   '{"10":"A","11":"C","12":"B","13":"B","14":"C"}',
   TRUE, 520),
  -- Carol (id=6) took Node.js quiz — passed
  (4, 6, 75.00,
   '{"...":"D","...":"B","...":"B","...":"B"}',
   TRUE, 440),
  -- Carol (id=6) took MySQL quiz — passed
  (6, 6, 100.00,
   '{"...":"B","...":"D","...":"C","...":"B"}',
   TRUE, 360);

-- ============================================================
-- CERTIFICATES (for completed courses)
-- ============================================================
INSERT IGNORE INTO certificates (user_id, course_id, certificate_no) VALUES
  (4, 6, 'IDLE-2024-FS-0001'),   -- alice: full stack
  (3, 1, 'IDLE-2024-RC-0002');   -- demo student: react (optional, mark as completed)

-- Update demo student React enrollment to 100%
UPDATE enrollments SET completed = TRUE, completed_at = NOW(), progress = 100.00
WHERE student_id = 3 AND course_id = 1;

SELECT CONCAT('Seed complete! Courses: ', (SELECT COUNT(*) FROM courses),
              ', Lessons: ', (SELECT COUNT(*) FROM lessons),
              ', Quizzes: ', (SELECT COUNT(*) FROM quizzes),
              ', Questions: ', (SELECT COUNT(*) FROM quiz_questions),
              ', Enrollments: ', (SELECT COUNT(*) FROM enrollments),
              ', Assessments: ', (SELECT COUNT(*) FROM assessments)) AS summary;
