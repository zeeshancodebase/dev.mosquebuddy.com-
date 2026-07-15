import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";
import cleanValue from "../utils/cleanValue.js";
import { logAdminActivity } from "../utils/adminActivityLogger.js";
import bcrypt from "bcryptjs";





/*
|--------------------------------------------------------------------------
| Helper: User Response Select
|--------------------------------------------------------------------------
| This controls what user data we send back from Prisma.
| We intentionally do NOT return passwordHash.
|
| Relations like userRoles, notificationPreference, assignments are included
| only because they are useful for app/admin access checks.
*/
const userResponseSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  profileImageUrl: true,
  accountStatus: true,
  createdAt: true,
  updatedAt: true,

  userRoles: {
    where: {
      isActive: true,
    },
    select: {
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
    },
  },

  notificationPreference: {
    select: {
      id: true,
      notificationsEnabled: true,
      prayerRemindersEnabled: true,
      jumuahRemindersEnabled: true,
      announcementNotificationsEnabled: true,
      preferredReminderMinutesBefore: true,
      createdAt: true,
      updatedAt: true,
    },
  },

  venueAdminAssignments: {
    where: {
      isActive: true,
    },
    select: {
      id: true,
      venueId: true,
      canEditVenueProfile: true,
      canEditDailyTimings: true,
      canEditJumuahTimings: true,
      canReviewReports: true,
      canMarkVerified: true,
      assignedAt: true,
      venue: {
        select: {
          id: true,
          name: true,
          venueType: true,
          isPublic: true,
          verificationStatus: true,
        },
      },
    },
  },

  volunteerAssignments: {
    where: {
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
      assignedAt: true,
    },
  },
};

/*
|--------------------------------------------------------------------------
| Create User
|--------------------------------------------------------------------------
| Purpose:
| Creates a user from Super Admin panel with registered_user role.
|
| Important Sabeel rule:
| A public/normal user creation should ONLY assign registered_user role.
| Mosque admin, trusted volunteer, and super admin roles will be assigned later
| through protected Super Admin APIs.
*/
export const createUser = async (req, res, next) => {
  try {
    const name = cleanValue(req.body.name);
    const email = cleanValue(req.body.email);
    const phone = cleanValue(req.body.phone);
    const password = cleanValue(req.body.password);
    const profileImageUrl = cleanValue(req.body.profileImageUrl);

    if (!name) {
      return next(createHttpError(400, "Name is required"));
    }

    if (!email && !phone) {
      return next(createHttpError(400, "Email or phone is required"));
    }

    if (!password) {
      return next(createHttpError(400, "Password is required"));
    }

    if (password.length < 8) {
      return next(
        createHttpError(400, "Password must be at least 8 characters long")
      );
    }
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const registeredUserRole = await tx.role.findUnique({
        where: {
          name: "registered_user",
        },
      });

      if (!registeredUserRole) {
        throw createHttpError(
          500,
          "Default role registered_user not found",
          "Please run npm run prisma:seed"
        );
      }

      return tx.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          profileImageUrl,

          userRoles: {
            create: {
              roleId: registeredUserRole.id,
            },
          },

          notificationPreference: {
            create: {
              notificationsEnabled: false,
              prayerRemindersEnabled: false,
              jumuahRemindersEnabled: false,
              announcementNotificationsEnabled: false,
              preferredReminderMinutesBefore: 15,
            },
          },
        },
        select: userResponseSelect,
      });
    });

    await logAdminActivity({
      actorId: req.user?.id,
      action: "user_created",
      entityType: "user",
      entityId: user.id,
      metadata: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        accountStatus: user.accountStatus,
      },
    });


    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return next(
        createHttpError(
          409,
          "User with this email or phone already exists",
          error.meta?.target
        )
      );
    }

    return next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get All Users
|--------------------------------------------------------------------------
| Purpose:
| Returns users with roles and basic access information.
|
| MVP note:
| Right now this is open for testing.
| Later this should become a protected Super Admin route.
*/
export const getUsers = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = cleanValue(req.query.search);
    const accountStatus = cleanValue(req.query.accountStatus);
    const role = cleanValue(req.query.role);

    const skip = (page - 1) * limit;

    const where = {
      ...(accountStatus && {
        accountStatus,
      }),

      ...(role && {
        userRoles: {
          some: {
            isActive: true,
            role: {
              name: role,
            },
          },
        },
      }),

      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      }),
    };

    const [users, totalUsers] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: userResponseSelect,
      }),

      prisma.user.count({
        where,
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
      data: users,
    });
  } catch (error) {
    return next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get User By ID
|--------------------------------------------------------------------------
| Purpose:
| Returns one user by ID.
|
| Used later for:
| - profile page
| - admin user details
| - checking user roles/access
*/
export const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: userResponseSelect,
    });

    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Update User
|--------------------------------------------------------------------------
| Purpose:
| Updates basic user profile fields only.
|
| Important:
| This function should NOT update roles.
| Role updates must be handled separately by Super Admin APIs.
*/
export const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        phone: true,
      },
    });

    if (!existingUser) {
      return next(createHttpError(404, "User not found"));
    }

    const name = cleanValue(req.body.name);
    const email = cleanValue(req.body.email);
    const phone = cleanValue(req.body.phone);
    const profileImageUrl = cleanValue(req.body.profileImageUrl);

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (profileImageUrl !== undefined) {
      updateData.profileImageUrl = profileImageUrl;
    }

    if (Object.keys(updateData).length === 0) {
      return next(createHttpError(400, "No valid fields provided for update"));
    }

    if (updateData.name === null) {
      return next(createHttpError(400, "Name cannot be empty"));
    }

    const finalEmail =
      updateData.email !== undefined ? updateData.email : existingUser.email;

    const finalPhone =
      updateData.phone !== undefined ? updateData.phone : existingUser.phone;

    if (!finalEmail && !finalPhone) {
      return next(createHttpError(400, "Email or phone is required"));
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
      select: userResponseSelect,
    });

    await logAdminActivity({
      actorId: req.user?.id,
      action: "user_updated",
      entityType: "user",
      entityId: updatedUser.id,
      metadata: {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        accountStatus: updatedUser.accountStatus,
      },
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return next(
        createHttpError(
          409,
          "User with this email or phone already exists",
          error.meta?.target
        )
      );
    }

    if (error.code === "P2025") {
      return next(createHttpError(404, "User not found"));
    }

    return next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Deactivate User
|--------------------------------------------------------------------------
| Purpose:
| Soft deletes/deactivates a user by setting accountStatus to deleted.
|
| Why soft delete?
| Because Sabeel needs trust/audit history. We should not physically delete
| users who may have submitted reports, updated timings, or performed admin actions.
*/
export const deactivateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (req.user.id === userId) {
      return next(createHttpError(400, "You cannot delete your own account"));
    }

    const deactivatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        accountStatus: "deleted",
      },
      select: userResponseSelect,
    });


    await logAdminActivity({
      actorId: req.user?.id,
      action: "user_deactivated",
      entityType: "user",
      entityId: deactivatedUser.id,
      metadata: {
        name: deactivatedUser.name,
        email: deactivatedUser.email,
        phone: deactivatedUser.phone,
        accountStatus: deactivatedUser.accountStatus,
      },
    });


    return res.status(200).json({
      success: true,
      message: "User deactivated successfully",
      data: deactivatedUser,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return next(createHttpError(404, "User not found"));
    }

    return next(error);
  }
};




export const deleteUserPermanently = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userRoles: {
          select: {
            role: { select: { name: true } }
          }
        }
      }
    });

    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    // safety: prevent deleting super admin
    const roles = user.userRoles.map(r => r.role.name);
    if (roles.includes("super_admin")) {
      return next(createHttpError(403, "Cannot delete super admin"));
    }

    await prisma.$transaction(async (tx) => {
      // delete related tables first (important for FK safety)

      await tx.userRoles.deleteMany({
        where: { userId }
      });

      await tx.notificationPreference.deleteMany({
        where: { userId }
      });

      await tx.venueAdminAssignment.deleteMany({
        where: { userId }
      });

      await tx.volunteerAssignment.deleteMany({
        where: { userId }
      });

      // finally delete user
      await tx.user.delete({
        where: { id: userId }
      });
    });

    await logAdminActivity({
      actorId: req.user?.id,
      action: "user_permanently_deleted",
      entityType: "user",
      entityId: userId,
    });

    return res.status(200).json({
      success: true,
      message: "User permanently deleted",
    });

  } catch (error) {
    return next(error);
  }
};