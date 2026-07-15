import express from "express";

import {
  createJumuahTiming,
  getJumuahTimingsByVenue,
  updateJumuahTiming,
  deleteJumuahTiming,
} from "../controllers/jumuahTiming.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("super_admin"));

router.post("/venues/:venueId/jumuah-timings", createJumuahTiming);
router.get("/venues/:venueId/jumuah-timings", getJumuahTimingsByVenue);
router.patch("/jumuah-timings/:timingId", updateJumuahTiming);
router.delete("/jumuah-timings/:timingId", deleteJumuahTiming);

export default router;