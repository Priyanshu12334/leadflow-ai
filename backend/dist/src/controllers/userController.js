import { prisma } from "../db/prisma.js";
import { authenticatedUserSelect } from "../types/authenticatedUser.js";
function publicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        draftsUsed: user.draftsUsed,
        draftLimit: user.draftLimit,
        usagePeriodStart: user.usagePeriodStart,
        googleConnected: Boolean(user.googleId),
        spreadsheetId: user.spreadsheetId,
        sheetName: user.sheetName,
        createdAt: user.createdAt,
    };
}
export const getCurrentUser = (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: "Authentication is required." });
    res.json({ user: publicUser(req.user) });
};
export const updateSpreadsheet = async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Authentication is required." });
        const { spreadsheetId, sheetName = "Sheet1" } = req.body || {};
        if (typeof spreadsheetId !== "string" || !/^[A-Za-z0-9_-]{15,}$/.test(spreadsheetId)) {
            return res.status(400).json({ error: "A valid Google spreadsheet ID is required." });
        }
        if (typeof sheetName !== "string" || sheetName.trim().length === 0 || sheetName.length > 100) {
            return res.status(400).json({ error: "A valid sheet name is required." });
        }
        const update = await prisma.user.updateMany({
            where: { id: req.user.id },
            data: { spreadsheetId, sheetName: sheetName.trim() },
        });
        if (update.count === 0)
            return res.status(401).json({ error: "Authentication is required." });
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: authenticatedUserSelect,
        });
        if (!user)
            return res.status(401).json({ error: "Authentication is required." });
        res.json({ user: publicUser(user) });
    }
    catch (error) {
        next(error);
    }
    ;
};
