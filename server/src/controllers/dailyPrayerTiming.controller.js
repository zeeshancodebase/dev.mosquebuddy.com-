import * as dailyPrayerTimingService from "../services/dailyPrayerTiming.service.js";
import { successResponse } from "../utils/apiResponse.js";
import createHttpError from "../utils/createHttpError.js";
import {
  createDailyPrayerTimingSchema,
  updateDailyPrayerTimingSchema,
} from "../validators/dailyPrayerTiming.validator.js";
import getValidationMessage from "../utils/getValidationMessage.js";

export async function createDailyPrayerTiming(req, res, next) {
  try {
    const parsed = createDailyPrayerTimingSchema.safeParse(req.body);

    if (!parsed.success) {
      throw createHttpError(400, getValidationMessage(parsed.error));
    }

    const timing = await dailyPrayerTimingService.createDailyPrayerTiming(
      req.params.venueId,
      parsed.data,
      req.user.id
    );

    return successResponse(res, {
      statusCode: 201,
      message: "Daily prayer timing created successfully",
      data: timing,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDailyPrayerTimingsByVenue(req, res, next) {
  try {
    const timings =
      await dailyPrayerTimingService.getDailyPrayerTimingsByVenue(
        req.params.venueId
      );

    return successResponse(res, {
      message: "Daily prayer timings fetched successfully",
      data: timings,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDailyPrayerTiming(req, res, next) {
  try {
    const parsed = updateDailyPrayerTimingSchema.safeParse(req.body);

    if (!parsed.success) {
      throw createHttpError(400, getValidationMessage(parsed.error));
    }

    const timing = await dailyPrayerTimingService.updateDailyPrayerTiming(
      req.params.timingId,
      parsed.data,
      req.user.id
    );

    return successResponse(res, {
      message: "Daily prayer timing updated successfully",
      data: timing,
    });
  } catch (error) {
    next(error);
  }
}