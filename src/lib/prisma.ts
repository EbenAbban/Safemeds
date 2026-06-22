import { PrismaClient } from "./prisma-client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient();

  // Prisma Accelerate / Prisma Postgres proxy URLs (prisma:// or
  // prisma+postgres://) do not speak the raw Postgres protocol — queries must
  // be routed over HTTP by the Accelerate extension. Direct postgresql:// URLs
  // use the bundled query engine and must NOT have the extension applied.
  // Different environments may use different URLs (e.g. a direct connection
  // locally and an Accelerate connection on Vercel), so pick the right mode
  // from the URL protocol at runtime instead of hard-coding one.
  const url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("prisma://") || url.startsWith("prisma+postgres://")) {
    return client.$extends(withAccelerate()) as unknown as PrismaClient;
  }

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
