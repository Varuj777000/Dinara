import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 больше не читает URL базы из schema.prisma — подключение живёт здесь.
// Само приложение и скрипты подключаются через драйверный адаптер
// (см. lib/db.ts и scripts/prisma-client.ts); этот файл нужен CLI для миграций.
// При переезде на PostgreSQL меняется provider в схеме и адаптер в тех двух файлах.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: { path: path.join("prisma", "migrations") },
  datasource: { url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" },
});
