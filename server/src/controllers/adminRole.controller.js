import { successResponse } from "../utils/apiResponse.js";
import createHttpError from "../utils/createHttpError.js";
import { logAdminActivity } from "../utils/adminActivityLogger.js";

import {
  getRoles,
  assignRoleToUser,
  removeRoleFromUser,
} from "../services/adminRole.service.js";

const allowedRoleNames = [
  "registered_user",
  "mosque_admin",
  "trusted_volunteer",
  "super_admin",
];

export async function getAdminRoles(req, res, next) {
  try {
    const roles = await getRoles();

    return successResponse(res, {
      message: "Roles fetched successfully",
      data: roles,
    });
  } catch (error) {
    next(error);
  }
}

export async function assignAdminUserRole(req, res, next) {
  try {
    const { userId } = req.params;
    const { roleName } = req.body;

    if (!roleName) {
      throw createHttpError(400, "roleName is required");
    }

    if (!allowedRoleNames.includes(roleName)) {
      throw createHttpError(400, "Invalid roleName");
    }

    const user = await assignRoleToUser(userId, roleName, req.user.id);

    await logAdminActivity({
      actorId: req.user.id,
      action: "role_assigned",
      entityType: "user",
      entityId: user.id,
      metadata: {
        userName: user.name,
        userEmail: user.email,
        assignedRole: roleName,
      },
    });

    return successResponse(res, {
      message: "Role assigned successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeAdminUserRole(req, res, next) {
  try {
    const { userId, roleName } = req.params;

    if (!allowedRoleNames.includes(roleName)) {
      throw createHttpError(400, "Invalid roleName");
    }

    const user = await removeRoleFromUser(userId, roleName, req.user.id);

    await logAdminActivity({
      actorId: req.user.id,
      action: "role_removed",
      entityType: "user",
      entityId: user.id,
      metadata: {
        userName: user.name,
        userEmail: user.email,
        removedRole: roleName,
      },
    });

    return successResponse(res, {
      message: "Role removed successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
}