const jwt = require('jsonwebtoken');
require('./config/loadEnv');
const { pool } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET;

async function repro() {
  try {
    const [users] = await pool.query('SELECT * FROM users LIMIT 1');
    if (!users.length) {
      console.error('No users in database.');
      return;
    }
    const user = users[0];
    console.log('Testing with user:', { id: user.id, email: user.email, role: user.role });

    const token = jwt.sign(
      { sub: String(user.id), role: user.role, name: user.full_name },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Generated token for role:', user.role);

    // Now, we can't easily "call" the express route without starting the server,
    // but we can simulate the middleware logic.
    
    const req = {
      headers: { authorization: `Bearer ${token}` },
      user: null
    };

    // Simulate authenticateToken
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      console.log('Middleware: Authentication passed. User:', req.user);
    } catch (err) {
      console.error('Middleware: Authentication failed:', err.message);
      return;
    }

    // Simulate requireRole('student') with ADMIN bypass
    const requiredRoles = ['student'];
    if (req.user.role === 'admin' || requiredRoles.includes(req.user.role)) {
      console.log('Middleware: Authorization passed (ADMIN bypass or Role Match).');
    } else {
      console.error('Middleware: Authorization FAILED. Current role:', req.user.role);
    }

    // Finally, let's try the actual DB query that routes/courses.js line 87 uses
    console.log('Executing database query for enrolled courses...');
    try {
      const [rows] = await pool.query(`SELECT c.id, c.title 
               FROM enrollments e
               JOIN courses c ON c.id = e.course_id
               WHERE e.student_id = $1`, [user.id]);
      console.log('Database query SUCCESS. Rows count:', rows.length);
    } catch (err) {
      console.error('Database query FAILED:', err.message);
    }

  } catch (err) {
    console.error('Repro script error:', err);
  } finally {
    process.exit(0);
  }
}

repro();
