import { Router } from "express";
import { listLeads, processLeads, updateLeadFollowUpDate } from "../controllers/leadController.js";
import { authenticate } from "../middleware/authenticate.js";
export const leadRoutes = Router();
leadRoutes.post("/process", authenticate, processLeads);
leadRoutes.get("/", authenticate, listLeads);
leadRoutes.put("/:rowNumber/follow-up", authenticate, (req, res, next) => {
    req.body = { ...req.body, rowNumber: Number(req.params.rowNumber) };
    return updateLeadFollowUpDate(req, res, next);
});
