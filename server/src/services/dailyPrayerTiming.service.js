import prisma from "../config/prisma.js";
import { logAdminActivity } from "../utils/adminActivityLogger.js";
import createHttpError from "../utils/createHttpError.js";

function getDailyTimingInclude() {
  return {
    venue: {
      select: {
        id: true,
        name: true,
        venueType: true,
        city: true,
        area: true,
      },
    },
    updatedBy: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  };
}

function normalizeDate(value) {
  if (!value) return null;
  return new Date(value);
}

async function ensureVenueExists(venueId) {
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { id: true },
  });

  if (!venue) {
    throw createHttpError(404, "Venue not found");
  }
}

function stringifyHistoryValue(value) {
  if (value === undefined || value === null) return null;

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

async function createDailyTimingUpdateHistory({
  timingId,
  venueId,
  changedById,
  oldData = {},
  newData = {},
  sourceNote,
}) {
  const ignoredFields = ["updatedById", "sourceNote"];
  const historyRows = [];

  for (const fieldName of Object.keys(newData)) {
    if (ignoredFields.includes(fieldName)) continue;

    const oldValue = stringifyHistoryValue(oldData[fieldName]);
    const newValue = stringifyHistoryValue(newData[fieldName]);

    if (oldValue === newValue) continue;

    historyRows.push({
      entityType: "daily_prayer_timing",
      entityId: timingId,
      venueId,
      dailyTimingId: timingId,
      fieldName,
      oldValue,
      newValue,
      changedById,
      sourceNote: sourceNote || null,
    });
  }

  if (historyRows.length > 0) {
    await prisma.updateHistory.createMany({
      data: historyRows,
    });
  }
}

export async function createDailyPrayerTiming(venueId, data, currentUserId) {
  await ensureVenueExists(venueId);

  const existingTiming = await prisma.dailyPrayerTiming.findFirst({
    where: {
      venueId,
      prayerName: data.prayerName,
      effectiveTo: null,
    },
  });

  if (existingTiming) {
    throw createHttpError(
      409,
      "Active timing already exists for this prayer at this venue. Please update it instead."
    );
  }

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

      verificationStatus: data.verificationStatus,
      sourceNote: data.sourceNote || null,
      lastVerifiedAt:
        data.verificationStatus === "verified" ? new Date() : null,

      updatedById: currentUserId,
    },
    include: getDailyTimingInclude(),
  });

  await logAdminActivity({
    actorId: currentUserId,
    action: "daily_timing_created",
    entityType: "daily_prayer_timing",
    entityId: timing.id,
    venueId,
    metadata: {
      prayerName: timing.prayerName,
      azaanTime: timing.azaanTime,
      jamaahTime: timing.jamaahTime,
      timingType: timing.timingType,
      relativeTimeText: timing.relativeTimeText,
      verificationStatus: timing.verificationStatus,
    },
  });

  await createDailyTimingUpdateHistory({
    timingId: timing.id,
    venueId,
    changedById: currentUserId,
    oldData: {},
    newData: {
      prayerName: timing.prayerName,
      azaanTime: timing.azaanTime,
      jamaahTime: timing.jamaahTime,
      timingType: timing.timingType,
      relativeTimeText: timing.relativeTimeText,
      effectiveFrom: timing.effectiveFrom,
      effectiveTo: timing.effectiveTo,
      verificationStatus: timing.verificationStatus,
      sourceNote: timing.sourceNote,
    },
    sourceNote: "Daily prayer timing created by Super Admin",
  });

  return timing;
}

export async function getDailyPrayerTimingsByVenue(venueId) {
  await ensureVenueExists(venueId);

  return prisma.dailyPrayerTiming.findMany({
    where: { venueId },
    orderBy: {
      prayerName: "asc",
    },
    include: getDailyTimingInclude(),
  });
}

export async function updateDailyPrayerTiming(timingId, data, currentUserId) {
  const existingTiming = await prisma.dailyPrayerTiming.findUnique({
    where: { id: timingId },
  });

  if (!existingTiming) {
    throw createHttpError(404, "Daily prayer timing not found");
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

  if (!finalJamaahTime && !finalRelativeTimeText) {
    throw createHttpError(
      400,
      "Either jamaahTime or relativeTimeText is required"
    );
  }

  const finalPrayerName =
    data.prayerName !== undefined ? data.prayerName : existingTiming.prayerName;

  const finalEffectiveTo =
    data.effectiveTo !== undefined ? normalizeDate(data.effectiveTo) : existingTiming.effectiveTo;

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
    });

    if (duplicateActiveTiming) {
      throw createHttpError(
        409,
        "Active timing already exists for this prayer at this venue."
      );
    }
  }

  const updateData = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (key === "effectiveFrom" || key === "effectiveTo") {
        updateData[key] = normalizeDate(value);
      } else {
        updateData[key] = value;
      }
    }
  }

  updateData.updatedById = currentUserId;

  if (data.verificationStatus === "verified") {
    updateData.lastVerifiedAt = new Date();
  }

  const updatedTiming = await prisma.dailyPrayerTiming.update({
    where: { id: timingId },
    data: updateData,
    include: getDailyTimingInclude(),
  });

  await logAdminActivity({
    actorId: currentUserId,
    action: "daily_timing_updated",
    entityType: "daily_prayer_timing",
    entityId: timingId,
    venueId: existingTiming.venueId,
    metadata: {
      updatedFields: Object.keys(updateData),
      prayerName: updatedTiming.prayerName,
      verificationStatus: updatedTiming.verificationStatus,
    },
  });

  await createDailyTimingUpdateHistory({
    timingId,
    venueId: existingTiming.venueId,
    changedById: currentUserId,
    oldData: existingTiming,
    newData: updateData,
    sourceNote: data.sourceNote || "Daily prayer timing updated by Super Admin",
  });

  return updatedTiming;
}

/*
-----------Sample Data---------------
{
  "timings": [
    {
      "prayerName": "fajr",
      "azaanTime": "05:10",
      "jamaahTime": "05:30",
      "timingType": "fixed",
      "effectiveFrom": "2026-06-26T00:00:00.000Z",
      "verificationStatus": "verified"
    },
    {
      "prayerName": "dhuhr",
      "azaanTime": "12:25",
      "jamaahTime": "12:45",
      "timingType": "fixed",
      "effectiveFrom": "2026-06-26T00:00:00.000Z",
      "verificationStatus": "verified"
    },
    {
      "prayerName": "asr",
      "azaanTime": "15:45",
      "jamaahTime": "16:00",
      "timingType": "fixed",
      "effectiveFrom": "2026-06-26T00:00:00.000Z",
      "verificationStatus": "verified"
    },
    {
      "prayerName": "maghrib",
      "azaanTime": "18:48",
      "jamaahTime": "18:51",
      "timingType": "fixed",
      "effectiveFrom": "2026-06-26T00:00:00.000Z",
      "verificationStatus": "verified"
    },
    {
      "prayerName": "isha",
      "azaanTime": "20:10",
      "jamaahTime": "20:25",
      "timingType": "fixed",
      "effectiveFrom": "2026-06-26T00:00:00.000Z",
      "verificationStatus": "verified"
    }
  ]
}

*/