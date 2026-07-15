import prisma from "../config/prisma.js";
import { logAdminActivity } from "../utils/adminActivityLogger.js";
import createHttpError from "../utils/createHttpError.js";

function normalizeDate(value) {
  if (!value) return null;
  return new Date(value);
}

function getJumuahTimingInclude() {
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

async function ensureVenueExists(venueId) {
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!venue) {
    throw createHttpError(404, "Venue not found");
  }

  return venue;
}

async function ensureJumuahTimingExists(timingId) {
  const timing = await prisma.jumuahTiming.findUnique({
    where: { id: timingId },
  });

  if (!timing) {
    throw createHttpError(404, "Jumu‘ah timing not found");
  }

  return timing;
}

export async function createJumuahTiming(venueId, data, currentUserId) {
  await ensureVenueExists(venueId);

  const existingSlot = await prisma.jumuahTiming.findFirst({
    where: {
      venueId,
      slotNumber: data.slotNumber,
      effectiveTo: null,
    },
  });

  if (existingSlot) {
    throw createHttpError(
      409,
      "Active Jumu‘ah slot already exists for this venue. Please update it instead."
    );
  }

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

      verificationStatus: data.verificationStatus,
      sourceNote: data.sourceNote || null,
      lastVerifiedAt:
        data.verificationStatus === "verified" ? new Date() : null,

      updatedById: currentUserId,
    },
    include: getJumuahTimingInclude(),
  });

  await logAdminActivity({
    actorId: currentUserId,
    action: "jumuah_timing_created",
    entityType: "jumuah_timing",
    entityId: timing.id,
    venueId,
    metadata: {
      slotNumber: timing.slotNumber,
      azaanTime: timing.azaanTime,
      khutbahTime: timing.khutbahTime,
      jamaahTime: timing.jamaahTime,
      khutbahLanguage: timing.khutbahLanguage,
      womenPrayerSpace: timing.womenPrayerSpace,
      verificationStatus: timing.verificationStatus,
    },
  });

  await createUpdateHistory({
    entityType: "jumuah_timing",
    entityId: timing.id,
    venueId,
    jumuahTimingId: timing.id,
    changedById: currentUserId,
    fieldName: "created",
    oldValue: null,
    newValue: JSON.stringify({
      slotNumber: timing.slotNumber,
      jamaahTime: timing.jamaahTime,
      verificationStatus: timing.verificationStatus,
    }),
    sourceNote: data.sourceNote || null,
  });

  return timing;
}

export async function getJumuahTimingsByVenue(venueId) {
  await ensureVenueExists(venueId);

  return prisma.jumuahTiming.findMany({
    where: {
      venueId,
    },
    orderBy: [
      {
        slotNumber: "asc",
      },
      {
        jamaahTime: "asc",
      },
    ],
    include: getJumuahTimingInclude(),
  });
}

export async function updateJumuahTiming(timingId, data, currentUserId) {
  const existingTiming = await ensureJumuahTimingExists(timingId);


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
    });

    if (duplicateActiveSlot) {
      throw createHttpError(
        409,
        "Active Jumu‘ah timing already exists for this slot number at this venue."
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

  const updatedTiming = await prisma.jumuahTiming.update({
    where: { id: timingId },
    data: updateData,
    include: getJumuahTimingInclude(),
  });

  await logAdminActivity({
    actorId: currentUserId,
    action: "jumuah_timing_updated",
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
    newData: updateData,
    entityType: "jumuah_timing",
    entityId: timingId,
    venueId: existingTiming.venueId,
    jumuahTimingId: timingId,
    changedById: currentUserId,
    sourceNote: data.sourceNote || null,
  });

  return updatedTiming;
}

export async function deleteJumuahTiming(timingId, currentUserId) {
  const existingTiming = await ensureJumuahTimingExists(timingId);

  await prisma.jumuahTiming.delete({
    where: { id: timingId },
  });

  await logAdminActivity({
    actorId: currentUserId,
    action: "jumuah_timing_deleted",
    entityType: "jumuah_timing",
    entityId: timingId,
    venueId: existingTiming.venueId,
    metadata: {
      slotNumber: existingTiming.slotNumber,
      azaanTime: existingTiming.azaanTime,
      khutbahTime: existingTiming.khutbahTime,
      jamaahTime: existingTiming.jamaahTime,
      khutbahLanguage: existingTiming.khutbahLanguage,
      womenPrayerSpace: existingTiming.womenPrayerSpace,
      verificationStatus: existingTiming.verificationStatus,
    },
  });

  return existingTiming;
}


async function createUpdateHistory({
  entityType,
  entityId,
  venueId,
  jumuahTimingId,
  changedById,
  fieldName,
  oldValue,
  newValue,
  sourceNote,
}) {
  try {
    await prisma.updateHistory.create({
      data: {
        entityType,
        entityId,
        venueId,
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
  newData,
  entityType,
  entityId,
  venueId,
  jumuahTimingId,
  changedById,
  sourceNote,
}) {
  const ignoredFields = ["updatedById", "lastVerifiedAt"];

  for (const [fieldName, newValue] of Object.entries(newData)) {
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