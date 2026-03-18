const { Pool } = require('pg');
require('./config/loadEnv');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Critical Error: DATABASE_URL is not defined in the environment.");
  process.exit(1);
}

const pgPool = new Pool({
  connectionString,
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

module.exports = { pool: wrappedPool, createScriptConnection };
