const { pool } = require('../db');

async function fixSchema() {
  try {
    console.log('Adding missing updated_at to enrollments...');
    await pool.query(`
      ALTER TABLE enrollments 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    console.log('Adding updated_at trigger if not exists (for Postgres)...');
    // Supabase/Postgres doesn't automatically update TIMESTAMP on update unless we use a trigger
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
      SET search_path = public;
    `);

    try {
      await pool.query(`
        CREATE TRIGGER update_enrollments_updated_at
        BEFORE UPDATE ON enrollments
        FOR EACH ROW
        EXECUTE PROCEDURE update_updated_at_column();
      `);
    } catch (e) {
      console.log('Trigger update_enrollments_updated_at might already exist.');
    }

    console.log('Enabling RLS on core tables...');
    const tables = ['users', 'courses', 'enrollments', 'lessons', 'quizzes', 'assessments', 'tasks', 'categories', 'materials', 'lesson_progress'];
    for (const table of tables) {
      try {
        await pool.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
        console.log(`- Enabled RLS for ${table}`);
      } catch (e) {
        console.warn(`- Failed to enable RLS for ${table}: ${e.message}`);
      }
    }

    console.log('Schema fixes applied successfully.');
  } catch (err) {
    console.error('Error applying schema fixes:', err.message);
  } finally {
    process.exit(0);
  }
}

fixSchema();
