import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function getConnectionString() {
  return process.env.POSTGRES_URL || process.env.DATABASE_URL;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const connectionString = getConnectionString();

if (!connectionString) {
  throw new Error("Missing Postgres connection string. Set POSTGRES_URL or DATABASE_URL.");
}

const adapter = new PrismaPg({ connectionString });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
