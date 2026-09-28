import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Файл SQLite подключается по пути из DATABASE_URL, а не через import —
  // трассировщик файлов Next.js не видит его сам и не кладёт в сборку
  // serverless-функции. Актуально только для деплоя с файловой SQLite
  // (временный демо-хостинг); при переезде на Postgres можно убрать.
  outputFileTracingIncludes: {
    "/**": ["./prisma/*.db"],
  },
};

export default nextConfig;
