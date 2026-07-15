import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";

/*
|--------------------------------------------------------------------------
| Public Next Jamā‘ah Service
|--------------------------------------------------------------------------
| Purpose:
| Powers the Sabeel home-screen experience:
| "Where can I still catch the next jamā‘ah?"
|
| Product behavior:
| - Uses public + active venues only
| - Uses active daily timing records only
| - Uses fixed jamaahTime only for comparison
| - Sorts by upcoming jamā‘ah time, then distance, then trust
| - If no prayer is left today, returns tomorrow's Fajr
| - Returns mobile-ready cards, not raw database rows
*/

const PRAYER_ORDER = {
  fajr: 1,
  dhuhr: 2,
  asr: 3,
  maghrib: 4,
  isha: 5,
};

const VALID_PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

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

function trustRank(status) {
  const rank = {
    verified: 1,
    community_updated: 2,
    needs_update: 3,
    pending_review: 4,
  };

  return rank[status] || 99;
}

function buildWhere(filters = {}) {
  const now = new Date();

  const where = {
    effectiveTo: null,
    timingType: "fixed",
    jamaahTime: {
      not: null,
    },

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

  if (filters.prayerName) {
    where.prayerName = filters.prayerName;
  }

  if (filters.countryId) where.venue.countryId = filters.countryId;
  if (filters.stateId) where.venue.stateId = filters.stateId;
  if (filters.cityId) where.venue.cityId = filters.cityId;
  if (filters.areaId) where.venue.areaId = filters.areaId;
  if (filters.venueType) where.venue.venueType = filters.venueType;

  if (filters.womenPrayerSpace) {
    where.venue.womenPrayerSpace = filters.womenPrayerSpace;
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

function getSelect() {
  return {
    id: true,
    prayerName: true,
    azaanTime: true,
    jamaahTime: true,
    timingType: true,
    relativeTimeText: true,
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
      },
    },
  };
}

function formatNextJamaahCard(timing, userLat, userLng, dayOffset = 0) {
  const distanceKm = getDistanceKm(
    userLat,
    userLng,
    timing.venue.latitude,
    timing.venue.longitude
  );

  return {
    id: timing.id,
    prayerName: timing.prayerName,
    dayOffset,
    dayLabel: dayOffset === 1 ? "tomorrow" : "today",

    times: {
      azaanTime: timing.azaanTime,
      jamaahTime: timing.jamaahTime,
      timingType: timing.timingType,
      relativeTimeText: timing.relativeTimeText,
    },

    trust: {
      timingVerificationStatus: timing.verificationStatus,
      timingLastVerifiedAt: timing.lastVerifiedAt,
      timingLastUpdatedAt: timing.updatedAt,
      venueVerificationStatus: timing.venue.verificationStatus,
      venueLastVerifiedAt: timing.venue.lastVerifiedAt,
      venueLastUpdatedAt: timing.venue.updatedAt,
    },

    venue: {
      id: timing.venue.id,
      name: timing.venue.name,
      alternateNames: timing.venue.alternateNames,
      venueType: timing.venue.venueType,

      location: {
        address: timing.venue.address,
        pincode: timing.venue.pincode,
        latitude: timing.venue.latitude,
        longitude: timing.venue.longitude,
        googleMapsLink: timing.venue.googleMapsLink,
        distanceKm,
        country: timing.venue.country,
        state: timing.venue.state,
        city: timing.venue.city,
        area: timing.venue.area,
        timezone: timing.venue.timezone || timing.venue.city?.timezone || null,
      },

      facilities: {
        womenPrayerSpace: timing.venue.womenPrayerSpace,
        wuduFacility: timing.venue.wuduFacility,
        parking: timing.venue.parking,
        facilityNotes: timing.venue.facilityNotes,
        importantNotice: timing.venue.importantNotice,
      },
    },
  };
}

function sortCards(cards) {
  return [...cards].sort((a, b) => {
    const dayCompare = a.dayOffset - b.dayOffset;
    if (dayCompare !== 0) return dayCompare;

    const timeCompare = a.times.jamaahTime.localeCompare(b.times.jamaahTime);
    if (timeCompare !== 0) return timeCompare;

    const aDistance = a.venue.location.distanceKm;
    const bDistance = b.venue.location.distanceKm;

    if (aDistance !== null && bDistance !== null) {
      return aDistance - bDistance;
    }

    if (aDistance !== null) return -1;
    if (bDistance !== null) return 1;

    const trustCompare =
      trustRank(a.trust.timingVerificationStatus) -
      trustRank(b.trust.timingVerificationStatus);

    if (trustCompare !== 0) return trustCompare;

    return a.venue.name.localeCompare(b.venue.name);
  });
}

function findTargetPrayer(cards) {
  if (cards.length === 0) return null;

  const firstDayOffset = cards[0].dayOffset;
  const firstTime = cards[0].times.jamaahTime;

  const cardsAtFirstTime = cards.filter((card) => {
    return card.dayOffset === firstDayOffset && card.times.jamaahTime === firstTime;
  });

  return cardsAtFirstTime.sort((a, b) => {
    return PRAYER_ORDER[a.prayerName] - PRAYER_ORDER[b.prayerName];
  })[0].prayerName;
}

function applyRadiusFilter(cards, hasUserLocation, radiusKm) {
  if (!hasUserLocation || radiusKm === null) {
    return cards;
  }

  return cards.filter((card) => {
    return (
      card.venue.location.distanceKm !== null &&
      card.venue.location.distanceKm <= radiusKm
    );
  });
}

export async function getPublicNextJamaah(query = {}) {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, 20), 50);

  const currentTime = query.currentTime;

  if (!currentTime) {
    throw createHttpError(400, "currentTime is required in HH:mm format");
  }

  if (!isValidTime(currentTime)) {
    throw createHttpError(400, "currentTime must be in HH:mm format");
  }

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

  if (query.prayerName && !VALID_PRAYERS.includes(query.prayerName)) {
    throw createHttpError(
      400,
      "prayerName must be one of: fajr, dhuhr, asr, maghrib, isha"
    );
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
    prayerName: query.prayerName,
  };

  const where = buildWhere(filters);

  const rawTimings = await prisma.dailyPrayerTiming.findMany({
    where,
    orderBy: [
      {
        jamaahTime: "asc",
      },
    ],
    select: getSelect(),
  });

  let dayOffset = 0;

  let cards = rawTimings
    .filter((timing) => timing.jamaahTime >= currentTime)
    .map((timing) => formatNextJamaahCard(timing, userLat, userLng, dayOffset));

  cards = applyRadiusFilter(cards, hasUserLocation, radiusKm);
  cards = sortCards(cards);

  let targetPrayerName = query.prayerName || findTargetPrayer(cards);

  /*
  |--------------------------------------------------------------------------
  | After-Isha fallback
  |--------------------------------------------------------------------------
  | If no prayer is left today and the user did not request a specific prayer,
  | show tomorrow's Fajr options. This keeps the home screen useful late night.
  */
  if (!query.prayerName && cards.length === 0) {
    dayOffset = 1;

    cards = rawTimings
      .filter((timing) => timing.prayerName === "fajr")
      .map((timing) =>
        formatNextJamaahCard(timing, userLat, userLng, dayOffset)
      );

    cards = applyRadiusFilter(cards, hasUserLocation, radiusKm);
    cards = sortCards(cards);

    targetPrayerName = cards.length > 0 ? "fajr" : null;
  }

  if (targetPrayerName) {
    cards = cards.filter((card) => card.prayerName === targetPrayerName);
    cards = sortCards(cards);
  }

  const total = cards.length;
  const start = (page - 1) * limit;
  const paginatedCards = cards.slice(start, start + limit);

  return {
    targetPrayerName,
    cards: paginatedCards,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
    meta: {
      resultType: "next_jamaah",
      currentTime,
      requestedPrayerName: query.prayerName || null,
      targetPrayerName,
      dayOffset,
      dayLabel: dayOffset === 1 ? "tomorrow" : "today",
      fixedTimingOnly: true,
      sortedBy: hasUserLocation
        ? "jamaah_time_then_distance_then_trust"
        : "jamaah_time_then_trust",
      latitude: hasUserLocation ? userLat : null,
      longitude: hasUserLocation ? userLng : null,
      radiusKm,
      emptyReason:
        total === 0
          ? "No upcoming fixed jamā‘ah timings found for the selected filters"
          : null,
    },
  };
}