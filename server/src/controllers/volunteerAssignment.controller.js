import { successResponse } from "../utils/apiResponse.js";
import { logAdminActivity } from "../utils/adminActivityLogger.js";

import {
  getVolunteerAssignments,
  createVolunteerAssignment,
  updateVolunteerAssignment,
  deactivateVolunteerAssignment,
} from "../services/volunteerAssignment.service.js";

export async function getVolunteerAssignmentsController(req, res, next) {
  try {
    const result = await getVolunteerAssignments(req.query);

    return successResponse(res, {
      message: "Volunteer assignments fetched successfully",
      data: result.assignments,
      meta: {
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createVolunteerAssignmentController(req, res, next) {
  try {
    const assignment = await createVolunteerAssignment(req.body, req.user.id);

    await logAdminActivity({
      actorId: req.user.id,
      action: "volunteer_assignment_created",
      entityType: "volunteer_assignment",
      entityId: assignment.id,
      venueId: assignment.venueId || null,
      metadata: {
        userId: assignment.userId,
        venueId: assignment.venueId,
        areaId: assignment.areaId,
        cityId: assignment.cityId,
        permissions: {
          canVerifyTimings: assignment.canVerifyTimings,
          canUpdateTimings: assignment.canUpdateTimings,
          canReviewReports: assignment.canReviewReports,
          canReviewSuggestions: assignment.canReviewSuggestions,
        },
      },
    });

    return successResponse(res, {
      statusCode: 201,
      message: "Volunteer assignment created successfully",
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateVolunteerAssignmentController(req, res, next) {
  try {
    const assignment = await updateVolunteerAssignment(
      req.params.assignmentId,
      req.body
    );

    await logAdminActivity({
      actorId: req.user.id,
      action: "volunteer_assignment_updated",
      entityType: "volunteer_assignment",
      entityId: assignment.id,
      venueId: assignment.venueId || null,
      metadata: {
        userId: assignment.userId,
        venueId: assignment.venueId,
        areaId: assignment.areaId,
        cityId: assignment.cityId,
        updatedFields: Object.keys(req.body),
        permissions: {
          canVerifyTimings: assignment.canVerifyTimings,
          canUpdateTimings: assignment.canUpdateTimings,
          canReviewReports: assignment.canReviewReports,
          canReviewSuggestions: assignment.canReviewSuggestions,
        },
        isActive: assignment.isActive,
      },
    });

    return successResponse(res, {
      message: "Volunteer assignment updated successfully",
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}

export async function deactivateVolunteerAssignmentController(req, res, next) {
  try {
    const assignment = await deactivateVolunteerAssignment(
      req.params.assignmentId
    );

    await logAdminActivity({
      actorId: req.user.id,
      action: "volunteer_assignment_deactivated",
      entityType: "volunteer_assignment",
      entityId: assignment.id,
      venueId: assignment.venueId || null,
      metadata: {
        userId: assignment.userId,
        venueId: assignment.venueId,
        areaId: assignment.areaId,
        cityId: assignment.cityId,
      },
    });

    return successResponse(res, {
      message: "Volunteer assignment deactivated successfully",
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}