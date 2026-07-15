import { successResponse } from "../utils/apiResponse.js";
import { logAdminActivity } from "../utils/adminActivityLogger.js";

import {
  getVenueSuggestions,
  getVenueSuggestionById,
  updateVenueSuggestionStatus,
} from "../services/adminVenueSuggestion.service.js";

/*
|--------------------------------------------------------------------------
| Admin Venue Suggestion Controller
|--------------------------------------------------------------------------
| Purpose:
| Super Admin review workflow for missing mosque/prayer venue suggestions.
*/

export async function getAdminVenueSuggestions(req, res, next) {
  try {
    const result = await getVenueSuggestions(req.query);

    return successResponse(res, {
      message: "Venue suggestions fetched successfully",
      data: result.suggestions,
      meta: {
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminVenueSuggestionById(req, res, next) {
  try {
    const suggestion = await getVenueSuggestionById(req.params.suggestionId);

    return successResponse(res, {
      message: "Venue suggestion fetched successfully",
      data: suggestion,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminVenueSuggestionStatus(req, res, next) {
  try {
    const result = await updateVenueSuggestionStatus(
      req.params.suggestionId,
      {
        status: req.body.status,
        reviewNote: req.body.reviewNote,
        approvedVenueId: req.body.approvedVenueId,
      },
      req.user.id
    );

    await logAdminActivity({
      actorId: req.user.id,
      action: "venue_suggestion_reviewed",
      entityType: "venue_suggestion",
      entityId: result.suggestion.id,
      venueId: result.suggestion.approvedVenueId || null,
      metadata: {
        previousStatus: result.previousStatus,
        newStatus: result.suggestion.status,
        suggestedName: result.suggestion.suggestedName,
        approvedVenueId: result.suggestion.approvedVenueId,
        reviewNote: result.suggestion.reviewNote,
      },
    });

    return successResponse(res, {
      message: "Venue suggestion status updated successfully",
      data: result.suggestion,
    });
  } catch (error) {
    next(error);
  }
}