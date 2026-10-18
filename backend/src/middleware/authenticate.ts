import jwt from "jsonwebtoken";
import type { RequestHandler, Request } from "express";
import { getRequiredEnvironmentValue } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { authenticatedUserSelect } from "../types/authenticatedUser.js";

function readToken(req: Request): string | null {
  const authorization = req.get("authorization");
  return req.cookies?.access_token || (authorization?.startsWith("Bearer ") ? authorization.slice(7) : null);
}

export const optionalAuthenticate: RequestHandler = async (req, _res, next) => {
  const token = readToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, getRequiredEnvironmentValue("JWT_SECRET"));
    if (typeof payload === "object" && payload.sub) {
      req.user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: authenticatedUserSelect,
      }) || undefined;
    }
  } catch {
    // An unauthenticated request may begin a Google sign-in flow.
  }
  next();
};

export const authenticate: RequestHandler = async (req, res, next) => {
  const token = readToken(req);
  if (!token) return res.status(401).json({ error: "Authentication is required." });
  try {
    const payload = jwt.verify(token, getRequiredEnvironmentValue("JWT_SECRET"));
    if (typeof payload === "string" || !payload.sub) {
      return res.status(401).json({ error: "Your session is invalid or expired. Please sign in again." });
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: authenticatedUserSelect,
    });
    if (!user) return res.status(401).json({ error: "Authentication is required." });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Your session is invalid or expired. Please sign in again." });
  };
}
