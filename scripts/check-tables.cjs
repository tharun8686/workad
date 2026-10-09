const fs = require('fs');
const path = require('path');
const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
for (const line of env.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = (match[2] || '').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}
const { Pool } = require('pg');

async function check() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    const ownerRes = await client.query("SELECT id, name FROM \"user\" WHERE email = 'rajatharun12@gmail.com'");
    const owner = ownerRes.rows[0];
    console.log('Owner:', owner);

    // Let's check schema of requirement_skills, requirements, strategy_scores, normalization_reviews
    const tables = ['requirements', 'requirement_skills', 'normalization_reviews', 'strategy_scores'];
    for (const t of tables) {
      const res = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [t]);
      console.log(`Table ${t} columns:`, res.rows.map(r => r.column_name));
    }
    const constraints = await client.query(`
      SELECT t.relname, c.conname, c.contype, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname IN ('requirements', 'requirement_skills', 'normalization_reviews', 'strategy_scores')
    `);
    console.log('Constraints:');
    for (const row of constraints.rows) {
      console.log(`  ${row.relname}.${row.conname} (${row.contype}): ${row.def}`);
    }
    const skillsSample = await client.query(`SELECT id, name, payload->>'id' as pid FROM skills WHERE name IN ('React', 'Node.js', 'PostgreSQL')`);
    console.log('Skills sample:', skillsSample.rows);
  } catch (err) {
    console.error('Check error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

check();
