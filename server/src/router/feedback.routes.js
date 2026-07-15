import express from "express";

import {
  submitFeedbackController,
  getAdminFeedbackController,
  getAdminFeedbackByIdController,
  updateAdminFeedbackController,
  getAdminFeedbackSummaryController,
} from "../controllers/feedback.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { optionalAuthMiddleware } from "../middlewares/optionalAuthMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Feedback Routes
|--------------------------------------------------------------------------
| Public: POST /feedback — used by the mobile app, no auth required.
|         If a Bearer token is sent, it's still optionally attached
|         (see note below) so feedback can link to a user when logged in.
|
| Admin:  GET/PATCH /admin/feedback — Super Admin review.
*/

// Public — anonymous allowed. No authMiddleware, so req.user is never set
// here. This matches the "both, but anonymous is limited" decision: logged-in
// status isn't checked or required at this route.
router.post("/feedback", optionalAuthMiddleware, submitFeedbackController);

// Admin — Super Admin only
router.get(
  "/admin/feedback/summary",
  authMiddleware,
  roleMiddleware("super_admin"),
  getAdminFeedbackSummaryController
);

router.get(
  "/admin/feedback",
  authMiddleware,
  roleMiddleware("super_admin"),
  getAdminFeedbackController
);

router.get(
  "/admin/feedback/:feedbackId",
  authMiddleware,
  roleMiddleware("super_admin"),
  getAdminFeedbackByIdController
);

router.patch(
  "/admin/feedback/:feedbackId",
  authMiddleware,
  roleMiddleware("super_admin"),
  updateAdminFeedbackController
);

export default router;