import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

/** Клиент для консольных скриптов: те же настройки подключения, что и у сайта. */
export function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}
