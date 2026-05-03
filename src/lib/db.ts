import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { statSync } from "node:fs";
import path from "node:path";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  /** mtime of generated client; when it changes, recreate the client (dev: after `prisma generate`). */
  prismaClientMtime?: number;
};

const generatedClientMarker = path.join(process.cwd(), "node_modules", ".prisma", "client", "schema.prisma");

function prismaGeneratedMtime(): number {
  try {
    return statSync(generatedClientMarker).mtimeMs;
  } catch {
    return 0;
  }
}

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL ?? "file:./data/app.db"
    }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });
}

function resolvePrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    globalForPrisma.prisma ??= createPrismaClient();
    return globalForPrisma.prisma;
  }

  const mtime = prismaGeneratedMtime();
  if (!globalForPrisma.prisma || globalForPrisma.prismaClientMtime !== mtime) {
    void globalForPrisma.prisma?.$disconnect().catch(() => {});
    globalForPrisma.prisma = createPrismaClient();
    globalForPrisma.prismaClientMtime = mtime;
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = resolvePrismaClient();
    const value = Reflect.get(client, prop as string | symbol);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  }
});
