import prisma from "../config/prisma.js";
import { logAdminActivity } from "../utils/adminActivityLogger.js";
import createHttpError from "../utils/createHttpError.js";

function getVenueInclude() {
  return {
    country: true,
    state: true,
    city: true,
    area: true,
    createdBy: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  };
}

function buildVenueWhereClause(filters) {
  const where = {};

  if (filters.search) {
    where.OR = [
      {
        name: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        address: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        pincode: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (filters.countryId) where.countryId = filters.countryId;
  if (filters.stateId) where.stateId = filters.stateId;
  if (filters.cityId) where.cityId = filters.cityId;
  if (filters.areaId) where.areaId = filters.areaId;
  if (filters.venueType) where.venueType = filters.venueType;
  if (filters.verificationStatus) where.verificationStatus = filters.verificationStatus;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.isPublic !== undefined) where.isPublic = filters.isPublic;

  return where;
}


export async function createVenue(data, currentUserId) {
  const venue = await prisma.venue.create({
    data: {
      name: data.name,
      alternateNames: data.alternateNames || [],
      venueType: data.venueType,

      countryId: data.countryId,
      stateId: data.stateId,
      cityId: data.cityId,
      areaId: data.areaId || null,

      address: data.address || null,
      pincode: data.pincode || null,

      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,

      googleMapsLink: data.googleMapsLink || null,
      phone: data.phone || null,
      timezone: data.timezone || null,

      womenPrayerSpace: data.womenPrayerSpace,
      wuduFacility: data.wuduFacility,
      parking: data.parking,

      defaultKhutbahLanguage: data.defaultKhutbahLanguage || null,
      facilityNotes: data.facilityNotes || null,
      importantNotice: data.importantNotice || null,

      isActive: data.isActive,
      isPublic: data.isPublic,

      verificationStatus: data.verificationStatus,
      lastVerifiedAt:
        data.verificationStatus === "verified" ? new Date() : null,

      createdById: currentUserId,
    },
    include: getVenueInclude(),
  });

  await logAdminActivity({
    actorId: currentUserId,
    action: "venue_created",
    entityType: "venue",
    entityId: venue.id,
    venueId: venue.id,
    metadata: {
      venueName: venue.name,
      venueType: venue.venueType,
      cityId: venue.cityId,
      areaId: venue.areaId,
      isActive: venue.isActive,
      isPublic: venue.isPublic,
      verificationStatus: venue.verificationStatus,
    },
  });

  return venue;
}

export async function getVenues(filters) {
  const page = filters.page;
  const limit = filters.limit;
  const skip = (page - 1) * limit;

  const where = buildVenueWhereClause(filters);

  const [venues, total] = await Promise.all([
    prisma.venue.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      include: getVenueInclude(),
    }),
    prisma.venue.count({ where }),
  ]);

  return {
    venues,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getVenueById(venueId) {
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    include: getVenueInclude(),
  });

  if (!venue) {
    throw createHttpError(404, "Venue not found");
  }

  return venue;
}

export async function updateVenue(venueId, data, currentUserId) {
  await getVenueById(venueId);

  const updateData = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updateData[key] = value;
    }
  }

  if (data.verificationStatus === "verified") {
    updateData.lastVerifiedAt = new Date();
  }

  const updatedVenue = await prisma.venue.update({
    where: { id: venueId },
    data: updateData,
    include: getVenueInclude(),
  });

  await logAdminActivity({
    actorId: currentUserId,
    action: "venue_updated",
    entityType: "venue",
    entityId: venueId,
    venueId,
    metadata: {
      updatedFields: Object.keys(updateData),
      venueName: updatedVenue.name,
      venueType: updatedVenue.venueType,
      cityId: updatedVenue.cityId,
      areaId: updatedVenue.areaId,
      isActive: updatedVenue.isActive,
      isPublic: updatedVenue.isPublic,
      verificationStatus: updatedVenue.verificationStatus,
    },
  });

  return updatedVenue;
}

export async function updateVenueStatus(venueId, data, currentUserId) {
  await getVenueById(venueId);

  const updateData = {};

  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

  if (data.verificationStatus !== undefined) {
    updateData.verificationStatus = data.verificationStatus;

    if (data.verificationStatus === "verified") {
      updateData.lastVerifiedAt = new Date();
    }
  }

  const updatedVenue = await prisma.venue.update({
    where: { id: venueId },
    data: updateData,
    include: getVenueInclude(),
  });

  await logAdminActivity({
    actorId: currentUserId,
    action: "venue_status_updated",
    entityType: "venue",
    entityId: venueId,
    venueId,
    metadata: {
      updatedFields: Object.keys(updateData),
      venueName: updatedVenue.name,
      isActive: updatedVenue.isActive,
      isPublic: updatedVenue.isPublic,
      verificationStatus: updatedVenue.verificationStatus,
    },
  });

  return updatedVenue;
}