const { Pool } = require('pg');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const dbUrl = envFile.split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const pool = new Pool({ connectionString: dbUrl });

async function run() {
  const sessions = await pool.query('SELECT "userId", token, "expiresAt" FROM session ORDER BY "expiresAt" DESC LIMIT 5');
  console.log('Sessions:', sessions.rows);
  const accounts = await pool.query('SELECT "userId", "providerId", password FROM account LIMIT 5');
  console.log('Accounts:', accounts.rows.map(a => ({ userId: a.userId, providerId: a.providerId, hasPassword: !!a.password })));
  await pool.end();
}

run();
