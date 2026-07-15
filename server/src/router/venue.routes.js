import express from "express";

import {
  createVenue,
  getVenues,
  getVenueById,
  updateVenue,
  updateVenueStatus,
} from "../controllers/venue.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("super_admin"));

router.post("/", createVenue);
router.get("/", getVenues);
router.get("/:id", getVenueById);
router.patch("/:id", updateVenue);
router.patch("/:id/status", updateVenueStatus);

export default router;