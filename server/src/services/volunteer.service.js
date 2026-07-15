import prisma from "../config/prisma.js";
import  createHttpError  from "../utils/createHttpError.js";
import { logAdminActivity } from "../utils/adminActivityLogger.js";

const volunteerAssignmentSelect = {
  id: true,
  venueId: true,
  areaId: true,
  cityId: true,

  canVerifyTimings: true,
  canUpdateTimings: true,
  canReviewReports: true,
  canReviewSuggestions: true,

  assignedAt: true,
  isActive: true,

  venue: {
    select: {
      id: true,
      name: true,
      venueType: true,
      address: true,
      pincode: true,
      latitude: true,
      longitude: true,
      googleMapsLink: true,
      verificationStatus: true,
      lastVerifiedAt: true,
      isActive: true,
      isPublic: true,

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
    },
  },

  area: {
    select: {
      id: true,
      name: true,
      city: {
        select: {
          id: true,
          name: true,
          timezone: true,
        },
      },
    },
  },

  city: {
    select: {
      id: true,
      name: true,
      timezone: true,
    },
  },
};

const volunteerVenueSelect = {
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
};

const volunteerReportSelect = {
  id: true,
  venueId: true,
  dailyTimingId: true,
  jumuahTimingId: true,
  prayerName: true,
  issueType: true,

  currentAzaanTime: true,
  currentJamaahTime: true,
  suggestedAzaanTime: true,
  suggestedJamaahTime: true,
  suggestedKhutbahTime: true,

  userNote: true,
  status: true,
  reviewNote: true,
  resolvedAt: true,

  createdAt: true,
  updatedAt: true,

  venue: {
    select: {
      id: true,
      name: true,
      venueType: true,
      city: {
        select: {
          id: true,
          name: true,
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

  dailyTiming: {
    select: {
      id: true,
      prayerName: true,
      azaanTime: true,
      jamaahTime: true,
      timingType: true,
      relativeTimeText: true,
      verificationStatus: true,
      lastVerifiedAt: true,
    },
  },

  jumuahTiming: {
    select: {
      id: true,
      slotNumber: true,
      azaanTime: true,
      khutbahTime: true,
      jamaahTime: true,
      khutbahLanguage: true,
      womenPrayerSpace: true,
      verificationStatus: true,
      lastVerifiedAt: true,
    },
  },
};

const volunteerSuggestionSelect = {
  id: true,
  suggestedName: true,
  venueType: true,

  address: true,
  areaText: true,
  cityText: true,
  stateText: true,
  countryText: true,
  city: { select: { id: true, name: true } },
  area: { select: { id: true, name: true } },
  pincode: true,
  googleMapsLink: true,
  latitude: true,
  longitude: true,
  phone: true,

  optionalTimingNote: true,
  userNote: true,

  status: true,
  reviewNote: true,
  resolvedAt: true,

  createdAt: true,
  updatedAt: true,
};

function getPagination(query = {}) {
  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Math.min(Number(query.limit) > 0 ? Number(query.limit) : 20, 100);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
}

async function getActiveVolunteerAssignments(userId) {
  return prisma.volunteerAssignment.findMany({
    where: {
      userId,
      isActive: true,
    },
    select: {
      id: true,
      venueId: true,
      areaId: true,
      cityId: true,
      canVerifyTimings: true,
      canUpdateTimings: true,
      canReviewReports: true,
      canReviewSuggestions: true,
    },
  });
}

function buildVenueScopeWhere(assignments = []) {
  const OR = [];

  for (const assignment of assignments) {
    if (assignment.venueId) {
      OR.push({
        id: assignment.venueId,
      });
    }

    if (assignment.areaId) {
      OR.push({
        areaId: assignment.areaId,
      });
    }

    if (assignment.cityId) {
      OR.push({
        cityId: assignment.cityId,
      });
    }
  }

  if (OR.length === 0) {
    return null;
  }

  return {
    OR,
  };
}

function buildReportScopeWhere(assignments = []) {
  const OR = [];

  for (const assignment of assignments) {
    if (!assignment.canReviewReports && !assignment.canVerifyTimings) {
      continue;
    }

    if (assignment.venueId) {
      OR.push({
        venueId: assignment.venueId,
      });
    }

    if (assignment.areaId) {
      OR.push({
        venue: {
          areaId: assignment.areaId,
        },
      });
    }

    if (assignment.cityId) {
      OR.push({
        venue: {
          cityId: assignment.cityId,
        },
      });
    }
  }

  if (OR.length === 0) {
    return null;
  }

  return {
    OR,
  };
}

// function buildSuggestionScopeWhere(assignments = []) {
//   const OR = [];

//   for (const assignment of assignments) {
//     if (!assignment.canReviewSuggestions) {
//       continue;
//     }

//     if (assignment.areaId) {
//       OR.push({
//         areaText: {
//           not: null,
//         },
//       });
//     }

//     if (assignment.cityId) {
//       OR.push({
//         cityText: {
//           not: null,
//         },
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Note:
//     |--------------------------------------------------------------------------
//     | Venue suggestions are text/location based before becoming real venues.
//     | Exact area/city matching can be improved later once suggestions are linked
//     | to normalized location IDs. For MVP, this gives volunteers a review queue
//     | without blocking the main workflow.
//     */
//   }

//   if (OR.length === 0) {
//     return null;
//   }

//   return {
//     OR,
//   };
// }

function buildSuggestionScopeWhere(assignments = []) {
  const OR = [];

  for (const assignment of assignments) {
    if (!assignment.canReviewSuggestions) {
      continue;
    }

    if (assignment.areaId) {
      OR.push({ areaId: assignment.areaId });
    }

    if (assignment.cityId) {
      OR.push({ cityId: assignment.cityId });
    }

    // No venueId branch — a suggestion is for a mosque that doesn't exist
    // as a venue yet, so venue-scoped assignments have nothing to match.
    // Suggestions with no resolved cityId/areaId (user picked "Other")
    // never match any volunteer's OR clause here, and stay visible only
    // in the Super Admin queue — by design, not by omission.
  }

  if (OR.length === 0) {
    return null;
  }

  return { OR };
}

export async function getMyVolunteerAssignments(userId) {
  return prisma.volunteerAssignment.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: {
      assignedAt: "desc",
    },
    select: volunteerAssignmentSelect,
  });
}

export async function getVolunteerVenues(userId, query = {}) {
  const assignments = await getActiveVolunteerAssignments(userId);
  const scopeWhere = buildVenueScopeWhere(assignments);

  if (!scopeWhere) {
    return {
      venues: [],
      pagination: {
        page: 1,
        limit: Number(query.limit) || 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  const { page, limit, skip } = getPagination(query);

  const where = {
    ...scopeWhere,
  };

  if (query.search) {
    where.AND = [
      {
        OR: scopeWhere.OR,
      },
      {
        OR: [
          {
            name: {
              contains: query.search,
              mode: "insensitive",
            },
          },
          {
            address: {
              contains: query.search,
              mode: "insensitive",
            },
          },
          {
            pincode: {
              contains: query.search,
              mode: "insensitive",
            },
          },
        ],
      },
    ];

    delete where.OR;
  }

  if (query.verificationStatus) {
    where.verificationStatus = query.verificationStatus;
  }

  const [venues, total] = await prisma.$transaction([
    prisma.venue.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        updatedAt: "desc",
      },
      select: volunteerVenueSelect,
    }),

    prisma.venue.count({
      where,
    }),
  ]);

  return {
    venues,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getVolunteerVenueById(userId, venueId) {
  const assignments = await getActiveVolunteerAssignments(userId);

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: volunteerVenueSelect,
  });

  if (!venue) {
    throw createHttpError(404, "Venue not found");
  }

  const inScope = assignments.some(
    (a) => a.venueId === venue.id || a.areaId === venue.areaId || a.cityId === venue.cityId
  );

  if (!inScope) {
    throw createHttpError(403, "This venue is outside your assigned scope");
  }

  return venue;
}

export async function getVolunteerReports(userId, query = {}) {
  const assignments = await getActiveVolunteerAssignments(userId);
  const scopeWhere = buildReportScopeWhere(assignments);

  if (!scopeWhere) {
    return {
      reports: [],
      pagination: {
        page: 1,
        limit: Number(query.limit) || 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  const { page, limit, skip } = getPagination(query);

  const where = {
    ...scopeWhere,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.issueType) {
    where.issueType = query.issueType;
  }

  const [reports, total] = await prisma.$transaction([
    prisma.timingReport.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: volunteerReportSelect,
    }),

    prisma.timingReport.count({
      where,
    }),
  ]);

  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getVolunteerSuggestions(userId, query = {}) {
  const assignments = await getActiveVolunteerAssignments(userId);
  const scopeWhere = buildSuggestionScopeWhere(assignments);

  if (!scopeWhere) {
    return {
      suggestions: [],
      pagination: {
        page: 1,
        limit: Number(query.limit) || 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  const { page, limit, skip } = getPagination(query);

  const where = {
    ...scopeWhere,
  };

  if (query.status) {
    where.status = query.status;
  }

  const [suggestions, total] = await prisma.$transaction([
    prisma.venueSuggestion.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: volunteerSuggestionSelect,
    }),

    prisma.venueSuggestion.count({
      where,
    }),
  ]);

  return {
    suggestions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}


const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function validateTimeField(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (!TIME_REGEX.test(value)) {
    throw createHttpError(400, `${fieldName} must be in HH:mm 24-hour format`);
  }
  return value;
}

async function getScopedAssignment(userId, venueId, permissionField) {
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { id: true, areaId: true, cityId: true },
  });

  if (!venue) {
    throw createHttpError(404, "Venue not found");
  }

  const assignment = await prisma.volunteerAssignment.findFirst({
    where: {
      userId,
      isActive: true,
      [permissionField]: true,
      OR: [
        { venueId: venue.id },
        { areaId: venue.areaId },
        { cityId: venue.cityId },
      ],
    },
  });

  if (!assignment) {
    throw createHttpError(403, "You are not authorized to perform this action for this venue");
  }

  return { venue, assignment };
}

function resolveTrustStatus(assignment) {
  return assignment.canVerifyTimings
    ? { verificationStatus: "verified", lastVerifiedAt: new Date() }
    : { verificationStatus: "community_updated", lastVerifiedAt: null };
}


function getVolunteerTrustUpdateData(assignment) {
  return assignment.canVerifyTimings
    ? { verificationStatus: "verified", lastVerifiedAt: new Date() }
    : { verificationStatus: "community_updated", lastVerifiedAt: null };
}

function buildVolunteerApprovedReportSourceNote(report, reviewNote) {
  const parts = [`Updated from volunteer approved report ${report.id}`];

  if (report.issueType) parts.push(`Issue: ${report.issueType}`);
  if (reviewNote) parts.push(`Review note: ${reviewNote}`);
  if (report.userNote) parts.push(`User note: ${report.userNote}`);

  return parts.join(" | ");
}

function stringifyVolunteerHistoryValue(value) {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

async function createVolunteerTimingReportUpdateHistory({
  tx,
  entityType,
  entityId,
  venueId,
  dailyTimingId = null,
  jumuahTimingId = null,
  changedById,
  oldData = {},
  newData = {},
  sourceNote,
}) {
  const ignoredFields = ["updatedById", "sourceNote"];
  const historyRows = [];

  for (const fieldName of Object.keys(newData)) {
    if (ignoredFields.includes(fieldName)) continue;

    const oldValue = stringifyVolunteerHistoryValue(oldData[fieldName]);
    const newValue = stringifyVolunteerHistoryValue(newData[fieldName]);

    if (oldValue === newValue) continue;

    historyRows.push({
      entityType,
      entityId,
      venueId,
      dailyTimingId,
      jumuahTimingId,
      fieldName,
      oldValue,
      newValue,
      changedById,
      sourceNote: sourceNote || null,
    });
  }

  if (historyRows.length > 0) {
    await tx.updateHistory.createMany({ data: historyRows });
  }
}

async function applyVolunteerApprovedReportChange({ tx, report, assignment, reviewedById, reviewNote }) {
  if (!assignment.canUpdateTimings) {
    // Volunteer can review/approve the report itself, but this particular
    // matched assignment doesn't trust them to write the live timing.
    // Report status still updates; the timing is left for someone
    // with canUpdateTimings (or Super Admin) to apply manually.
    return null;
  }

  const sourceNote = buildVolunteerApprovedReportSourceNote(report, reviewNote);
  const trustData = getVolunteerTrustUpdateData(assignment);

  if (report.dailyTimingId) {
    const existingDailyTiming = await tx.dailyPrayerTiming.findUnique({
      where: { id: report.dailyTimingId },
      select: {
        id: true, azaanTime: true, jamaahTime: true,
        timingType: true, relativeTimeText: true, verificationStatus: true,
      },
    });

    const updateData = {};
    if (report.suggestedAzaanTime) updateData.azaanTime = report.suggestedAzaanTime;
    if (report.suggestedJamaahTime) {
      updateData.jamaahTime = report.suggestedJamaahTime;
      updateData.timingType = "fixed";
      updateData.relativeTimeText = null;
    }

    if (Object.keys(updateData).length === 0) {
      throw createHttpError(400, "This report does not contain timing changes to approve");
    }

    updateData.verificationStatus = trustData.verificationStatus;
    if (trustData.lastVerifiedAt) updateData.lastVerifiedAt = trustData.lastVerifiedAt;
    updateData.updatedById = reviewedById;
    updateData.sourceNote = sourceNote;

    const updatedTiming = await tx.dailyPrayerTiming.update({
      where: { id: report.dailyTimingId },
      data: updateData,
      select: { id: true, prayerName: true, azaanTime: true, jamaahTime: true, verificationStatus: true },
    });

    await createVolunteerTimingReportUpdateHistory({
      tx,
      entityType: "daily_prayer_timing",
      entityId: updatedTiming.id,
      venueId: report.venueId,
      dailyTimingId: updatedTiming.id,
      changedById: reviewedById,
      oldData: existingDailyTiming || {},
      newData: updateData,
      sourceNote,
    });

    return {
      timingType: "daily_prayer_timing",
      timingId: updatedTiming.id,
      updatedFields: Object.keys(updateData),
      verificationStatus: updatedTiming.verificationStatus,
    };
  }

  if (report.jumuahTimingId) {
    const existingJumuahTiming = await tx.jumuahTiming.findUnique({
      where: { id: report.jumuahTimingId },
      select: { id: true, azaanTime: true, khutbahTime: true, jamaahTime: true, verificationStatus: true },
    });

    const updateData = {};
    if (report.suggestedAzaanTime) updateData.azaanTime = report.suggestedAzaanTime;
    if (report.suggestedKhutbahTime) updateData.khutbahTime = report.suggestedKhutbahTime;
    if (report.suggestedJamaahTime) updateData.jamaahTime = report.suggestedJamaahTime;

    if (Object.keys(updateData).length === 0) {
      throw createHttpError(400, "This report does not contain timing changes to approve");
    }

    updateData.verificationStatus = trustData.verificationStatus;
    if (trustData.lastVerifiedAt) updateData.lastVerifiedAt = trustData.lastVerifiedAt;
    updateData.updatedById = reviewedById;
    updateData.sourceNote = sourceNote;

    const updatedTiming = await tx.jumuahTiming.update({
      where: { id: report.jumuahTimingId },
      data: updateData,
      select: { id: true, slotNumber: true, azaanTime: true, khutbahTime: true, jamaahTime: true, verificationStatus: true },
    });

    await createVolunteerTimingReportUpdateHistory({
      tx,
      entityType: "jumuah_timing",
      entityId: updatedTiming.id,
      venueId: report.venueId,
      jumuahTimingId: updatedTiming.id,
      changedById: reviewedById,
      oldData: existingJumuahTiming || {},
      newData: updateData,
      sourceNote,
    });

    return {
      timingType: "jumuah_timing",
      timingId: updatedTiming.id,
      updatedFields: Object.keys(updateData),
      verificationStatus: updatedTiming.verificationStatus,
    };
  }

  return null;
}


/* ---------------------------- Daily Timings ---------------------------- */

export async function createVolunteerDailyTiming(userId, venueId, payload) {
  const { assignment } = await getScopedAssignment(userId, venueId, "canUpdateTimings");

  const {
    prayerName,
    azaanTime,
    jamaahTime,
    timingType = "fixed",
    relativeTimeText,
    effectiveFrom,
    sourceNote,
  } = payload;

  if (!prayerName) {
    throw createHttpError(400, "prayerName is required");
  }

  validateTimeField(azaanTime, "azaanTime");
  validateTimeField(jamaahTime, "jamaahTime");

  const trust = resolveTrustStatus(assignment);

  const timing = await prisma.dailyPrayerTiming.create({
    data: {
      venueId,
      prayerName,
      azaanTime: azaanTime || null,
      jamaahTime: jamaahTime || null,
      timingType,
      relativeTimeText: relativeTimeText || null,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      sourceNote: sourceNote || null,
      updatedById: userId, 
      ...trust,
    },
  });

  logAdminActivity({
    actorId: userId,
    action: "volunteer_daily_timing_created",
    entityType: "DailyPrayerTiming",
    entityId: timing.id,
    venueId,
    metadata: { prayerName, trust: trust.verificationStatus },
  });

  return timing;
}

export async function updateVolunteerDailyTiming(userId, timingId, payload) {
  const timing = await prisma.dailyPrayerTiming.findUnique({
    where: { id: timingId },
    select: { id: true, venueId: true },
  });

  if (!timing) {
    throw createHttpError(404, "Timing not found");
  }

  const { assignment } = await getScopedAssignment(userId, timing.venueId, "canUpdateTimings");

  const { azaanTime, jamaahTime, timingType, relativeTimeText, effectiveFrom, sourceNote } = payload;

  if (azaanTime !== undefined) validateTimeField(azaanTime, "azaanTime");
  if (jamaahTime !== undefined) validateTimeField(jamaahTime, "jamaahTime");

  const trust = resolveTrustStatus(assignment);

  const updated = await prisma.dailyPrayerTiming.update({
    where: { id: timingId },
    data: {
      ...(azaanTime !== undefined && { azaanTime: azaanTime || null }),
      ...(jamaahTime !== undefined && { jamaahTime: jamaahTime || null }),
      ...(timingType !== undefined && { timingType }),
      ...(relativeTimeText !== undefined && { relativeTimeText: relativeTimeText || null }),
      ...(effectiveFrom !== undefined && { effectiveFrom: new Date(effectiveFrom) }),
      ...(sourceNote !== undefined && { sourceNote: sourceNote || null }),
      updatedById: userId, 
      ...trust,
    },
  });

  logAdminActivity({
    actorId: userId,
    action: "volunteer_daily_timing_updated",
    entityType: "DailyPrayerTiming",
    entityId: updated.id,
    venueId: timing.venueId,
    metadata: { trust: trust.verificationStatus },
  });

  return updated;
}

export async function verifyVolunteerDailyTiming(userId, timingId) {
  const timing = await prisma.dailyPrayerTiming.findUnique({
    where: { id: timingId },
    select: { id: true, venueId: true },
  });

  if (!timing) {
    throw createHttpError(404, "Timing not found");
  }

  await getScopedAssignment(userId, timing.venueId, "canVerifyTimings");

  const updated = await prisma.dailyPrayerTiming.update({
    where: { id: timingId },
    data: {
      verificationStatus: "verified",
      lastVerifiedAt: new Date(),
      updatedById: userId, 
    },
  });

  logAdminActivity({
    actorId: userId,
    action: "volunteer_timing_verified",
    entityType: "DailyPrayerTiming",
    entityId: timing.id,
    venueId: timing.venueId,
  });

  return updated;
}

/* ---------------------------- Jumu'ah Timings ---------------------------- */

export async function createVolunteerJumuahTiming(userId, venueId, payload) {
  const { assignment } = await getScopedAssignment(userId, venueId, "canUpdateTimings");

  const {
    slotNumber,
    jamaahTime,
    azaanTime,
    khutbahTime,
    khutbahLanguage,
    womenPrayerSpace,
    importantNotice,
    effectiveFrom,
    sourceNote,
  } = payload;

  if (!slotNumber) {
    throw createHttpError(400, "slotNumber is required");
  }
  if (!jamaahTime) {
    throw createHttpError(400, "jamaahTime is required for Jumu'ah slots");
  }

  validateTimeField(jamaahTime, "jamaahTime");
  validateTimeField(azaanTime, "azaanTime");
  validateTimeField(khutbahTime, "khutbahTime");

  const trust = resolveTrustStatus(assignment);

  const timing = await prisma.jumuahTiming.create({
    data: {
      venueId,
      slotNumber,
      jamaahTime,
      azaanTime: azaanTime || null,
      khutbahTime: khutbahTime || null,
      khutbahLanguage: khutbahLanguage || null,
      womenPrayerSpace: womenPrayerSpace || null,
      importantNotice: importantNotice || null,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      sourceNote: sourceNote || null,
      updatedById: userId, 
      ...trust,
    },
  });

  logAdminActivity({
    actorId: userId,
    action: "volunteer_jumuah_timing_created",
    entityType: "JumuahTiming",
    entityId: timing.id,
    venueId,
    metadata: { slotNumber, trust: trust.verificationStatus },
  });

  return timing;
}

export async function updateVolunteerJumuahTiming(userId, timingId, payload) {
  const timing = await prisma.jumuahTiming.findUnique({
    where: { id: timingId },
    select: { id: true, venueId: true },
  });

  if (!timing) {
    throw createHttpError(404, "Jumu'ah timing not found");
  }

  const { assignment } = await getScopedAssignment(userId, timing.venueId, "canUpdateTimings");

  const {
    jamaahTime, azaanTime, khutbahTime, khutbahLanguage,
    womenPrayerSpace, importantNotice, effectiveFrom, sourceNote,
  } = payload;

  if (jamaahTime !== undefined) validateTimeField(jamaahTime, "jamaahTime");
  if (azaanTime !== undefined) validateTimeField(azaanTime, "azaanTime");
  if (khutbahTime !== undefined) validateTimeField(khutbahTime, "khutbahTime");

  const trust = resolveTrustStatus(assignment);

  const updated = await prisma.jumuahTiming.update({
    where: { id: timingId },
    data: {
      ...(jamaahTime !== undefined && { jamaahTime }),
      ...(azaanTime !== undefined && { azaanTime: azaanTime || null }),
      ...(khutbahTime !== undefined && { khutbahTime: khutbahTime || null }),
      ...(khutbahLanguage !== undefined && { khutbahLanguage: khutbahLanguage || null }),
      ...(womenPrayerSpace !== undefined && { womenPrayerSpace: womenPrayerSpace || null }),
      ...(importantNotice !== undefined && { importantNotice: importantNotice || null }),
      ...(effectiveFrom !== undefined && { effectiveFrom: new Date(effectiveFrom) }),
      ...(sourceNote !== undefined && { sourceNote: sourceNote || null }),
      updatedById: userId, 
      ...trust,
    },
  });

  logAdminActivity({
    actorId: userId,
    action: "volunteer_jumuah_timing_updated",
    entityType: "JumuahTiming",
    entityId: updated.id,
    venueId: timing.venueId,
    metadata: { trust: trust.verificationStatus },
  });

  return updated;
}

export async function verifyVolunteerJumuahTiming(userId, timingId) {
  const timing = await prisma.jumuahTiming.findUnique({
    where: { id: timingId },
    select: { id: true, venueId: true },
  });

  if (!timing) {
    throw createHttpError(404, "Jumu'ah timing not found");
  }

  await getScopedAssignment(userId, timing.venueId, "canVerifyTimings");

  const updated = await prisma.jumuahTiming.update({
    where: { id: timingId },
    data: {
      verificationStatus: "verified",
      lastVerifiedAt: new Date(),
      updatedById: userId, 
    },
  });

  logAdminActivity({
    actorId: userId,
    action: "volunteer_timing_verified",
    entityType: "JumuahTiming",
    entityId: timing.id,
    venueId: timing.venueId,
  });

  return updated;
}

/* ------------------------------ Reports ------------------------------ */

const ALLOWED_REPORT_STATUSES = ["approved", "rejected", "needs_more_info"];

export async function updateVolunteerReportStatus(userId, reportId, { status, reviewNote }) {
  if (!ALLOWED_REPORT_STATUSES.includes(status)) {
    throw createHttpError(400, "Invalid status value");
  }

  const result = await prisma.$transaction(async (tx) => {
    const report = await tx.timingReport.findUnique({
      where: { id: reportId },
      select: {
        id: true, status: true, venueId: true,
        dailyTimingId: true, jumuahTimingId: true,
        prayerName: true, issueType: true,
        suggestedAzaanTime: true, suggestedJamaahTime: true, suggestedKhutbahTime: true,
        userNote: true,
      },
    });

    if (!report) {
      throw createHttpError(404, "Report not found");
    }

    const venue = await tx.venue.findUnique({
      where: { id: report.venueId },
      select: { id: true, areaId: true, cityId: true },
    });

    const assignment = await tx.volunteerAssignment.findFirst({
      where: {
        userId,
        isActive: true,
        canReviewReports: true,
        OR: [
          { venueId: venue.id },
          { areaId: venue.areaId },
          { cityId: venue.cityId },
        ],
      },
      orderBy: [
        { canUpdateTimings: "desc" },
        { canVerifyTimings: "desc" },
        { assignedAt: "desc" },
      ],
    });

    if (!assignment) {
      throw createHttpError(403, "You are not authorized to review reports for this venue");
    }

    let appliedTimingUpdate = null;

    if (status === "approved" && report.status !== "approved") {
      appliedTimingUpdate = await applyVolunteerApprovedReportChange({
        tx,
        report,
        assignment,
        reviewedById: userId,
        reviewNote,
      });
    }

    const updatedReport = await tx.timingReport.update({
      where: { id: reportId },
      data: {
        status,
        reviewNote: reviewNote || null,
        reviewedById: userId,
        resolvedAt: status === "needs_more_info" ? null : new Date(),
      },
    });

    return { previousStatus: report.status, report: updatedReport, appliedTimingUpdate };
  });

  logAdminActivity({
    actorId: userId,
    action: "volunteer_report_reviewed",
    entityType: "TimingReport",
    entityId: result.report.id,
    venueId: result.report.venueId,
    metadata: {
      previousStatus: result.previousStatus,
      newStatus: result.report.status,
      appliedTimingUpdate: result.appliedTimingUpdate,
    },
  });

  return {
    ...result.report,
    appliedTimingUpdate: result.appliedTimingUpdate,
  };
}

/* ---------------------------- Suggestions ---------------------------- */

const ALLOWED_VOLUNTEER_SUGGESTION_STATUSES = ["rejected", "duplicate", "needs_more_info"];

export async function updateVolunteerSuggestionStatus(userId, suggestionId, { status, reviewNote }) {
  if (!ALLOWED_VOLUNTEER_SUGGESTION_STATUSES.includes(status)) {
    throw createHttpError(
      400,
      "Volunteers can mark suggestions as rejected, duplicate, or needs_more_info. Final approval into a live venue is a Super Admin action."
    );
  }

  const suggestion = await prisma.venueSuggestion.findUnique({
    where: { id: suggestionId },
    select: { id: true, cityId: true, areaId: true },
  });

  if (!suggestion) {
    throw createHttpError(404, "Suggestion not found");
  }

  const assignment = await prisma.volunteerAssignment.findFirst({
    where: {
      userId,
      isActive: true,
      canReviewSuggestions: true,
      OR: [
        { areaId: suggestion.areaId ?? undefined },
        { cityId: suggestion.cityId ?? undefined },
      ].filter((clause) => Object.values(clause)[0] !== undefined),
    },
  });

  if (!assignment) {
    throw createHttpError(403, "This suggestion is outside your assigned scope");
  }

  const updated = await prisma.venueSuggestion.update({
    where: { id: suggestionId },
    data: {
      status,
      reviewNote: reviewNote || null,
      reviewedById: userId,
      resolvedAt: status === "needs_more_info" ? null : new Date(),
    },
  });

  logAdminActivity({
    actorId: userId,
    action: "volunteer_suggestion_reviewed",
    entityType: "VenueSuggestion",
    entityId: suggestion.id,
    metadata: { status },
  });

  return updated;
}