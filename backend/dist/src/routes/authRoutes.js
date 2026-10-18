import { Router } from "express";
import { beginGoogleOAuth, completeGoogleOAuth, logout } from "../controllers/authController.js";
import { optionalAuthenticate, authenticate } from "../middleware/authenticate.js";
export const authRoutes = Router();
authRoutes.get("/google", optionalAuthenticate, beginGoogleOAuth);
authRoutes.get("/google/callback", completeGoogleOAuth);
authRoutes.post("/logout", authenticate, logout);
