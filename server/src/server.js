
// server/src/server.js
import "./config/env.js";

import express from "express";
import cors from "cors";
import apiRoutes from "./router/index.js";
import connectDb from "./db/conn.js";
import { env } from "./config/env.js";
import prisma from "./config/prisma.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import createHttpError from "./utils/createHttpError.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    server: "running",
    name: "Sabeel API",
    version: "1.0.0",
    environment: env.nodeEnv,
    message: "Sabeel API server is running",
  });
});

app.use("/api", apiRoutes);

app.use((req, res, next) => {
  // console.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  next(createHttpError(404, "The requested resource was not found."));
});

app.use(errorMiddleware);

const startServer = async () => {
  await connectDb();

  const server = app.listen(env.port, () => {
    console.log(`🚀 Server is running on port ${env.port}`);
  });

  const shutdown = async () => {
    console.log("🛑 Shutting down server...");

    server.close(async () => {
      await prisma.$disconnect();

      console.log("✅ Server closed successfully");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

startServer().catch((error) => {
  console.error("❌ Failed to start server:", error.message);
  process.exit(1);
});