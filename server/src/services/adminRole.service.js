import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";

const userRoleSelect = {
  id: true,
  assignedAt: true,
  isActive: true,
  role: {
    select: {
      id: true,
      name: true,
      description: true,
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

const userWithRolesSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  accountStatus: true,
  userRoles: {
    where: {
      isActive: true,
    },
    select: userRoleSelect,
  },
};

export async function getRoles() {
  return prisma.role.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function assignRoleToUser(userId, roleName, assignedById) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      accountStatus: true,
    },
  });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  if (user.accountStatus !== "active") {
    throw createHttpError(400, "Cannot assign role to inactive user");
  }

  const role = await prisma.role.findUnique({
    where: {
      name: roleName,
    },
  });

  if (!role) {
    throw createHttpError(404, "Role not found");
  }

  const existingUserRole = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id,
      },
    },
  });

  if (existingUserRole) {
    if (existingUserRole.isActive) {
      throw createHttpError(409, "User already has this role");
    }

    await prisma.userRole.update({
      where: {
        id: existingUserRole.id,
      },
      data: {
        isActive: true,
        assignedById,
        assignedAt: new Date(),
      },
    });
  } else {
    await prisma.userRole.create({
      data: {
        userId,
        roleId: role.id,
        assignedById,
      },
    });
  }

  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: userWithRolesSelect,
  });
}

export async function removeRoleFromUser(userId, roleName, actorId) {
  if (roleName === "registered_user") {
    throw createHttpError(400, "registered_user role cannot be removed");
  }

  if (userId === actorId && roleName === "super_admin") {
    throw createHttpError(400, "You cannot remove your own super_admin role");
  }

  const role = await prisma.role.findUnique({
    where: {
      name: roleName,
    },
  });

  if (!role) {
    throw createHttpError(404, "Role not found");
  }

  const userRole = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id,
      },
    },
  });

  if (!userRole || !userRole.isActive) {
    throw createHttpError(404, "User does not have this active role");
  }

  await prisma.$transaction(async (tx) => {
    await tx.userRole.update({
      where: {
        id: userRole.id,
      },
      data: {
        isActive: false,
      },
    });

    if (roleName === "mosque_admin") {
      await tx.venueAdminAssignment.updateMany({
        where: {
          userId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }

    if (roleName === "trusted_volunteer") {
      await tx.volunteerAssignment.updateMany({
        where: {
          userId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }
  });

  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: userWithRolesSelect,
  });
}