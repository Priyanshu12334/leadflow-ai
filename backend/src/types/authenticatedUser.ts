import type { Prisma } from "@prisma/client";

export const authenticatedUserSelect = {
  id: true,
  name: true,
  email: true,
  isDemo: true,
  googleId: true,
  googleRefreshToken: true,
  plan: true,
  draftsUsed: true,
  draftLimit: true,
  usagePeriodStart: true,
  quotaCycleStartAt: true,
  spreadsheetId: true,
  sheetName: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type AuthenticatedUser = Prisma.UserGetPayload<{
  select: typeof authenticatedUserSelect;
}>;
