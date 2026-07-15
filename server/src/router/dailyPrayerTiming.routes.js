import express from "express";

import {
  createDailyPrayerTiming,
  getDailyPrayerTimingsByVenue,
  updateDailyPrayerTiming,
} from "../controllers/dailyPrayerTiming.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("super_admin"));

router.post("/venues/:venueId/daily-timings", createDailyPrayerTiming);
router.get("/venues/:venueId/daily-timings", getDailyPrayerTimingsByVenue);
router.patch("/daily-timings/:timingId", updateDailyPrayerTiming);

export default router;