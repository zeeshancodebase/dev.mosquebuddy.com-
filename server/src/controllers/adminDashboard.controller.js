import { successResponse } from "../utils/apiResponse.js";
import { getAdminDashboardSummaryService } from "../services/adminDashboard.service.js";

export const getAdminDashboardSummary = async (req, res, next) => {
  try {
    const dashboardSummary = await getAdminDashboardSummaryService();

    return successResponse(res, {
      message: "Admin dashboard summary fetched successfully",
      data: dashboardSummary,
    });
  } catch (error) {
    return next(error);
  }
};