import { Router } from "express";
import { getProcessLeadsJob, listLeads, processLeads } from "../controllers/leadController.js";
import { authenticate } from "../middleware/authenticate.js";

export const leadRoutes = Router();
leadRoutes.post("/process", authenticate, processLeads);
leadRoutes.get("/process/:jobId", authenticate, getProcessLeadsJob);
leadRoutes.get("/", authenticate, listLeads);
