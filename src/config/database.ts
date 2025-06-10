import { PrismaClient } from "@prisma/client";
import { environment } from "./environment";

export const prisma = new PrismaClient({
  log: environment.nodeEnv === "development" ? ["error", "warn"] : ["error"],
});

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
