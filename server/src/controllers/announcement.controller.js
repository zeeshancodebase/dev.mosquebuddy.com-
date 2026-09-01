import { successResponse } from "../utils/apiResponse.js";
import { logAdminActivity } from "../utils/adminActivityLogger.js";
import {
  createVenueAnnouncement,
  createVolunteerAnnouncement,
  createAdminAnnouncement,
  listPublicAnnouncements,
} from "../services/announcement.service.js";

export async function postVenueAnnouncement(req, res, next) {
  try {
    const { venueId } = req.params;
    const announcement = await createVenueAnnouncement(req.user.id, venueId, req.body);

    await logAdminActivity({
      actorId: req.user.id,
      action: "announcement_created",
      entityType: "announcement",
      entityId: announcement.id,
      venueId: announcement.venueId,
      metadata: { scope: announcement.scope, title: announcement.title },
    });

    return successResponse(res, {
      statusCode: 201,
      message: "Announcement posted",
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
}

export async function postVolunteerAnnouncement(req, res, next) {
  try {
    const announcement = await createVolunteerAnnouncement(req.user.id, req.body);

    await logAdminActivity({
      actorId: req.user.id,
      action: "announcement_created",
      entityType: "announcement",
      entityId: announcement.id,
      venueId: announcement.venueId,
      metadata: { scope: announcement.scope, title: announcement.title },
    });

    return successResponse(res, {
      statusCode: 201,
      message: "Announcement posted",
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
}

export async function postAdminAnnouncement(req, res, next) {
  try {
    const announcement = await createAdminAnnouncement(req.user.id, req.body);

    await logAdminActivity({
      actorId: req.user.id,
      action: "announcement_created",
      entityType: "announcement",
      entityId: announcement.id,
      venueId: announcement.venueId,
      metadata: { scope: announcement.scope, title: announcement.title },
    });

    return successResponse(res, {
      statusCode: 201,
      message: "Announcement posted",
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicAnnouncements(req, res, next) {
  try {
    const { venueId, venueIds, areaId, cityId, stateId, page, limit } = req.query;
    // venueIds arrives as a comma-separated string over query params
    const venueIdsArray = venueIds ? String(venueIds).split(",").filter(Boolean) : undefined;
    const result = await listPublicAnnouncements({
      venueId,
      venueIds: venueIdsArray,
      areaId,
      cityId,
      stateId,
      page,
      limit,
    });
    
    return successResponse(res, {
      statusCode: 200,
      message: "Announcements fetched",
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}