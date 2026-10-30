import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config, validateEnvironment } from "./config/env.js";
import { connectPrismaDatabase } from "./db/prisma.js";
import { authRoutes } from "./routes/authRoutes.js";
import { leadRoutes } from "./routes/leadRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
async function startServer() {
    validateEnvironment();
    await connectPrismaDatabase();
    const app = express();
    app.disable("x-powered-by");
    app.use(cors({ origin: config.frontendOrigin, credentials: true }));
    app.use(express.json({ limit: "100kb" }));
    app.use(cookieParser());
    app.get("/health", (_req, res) => res.json({ status: "ok" }));
    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/leads", leadRoutes);
    app.use(notFound);
    app.use(errorHandler);
    app.listen(config.port, "0.0.0.0", () => {
        console.log(`AI Lead Follow-Up API listening on port ${config.port}.`);
    });
}
startServer().catch((error) => {
    console.error("Unable to start server:", error instanceof Error ? error.message : String(error));
    process.exit(1);
});
