import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __project1_pg_pool: Pool | undefined;
}

function getConnectionString() {
  return process.env.POSTGRES_URL || process.env.DATABASE_URL;
}

export function getPool(): Pool {
  if (!global.__project1_pg_pool) {
    const connectionString = getConnectionString();

    if (!connectionString) {
      throw new Error(
        "Missing Postgres connection string. Set POSTGRES_URL or DATABASE_URL.",
      );
    }

    const useSsl = !/localhost|127\.0\.0\.1/.test(connectionString);

    global.__project1_pg_pool = new Pool({
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    });
  }

  return global.__project1_pg_pool;
}
