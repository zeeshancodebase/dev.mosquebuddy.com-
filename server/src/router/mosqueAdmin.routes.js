import express from "express";

import {
  getMosqueAdminMyVenues,
  getMosqueAdminVenueById,
  updateMosqueAdminVenueProfile,
  createMosqueAdminDailyTimingController,
  updateMosqueAdminDailyTimingController,
  createMosqueAdminJumuahTimingController,
  updateMosqueAdminJumuahTimingController,
  getMosqueAdminReportsController,
getMosqueAdminReportByIdController,
updateMosqueAdminReportStatusController,
} from "../controllers/mosqueAdmin.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Mosque Admin Routes
|--------------------------------------------------------------------------
| Used by mosque admins inside mobile app / future web tools.
|
| Important:
| - Requires login
| - Requires mosque_admin role
| - Every venue action checks active assignment
*/

router.use(authMiddleware);
router.use(roleMiddleware("mosque_admin"));

router.get("/my-venues", getMosqueAdminMyVenues);
router.get("/venues/:venueId", getMosqueAdminVenueById);
router.patch("/venues/:venueId/profile", updateMosqueAdminVenueProfile);

router.post(
  "/venues/:venueId/daily-timings",
  createMosqueAdminDailyTimingController
);

router.patch(
  "/daily-timings/:timingId",
  updateMosqueAdminDailyTimingController
);

router.post(
  "/venues/:venueId/jumuah-timings",
  createMosqueAdminJumuahTimingController
);

router.patch(
  "/jumuah-timings/:timingId",
  updateMosqueAdminJumuahTimingController
);

router.get("/reports", getMosqueAdminReportsController);
router.get("/reports/:reportId", getMosqueAdminReportByIdController);
router.patch(
  "/reports/:reportId/status",
  updateMosqueAdminReportStatusController
);

export default router;