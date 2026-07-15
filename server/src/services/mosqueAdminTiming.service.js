import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";
import { logAdminActivity } from "../utils/adminActivityLogger.js";

/*
|--------------------------------------------------------------------------
| Mosque Admin Timing Service
|--------------------------------------------------------------------------
| Purpose:
| Allows mosque admins to create/update timings only for assigned mosques.
|
| Product rules:
| - Mosque admin must have active assignment.
| - Mosque admin can only edit permitted timing type.
| - Mosque admin cannot choose arbitrary verification status.
| - Trust status is controlled by assignment.canMarkVerified.
| - Every important change is logged.
*/

function normalizeDate(value) {
  if (!value) return null;
  return new Date(value);
}

function getTrustUpdateData(assignment) {
  if (assignment.canMarkVerified) {
    return {
      verificationStatus: "verified",
      lastVerifiedAt: new Date(),
    };
  }

  return {
    verificationStatus: "community_updated",
  };
}

function normalizeTimingData(data = {}) {
  const normalized = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;

    if (key === "effectiveFrom" || key === "effectiveTo") {
      normalized[key] = normalizeDate(value);
    } else {
      normalized[key] = value;
    }
  }

  return normalized;
}

async function createUpdateHistory({
  entityType,
  entityId,
  venueId,
  dailyTimingId = null,
  jumuahTimingId = null,
  changedById,
  fieldName,
  oldValue,
  newValue,
  sourceNote = null,
}) {
  try {
    await prisma.updateHistory.create({
      data: {
        entityType,
        entityId,
        venueId,
        dailyTimingId,
        jumuahTimingId,
        changedById,
        fieldName,
        oldValue,
        newValue,
        sourceNote,
      },
    });
  } catch (error) {
    console.error("Update history failed:", error.message);
  }
}

async function createFieldUpdateHistory({
  oldRecord,
  updateData,
  entityType,
  entityId,
  venueId,
  dailyTimingId = null,
  jumuahTimingId = null,
  changedById,
  sourceNote = null,
}) {
  const ignoredFields = ["updatedById", "lastVerifiedAt"];

  for (const [fieldName, newValue] of Object.entries(updateData)) {
    if (ignoredFields.includes(fieldName)) continue;

    const oldValue = oldRecord[fieldName];

    const normalizedOldValue =
      oldValue instanceof Date ? oldValue.toISOString() : oldValue;

    const normalizedNewValue =
      newValue instanceof Date ? newValue.toISOString() : newValue;

    if (String(normalizedOldValue ?? "") === String(normalizedNewValue ?? "")) {
      continue;
    }

    await createUpdateHistory({
      entityType,
      entityId,
      venueId,
      dailyTimingId,
      jumuahTimingId,
      changedById,
      fieldName,
      oldValue:
        normalizedOldValue === null || normalizedOldValue === undefined
          ? null
          : String(normalizedOldValue),
      newValue:
        normalizedNewValue === null || normalizedNewValue === undefined
          ? null
          : String(normalizedNewValue),
      sourceNote,
    });
  }
}

async function getVenueAssignment(userId, venueId) {
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
      canEditDailyTimings: true,
      canEditJumuahTimings: true,
      canMarkVerified: true,
      venue: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
    },
  });

  if (!assignment) {
    throw createHttpError(
      403,
      "You are not assigned to manage this mosque"
    );
  }

  if (!assignment.venue?.isActive) {
    throw createHttpError(403, "This mosque is not active");
  }

  return assignment;
}

async function getDailyTimingWithAssignment(userId, timingId) {
  const timing = await prisma.dailyPrayerTiming.findUnique({
    where: {
      id: timingId,
    },
    select: {
      id: true,
      venueId: true,
      prayerName: true,
      azaanTime: true,
      jamaahTime: true,
      timingType: true,
      relativeTimeText: true,
      effectiveFrom: true,
      effectiveTo: true,
      verificationStatus: true,
      sourceNote: true,
      lastVerifiedAt: true,
    },
  });

  if (!timing) {
    throw createHttpError(404, "Daily prayer timing not found");
  }

  const assignment = await getVenueAssignment(userId, timing.venueId);

  return {
    timing,
    assignment,
  };
}

async function getJumuahTimingWithAssignment(userId, timingId) {
  const timing = await prisma.jumuahTiming.findUnique({
    where: {
      id: timingId,
    },
    select: {
      id: true,
      venueId: true,
      slotNumber: true,
      azaanTime: true,
      khutbahTime: true,
      jamaahTime: true,
      khutbahLanguage: true,
      womenPrayerSpace: true,
      importantNotice: true,
      effectiveFrom: true,
      effectiveTo: true,
      verificationStatus: true,
      sourceNote: true,
      lastVerifiedAt: true,
    },
  });

  if (!timing) {
    throw createHttpError(404, "Jumu‘ah timing not found");
  }

  const assignment = await getVenueAssignment(userId, timing.venueId);

  return {
    timing,
    assignment,
  };
}

function getDailyTimingSelect() {
  return {
    id: true,
    venueId: true,
    prayerName: true,
    azaanTime: true,
    jamaahTime: true,
    timingType: true,
    relativeTimeText: true,
    effectiveFrom: true,
    effectiveTo: true,
    verificationStatus: true,
    sourceNote: true,
    lastVerifiedAt: true,
    updatedAt: true,
    createdAt: true,
    venue: {
      select: {
        id: true,
        name: true,
        venueType: true,
      },
    },
  };
}

function getJumuahTimingSelect() {
  return {
    id: true,
    venueId: true,
    slotNumber: true,
    azaanTime: true,
    khutbahTime: true,
    jamaahTime: true,
    khutbahLanguage: true,
    womenPrayerSpace: true,
    importantNotice: true,
    effectiveFrom: true,
    effectiveTo: true,
    verificationStatus: true,
    sourceNote: true,
    lastVerifiedAt: true,
    updatedAt: true,
    createdAt: true,
    venue: {
      select: {
        id: true,
        name: true,
        venueType: true,
      },
    },
  };
}

/*
|--------------------------------------------------------------------------
| Daily Prayer Timings
|--------------------------------------------------------------------------
*/

export async function createMosqueAdminDailyTiming(userId, venueId, data) {
  const assignment = await getVenueAssignment(userId, venueId);

  if (!assignment.canEditDailyTimings) {
    throw createHttpError(
      403,
      "You do not have permission to edit daily prayer timings for this mosque"
    );
  }

  const existingTiming = await prisma.dailyPrayerTiming.findFirst({
    where: {
      venueId,
      prayerName: data.prayerName,
      effectiveTo: null,
    },
    select: {
      id: true,
    },
  });

  if (existingTiming) {
    throw createHttpError(
      409,
      "Active timing already exists for this prayer. Please update it instead."
    );
  }

  const trustData = getTrustUpdateData(assignment);

  const timing = await prisma.dailyPrayerTiming.create({
    data: {
      venueId,
      prayerName: data.prayerName,

      azaanTime: data.azaanTime || null,
      jamaahTime: data.jamaahTime || null,

      timingType: data.timingType,
      relativeTimeText: data.relativeTimeText || null,

      effectiveFrom: normalizeDate(data.effectiveFrom),
      effectiveTo: normalizeDate(data.effectiveTo),

      verificationStatus: trustData.verificationStatus,
      lastVerifiedAt: trustData.lastVerifiedAt || null,
      sourceNote: data.sourceNote || "Updated by mosque admin",

      updatedById: userId,
    },
    select: getDailyTimingSelect(),
  });

  await logAdminActivity({
    actorId: userId,
    action: "mosque_admin_daily_timing_created",
    entityType: "daily_prayer_timing",
    entityId: timing.id,
    venueId,
    metadata: {
      venueName: timing.venue.name,
      prayerName: timing.prayerName,
      azaanTime: timing.azaanTime,
      jamaahTime: timing.jamaahTime,
      timingType: timing.timingType,
      verificationStatus: timing.verificationStatus,
    },
  });

  await createUpdateHistory({
    entityType: "daily_prayer_timing",
    entityId: timing.id,
    venueId,
    dailyTimingId: timing.id,
    changedById: userId,
    fieldName: "created",
    oldValue: null,
    newValue: JSON.stringify({
      prayerName: timing.prayerName,
      azaanTime: timing.azaanTime,
      jamaahTime: timing.jamaahTime,
      timingType: timing.timingType,
      verificationStatus: timing.verificationStatus,
    }),
    sourceNote: timing.sourceNote,
  });

  return timing;
}

export async function updateMosqueAdminDailyTiming(userId, timingId, data) {
  const { timing: existingTiming, assignment } =
    await getDailyTimingWithAssignment(userId, timingId);

  if (!assignment.canEditDailyTimings) {
    throw createHttpError(
      403,
      "You do not have permission to edit daily prayer timings for this mosque"
    );
  }

  const finalTimingType =
    data.timingType !== undefined ? data.timingType : existingTiming.timingType;

  const finalJamaahTime =
    data.jamaahTime !== undefined ? data.jamaahTime : existingTiming.jamaahTime;

  const finalRelativeTimeText =
    data.relativeTimeText !== undefined
      ? data.relativeTimeText
      : existingTiming.relativeTimeText;

  if (finalTimingType === "fixed" && !finalJamaahTime) {
    throw createHttpError(
      400,
      "jamaahTime is required when timingType is fixed"
    );
  }

  if (finalTimingType === "relative" && !finalRelativeTimeText) {
    throw createHttpError(
      400,
      "relativeTimeText is required when timingType is relative"
    );
  }

  const finalPrayerName =
    data.prayerName !== undefined ? data.prayerName : existingTiming.prayerName;

  const finalEffectiveTo =
    data.effectiveTo !== undefined
      ? normalizeDate(data.effectiveTo)
      : existingTiming.effectiveTo;

  if (
    finalEffectiveTo === null &&
    finalPrayerName !== existingTiming.prayerName
  ) {
    const duplicateActiveTiming = await prisma.dailyPrayerTiming.findFirst({
      where: {
        venueId: existingTiming.venueId,
        prayerName: finalPrayerName,
        effectiveTo: null,
        id: {
          not: timingId,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicateActiveTiming) {
      throw createHttpError(
        409,
        "Active timing already exists for this prayer at this mosque."
      );
    }
  }

  const updateData = normalizeTimingData(data);
  const trustData = getTrustUpdateData(assignment);

  updateData.verificationStatus = trustData.verificationStatus;
  if (trustData.lastVerifiedAt) {
    updateData.lastVerifiedAt = trustData.lastVerifiedAt;
  }
  updateData.updatedById = userId;

  if (!updateData.sourceNote) {
    updateData.sourceNote = "Updated by mosque admin";
  }

  const updatedTiming = await prisma.dailyPrayerTiming.update({
    where: {
      id: timingId,
    },
    data: updateData,
    select: getDailyTimingSelect(),
  });

  await logAdminActivity({
    actorId: userId,
    action: "mosque_admin_daily_timing_updated",
    entityType: "daily_prayer_timing",
    entityId: timingId,
    venueId: existingTiming.venueId,
    metadata: {
      updatedFields: Object.keys(updateData),
      prayerName: updatedTiming.prayerName,
      verificationStatus: updatedTiming.verificationStatus,
    },
  });

  await createFieldUpdateHistory({
    oldRecord: existingTiming,
    updateData,
    entityType: "daily_prayer_timing",
    entityId: timingId,
    venueId: existingTiming.venueId,
    dailyTimingId: timingId,
    changedById: userId,
    sourceNote: updateData.sourceNote,
  });

  return updatedTiming;
}

/*
|--------------------------------------------------------------------------
| Jumu‘ah Timings
|--------------------------------------------------------------------------
*/

export async function createMosqueAdminJumuahTiming(userId, venueId, data) {
  const assignment = await getVenueAssignment(userId, venueId);

  if (!assignment.canEditJumuahTimings) {
    throw createHttpError(
      403,
      "You do not have permission to edit Jumu‘ah timings for this mosque"
    );
  }

  const existingSlot = await prisma.jumuahTiming.findFirst({
    where: {
      venueId,
      slotNumber: data.slotNumber,
      effectiveTo: null,
    },
    select: {
      id: true,
    },
  });

  if (existingSlot) {
    throw createHttpError(
      409,
      "Active Jumu‘ah slot already exists for this mosque. Please update it instead."
    );
  }

  const trustData = getTrustUpdateData(assignment);

  const timing = await prisma.jumuahTiming.create({
    data: {
      venueId,
      slotNumber: data.slotNumber,

      azaanTime: data.azaanTime || null,
      khutbahTime: data.khutbahTime || null,
      jamaahTime: data.jamaahTime,

      khutbahLanguage: data.khutbahLanguage || null,
      womenPrayerSpace: data.womenPrayerSpace,
      importantNotice: data.importantNotice || null,

      effectiveFrom: normalizeDate(data.effectiveFrom),
      effectiveTo: normalizeDate(data.effectiveTo),

      verificationStatus: trustData.verificationStatus,
      lastVerifiedAt: trustData.lastVerifiedAt || null,
      sourceNote: data.sourceNote || "Updated by mosque admin",

      updatedById: userId,
    },
    select: getJumuahTimingSelect(),
  });

  await logAdminActivity({
    actorId: userId,
    action: "mosque_admin_jumuah_timing_created",
    entityType: "jumuah_timing",
    entityId: timing.id,
    venueId,
    metadata: {
      venueName: timing.venue.name,
      slotNumber: timing.slotNumber,
      azaanTime: timing.azaanTime,
      khutbahTime: timing.khutbahTime,
      jamaahTime: timing.jamaahTime,
      khutbahLanguage: timing.khutbahLanguage,
      verificationStatus: timing.verificationStatus,
    },
  });

  await createUpdateHistory({
    entityType: "jumuah_timing",
    entityId: timing.id,
    venueId,
    jumuahTimingId: timing.id,
    changedById: userId,
    fieldName: "created",
    oldValue: null,
    newValue: JSON.stringify({
      slotNumber: timing.slotNumber,
      azaanTime: timing.azaanTime,
      khutbahTime: timing.khutbahTime,
      jamaahTime: timing.jamaahTime,
      verificationStatus: timing.verificationStatus,
    }),
    sourceNote: timing.sourceNote,
  });

  return timing;
}

export async function updateMosqueAdminJumuahTiming(userId, timingId, data) {
  const { timing: existingTiming, assignment } =
    await getJumuahTimingWithAssignment(userId, timingId);

  if (!assignment.canEditJumuahTimings) {
    throw createHttpError(
      403,
      "You do not have permission to edit Jumu‘ah timings for this mosque"
    );
  }

  const finalSlotNumber =
    data.slotNumber !== undefined ? data.slotNumber : existingTiming.slotNumber;

  const finalEffectiveTo =
    data.effectiveTo !== undefined
      ? normalizeDate(data.effectiveTo)
      : existingTiming.effectiveTo;

  if (
    finalEffectiveTo === null &&
    finalSlotNumber !== existingTiming.slotNumber
  ) {
    const duplicateActiveSlot = await prisma.jumuahTiming.findFirst({
      where: {
        venueId: existingTiming.venueId,
        slotNumber: finalSlotNumber,
        effectiveTo: null,
        id: {
          not: timingId,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicateActiveSlot) {
      throw createHttpError(
        409,
        "Active Jumu‘ah timing already exists for this slot number at this mosque."
      );
    }
  }

  const updateData = normalizeTimingData(data);
  const trustData = getTrustUpdateData(assignment);

  updateData.verificationStatus = trustData.verificationStatus;
  if (trustData.lastVerifiedAt) {
    updateData.lastVerifiedAt = trustData.lastVerifiedAt;
  }
  updateData.updatedById = userId;

  if (!updateData.sourceNote) {
    updateData.sourceNote = "Updated by mosque admin";
  }

  const updatedTiming = await prisma.jumuahTiming.update({
    where: {
      id: timingId,
    },
    data: updateData,
    select: getJumuahTimingSelect(),
  });

  await logAdminActivity({
    actorId: userId,
    action: "mosque_admin_jumuah_timing_updated",
    entityType: "jumuah_timing",
    entityId: timingId,
    venueId: existingTiming.venueId,
    metadata: {
      updatedFields: Object.keys(updateData),
      slotNumber: updatedTiming.slotNumber,
      verificationStatus: updatedTiming.verificationStatus,
    },
  });

  await createFieldUpdateHistory({
    oldRecord: existingTiming,
    updateData,
    entityType: "jumuah_timing",
    entityId: timingId,
    venueId: existingTiming.venueId,
    jumuahTimingId: timingId,
    changedById: userId,
    sourceNote: updateData.sourceNote,
  });

  return updatedTiming;
}