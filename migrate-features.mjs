import pg from 'pg';
import { readFileSync } from 'fs';

const { Pool } = pg;

// Read env manually
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) envVars[key.trim()] = vals.join('=').trim();
}

const pool = new Pool({ 
  connectionString: envVars.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

const client = await pool.connect();
try {
  await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS wise_video_url TEXT');
  console.log('+ wise_video_url');
  await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS hourly_quotes_enabled BOOLEAN NOT NULL DEFAULT FALSE');
  console.log('+ hourly_quotes_enabled');
  await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS task_reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE');
  console.log('+ task_reminder_enabled');
  await client.query('ALTER TABLE habits ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ');
  console.log('+ habits.deadline');
  await client.query(`CREATE TABLE IF NOT EXISTS ideas (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  console.log('+ ideas table');
  console.log('All migrations completed successfully!');
} finally { 
  client.release(); 
  await pool.end(); 
}
