import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";

const assignmentSelect = {
  id: true,
  userId: true,
  venueId: true,

  canEditVenueProfile: true,
  canEditDailyTimings: true,
  canEditJumuahTimings: true,
  canReviewReports: true,
  canMarkVerified: true,

  assignedAt: true,
  isActive: true,

  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      accountStatus: true,
      userRoles: {
        where: {
          isActive: true,
        },
        select: {
          role: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  },

  venue: {
    select: {
      id: true,
      name: true,
      venueType: true,
      isPublic: true,
      verificationStatus: true,
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

  assignedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

async function ensureUserHasMosqueAdminRole(userId) {
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
        },
        select: {
          role: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  if (user.accountStatus !== "active") {
    throw createHttpError(400, "Cannot assign inactive user as mosque admin");
  }

  const roles = user.userRoles.map((userRole) => userRole.role.name);

  if (!roles.includes("mosque_admin")) {
    throw createHttpError(
      400,
      "User must have mosque_admin role before venue assignment"
    );
  }

  return user;
}

async function ensureVenueExists(venueId) {
  const venue = await prisma.venue.findUnique({
    where: {
      id: venueId,
    },
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

export async function getVenueAdminAssignments(query = {}) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const userId = query.userId || undefined;
  const venueId = query.venueId || undefined;
  const isActive =
    query.isActive === undefined ? undefined : query.isActive === "true";

  const where = {
    ...(userId && { userId }),
    ...(venueId && { venueId }),
    ...(isActive !== undefined && { isActive }),
  };

  const [assignments, totalAssignments] = await prisma.$transaction([
    prisma.venueAdminAssignment.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        assignedAt: "desc",
      },
      select: assignmentSelect,
    }),

    prisma.venueAdminAssignment.count({
      where,
    }),
  ]);

  return {
    assignments,
    pagination: {
      page,
      limit,
      totalAssignments,
      totalPages: Math.ceil(totalAssignments / limit),
    },
  };
}

export async function createVenueAdminAssignment(data, assignedById) {
  await ensureUserHasMosqueAdminRole(data.userId);
  await ensureVenueExists(data.venueId);

  const existingAssignment = await prisma.venueAdminAssignment.findUnique({
    where: {
      userId_venueId: {
        userId: data.userId,
        venueId: data.venueId,
      },
    },
  });

  if (existingAssignment) {
    if (existingAssignment.isActive) {
      throw createHttpError(
        409,
        "This user is already assigned to this venue"
      );
    }

    return prisma.venueAdminAssignment.update({
      where: {
        id: existingAssignment.id,
      },
      data: {
        isActive: true,
        canEditVenueProfile: data.canEditVenueProfile ?? true,
        canEditDailyTimings: data.canEditDailyTimings ?? true,
        canEditJumuahTimings: data.canEditJumuahTimings ?? true,
        canReviewReports: data.canReviewReports ?? false,
        canMarkVerified: data.canMarkVerified ?? true,
        assignedById,
        assignedAt: new Date(),
      },
      select: assignmentSelect,
    });
  }

  return prisma.venueAdminAssignment.create({
    data: {
      userId: data.userId,
      venueId: data.venueId,

      canEditVenueProfile: data.canEditVenueProfile ?? true,
      canEditDailyTimings: data.canEditDailyTimings ?? true,
      canEditJumuahTimings: data.canEditJumuahTimings ?? true,
      canReviewReports: data.canReviewReports ?? false,
      canMarkVerified: data.canMarkVerified ?? true,

      assignedById,
    },
    select: assignmentSelect,
  });
}

export async function updateVenueAdminAssignment(assignmentId, data) {
  const assignment = await prisma.venueAdminAssignment.findUnique({
    where: {
      id: assignmentId,
    },
  });

  if (!assignment) {
    throw createHttpError(404, "Venue admin assignment not found");
  }

  return prisma.venueAdminAssignment.update({
    where: {
      id: assignmentId,
    },
    data: {
      ...(data.canEditVenueProfile !== undefined && {
        canEditVenueProfile: data.canEditVenueProfile,
      }),
      ...(data.canEditDailyTimings !== undefined && {
        canEditDailyTimings: data.canEditDailyTimings,
      }),
      ...(data.canEditJumuahTimings !== undefined && {
        canEditJumuahTimings: data.canEditJumuahTimings,
      }),
      ...(data.canReviewReports !== undefined && {
        canReviewReports: data.canReviewReports,
      }),
      ...(data.canMarkVerified !== undefined && {
        canMarkVerified: data.canMarkVerified,
      }),
      ...(data.isActive !== undefined && {
        isActive: data.isActive,
      }),
    },
    select: assignmentSelect,
  });
}

export async function deactivateVenueAdminAssignment(assignmentId) {
  const assignment = await prisma.venueAdminAssignment.findUnique({
    where: {
      id: assignmentId,
    },
  });

  if (!assignment) {
    throw createHttpError(404, "Venue admin assignment not found");
  }

  return prisma.venueAdminAssignment.update({
    where: {
      id: assignmentId,
    },
    data: {
      isActive: false,
    },
    select: assignmentSelect,
  });
}