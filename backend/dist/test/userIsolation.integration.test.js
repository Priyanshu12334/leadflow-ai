import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
test("PostgreSQL keeps two users' history and quotas separate", { skip: !testDatabaseUrl }, async () => {
    if (!testDatabaseUrl)
        return;
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: testDatabaseUrl }) });
    const suffix = crypto.randomUUID();
    let userIds = [];
    try {
        const userA = await prisma.user.create({
            data: { name: "Isolation A", email: `isolation-a-${suffix}@example.test`, googleId: `google-a-${suffix}`, googleRefreshToken: null, draftLimit: 20 },
            select: { id: true },
        });
        userIds = [userA.id];
        const userB = await prisma.user.create({
            data: { name: "Isolation B", email: `isolation-b-${suffix}@example.test`, googleId: `google-b-${suffix}`, googleRefreshToken: null, draftLimit: 20 },
            select: { id: true },
        });
        userIds.push(userB.id);
        // Both users can reference the same Google Sheet row without colliding in
        // the composite history key because userId is part of that key.
        await prisma.leadProcessing.createMany({
            data: userIds.map((userId) => ({
                userId,
                spreadsheetId: "shared-sheet-id-123456",
                sheetName: "Leads",
                rowNumber: 8,
                leadFingerprint: `fingerprint-${userId}`,
            })),
        });
        await prisma.user.update({ where: { id: userA.id }, data: { draftsUsed: { increment: 1 } } });
        const [historyA, historyB, quotaA, quotaB] = await Promise.all([
            prisma.leadProcessing.findMany({ where: { userId: userA.id } }),
            prisma.leadProcessing.findMany({ where: { userId: userB.id } }),
            prisma.user.findUniqueOrThrow({ where: { id: userA.id }, select: { draftsUsed: true } }),
            prisma.user.findUniqueOrThrow({ where: { id: userB.id }, select: { draftsUsed: true } }),
        ]);
        assert.equal(historyA.length, 1);
        assert.equal(historyB.length, 1);
        assert.notEqual(historyA[0].id, historyB[0].id);
        assert.equal(quotaA.draftsUsed, 1);
        assert.equal(quotaB.draftsUsed, 0);
    }
    finally {
        if (userIds.length)
            await prisma.user.deleteMany({ where: { id: { in: userIds } } });
        await prisma.$disconnect();
    }
});
