import { successResponse } from "../utils/apiResponse.js";
import createHttpError from "../utils/createHttpError.js";
import { logAdminActivity } from "../utils/adminActivityLogger.js";

import {
  getTimingReports,
  getTimingReportById,
  updateTimingReportStatus,
} from "../services/adminTimingReport.service.js";

const allowedStatuses = [
  "pending",
  "approved",
  "rejected",
  "needs_more_info",
];

export async function getAdminTimingReports(req, res, next) {
  try {
    const result = await getTimingReports(req.query);

    return successResponse(res, {
      message: "Timing reports fetched successfully",
      data: result.reports,
      meta: {
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminTimingReportById(req, res, next) {
  try {
    const report = await getTimingReportById(req.params.reportId);

    return successResponse(res, {
      message: "Timing report fetched successfully",
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminTimingReportStatus(req, res, next) {
  try {
    const { status, reviewNote } = req.body;

    if (!allowedStatuses.includes(status)) {
      throw createHttpError(400, "Invalid report status");
    }

    const result = await updateTimingReportStatus(
      req.params.reportId,
      {
        status,
        reviewNote,
      },
      req.user.id
    );

    await logAdminActivity({
      actorId: req.user.id,
      action: "timing_report_reviewed",
      entityType: "timing_report",
      entityId: result.report.id,
      venueId: result.report.venueId,
      metadata: {
        previousStatus: result.previousStatus,
        newStatus: result.report.status,
        issueType: result.report.issueType,
        prayerName: result.report.prayerName,
        reviewNote: result.report.reviewNote,
      },
    });

    return successResponse(res, {
      message: "Timing report status updated successfully",
      data: result.report,
    });
  } catch (error) {
    next(error);
  }
}