import { successResponse } from "../utils/apiResponse.js";
import { logAdminActivity } from "../utils/adminActivityLogger.js";

import {
  submitFeedback,
  getAdminFeedbackList,
  getAdminFeedbackById,
  updateAdminFeedback,
  getAdminFeedbackSummary,
} from "../services/feedback.service.js";

/*
|--------------------------------------------------------------------------
| Feedback Controller
|--------------------------------------------------------------------------
*/

// ─── Public: submit feedback ──────────────────────────────
// authMiddleware is NOT required on this route — anonymous allowed.
// If a token is present, authMiddleware (when used) attaches req.user.
export async function submitFeedbackController(req, res, next) {
  try {
    const submittedById = req.user?.id || null;
    const feedback = await submitFeedback(req.body, submittedById);

    return successResponse(res, {
      message: "Feedback submitted successfully. JazakAllahu khair!",
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
}

// ─── Admin: list feedback ─────────────────────────────────
export async function getAdminFeedbackController(req, res, next) {
  try {
    const result = await getAdminFeedbackList(req.query);

    return successResponse(res, {
      message: "Feedback fetched successfully",
      data: result.items,
      meta: { pagination: result.pagination },
    });
  } catch (error) {
    next(error);
  }
}

// ─── Admin: get single feedback ───────────────────────────
export async function getAdminFeedbackByIdController(req, res, next) {
  try {
    const feedback = await getAdminFeedbackById(req.params.feedbackId);

    return successResponse(res, {
      message: "Feedback fetched successfully",
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
}

// ─── Admin: update status / internal note ─────────────────
export async function updateAdminFeedbackController(req, res, next) {
  try {
    const result = await updateAdminFeedback(req.params.feedbackId, {
      status: req.body.status,
      internalNote: req.body.internalNote,
    });

    await logAdminActivity({
      actorId: req.user.id,
      action: "feedback_reviewed",
      entityType: "feedback",
      entityId: result.feedback.id,
      venueId: null,
      metadata: {
        previousStatus: result.previousStatus,
        newStatus: result.feedback.status,
        feedbackType: result.feedback.type,
      },
    });

    return successResponse(res, {
      message: "Feedback updated successfully",
      data: result.feedback,
    });
  } catch (error) {
    next(error);
  }
}

// ─── Admin: summary stats ─────────────────────────────────
export async function getAdminFeedbackSummaryController(req, res, next) {
  try {
    const summary = await getAdminFeedbackSummary();

    return successResponse(res, {
      message: "Feedback summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}