import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { env } from "../config/env.js";
import createHttpError from "../utils/createHttpError.js";
import cleanValue from "../utils/cleanValue.js";
import { logAdminActivity } from "../utils/adminActivityLogger.js";

/*
|--------------------------------------------------------------------------
| Helper: User Response Select
|--------------------------------------------------------------------------
| Controls what user data is returned.
| Important: passwordHash is never returned.
*/
const authUserSelect = {
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
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  },

  notificationPreference: true,
};

/*
|--------------------------------------------------------------------------
| Helper: Generate JWT Token
|--------------------------------------------------------------------------
| Creates a signed token for logged-in users.
| The token stores only basic identity, not full user data.
*/
const generateToken = (userId) => {
  return jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
};

/*
|--------------------------------------------------------------------------
| Register User
|--------------------------------------------------------------------------
| Public registration.
|
| Sabeel rule:
| A newly registered user only gets registered_user role.
| Mosque admin / trusted volunteer / super admin are assigned later
| by protected Super Admin workflows.
*/
export const registerUser = async (req, res, next) => {
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
        select: authUserSelect,
      });
    });

    const token = generateToken(user.id);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
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
| Login User
|--------------------------------------------------------------------------
| Allows login using email or phone plus password.
*/
export const loginUser = async (req, res, next) => {
  try {
    const identifier = cleanValue(req.body.identifier);
    const password = cleanValue(req.body.password);

    if (!identifier) {
      return next(createHttpError(400, "Email or phone is required"));
    }

    if (!password) {
      return next(createHttpError(400, "Password is required"));
    }

    const userWithPassword = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
      select: {
        id: true,
        passwordHash: true,
        accountStatus: true,
      },
    });

    if (!userWithPassword || !userWithPassword.passwordHash) {
      return next(createHttpError(401, "Invalid email/phone or password"));
    }

    if (userWithPassword.accountStatus === "deleted") {
      return next(createHttpError(403, "This account has been deleted"));
    }

    if (userWithPassword.accountStatus !== "active") {
      return next(createHttpError(403, "Your account is not active"));
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      userWithPassword.passwordHash
    );

    if (!isPasswordCorrect) {
      return next(createHttpError(401, "Invalid email/phone or password"));
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userWithPassword.id,
      },
      select: authUserSelect,
    });

    const token = generateToken(user.id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get Current User
|--------------------------------------------------------------------------
| Returns the logged-in user's profile using req.user from auth middleware.
*/
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: authUserSelect,
    });

    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    return res.status(200).json({
      success: true,
      message: "Current user fetched successfully",
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};


/*
|--------------------------------------------------------------------------
| Delete My Account (Self-Service)
|--------------------------------------------------------------------------
| Purpose:
| Lets a logged-in user delete their own account from the mobile app.
| Required for Google Play compliance.
|
| Important Sabeel rule:
| This is a SOFT delete, not a hard delete — regardless of what the UI
| tells the user. We do this because a deleted account may belong to a
| mosque_admin or trusted_volunteer whose past actions (timing updates,
| report reviews, verifications) are part of Sabeel's trust/audit history.
| Losing that history is worse than keeping an inactive row.
|
| The user is told this is permanent because, from their perspective,
| it is: their login stops working immediately (authMiddleware rejects
| any accountStatus other than "active"), and no soft/hard distinction
| should ever be surfaced to them.
|
| On top of accountStatus, we also deactivate any live venue admin /
| volunteer assignments so permissions can't silently come back if the
| account is ever manually reactivated later.
*/
export const deleteMyAccount = async (req, res, next) => {
  try {
    const password = cleanValue(req.body.password);

    if (!password) {
      return next(createHttpError(400, "Password is required"));
    }

    const userWithPassword = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        passwordHash: true,
        accountStatus: true,
      },
    });

    if (!userWithPassword || !userWithPassword.passwordHash) {
      return next(createHttpError(401, "Incorrect password"));
    }

    if (userWithPassword.accountStatus !== "active") {
      return next(createHttpError(403, "This account is not active"));
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      userWithPassword.passwordHash
    );

    if (!isPasswordCorrect) {
      return next(createHttpError(401, "Incorrect password"));
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: req.user.id,
        },
        data: {
          accountStatus: "deleted",
        },
      });

      await tx.venueAdminAssignment.updateMany({
        where: {
          userId: req.user.id,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      await tx.volunteerAssignment.updateMany({
        where: {
          userId: req.user.id,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    });

    await logAdminActivity({
      actorId: req.user.id,
      action: "user_self_deleted",
      entityType: "user",
      entityId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};