import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({
      connectionString
    })
  : null;

export function isDatabaseEnabled() {
  return Boolean(pool);
}
