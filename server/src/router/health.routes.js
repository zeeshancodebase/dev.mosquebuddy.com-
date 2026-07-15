
// server\src\router\health.routes.js
import express from "express";
import prisma from "../config/prisma.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      success: true,
      status: "healthy",
      server: "running",
      database: "connected",
      uptimeSec: Math.floor(process.uptime()),
      responseTimeMs: Date.now() - startedAt,
      environment: process.env.NODE_ENV || "development",
      message: "Sabeel API and database are healthy",
    });
  } catch (error) {
    console.error("❌ Health check failed:", error.message);

    return res.status(503).json({
      success: false,
      status: "unhealthy",
      server: "running",
      database: "disconnected",
      uptimeSec: Math.floor(process.uptime()),
      responseTimeMs: Date.now() - startedAt,
      environment: process.env.NODE_ENV || "development",
      message: "Sabeel API is running, but database is not reachable",
    });
  }
});

export default router;