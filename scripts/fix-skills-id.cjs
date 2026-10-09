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

async function fixSkills() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    console.log('Fixing skills payload->>id to match skills.id...');
    const res = await client.query(`
      UPDATE skills 
      SET payload = jsonb_set(payload, '{id}', to_jsonb(id)) 
      WHERE payload->>'id' IS DISTINCT FROM id
    `);
    console.log(`Updated ${res.rowCount} skills rows to align payload.id with column id.`);

    // Verify
    const check = await client.query(`
      SELECT count(*) as mismatched 
      FROM skills 
      WHERE payload->>'id' != id
    `);
    console.log(`Mismatched skills remaining: ${check.rows[0].mismatched}`);
  } catch (err) {
    console.error('Error fixing skills:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

fixSkills();
