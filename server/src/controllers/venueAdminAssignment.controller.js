import { successResponse } from "../utils/apiResponse.js";
import createHttpError from "../utils/createHttpError.js";
import { logAdminActivity } from "../utils/adminActivityLogger.js";

import {
  getVenueAdminAssignments,
  createVenueAdminAssignment,
  updateVenueAdminAssignment,
  deactivateVenueAdminAssignment,
} from "../services/venueAdminAssignment.service.js";

export async function getAdminVenueAdminAssignments(req, res, next) {
  try {
    const result = await getVenueAdminAssignments(req.query);

    return successResponse(res, {
      message: "Venue admin assignments fetched successfully",
      data: result.assignments,
      meta: {
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createAdminVenueAdminAssignment(req, res, next) {
  try {
    const { userId, venueId } = req.body;

    if (!userId) {
      throw createHttpError(400, "userId is required");
    }

    if (!venueId) {
      throw createHttpError(400, "venueId is required");
    }

    const assignment = await createVenueAdminAssignment(
      req.body,
      req.user.id
    );

    await logAdminActivity({
      actorId: req.user.id,
      action: "venue_admin_assigned",
      entityType: "venue_admin_assignment",
      entityId: assignment.id,
      venueId: assignment.venueId,
      metadata: {
        assignedUserId: assignment.userId,
        assignedUserName: assignment.user?.name,
        venueName: assignment.venue?.name,
        canEditVenueProfile: assignment.canEditVenueProfile,
        canEditDailyTimings: assignment.canEditDailyTimings,
        canEditJumuahTimings: assignment.canEditJumuahTimings,
        canReviewReports: assignment.canReviewReports,
        canMarkVerified: assignment.canMarkVerified,
      },
    });

    return successResponse(res, {
      statusCode: 201,
      message: "Venue admin assigned successfully",
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminVenueAdminAssignment(req, res, next) {
  try {
    const assignment = await updateVenueAdminAssignment(
      req.params.assignmentId,
      req.body
    );

    await logAdminActivity({
      actorId: req.user.id,
      action: "venue_admin_assignment_updated",
      entityType: "venue_admin_assignment",
      entityId: assignment.id,
      venueId: assignment.venueId,
      metadata: {
        assignedUserId: assignment.userId,
        assignedUserName: assignment.user?.name,
        venueName: assignment.venue?.name,
        isActive: assignment.isActive,
        canEditVenueProfile: assignment.canEditVenueProfile,
        canEditDailyTimings: assignment.canEditDailyTimings,
        canEditJumuahTimings: assignment.canEditJumuahTimings,
        canReviewReports: assignment.canReviewReports,
        canMarkVerified: assignment.canMarkVerified,
      },
    });

    return successResponse(res, {
      message: "Venue admin assignment updated successfully",
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}

export async function deactivateAdminVenueAdminAssignment(req, res, next) {
  try {
    const assignment = await deactivateVenueAdminAssignment(
      req.params.assignmentId
    );

    await logAdminActivity({
      actorId: req.user.id,
      action: "venue_admin_assignment_removed",
      entityType: "venue_admin_assignment",
      entityId: assignment.id,
      venueId: assignment.venueId,
      metadata: {
        assignedUserId: assignment.userId,
        assignedUserName: assignment.user?.name,
        venueName: assignment.venue?.name,
      },
    });

    return successResponse(res, {
      message: "Venue admin assignment removed successfully",
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}