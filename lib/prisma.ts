import { PrismaClient } from "@prisma/client"

//we need to check if a PrismaClient exist
//Next.js suport hot reloading of changing files, if the framework restarts, we have to ensure that extra unwanted instances of the database do not exist
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export default prisma

//unlike mongoose, you do not need to explicitely call connect since Prisma uses a pooled ocnnection under the hood