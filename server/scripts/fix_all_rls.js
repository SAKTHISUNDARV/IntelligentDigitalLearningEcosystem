const { pool } = require('../db');

async function fixAllRLS() {
  try {
    console.log('Fetching all tables in the public schema...');
    const [tables] = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);

    console.log(`Found ${tables.length} tables. Enabling RLS for each...`);

    for (const row of tables) {
      const tableName = row.table_name;
      try {
        // 1. Enable RLS
        await pool.query(`ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`);
        
        // 2. Add a 'deny all' policy if no policies exist (optional but good for visibility)
        // By default, enabling RLS with no policies denies all access to non-owners.
        // Our backend uses the 'postgres' role which is an owner/superuser, so it's unaffected.
        
        console.log(`✅ Enabled RLS for: ${tableName}`);
      } catch (e) {
        console.warn(`❌ Failed to enable RLS for ${tableName}: ${e.message}`);
      }
    }

    console.log('\nAll tables processed.');
    console.log('NOTE: Since no SELECT policies were added, these tables are now SECURE and hidden from the public anon API.');
    console.log('The backend will still work because it uses a superuser connection.');

  } catch (err) {
    console.error('Error fetching tables:', err.message);
  } finally {
    process.exit(0);
  }
}

fixAllRLS();
