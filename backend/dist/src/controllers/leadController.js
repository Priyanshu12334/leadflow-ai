import { processUserLeads } from "../services/leadProcessingService.js";
export const processLeads = async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Authentication is required." });
        const { spreadsheetId, sheetName } = req.user;
        if (!spreadsheetId)
            return res.status(400).json({ error: "Configure your Google spreadsheet before processing leads." });
        const result = await processUserLeads(req.user.id, { spreadsheetId, sheetName });
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
