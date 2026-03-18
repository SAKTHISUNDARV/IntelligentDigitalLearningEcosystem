const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function runSchema() {
  try {
    const schemaPath = path.join(__dirname, 'sql', 'create_tables.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Split statements by semicolon and execute sequentially
    const statements = sql
      .split(/;\s*\n/) // split on semicolon followed by newline (keeps inline comments intact)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      console.log('Executing:', stmt.split('\n')[0].slice(0, 120));
      await pool.query(stmt);
    }

    console.log('Schema executed successfully.');
  } catch (err) {
    console.error('Error executing schema:', err);
    process.exitCode = 1;
  } finally {
    try { await pool.end(); } catch (e) {}
  }
}

runSchema();
