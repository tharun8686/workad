const { Pool } = require('pg');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const dbUrl = envFile.split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const pool = new Pool({ connectionString: dbUrl });

async function run() {
  const r = await pool.query('SELECT a."userId", u.email, a.password FROM account a JOIN "user" u ON u.id = a."userId"');
  for (const row of r.rows) {
    console.log(row.email, 'hash:', row.password ? row.password.slice(0, 20) : 'null');
  }
  await pool.end();
}

run();
