import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__arenaxPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__arenaxPrisma = prisma;
}
