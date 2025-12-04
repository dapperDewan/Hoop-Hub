import { PrismaClient } from '@prisma/client';

// Use a global variable for the Prisma Client in development to prevent
// multiple instances during hot reloading
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
