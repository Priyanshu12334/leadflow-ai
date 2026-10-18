import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { getRequiredEnvironmentValue } from "../config/env.js";
const adapter = new PrismaPg({
    connectionString: getRequiredEnvironmentValue("DATABASE_URL"),
});
export const prisma = new PrismaClient({ adapter });
export async function connectPrismaDatabase() {
    await prisma.$connect();
    console.log("Connected to PostgreSQL via Prisma.");
}
