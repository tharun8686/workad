const { Pool } = require('pg');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let dbUrl = '';
let migrationUrl = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('DATABASE_MIGRATION_URL=')) {
    migrationUrl = line.substring('DATABASE_MIGRATION_URL='.length).trim();
  }
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.substring('DATABASE_URL='.length).trim();
  }
}

const pool = new Pool({ connectionString: migrationUrl || dbUrl });

async function run() {
  try {
    const users = await pool.query('SELECT id, name, email FROM "user"');
    console.log('Users in DB:');
    for (const u of users.rows) {
      console.log(` - ${u.name} (${u.email}) [ID: ${u.id}]`);
    }

    const totalCounts = await pool.query(`
      SELECT 
        (SELECT count(*) FROM talent_records) as talent_records,
        (SELECT count(*) FROM requirements) as requirements,
        (SELECT count(*) FROM decisions) as decisions,
        (SELECT count(*) FROM actions) as actions,
        (SELECT count(*) FROM scenarios) as scenarios,
        (SELECT count(*) FROM talent_profiles) as talent_profiles,
        (SELECT count(*) FROM recruitment_jobs) as recruitment_jobs,
        (SELECT count(*) FROM recruitment_applications) as recruitment_applications,
        (SELECT count(*) FROM workforce_outcomes) as workforce_outcomes,
        (SELECT count(*) FROM pay_policies) as pay_policies,
        (SELECT count(*) FROM course_events) as course_events,
        (SELECT count(*) FROM resource_reservations) as resource_reservations,
        (SELECT count(*) FROM skills) as skills
    `);
    console.log('\nTotal Database Counts across all tables:');
    console.log(totalCounts.rows[0]);

    // Now test with app.user_id set for Rajatharun (UAiTjcbfI2n1RBrWMlrLHsoaxFdUvd2i)
    const rajatId = 'UAiTjcbfI2n1RBrWMlrLHsoaxFdUvd2i';
    const appPool = new Pool({ connectionString: dbUrl });
    const appClient = await appPool.connect();
    await appClient.query("SELECT set_config('app.user_id', $1, false)", [rajatId]);
    const rajatCounts = await appClient.query(`
      SELECT 
        (SELECT count(*) FROM talent_records WHERE owner_id = current_setting('app.user_id', true)) as talent_records,
        (SELECT count(*) FROM requirements WHERE owner_id = current_setting('app.user_id', true)) as requirements,
        (SELECT count(*) FROM decisions d JOIN requirements r ON r.id = d.requirement_id WHERE r.owner_id = current_setting('app.user_id', true)) as decisions,
        (SELECT count(*) FROM actions a JOIN requirements r ON r.id = a.requirement_id WHERE r.owner_id = current_setting('app.user_id', true)) as actions,
        (SELECT count(*) FROM resource_reservations) as resource_reservations,
        (SELECT count(*) FROM talent_profiles WHERE owner_id = current_setting('app.user_id', true)) as talent_profiles,
        (SELECT count(*) FROM recruitment_jobs WHERE owner_id = current_setting('app.user_id', true)) as recruitment_jobs,
        (SELECT count(*) FROM recruitment_applications WHERE owner_id = current_setting('app.user_id', true)) as recruitment_applications,
        (SELECT count(*) FROM workforce_outcomes WHERE owner_id = current_setting('app.user_id', true)) as workforce_outcomes,
        (SELECT count(*) FROM pay_policies WHERE owner_id = current_setting('app.user_id', true)) as pay_policies,
        (SELECT count(*) FROM course_events WHERE owner_id = current_setting('app.user_id', true)) as course_events
    `);
    console.log('\nVerified RLS Counts for Rajatharun (rajatharun12@gmail.com):');
    console.log(rajatCounts.rows[0]);
    appClient.release();
    await appPool.end();

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
