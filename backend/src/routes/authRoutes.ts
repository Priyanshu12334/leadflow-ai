import { Router } from "express";
import { beginGoogleOAuth, completeGoogleOAuth, logout } from "../controllers/authController.js";
import { optionalAuthenticate } from "../middleware/authenticate.js";

export const authRoutes = Router();
authRoutes.get("/google", optionalAuthenticate, beginGoogleOAuth);
authRoutes.get("/google/callback", completeGoogleOAuth);
// Clearing the session cookie must work even after the JWT has expired.
authRoutes.post("/logout", logout);
