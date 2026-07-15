import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";
import cleanValue from "../utils/cleanValue.js";

/*
|--------------------------------------------------------------------------
| Admin Activity Log Service
|--------------------------------------------------------------------------
| Purpose:
| Provides a dedicated audit log API for Super Admin.
|
| Dashboard recent activity is only a snapshot.
| This service powers the full audit page with filters and pagination.
*/

function toPositiveInt(value, fallback) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return fallback;
  }

  return number;
}

function parseDate(value, fieldName) {
  const cleaned = cleanValue(value);

  if (!cleaned) return null;

  const date = new Date(cleaned);

  if (Number.isNaN(date.getTime())) {
    throw createHttpError(400, `${fieldName} must be a valid date`);
  }

  return date;
}

const adminActivityLogSelect = {
  id: true,
  actorId: true,
  action: true,
  entityType: true,
  entityId: true,
  venueId: true,
  metadata: true,
  createdAt: true,

  actor: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },

  venue: {
    select: {
      id: true,
      name: true,
      venueType: true,
      area: {
        select: {
          id: true,
          name: true,
        },
      },
      city: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
};

export async function getAdminActivityLogs(query = {}) {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, 25), 100);
  const skip = (page - 1) * limit;

  const actorId = cleanValue(query.actorId);
  const action = cleanValue(query.action);
  const entityType = cleanValue(query.entityType);
  const entityId = cleanValue(query.entityId);
  const venueId = cleanValue(query.venueId);
  const search = cleanValue(query.search);

  const fromDate = parseDate(query.fromDate, "fromDate");
  const toDate = parseDate(query.toDate, "toDate");

  if (fromDate && toDate && fromDate > toDate) {
    throw createHttpError(400, "fromDate cannot be after toDate");
  }

  const where = {
    ...(actorId && { actorId }),
    ...(action && {
      action: {
        contains: action,
        mode: "insensitive",
      },
    }),
    ...(entityType && {
      entityType: {
        contains: entityType,
        mode: "insensitive",
      },
    }),
    ...(entityId && { entityId }),
    ...(venueId && { venueId }),

    ...((fromDate || toDate) && {
      createdAt: {
        ...(fromDate && { gte: fromDate }),
        ...(toDate && { lte: toDate }),
      },
    }),

    ...(search && {
      OR: [
        {
          action: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          entityType: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          actor: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          actor: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          venue: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ],
    }),
  };

  const [logs, totalLogs] = await prisma.$transaction([
    prisma.adminActivityLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: adminActivityLogSelect,
    }),

    prisma.adminActivityLog.count({
      where,
    }),
  ]);

  return {
    logs: logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      createdAt: log.createdAt,

      actor: log.actor
        ? {
            id: log.actor.id,
            name: log.actor.name,
            email: log.actor.email,
            phone: log.actor.phone,
          }
        : null,

      venue: log.venue
        ? {
            id: log.venue.id,
            name: log.venue.name,
            venueType: log.venue.venueType,
            areaName: log.venue.area?.name || null,
            cityName: log.venue.city?.name || null,
          }
        : null,
    })),

    pagination: {
      page,
      limit,
      totalLogs,
      totalPages: Math.ceil(totalLogs / limit),
      hasNextPage: page * limit < totalLogs,
      hasPreviousPage: page > 1,
    },

    filters: {
      actorId,
      action,
      entityType,
      entityId,
      venueId,
      search,
      fromDate,
      toDate,
    },
  };
}