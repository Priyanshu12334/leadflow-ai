import { Router } from "express";
import { processLeads } from "../controllers/leadController.js";
import { authenticate } from "../middleware/authenticate.js";

export const leadRoutes = Router();
leadRoutes.post("/process", authenticate, processLeads);
