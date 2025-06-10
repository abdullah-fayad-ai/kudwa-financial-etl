import cors from "cors";
import express from "express";

import logger from "./utils/logger.util";
import etlRoutes from "./routes/etlRoutes";
import { prisma } from "./config/database";
import dataRoutes from "./routes/dataRoutes";
import companyRoutes from "./routes/companyRoutes";
import { environment } from "./config/environment";
import { errorHandler } from "./middleware/error-handler.middleware";

const app = express();
const port = environment.port;

// Middleware
app.use(
  cors({
    origin: "https://kudwa-financial-web.vercel.app",
  })
);
app.use(express.json());

// Routes
app.use("/api/etl", etlRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/companies", companyRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
    environment: environment.nodeEnv,
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: `Cannot ${req.method} ${req.path}`,
  });
});

// Global error handling middleware
app.use(errorHandler);

// Start server
const server = app.listen(port, () => {
  logger.info(`Server running on port ${port} in ${environment.nodeEnv} mode`);
});

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  await prisma.$disconnect();
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

export default app;
