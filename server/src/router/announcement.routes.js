import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import {
  postVenueAnnouncement,
  postVolunteerAnnouncement,
  postAdminAnnouncement,
  getPublicAnnouncements,
} from "../controllers/announcement.controller.js";

const router = express.Router();

// Mosque Admin — post announcement for their assigned venue
router.post(
  "/mosque-admin/venues/:venueId/announcements",
  authMiddleware,
  roleMiddleware("mosque_admin"),
  postVenueAnnouncement
);

// Trusted Volunteer — post announcement within assigned scope
router.post(
  "/volunteer/announcements",
  authMiddleware,
  roleMiddleware("trusted_volunteer"),
  postVolunteerAnnouncement
);

// Super Admin — post announcement at any scope
router.post(
  "/admin/announcements",
  authMiddleware,
  roleMiddleware("super_admin"),
  postAdminAnnouncement
);

// Public — home screen feed
router.get("/public/announcements", getPublicAnnouncements);

export default router;