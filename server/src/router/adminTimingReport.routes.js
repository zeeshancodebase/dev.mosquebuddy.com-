import express from "express";

import {
  getAdminTimingReports,
  getAdminTimingReportById,
  updateAdminTimingReportStatus,
} from "../controllers/adminTimingReport.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get(
  "/timing-reports",
  authMiddleware,
  roleMiddleware("super_admin"),
  getAdminTimingReports
);

router.get(
  "/timing-reports/:reportId",
  authMiddleware,
  roleMiddleware("super_admin"),
  getAdminTimingReportById
);

router.patch(
  "/timing-reports/:reportId/status",
  authMiddleware,
  roleMiddleware("super_admin"),
  updateAdminTimingReportStatus
);

export default router;