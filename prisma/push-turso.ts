import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function main() {
  const sql = readFileSync("prisma/turso-schema.sql", "utf-8");
  // Split on comment blocks that start statements
  const statements = sql
    .split(/\n\n-- /)
    .map((s, i) => (i === 0 ? s : "-- " + s))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Applying ${statements.length} statements to Turso...`);

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      const match = stmt.match(
        /(?:CreateTable|CreateIndex)\n(.+)/
      );
      console.log(
        `  OK: ${match ? match[1].slice(0, 60) : stmt.slice(0, 60)}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already exists")) {
        console.log(`  SKIP (exists)`);
      } else {
        console.error(`  FAIL: ${msg}`);
        console.error(`  SQL: ${stmt.slice(0, 120)}`);
      }
    }
  }

  console.log("Schema push complete!");
}

main().catch(console.error);
