import { successResponse } from "../utils/apiResponse.js";
import { getAdminActivityLogs } from "../services/adminActivityLog.service.js";

/*
|--------------------------------------------------------------------------
| Admin Activity Log Controller
|--------------------------------------------------------------------------
| Purpose:
| Dedicated Super Admin audit log page.
*/

export async function getAdminActivityLogsController(req, res, next) {
  try {
    const result = await getAdminActivityLogs(req.query);

    return successResponse(res, {
      message: "Admin activity logs fetched successfully",
      data: result.logs,
      meta: {
        pagination: result.pagination,
        filters: result.filters,
      },
    });
  } catch (error) {
    next(error);
  }
}