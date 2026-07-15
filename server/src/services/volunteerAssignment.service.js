import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";

const volunteerAssignmentSelect = {
  id: true,
  userId: true,
  venueId: true,
  areaId: true,
  cityId: true,

  canVerifyTimings: true,
  canUpdateTimings: true,
  canReviewReports: true,
  canReviewSuggestions: true,

  assignedById: true,
  assignedAt: true,
  isActive: true,

  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      accountStatus: true,
    },
  },

  venue: {
    select: {
      id: true,
      name: true,
      venueType: true,
      isActive: true,
      isPublic: true,
      verificationStatus: true,
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

  area: {
    select: {
      id: true,
      name: true,
      city: {
        select: {
          id: true,
          name: true,
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

  assignedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

function toBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  return Boolean(value);
}

function getAssignmentScope(data = {}) {
  const scopeFields = [
    data.venueId ? "venueId" : null,
    data.areaId ? "areaId" : null,
    data.cityId ? "cityId" : null,
  ].filter(Boolean);

  if (scopeFields.length === 0) {
    throw createHttpError(
      400,
      "Volunteer assignment must include one of venueId, areaId, or cityId"
    );
  }

  if (scopeFields.length > 1) {
    throw createHttpError(
      400,
      "Volunteer assignment can only target one scope: venueId, areaId, or cityId"
    );
  }

  return scopeFields[0];
}

async function ensureUserIsTrustedVolunteer(userId) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      accountStatus: true,
      userRoles: {
        where: {
          isActive: true,
          role: {
            name: "trusted_volunteer",
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  if (user.accountStatus !== "active") {
    throw createHttpError(400, "Cannot assign inactive user as volunteer");
  }

  if (user.userRoles.length === 0) {
    throw createHttpError(
      400,
      "User must have trusted_volunteer role before volunteer assignment"
    );
  }
}

async function ensureScopeExists(scopeField, scopeId) {
  if (scopeField === "venueId") {
    const venue = await prisma.venue.findUnique({
      where: {
        id: scopeId,
      },
      select: {
        id: true,
      },
    });

    if (!venue) {
      throw createHttpError(404, "Venue not found");
    }
  }

  if (scopeField === "areaId") {
    const area = await prisma.area.findUnique({
      where: {
        id: scopeId,
      },
      select: {
        id: true,
      },
    });

    if (!area) {
      throw createHttpError(404, "Area not found");
    }
  }

  if (scopeField === "cityId") {
    const city = await prisma.city.findUnique({
      where: {
        id: scopeId,
      },
      select: {
        id: true,
      },
    });

    if (!city) {
      throw createHttpError(404, "City not found");
    }
  }
}

async function ensureNoDuplicateActiveAssignment(userId, scopeField, scopeId) {
  const duplicate = await prisma.volunteerAssignment.findFirst({
    where: {
      userId,
      isActive: true,
      [scopeField]: scopeId,
    },
    select: {
      id: true,
    },
  });

  if (duplicate) {
    throw createHttpError(
      409,
      "Active volunteer assignment already exists for this user and scope"
    );
  }
}

export async function getVolunteerAssignments(query = {}) {
  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Math.min(Number(query.limit) > 0 ? Number(query.limit) : 20, 100);
  const skip = (page - 1) * limit;

  const where = {};

  if (query.userId) where.userId = query.userId;
  if (query.venueId) where.venueId = query.venueId;
  if (query.areaId) where.areaId = query.areaId;
  if (query.cityId) where.cityId = query.cityId;

  if (query.isActive === "true") where.isActive = true;
  if (query.isActive === "false") where.isActive = false;

  const [assignments, total] = await prisma.$transaction([
    prisma.volunteerAssignment.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        assignedAt: "desc",
      },
      select: volunteerAssignmentSelect,
    }),

    prisma.volunteerAssignment.count({
      where,
    }),
  ]);

  return {
    assignments,
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

export async function createVolunteerAssignment(data, assignedById) {
  const scopeField = getAssignmentScope(data);
  const scopeId = data[scopeField];

  await ensureUserIsTrustedVolunteer(data.userId);
  await ensureScopeExists(scopeField, scopeId);
  await ensureNoDuplicateActiveAssignment(data.userId, scopeField, scopeId);

  const assignment = await prisma.volunteerAssignment.create({
    data: {
      userId: data.userId,

      venueId: data.venueId || null,
      areaId: data.areaId || null,
      cityId: data.cityId || null,

      canVerifyTimings: toBoolean(data.canVerifyTimings, true),
      canUpdateTimings: toBoolean(data.canUpdateTimings, false),
      canReviewReports: toBoolean(data.canReviewReports, false),
      canReviewSuggestions: toBoolean(data.canReviewSuggestions, false),

      assignedById,
      isActive: true,
    },
    select: volunteerAssignmentSelect,
  });

  return assignment;
}

export async function updateVolunteerAssignment(assignmentId, data = {}) {
  const existingAssignment = await prisma.volunteerAssignment.findUnique({
    where: {
      id: assignmentId,
    },
  });

  if (!existingAssignment) {
    throw createHttpError(404, "Volunteer assignment not found");
  }

  const updateData = {};

  const permissionFields = [
    "canVerifyTimings",
    "canUpdateTimings",
    "canReviewReports",
    "canReviewSuggestions",
    "isActive",
  ];

  for (const field of permissionFields) {
    if (data[field] !== undefined) {
      updateData[field] = Boolean(data[field]);
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw createHttpError(400, "No valid volunteer assignment fields provided");
  }

  const assignment = await prisma.volunteerAssignment.update({
    where: {
      id: assignmentId,
    },
    data: updateData,
    select: volunteerAssignmentSelect,
  });

  return assignment;
}

export async function deactivateVolunteerAssignment(assignmentId) {
  const existingAssignment = await prisma.volunteerAssignment.findUnique({
    where: {
      id: assignmentId,
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!existingAssignment) {
    throw createHttpError(404, "Volunteer assignment not found");
  }

  if (!existingAssignment.isActive) {
    throw createHttpError(400, "Volunteer assignment is already inactive");
  }

  const assignment = await prisma.volunteerAssignment.update({
    where: {
      id: assignmentId,
    },
    data: {
      isActive: false,
    },
    select: volunteerAssignmentSelect,
  });

  return assignment;
}