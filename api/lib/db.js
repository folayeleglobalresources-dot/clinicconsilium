const { Pool } = require('pg');

let pool;
function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'disable' ? false : { rejectUnauthorized: true },
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000
    });
    pool.on('error', () => {});
  }
  return pool;
}
async function query(text, values) { return getPool().query(text, values); }
module.exports = { query };