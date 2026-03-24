const { Pool } = require('pg');
require('./config/loadEnv');

const connectionString = (process.env.DATABASE_URL || '').trim().replace(/^"(.*)"$/, '$1');

if (!connectionString) {
  console.error("Critical Error: DATABASE_URL is not defined in the environment.");
  process.exit(1);
}

function getConnectionMeta() {
  try {
    const parsed = new URL(connectionString);
    return {
      host: parsed.hostname,
      port: parsed.port || '5432',
      database: parsed.pathname?.replace(/^\//, '') || 'postgres',
      user: parsed.username || '(unknown)',
    };
  } catch {
    return {
      host: '(invalid DATABASE_URL)',
      port: '',
      database: '',
      user: '',
    };
  }
}

const pgPool = new Pool({
  connectionString,
  family: 4,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  statement_timeout: 60000, // 60s
});

// Add error handler for the pool
pgPool.on('error', (err, client) => {
  console.error('[Postgres Pool Error] Unexpected error on idle client', err);
});

// Wrapper to mimic mysql2 tuple return
const wrappedPool = {
  query: async (text, params) => {
    // pg supports $1, $2 with params array natively
    const res = await pgPool.query(text, params);
    // return [rows, fields]
    return [res.rows, res.fields];
  },
  connect: async () => {
    const client = await pgPool.connect();
    // Wrap the client to maintain consistent [rows, fields] return
    return {
      query: async (text, params) => {
        const res = await client.query(text, params);
        return [res.rows, res.fields];
      },
      release: () => client.release(),
      // Add other necessary pg client methods if needed
    };
  },
  end: () => pgPool.end()
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkDatabaseConnection({ retries = 3, delayMs = 2500 } = {}) {
  const meta = getConnectionMeta();
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pgPool.query('SELECT 1');
      return { ok: true, meta };
    } catch (err) {
      lastError = err;
      const message = err?.message || 'Unknown database connection error';
      console.error(`[DB] Connection attempt ${attempt}/${retries} failed for ${meta.host}:${meta.port}/${meta.database}: ${message}`);
      if (attempt < retries) {
        await sleep(delayMs);
      }
    }
  }

  return { ok: false, meta, error: lastError };
}

async function createScriptConnection() {
  const client = await pgPool.connect();
  return {
    query: async (text, params) => {
      const res = await client.query(text, params);
      return [res.rows, res.fields];
    },
    end: () => client.release(),
    release: () => client.release()
  };
}

module.exports = { pool: wrappedPool, createScriptConnection, checkDatabaseConnection, getConnectionMeta };
