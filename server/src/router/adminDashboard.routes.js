import express from "express";
import { getAdminDashboardSummary } from "../controllers/adminDashboard.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get(
  "/dashboard/summary",
  authMiddleware,
  roleMiddleware("super_admin"),
  getAdminDashboardSummary
);

export default router;