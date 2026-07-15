import * as jumuahTimingService from "../services/jumuahTiming.service.js";
import { successResponse } from "../utils/apiResponse.js";
import createHttpError from "../utils/createHttpError.js";
import getValidationMessage from "../utils/getValidationMessage.js";

import {
  createJumuahTimingSchema,
  updateJumuahTimingSchema,
} from "../validators/jumuahTiming.validator.js";

export async function createJumuahTiming(req, res, next) {
  try {
    const parsed = createJumuahTimingSchema.safeParse(req.body);

    if (!parsed.success) {
      throw createHttpError(400, getValidationMessage(parsed.error));
    }

    const timing = await jumuahTimingService.createJumuahTiming(
      req.params.venueId,
      parsed.data,
      req.user.id
    );


    return successResponse(res, {
      statusCode: 201,
      message: "Jumu‘ah timing created successfully",
      data: timing,
    });
  } catch (error) {
    next(error);
  }
}

export async function getJumuahTimingsByVenue(req, res, next) {
  try {
    const timings = await jumuahTimingService.getJumuahTimingsByVenue(
      req.params.venueId
    );

    return successResponse(res, {
      message: "Jumu‘ah timings fetched successfully",
      data: timings,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateJumuahTiming(req, res, next) {
  try {
    const parsed = updateJumuahTimingSchema.safeParse(req.body);

    if (!parsed.success) {
      throw createHttpError(400, getValidationMessage(parsed.error));
    }

    const timing = await jumuahTimingService.updateJumuahTiming(
      req.params.timingId,
      parsed.data,
      req.user.id
    );


    return successResponse(res, {
      message: "Jumu‘ah timing updated successfully",
      data: timing,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteJumuahTiming(req, res, next) {
  try {
    const result = await jumuahTimingService.deleteJumuahTiming(
      req.params.timingId,
      req.user.id
    );

    return successResponse(res, {
      message: "Jumu‘ah timing deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}