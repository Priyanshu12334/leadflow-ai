import { Router } from "express";
import { getCurrentUser, updateSpreadsheet } from "../controllers/userController.js";
import { authenticate } from "../middleware/authenticate.js";

export const userRoutes = Router();
userRoutes.get("/me", authenticate, getCurrentUser);
userRoutes.put("/spreadsheet", authenticate, updateSpreadsheet);
