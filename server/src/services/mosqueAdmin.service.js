import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";
import cleanValue from "../utils/cleanValue.js";
import { logAdminActivity } from "../utils/adminActivityLogger.js";

/*
|--------------------------------------------------------------------------
| Mosque Admin Service
|--------------------------------------------------------------------------
| Purpose:
| Allows mosque admins to manage only their assigned mosque/prayer venue.
|
| Product rule:
| Mosque admins are trusted for their assigned mosque only.
| They should not receive Super Admin powers.
|
| This service currently supports:
| - list my assigned venues
| - view one assigned venue
| - update limited profile/facility/contact info
*/

const mosqueAdminVenueSelect = {
  id: true,
  name: true,
  alternateNames: true,
  venueType: true,

  address: true,
  pincode: true,
  latitude: true,
  longitude: true,
  googleMapsLink: true,
  phone: true,
  timezone: true,

  womenPrayerSpace: true,
  wuduFacility: true,
  parking: true,
  defaultKhutbahLanguage: true,
  facilityNotes: true,
  importantNotice: true,

  isActive: true,
  isPublic: true,
  verificationStatus: true,
  lastVerifiedAt: true,

  country: {
    select: {
      id: true,
      name: true,
      countryCode: true,
    },
  },

  state: {
    select: {
      id: true,
      name: true,
    },
  },

  city: {
    select: {
      id: true,
      name: true,
      timezone: true,
    },
  },

  area: {
    select: {
      id: true,
      name: true,
    },
  },

  dailyPrayerTimings: {
    where: {
      effectiveTo: null,
    },
    orderBy: {
      prayerName: "asc",
    },
    select: {
      id: true,
      prayerName: true,
      azaanTime: true,
      jamaahTime: true,
      timingType: true,
      relativeTimeText: true,
      verificationStatus: true,
      lastVerifiedAt: true,
      updatedAt: true,
    },
  },

  jumuahTimings: {
    where: {
      effectiveTo: null,
    },
    orderBy: [
      {
        slotNumber: "asc",
      },
      {
        jamaahTime: "asc",
      },
    ],
    select: {
      id: true,
      slotNumber: true,
      azaanTime: true,
      khutbahTime: true,
      jamaahTime: true,
      khutbahLanguage: true,
      womenPrayerSpace: true,
      importantNotice: true,
      verificationStatus: true,
      lastVerifiedAt: true,
      updatedAt: true,
    },
  },

  updatedAt: true,
  createdAt: true,
};

function normalizeNullableString(value) {
  const cleaned = cleanValue(value);
  return cleaned === undefined ? undefined : cleaned;
}

async function getActiveVenueAdminAssignment(userId, venueId) {
  const assignment = await prisma.venueAdminAssignment.findFirst({
    where: {
      userId,
      venueId,
      isActive: true,
    },
    select: {
      id: true,
      userId: true,
      venueId: true,
      canEditVenueProfile: true,
      canEditDailyTimings: true,
      canEditJumuahTimings: true,
      canReviewReports: true,
      canMarkVerified: true,
      assignedAt: true,
      venue: {
        select: mosqueAdminVenueSelect,
      },
    },
  });

  if (!assignment) {
    throw createHttpError(
      403,
      "You are not assigned to manage this mosque"
    );
  }

  return assignment;
}

export async function getMyAssignedVenues(userId) {
  const assignments = await prisma.venueAdminAssignment.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: {
      assignedAt: "desc",
    },
    select: {
      id: true,
      canEditVenueProfile: true,
      canEditDailyTimings: true,
      canEditJumuahTimings: true,
      canReviewReports: true,
      canMarkVerified: true,
      assignedAt: true,

      venue: {
        select: mosqueAdminVenueSelect,
      },
    },
  });

  return assignments.map((assignment) => ({
    assignmentId: assignment.id,
    permissions: {
      canEditVenueProfile: assignment.canEditVenueProfile,
      canEditDailyTimings: assignment.canEditDailyTimings,
      canEditJumuahTimings: assignment.canEditJumuahTimings,
      canReviewReports: assignment.canReviewReports,
      canMarkVerified: assignment.canMarkVerified,
    },
    assignedAt: assignment.assignedAt,
    venue: assignment.venue,
  }));
}

export async function getMyAssignedVenueById(userId, venueId) {
  const assignment = await getActiveVenueAdminAssignment(userId, venueId);

  return {
    assignmentId: assignment.id,
    permissions: {
      canEditVenueProfile: assignment.canEditVenueProfile,
      canEditDailyTimings: assignment.canEditDailyTimings,
      canEditJumuahTimings: assignment.canEditJumuahTimings,
      canReviewReports: assignment.canReviewReports,
      canMarkVerified: assignment.canMarkVerified,
    },
    assignedAt: assignment.assignedAt,
    venue: assignment.venue,
  };
}

export async function updateMyVenueProfile(userId, venueId, body = {}) {
  const assignment = await getActiveVenueAdminAssignment(userId, venueId);

  if (!assignment.canEditVenueProfile) {
    throw createHttpError(
      403,
      "You do not have permission to edit this mosque profile"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Allowed mosque-admin profile fields
  |--------------------------------------------------------------------------
  | Mosque admins can update practical public information.
  | They cannot update identity/location/visibility/trust fields.
  */
  const updateData = {
    phone: normalizeNullableString(body.phone),
    googleMapsLink: normalizeNullableString(body.googleMapsLink),

    womenPrayerSpace: body.womenPrayerSpace,
    wuduFacility: body.wuduFacility,
    parking: body.parking,

    defaultKhutbahLanguage: normalizeNullableString(
      body.defaultKhutbahLanguage
    ),
    facilityNotes: normalizeNullableString(body.facilityNotes),
    importantNotice: normalizeNullableString(body.importantNotice),
  };

  for (const key of Object.keys(updateData)) {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw createHttpError(400, "No valid mosque profile fields provided");
  }

  /*
  |--------------------------------------------------------------------------
  | Trust behavior
  |--------------------------------------------------------------------------
  | Mosque admin updates are useful and trusted, but we still mark them as
  | community_updated unless the admin has canMarkVerified.
  */
  if (assignment.canMarkVerified) {
    updateData.verificationStatus = "verified";
    updateData.lastVerifiedAt = new Date();
  } else {
    updateData.verificationStatus = "community_updated";
  }

  const updatedVenue = await prisma.venue.update({
    where: {
      id: venueId,
    },
    data: updateData,
    select: mosqueAdminVenueSelect,
  });

  await logAdminActivity({
    actorId: userId,
    action: "mosque_admin_venue_profile_updated",
    entityType: "venue",
    entityId: venueId,
    venueId,
    metadata: {
      updatedFields: Object.keys(updateData),
      venueName: updatedVenue.name,
      verificationStatus: updatedVenue.verificationStatus,
    },
  });

  return updatedVenue;
}