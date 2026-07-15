import express from "express";

import {
  getAdminVenueAdminAssignments,
  createAdminVenueAdminAssignment,
  updateAdminVenueAdminAssignment,
  deactivateAdminVenueAdminAssignment,
} from "../controllers/venueAdminAssignment.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get(
  "/venue-admin-assignments",
  authMiddleware,
  roleMiddleware("super_admin"),
  getAdminVenueAdminAssignments
);

router.post(
  "/venue-admin-assignments",
  authMiddleware,
  roleMiddleware("super_admin"),
  createAdminVenueAdminAssignment
);

router.patch(
  "/venue-admin-assignments/:assignmentId",
  authMiddleware,
  roleMiddleware("super_admin"),
  updateAdminVenueAdminAssignment
);

router.delete(
  "/venue-admin-assignments/:assignmentId",
  authMiddleware,
  roleMiddleware("super_admin"),
  deactivateAdminVenueAdminAssignment
);

export default router;