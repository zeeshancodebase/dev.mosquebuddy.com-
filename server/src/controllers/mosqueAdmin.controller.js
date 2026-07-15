import { successResponse } from "../utils/apiResponse.js";
import createHttpError from "../utils/createHttpError.js";
import getValidationMessage from "../utils/getValidationMessage.js";

import {
  createDailyPrayerTimingSchema,
  updateDailyPrayerTimingSchema,
} from "../validators/dailyPrayerTiming.validator.js";

import {
  createJumuahTimingSchema,
  updateJumuahTimingSchema,
} from "../validators/jumuahTiming.validator.js";

import {
  createMosqueAdminDailyTiming,
  updateMosqueAdminDailyTiming,
  createMosqueAdminJumuahTiming,
  updateMosqueAdminJumuahTiming,
} from "../services/mosqueAdminTiming.service.js";

import {
  getMyAssignedVenues,
  getMyAssignedVenueById,
  updateMyVenueProfile,
} from "../services/mosqueAdmin.service.js";

import {
  getMosqueAdminReports,
  getMosqueAdminReportById,
  updateMosqueAdminReportStatus,
} from "../services/mosqueAdminReport.service.js";

/*
|--------------------------------------------------------------------------
| Mosque Admin Controller
|--------------------------------------------------------------------------
| Purpose:
| Handles mosque-admin self-service tools.
|
| These are not Super Admin APIs.
| A mosque admin can only act on assigned venues.
*/

export async function getMosqueAdminMyVenues(req, res, next) {
  try {
    const venues = await getMyAssignedVenues(req.user.id);

    return successResponse(res, {
      message: "Assigned mosques fetched successfully",
      data: venues,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMosqueAdminVenueById(req, res, next) {
  try {
    const venue = await getMyAssignedVenueById(
      req.user.id,
      req.params.venueId
    );

    return successResponse(res, {
      message: "Assigned mosque fetched successfully",
      data: venue,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMosqueAdminVenueProfile(req, res, next) {
  try {
    const venue = await updateMyVenueProfile(
      req.user.id,
      req.params.venueId,
      req.body
    );

    return successResponse(res, {
      message: "Mosque profile updated successfully",
      data: venue,
    });
  } catch (error) {
    next(error);
  }
}

export async function createMosqueAdminDailyTimingController(req, res, next) {
  try {
    const parsed = createDailyPrayerTimingSchema.safeParse(req.body);

    if (!parsed.success) {
      throw createHttpError(400, getValidationMessage(parsed.error));
    }

    const timing = await createMosqueAdminDailyTiming(
      req.user.id,
      req.params.venueId,
      parsed.data
    );

    return successResponse(res, {
      statusCode: 201,
      message: "Daily prayer timing updated for your mosque",
      data: timing,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMosqueAdminDailyTimingController(req, res, next) {
  try {
    const parsed = updateDailyPrayerTimingSchema.safeParse(req.body);

    if (!parsed.success) {
      throw createHttpError(400, getValidationMessage(parsed.error));
    }

    const timing = await updateMosqueAdminDailyTiming(
      req.user.id,
      req.params.timingId,
      parsed.data
    );

    return successResponse(res, {
      message: "Daily prayer timing updated successfully",
      data: timing,
    });
  } catch (error) {
    next(error);
  }
}

export async function createMosqueAdminJumuahTimingController(req, res, next) {
  try {
    const parsed = createJumuahTimingSchema.safeParse(req.body);

    if (!parsed.success) {
      throw createHttpError(400, getValidationMessage(parsed.error));
    }

    const timing = await createMosqueAdminJumuahTiming(
      req.user.id,
      req.params.venueId,
      parsed.data
    );

    return successResponse(res, {
      statusCode: 201,
      message: "Jumu‘ah timing updated for your mosque",
      data: timing,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMosqueAdminJumuahTimingController(req, res, next) {
  try {
    const parsed = updateJumuahTimingSchema.safeParse(req.body);

    if (!parsed.success) {
      throw createHttpError(400, getValidationMessage(parsed.error));
    }

    const timing = await updateMosqueAdminJumuahTiming(
      req.user.id,
      req.params.timingId,
      parsed.data
    );

    return successResponse(res, {
      message: "Jumu‘ah timing updated successfully",
      data: timing,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMosqueAdminReportsController(req, res, next) {
  try {
    const result = await getMosqueAdminReports(req.user.id, req.query);

    return successResponse(res, {
      message: "Mosque reports fetched successfully",
      data: result.reports,
      meta: {
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMosqueAdminReportByIdController(req, res, next) {
  try {
    const report = await getMosqueAdminReportById(
      req.user.id,
      req.params.reportId
    );

    return successResponse(res, {
      message: "Mosque report fetched successfully",
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMosqueAdminReportStatusController(req, res, next) {
  try {
    const result = await updateMosqueAdminReportStatus(
      req.user.id,
      req.params.reportId,
      {
        status: req.body.status,
        reviewNote: req.body.reviewNote,
      }
    );

    return successResponse(res, {
      message: "Mosque report status updated successfully",
      data: result.report,
      meta: {
        previousStatus: result.previousStatus,
        appliedTimingUpdate: result.appliedTimingUpdate,
      },
    });
  } catch (error) {
    next(error);
  }
}