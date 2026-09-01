import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";
import { validateAnnouncementInput } from "../validators/announcement.validator.js";

const ANNOUNCEMENT_INCLUDE = {
  venue: { select: { id: true, name: true } },
  area: { select: { id: true, name: true } },
  city: { select: { id: true, name: true } },
  state: { select: { id: true, name: true } },
};

// ── Mosque Admin: post announcement for their assigned venue ──
export async function createVenueAnnouncement(mosqueAdminUserId, venueId, body) {
  const assignment = await prisma.venueAdminAssignment.findFirst({
    where: { userId: mosqueAdminUserId, venueId, isActive: true },
  });

  if (!assignment) {
    throw createHttpError(403, "You are not assigned to this venue");
  }

  const validated = validateAnnouncementInput(
    { ...body, scope: "venue", venueId },
    { isUpdate: false }
  );

  return prisma.announcement.create({
    data: {
      ...validated,
      createdById: mosqueAdminUserId,
      createdByRole: "mosque_admin",
    },
    include: ANNOUNCEMENT_INCLUDE,
  });
}

// ── Trusted Volunteer: post announcement within assigned scope ──
export async function createVolunteerAnnouncement(volunteerUserId, body) {
  const validated = validateAnnouncementInput(body, { isUpdate: false });

  if (validated.scope === "state") {
    throw createHttpError(403, "Volunteers cannot post state-wide announcements");
  }

  const scopeTargetId =
    validated.scope === "venue" ? validated.venueId :
    validated.scope === "area" ? validated.areaId :
    validated.cityId;

  const assignment = await prisma.volunteerAssignment.findFirst({
    where: {
      userId: volunteerUserId,
      isActive: true,
      canUpdateTimings: true,
      ...(validated.scope === "venue" && { venueId: scopeTargetId }),
      ...(validated.scope === "area" && { areaId: scopeTargetId }),
      ...(validated.scope === "city" && { cityId: scopeTargetId }),
    },
  });

  if (!assignment) {
    throw createHttpError(403, "You don't have an active assignment covering this scope");
  }

  return prisma.announcement.create({
    data: {
      ...validated,
      createdById: volunteerUserId,
      createdByRole: "trusted_volunteer",
    },
    include: ANNOUNCEMENT_INCLUDE,
  });
}

// ── Super Admin: post announcement at any scope ──
export async function createAdminAnnouncement(superAdminUserId, body) {
  const validated = validateAnnouncementInput(body, { isUpdate: false });

  return prisma.announcement.create({
    data: {
      ...validated,
      createdById: superAdminUserId,
      createdByRole: "super_admin",
    },
    include: ANNOUNCEMENT_INCLUDE,
  });
}

// ── Public: list announcements visible in a user's location context ──
// Pass every scope id that applies to the user's current location so
// venue + area + city + state announcements all surface together —
// this is exactly the mix your mock data (ann_1..ann_5) already models.
export async function listPublicAnnouncements({
  venueId,
  venueIds,
  areaId,
  cityId,
  stateId,
  page = 1,
  limit = 20,
}) {
  const now = new Date();
  const take = Math.min(Number(limit) || 20, 50);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const allVenueIds = [
    ...(venueId ? [venueId] : []),
    ...(Array.isArray(venueIds) ? venueIds : []),
  ].filter(Boolean);
  const uniqueVenueIds = [...new Set(allVenueIds)];

  const scopeFilters = [];
  if (uniqueVenueIds.length > 0) {
    scopeFilters.push({ scope: "venue", venueId: { in: uniqueVenueIds } });
  }
  if (areaId) scopeFilters.push({ scope: "area", areaId });
  if (cityId) scopeFilters.push({ scope: "city", cityId });
  if (stateId) scopeFilters.push({ scope: "state", stateId });

  if (scopeFilters.length === 0) {
    throw createHttpError(400, "At least one of venueId, areaId, cityId, stateId is required");
  }

  const where = {
    isActive: true,
    OR: scopeFilters,
    AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
  };

  const [items, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      include: ANNOUNCEMENT_INCLUDE,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip,
      take,
    }),
    prisma.announcement.count({ where }),
  ]);

  return {
    items,
    pagination: { page: Number(page) || 1, limit: take, total, totalPages: Math.ceil(total / take) },
  };
}