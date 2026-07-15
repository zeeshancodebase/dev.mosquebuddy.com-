// src/controllers/updateHistory.controller.js
import { getVenueUpdateHistory } from "../services/updateHistory.service.js";
import { successResponse } from "../utils/apiResponse.js";

export async function getVenueHistory(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    const result = await getVenueUpdateHistory(req.params.venueId, { page, limit });

    return successResponse(res, {
      message: "Update history fetched successfully",
      data: result.history,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}