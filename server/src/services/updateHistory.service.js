// src/services/updateHistory.service.js
import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";

export async function getVenueUpdateHistory(venueId, { page = 1, limit = 20 } = {}) {
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { id: true },
  });

  if (!venue) throw createHttpError(404, "Venue not found");

  const skip = (page - 1) * limit;

  const [history, total] = await Promise.all([
    prisma.updateHistory.findMany({
      where: { venueId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        entityType: true,
        entityId: true,
        fieldName: true,
        oldValue: true,
        newValue: true,
        sourceNote: true,
        createdAt: true,
        dailyTimingId: true,
        jumuahTimingId: true,
        changedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.updateHistory.count({ where: { venueId } }),
  ]);

  return {
    history,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}