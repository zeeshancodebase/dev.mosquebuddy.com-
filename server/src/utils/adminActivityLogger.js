import prisma from "../config/prisma.js";

/*
|--------------------------------------------------------------------------
| Admin Activity Logger
|--------------------------------------------------------------------------
| Records important admin actions for audit, trust, and dashboard activity.
|
| Use this only for meaningful admin actions, not every small read request.
*/
export const logAdminActivity = async ({
  actorId,
  action,
  entityType,
  entityId = null,
  venueId = null,
  metadata = null,
}) => {
  try {
    if (!actorId || !action || !entityType) {
      return null;
    }

    return await prisma.adminActivityLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        venueId,
        metadata,
      },
    });
  } catch (error) {
    /*
      Important:
      Activity logging should not break the main admin action.
      If a venue update succeeds but log insert fails, we should not fail the request.
    */
    console.error("Admin activity log failed:", error);
    return null;
  }
};