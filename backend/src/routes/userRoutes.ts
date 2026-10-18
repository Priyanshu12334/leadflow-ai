import { Router } from "express";
import { disconnectGoogle, getCurrentUser, getSpreadsheetOpenLink, updateSpreadsheet } from "../controllers/userController.js";
import { authenticate } from "../middleware/authenticate.js";

export const userRoutes = Router();
userRoutes.get("/me", authenticate, getCurrentUser);
userRoutes.get("/spreadsheet/open-link", authenticate, getSpreadsheetOpenLink);
userRoutes.put("/spreadsheet", authenticate, updateSpreadsheet);
userRoutes.delete("/google", authenticate, disconnectGoogle);
