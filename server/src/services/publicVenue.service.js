import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";

const PRAYER_ORDER = {
  fajr: 1,
  dhuhr: 2,
  asr: 3,
  maghrib: 4,
  isha: 5,
};

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


function buildPublicVenueWhere(filters = {}) {
  const where = {
    isActive: true,
    isPublic: true,
  };

  if (filters.search) {
    where.OR = [
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

  if (filters.countryId) where.countryId = filters.countryId;
  if (filters.stateId) where.stateId = filters.stateId;
  if (filters.cityId) where.cityId = filters.cityId;
  if (filters.areaId) where.areaId = filters.areaId;
  if (filters.venueType) where.venueType = filters.venueType;
  if (filters.womenPrayerSpace) {
    where.womenPrayerSpace = filters.womenPrayerSpace;
  }

  return where;
}

function getPublicVenueSelect() {
  return {
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

    verificationStatus: true,
    lastVerifiedAt: true,
    updatedAt: true,

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
      orderBy: [
        {
          slotNumber: "asc",
        },
        {
          jamaahTime: "asc",
        },
      ],
    },
  };
}

function sortDailyTimings(dailyPrayerTimings = []) {
  return [...dailyPrayerTimings].sort((a, b) => {
    return PRAYER_ORDER[a.prayerName] - PRAYER_ORDER[b.prayerName];
  });
}

function formatPublicVenue(venue, userLat = null, userLng = null) {
  const distanceKm = getDistanceKm(
    userLat,
    userLng,
    venue.latitude,
    venue.longitude
  );

  return {
    id: venue.id,
    name: venue.name,
    alternateNames: venue.alternateNames,
    venueType: venue.venueType,

    location: {
      address: venue.address,
      pincode: venue.pincode,
      latitude: venue.latitude,
      longitude: venue.longitude,
      googleMapsLink: venue.googleMapsLink,
      distanceKm,
      country: venue.country,
      state: venue.state,
      city: venue.city,
      area: venue.area,
      timezone: venue.timezone || venue.city?.timezone || null,
    },

    contact: {
      phone: venue.phone,
    },

    facilities: {
      womenPrayerSpace: venue.womenPrayerSpace,
      wuduFacility: venue.wuduFacility,
      parking: venue.parking,
      defaultKhutbahLanguage: venue.defaultKhutbahLanguage,
      facilityNotes: venue.facilityNotes,
      importantNotice: venue.importantNotice,
    },

    trust: {
      verificationStatus: venue.verificationStatus,
      lastVerifiedAt: venue.lastVerifiedAt,
      lastUpdatedAt: venue.updatedAt,
    },

    timings: {
      daily: sortDailyTimings(venue.dailyPrayerTimings),
      jumuah: venue.jumuahTimings,
    },
  };
}

function sortPublicVenues(venues, hasUserLocation) {
  return [...venues].sort((a, b) => {
    if (hasUserLocation) {
      const aDistance = a.location.distanceKm;
      const bDistance = b.location.distanceKm;

      if (aDistance !== null && bDistance !== null) {
        return aDistance - bDistance;
      }

      if (aDistance !== null) return -1;
      if (bDistance !== null) return 1;
    }

    const aVerified = a.trust.verificationStatus === "verified" ? 0 : 1;
    const bVerified = b.trust.verificationStatus === "verified" ? 0 : 1;

    if (aVerified !== bVerified) {
      return aVerified - bVerified;
    }

    return a.name.localeCompare(b.name);
  });
}

export async function getPublicVenues(query = {}) {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, 20), 50);

  const userLat = toOptionalNumber(query.latitude);
  const userLng = toOptionalNumber(query.longitude);
  const radiusKm = toOptionalNumber(query.radiusKm);

  if (
    (query.latitude && userLat === null) ||
    (query.longitude && userLng === null)
  ) {
    throw createHttpError(400, "Invalid latitude or longitude");
  }

  if ((userLat === null && userLng !== null) || (userLat !== null && userLng === null)) {
    throw createHttpError(400, "Both latitude and longitude are required");
  }

  if (radiusKm !== null && radiusKm <= 0) {
    throw createHttpError(400, "radiusKm must be greater than 0");
  }

  const hasUserLocation = userLat !== null && userLng !== null;

  const filters = {
    search: query.search?.trim(),
    countryId: query.countryId,
    stateId: query.stateId,
    cityId: query.cityId,
    areaId: query.areaId,
    venueType: query.venueType,
    womenPrayerSpace: query.womenPrayerSpace,
  };

  const where = buildPublicVenueWhere(filters);

  const rawVenues = await prisma.venue.findMany({
    where,
    orderBy: [
      {
        verificationStatus: "asc",
      },
      {
        updatedAt: "desc",
      },
    ],
    select: getPublicVenueSelect(),
  });

  let venues = rawVenues.map((venue) =>
    formatPublicVenue(venue, userLat, userLng)
  );

  if (hasUserLocation && radiusKm !== null) {
    venues = venues.filter((venue) => {
      return (
        venue.location.distanceKm !== null &&
        venue.location.distanceKm <= radiusKm
      );
    });
  }

  venues = sortPublicVenues(venues, hasUserLocation);

  const total = venues.length;
  const start = (page - 1) * limit;
  const paginatedVenues = venues.slice(start, start + limit);

  return {
    venues: paginatedVenues,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
    meta: {
      resultType: "public_venues",
      sortedBy: hasUserLocation ? "distance" : "trust_then_name",
      latitude: hasUserLocation ? userLat : null,
      longitude: hasUserLocation ? userLng : null,
      radiusKm,
    },
  };
}

export async function getPublicVenueById(venueId) {
  const venue = await prisma.venue.findFirst({
    where: {
      id: venueId,
      isActive: true,
      isPublic: true,
    },
    select: getPublicVenueSelect(),
  });

  if (!venue) {
    throw createHttpError(404, "Mosque not found or not public");
  }

  return formatPublicVenue(venue);
}