const fs = require('fs');
const path = require('path');

// Load pg from node_modules in lib/db where it's installed
const pg = require(path.join(__dirname, 'lib', 'db', 'node_modules', 'pg'));
const { Pool } = pg;

// Read env manually
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const eqIdx = line.indexOf('=');
  if (eqIdx > 0) {
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim();
    if (key) envVars[key] = val;
  }
}

const pool = new Pool({ 
  connectionString: envVars.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

(async () => {
  const client = await pool.connect();
  try {
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS wise_video_url TEXT');
    console.log('+ wise_video_url added to settings');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS hourly_quotes_enabled BOOLEAN NOT NULL DEFAULT FALSE');
    console.log('+ hourly_quotes_enabled added to settings');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS task_reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE');
    console.log('+ task_reminder_enabled added to settings');
    await client.query('ALTER TABLE habits ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ');
    console.log('+ deadline added to habits');
    await client.query(`CREATE TABLE IF NOT EXISTS ideas (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    console.log('+ ideas table created');
    console.log('\nAll migrations completed successfully!');
  } finally { 
    client.release(); 
    await pool.end(); 
  }
})().catch(err => { console.error('Migration failed:', err); process.exit(1); });
