import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// В dev Next.js перезагружает модули на каждом изменении — без синглтона
// накапливаются десятки открытых соединений с базой.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function create() {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}

export const prisma = globalForPrisma.prisma ?? create();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
