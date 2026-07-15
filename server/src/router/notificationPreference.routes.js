import express from "express";

import {
  getMyNotificationPreferencesController,
  updateMyNotificationPreferencesController,
} from "../controllers/notificationPreference.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Notification Preference Routes
|--------------------------------------------------------------------------
| Logged-in users can manage their notification settings.
| Push sending is not implemented here.
*/

router.use(authMiddleware);

router.get("/me", getMyNotificationPreferencesController);
router.patch("/me", updateMyNotificationPreferencesController);

export default router;