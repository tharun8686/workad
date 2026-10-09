require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { z } = require('zod');

// Let's test database execution of createRequirement logic
async function test() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  const client = await pool.connect();
  try {
    const ownerRes = await client.query("SELECT id FROM \"user\" WHERE email = 'rajatharun12@gmail.com'");
    const ownerId = ownerRes.rows[0].id;
    console.log('Owner ID:', ownerId);
    
    // Test what happens in insertRequirement
    // Let's run with the user's input:
    const input = {
      role: 'Senior Full Stack Engineer',
      businessUnit: 'Core Engineering',
      headcount: 2,
      location: 'Bengaluru',
      budget: 28,
      deadline: 60,
      experienceMin: 4,
      experienceMax: 8,
      durationMonths: 12,
      priority: 'Standard',
      mandatorySkills: ['Node.js', 'PostgreSQL', 'React'],
      skillWeights: { 'Node.js': 33, 'PostgreSQL': 33, 'React': 34 },
      optionalSkills: ['Docker', 'GraphQL'],
      repetitivePct: 15,
      remoteAllowed: true,
      rawText: 'We need 2 Senior Full Stack Engineers in Bengaluru...'
    };

    // Let's import the compiled or TS module or execute the queries
    console.log('Testing createRequirement directly...');
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

test();
