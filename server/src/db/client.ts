import { PrismaClient } from '@prisma/client';

declare global { var __prisma: PrismaClient | undefined; }

export const prisma = global.__prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

export async function connectDb() {
  try { await prisma.$connect(); console.log('✅ DB connected'); } catch (e) { console.warn('⚠️ DB connection failed (running without DB):', (e as Error).message); }
}
