import { db } from "./lib/db/src/index.js";
import { sql } from "drizzle-orm";

async function check() {
  try {
    const res = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tables in database:");
    res.rows.forEach(r => console.log("- " + r.table_name));

    // Let's check if there are users
    const users = await db.execute(sql`SELECT count(*) as count FROM users`);
    console.log(`\nUser count: ${users.rows[0].count}`);
  } catch (err) {
    console.error("DB Query error:", err);
  }
  process.exit(0);
}
check();
