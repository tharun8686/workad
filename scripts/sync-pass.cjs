const { Pool } = require('pg');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const dbUrl = envFile.split('\n').find(l => l.startsWith('DATABASE_URL=')).replace('DATABASE_URL=', '').trim();
const pool = new Pool({ connectionString: dbUrl });

async function run() {
  await pool.query(`
    UPDATE account 
    SET password = (
      SELECT a.password 
      FROM account a 
      JOIN "user" u ON u.id = a."userId" 
      WHERE u.email = 'rajatharun881@gmail.com'
    ) 
    WHERE "userId" = (
      SELECT id 
      FROM "user" 
      WHERE email = 'rajatharun12@gmail.com'
    )
  `);
  console.log('Password synced successfully for rajatharun12@gmail.com to Password12345!');
  await pool.end();
}

run();
