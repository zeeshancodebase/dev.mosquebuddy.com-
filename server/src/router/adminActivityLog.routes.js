import express from "express";

import { getAdminActivityLogsController } from "../controllers/adminActivityLog.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin Activity Log Routes
|--------------------------------------------------------------------------
| Dedicated Super Admin audit log page.
*/

router.get(
  "/activity-logs",
  authMiddleware,
  roleMiddleware("super_admin"),
  getAdminActivityLogsController
);

export default router;