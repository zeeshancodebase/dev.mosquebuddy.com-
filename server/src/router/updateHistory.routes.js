// src/router/updateHistory.routes.js
import express from "express";
import { getVenueHistory } from "../controllers/updateHistory.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("super_admin"));

router.get("/venues/:venueId/history", getVenueHistory);

export default router;