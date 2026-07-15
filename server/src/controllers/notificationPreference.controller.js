import { successResponse } from "../utils/apiResponse.js";

import {
  getMyNotificationPreferences,
  updateMyNotificationPreferences,
} from "../services/notificationPreference.service.js";

export async function getMyNotificationPreferencesController(req, res, next) {
  try {
    const preferences = await getMyNotificationPreferences(req.user.id);

    return successResponse(res, {
      message: "Notification preferences fetched successfully",
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMyNotificationPreferencesController(req, res, next) {
  try {
    const preferences = await updateMyNotificationPreferences(
      req.user.id,
      req.body
    );

    return successResponse(res, {
      message: "Notification preferences updated successfully",
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
}