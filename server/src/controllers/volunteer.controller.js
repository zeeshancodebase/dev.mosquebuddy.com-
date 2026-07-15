import { successResponse } from "../utils/apiResponse.js";

import {
  getMyVolunteerAssignments,
  getVolunteerVenues,
  getVolunteerReports,
  getVolunteerSuggestions,
  createVolunteerDailyTiming,
  updateVolunteerDailyTiming,
  verifyVolunteerDailyTiming,
  createVolunteerJumuahTiming,
  updateVolunteerJumuahTiming,
  verifyVolunteerJumuahTiming,
  updateVolunteerReportStatus,
  updateVolunteerSuggestionStatus,
  getVolunteerVenueById,
} from "../services/volunteer.service.js";

export async function getMyVolunteerAssignmentsController(req, res, next) {
  try {
    const assignments = await getMyVolunteerAssignments(req.user.id);

    return successResponse(res, {
      message: "Volunteer assignments fetched successfully",
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
}

export async function getVolunteerVenuesController(req, res, next) {
  try {
    const result = await getVolunteerVenues(req.user.id, req.query);

    return successResponse(res, {
      message: "Volunteer venues fetched successfully",
      data: result.venues,
      meta: {
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getVolunteerVenueByIdController(req, res, next) {
  try {
    const venue = await getVolunteerVenueById(req.user.id, req.params.venueId);
    return successResponse(res, { message: "Venue fetched successfully", data: venue });
  } catch (error) {
    next(error);
  }
}

export async function getVolunteerReportsController(req, res, next) {
  try {
    const result = await getVolunteerReports(req.user.id, req.query);

    return successResponse(res, {
      message: "Volunteer reports fetched successfully",
      data: result.reports,
      meta: {
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getVolunteerSuggestionsController(req, res, next) {
  try {
    const result = await getVolunteerSuggestions(req.user.id, req.query);

    return successResponse(res, {
      message: "Volunteer suggestions fetched successfully",
      data: result.suggestions,
      meta: {
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}


export async function createVolunteerDailyTimingController(req, res, next) {
  try {
    const timing = await createVolunteerDailyTiming(req.user.id, req.params.venueId, req.body);
    return successResponse(res, { statusCode: 201, message: "Daily timing created successfully", data: timing });
  } catch (error) {
    next(error);
  }
}

export async function updateVolunteerDailyTimingController(req, res, next) {
  try {
    const timing = await updateVolunteerDailyTiming(req.user.id, req.params.timingId, req.body);
    return successResponse(res, { message: "Daily timing updated successfully", data: timing });
  } catch (error) {
    next(error);
  }
}

export async function verifyVolunteerDailyTimingController(req, res, next) {
  try {
    const timing = await verifyVolunteerDailyTiming(req.user.id, req.params.timingId);
    return successResponse(res, { message: "Timing marked as verified", data: timing });
  } catch (error) {
    next(error);
  }
}

export async function createVolunteerJumuahTimingController(req, res, next) {
  try {
    const timing = await createVolunteerJumuahTiming(req.user.id, req.params.venueId, req.body);
    return successResponse(res, { statusCode: 201, message: "Jumu'ah timing created successfully", data: timing });
  } catch (error) {
    next(error);
  }
}

export async function updateVolunteerJumuahTimingController(req, res, next) {
  try {
    const timing = await updateVolunteerJumuahTiming(req.user.id, req.params.timingId, req.body);
    return successResponse(res, { message: "Jumu'ah timing updated successfully", data: timing });
  } catch (error) {
    next(error);
  }
}

export async function verifyVolunteerJumuahTimingController(req, res, next) {
  try {
    const timing = await verifyVolunteerJumuahTiming(req.user.id, req.params.timingId);
    return successResponse(res, { message: "Timing marked as verified", data: timing });
  } catch (error) {
    next(error);
  }
}

export async function updateVolunteerReportStatusController(req, res, next) {
  try {
    const report = await updateVolunteerReportStatus(req.user.id, req.params.reportId, req.body);
    return successResponse(res, { message: "Report status updated successfully", data: report });
  } catch (error) {
    next(error);
  }
}

export async function updateVolunteerSuggestionStatusController(req, res, next) {
  try {
    const suggestion = await updateVolunteerSuggestionStatus(req.user.id, req.params.suggestionId, req.body);
    return successResponse(res, { message: "Suggestion status updated successfully", data: suggestion });
  } catch (error) {
    next(error);
  }
}