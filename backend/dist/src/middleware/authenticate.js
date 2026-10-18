import jwt from "jsonwebtoken";
import { getRequiredEnvironmentValue } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { authenticatedUserSelect } from "../types/authenticatedUser.js";
function readToken(req) {
    const authorization = req.get("authorization");
    return req.cookies?.access_token || (authorization?.startsWith("Bearer ") ? authorization.slice(7) : null);
}
export const optionalAuthenticate = async (req, _res, next) => {
    const token = readToken(req);
    if (!token)
        return next();
    let payload;
    try {
        payload = jwt.verify(token, getRequiredEnvironmentValue("JWT_SECRET"));
    }
    catch {
        // An invalid/expired session is optional on the OAuth start endpoint.
        return next();
    }
    if (typeof payload !== "object" || !payload.sub)
        return next();
    try {
        req.user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: authenticatedUserSelect,
        }) || undefined;
        return next();
    }
    catch (error) {
        // A database failure is a server error, not an unauthenticated request.
        return next(error);
    }
};
export const authenticate = async (req, res, next) => {
    const token = readToken(req);
    if (!token)
        return res.status(401).json({ error: "Authentication is required." });
    let payload;
    try {
        payload = jwt.verify(token, getRequiredEnvironmentValue("JWT_SECRET"));
    }
    catch {
        return res.status(401).json({ error: "Your session is invalid or expired. Please sign in again." });
    }
    if (typeof payload === "string" || !payload.sub) {
        return res.status(401).json({ error: "Your session is invalid or expired. Please sign in again." });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: authenticatedUserSelect,
        });
        if (!user)
            return res.status(401).json({ error: "Authentication is required." });
        req.user = user;
        return next();
    }
    catch (error) {
        return next(error);
    }
};
