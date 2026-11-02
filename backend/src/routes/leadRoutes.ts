import { Router } from "express";
import { listLeads, processLeads } from "../controllers/leadController.js";
import { authenticate } from "../middleware/authenticate.js";

export const leadRoutes = Router();
leadRoutes.post("/process", authenticate, processLeads);
leadRoutes.get("/", authenticate, listLeads);
