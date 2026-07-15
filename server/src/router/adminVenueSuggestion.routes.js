import express from "express";

import {
  getAdminVenueSuggestions,
  getAdminVenueSuggestionById,
  updateAdminVenueSuggestionStatus,
} from "../controllers/adminVenueSuggestion.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin Venue Suggestion Routes
|--------------------------------------------------------------------------
| Super Admin review workflow for missing mosque/prayer venue suggestions.
*/

router.get(
  "/venue-suggestions",
  authMiddleware,
  roleMiddleware("super_admin"),
  getAdminVenueSuggestions
);

router.get(
  "/venue-suggestions/:suggestionId",
  authMiddleware,
  roleMiddleware("super_admin"),
  getAdminVenueSuggestionById
);

router.patch(
  "/venue-suggestions/:suggestionId/status",
  authMiddleware,
  roleMiddleware("super_admin"),
  updateAdminVenueSuggestionStatus
);

export default router;