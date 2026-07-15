import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";

/*
|--------------------------------------------------------------------------
| Public Jumu‘ah Service
|--------------------------------------------------------------------------
| Purpose:
| Provides public/mobile Jumu‘ah slot discovery.
|
| Product rule:
| Jumu‘ah should be shown slot-by-slot because one mosque can have multiple
| Jumu‘ah slots and users care about the next available slot.
*/

function toPositiveInt(value, fallback) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return fallback;
  }

  return number;
}

function toOptionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function isValidTime(value) {
  if (!value) return false;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 === null ||
    lon1 === null ||
    lat2 === null ||
    lon2 === null ||
    lat2 === undefined ||
    lon2 === undefined
  ) {
    return null;
  }

  const earthRadiusKm = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((earthRadiusKm * c).toFixed(2));
}

function buildPublicJumuahWhere(filters = {}) {
  const now = new Date();

  const where = {
    effectiveTo: null,

    OR: [
      {
        effectiveFrom: null,
      },
      {
        effectiveFrom: {
          lte: now,
        },
      },
    ],

    venue: {
      isActive: true,
      isPublic: true,
    },
  };

  if (filters.countryId) where.venue.countryId = filters.countryId;
  if (filters.stateId) where.venue.stateId = filters.stateId;
  if (filters.cityId) where.venue.cityId = filters.cityId;
  if (filters.areaId) where.venue.areaId = filters.areaId;
  if (filters.venueType) where.venue.venueType = filters.venueType;

  if (filters.womenPrayerSpace) {
    where.womenPrayerSpace = filters.womenPrayerSpace;
  }

  if (filters.khutbahLanguage) {
    where.khutbahLanguage = {
      contains: filters.khutbahLanguage,
      mode: "insensitive",
    };
  }

  if (filters.search) {
    where.venue.OR = [
      {
        name: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        alternateNames: {
          has: filters.search,
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
      {
        area: {
          name: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      },
      {
        city: {
          name: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  return where;
}

function getPublicJumuahSelect() {
  return {
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

    venue: {
      select: {
        id: true,
        name: true,
        alternateNames: true,
        venueType: true,

        address: true,
        pincode: true,
        latitude: true,
        longitude: true,
        googleMapsLink: true,
        timezone: true,

        womenPrayerSpace: true,
        wuduFacility: true,
        parking: true,
        defaultKhutbahLanguage: true,
        facilityNotes: true,
        importantNotice: true,

        verificationStatus: true,
        lastVerifiedAt: true,
        updatedAt: true,

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

        state: {
          select: {
            id: true,
            name: true,
          },
        },

        country: {
          select: {
            id: true,
            name: true,
            countryCode: true,
          },
        },
      },
    },
  };
}

function formatPublicJumuahSlot(slot, userLat, userLng) {
  const distanceKm = getDistanceKm(
    userLat,
    userLng,
    slot.venue.latitude,
    slot.venue.longitude
  );

  return {
    id: slot.id,
    slotNumber: slot.slotNumber,

    times: {
      azaanTime: slot.azaanTime,
      khutbahTime: slot.khutbahTime,
      jamaahTime: slot.jamaahTime,
    },

    khutbahLanguage:
      slot.khutbahLanguage || slot.venue.defaultKhutbahLanguage || null,

    womenPrayerSpace: slot.womenPrayerSpace,

    notices: {
      slotNotice: slot.importantNotice,
      venueNotice: slot.venue.importantNotice,
    },

    trust: {
      slotVerificationStatus: slot.verificationStatus,
      slotLastVerifiedAt: slot.lastVerifiedAt,
      slotLastUpdatedAt: slot.updatedAt,
      venueVerificationStatus: slot.venue.verificationStatus,
      venueLastVerifiedAt: slot.venue.lastVerifiedAt,
      venueLastUpdatedAt: slot.venue.updatedAt,
    },

    venue: {
      id: slot.venue.id,
      name: slot.venue.name,
      alternateNames: slot.venue.alternateNames,
      venueType: slot.venue.venueType,

      location: {
        address: slot.venue.address,
        pincode: slot.venue.pincode,
        latitude: slot.venue.latitude,
        longitude: slot.venue.longitude,
        googleMapsLink: slot.venue.googleMapsLink,
        distanceKm,
        country: slot.venue.country,
        state: slot.venue.state,
        city: slot.venue.city,
        area: slot.venue.area,
        timezone: slot.venue.timezone || slot.venue.city?.timezone || null,
      },

      facilities: {
        womenPrayerSpace: slot.venue.womenPrayerSpace,
        wuduFacility: slot.venue.wuduFacility,
        parking: slot.venue.parking,
        facilityNotes: slot.venue.facilityNotes,
      },
    },
  };
}

function sortJumuahSlots(slots) {
  return [...slots].sort((a, b) => {
    const timeCompare = a.times.jamaahTime.localeCompare(b.times.jamaahTime);
    if (timeCompare !== 0) return timeCompare;

    const aDistance = a.venue.location.distanceKm;
    const bDistance = b.venue.location.distanceKm;

    if (aDistance !== null && bDistance !== null) {
      return aDistance - bDistance;
    }

    return a.venue.name.localeCompare(b.venue.name);
  });
}

export async function getPublicJumuahSlots(query = {}) {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, 30), 50);

  const userLat = toOptionalNumber(query.latitude);
  const userLng = toOptionalNumber(query.longitude);
  const radiusKm = toOptionalNumber(query.radiusKm);

  if (
    (query.latitude && userLat === null) ||
    (query.longitude && userLng === null)
  ) {
    throw createHttpError(400, "Invalid latitude or longitude");
  }

  if (
    (userLat === null && userLng !== null) ||
    (userLat !== null && userLng === null)
  ) {
    throw createHttpError(400, "Both latitude and longitude are required");
  }

  if (radiusKm !== null && radiusKm <= 0) {
    throw createHttpError(400, "radiusKm must be greater than 0");
  }

  const currentTime = query.currentTime;

  if (currentTime && !isValidTime(currentTime)) {
    throw createHttpError(400, "currentTime must be in HH:mm format");
  }

  const filters = {
    search: query.search?.trim(),
    countryId: query.countryId,
    stateId: query.stateId,
    cityId: query.cityId,
    areaId: query.areaId,
    venueType: query.venueType,
    womenPrayerSpace: query.womenPrayerSpace,
    khutbahLanguage: query.khutbahLanguage?.trim(),
  };

  const where = buildPublicJumuahWhere(filters);

  const rawSlots = await prisma.jumuahTiming.findMany({
    where,
    orderBy: [
      {
        jamaahTime: "asc",
      },
      {
        slotNumber: "asc",
      },
    ],
    select: getPublicJumuahSelect(),
  });

  let slots = rawSlots.map((slot) =>
    formatPublicJumuahSlot(slot, userLat, userLng)
  );

  if (userLat !== null && userLng !== null && radiusKm !== null) {
    slots = slots.filter((slot) => {
      return (
        slot.venue.location.distanceKm !== null &&
        slot.venue.location.distanceKm <= radiusKm
      );
    });
  }

  if (currentTime && query.onlyUpcoming === "true") {
    slots = slots.filter((slot) => slot.times.jamaahTime >= currentTime);
  }

  slots = sortJumuahSlots(slots);

  const total = slots.length;
  const start = (page - 1) * limit;
  const paginatedSlots = slots.slice(start, start + limit);

  return {
    slots: paginatedSlots,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
    meta: {
      resultType: "jumuah_slots",
      sortedBy: userLat !== null && userLng !== null ? "time_then_distance" : "time",
      currentTime: currentTime || null,
      onlyUpcoming: query.onlyUpcoming === "true",
      latitude: userLat,
      longitude: userLng,
      radiusKm,
    },
  };
}