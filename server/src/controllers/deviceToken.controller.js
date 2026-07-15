import { successResponse } from "../utils/apiResponse.js";

import {
  registerDeviceToken,
  deactivateDeviceToken,
} from "../services/deviceToken.service.js";

export async function registerDeviceTokenController(req, res, next) {
  try {
    const token = await registerDeviceToken(req.body, req.user?.id || null);

    return successResponse(res, {
      statusCode: 201,
      message: "Device token registered successfully",
      data: token,
    });
  } catch (error) {
    next(error);
  }
}

export async function deactivateDeviceTokenController(req, res, next) {
  try {
    const token = await deactivateDeviceToken(
      req.params.deviceTokenId,
      req.user?.id || null
    );

    return successResponse(res, {
      message: "Device token deactivated successfully",
      data: token,
    });
  } catch (error) {
    next(error);
  }
}