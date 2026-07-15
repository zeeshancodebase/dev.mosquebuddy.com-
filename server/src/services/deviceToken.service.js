import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";

const VALID_PLATFORMS = ["android", "ios", "web"];
const VALID_PERMISSION_STATUSES = [
  "not_requested",
  "granted",
  "denied",
  "unknown",
];

const deviceTokenSelect = {
  id: true,
  userId: true,
  anonymousDeviceId: true,
  deviceToken: true,
  platform: true,
  permissionStatus: true,
  isActive: true,
  lastUsedAt: true,
  createdAt: true,
  updatedAt: true,
};

function cleanString(value) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateDeviceTokenPayload(data = {}) {
  const deviceToken = cleanString(data.deviceToken);
  const anonymousDeviceId = cleanString(data.anonymousDeviceId);
  const platform = cleanString(data.platform);
  const permissionStatus =
    cleanString(data.permissionStatus) || "unknown";

  if (!deviceToken) {
    throw createHttpError(400, "deviceToken is required");
  }

  if (!platform || !VALID_PLATFORMS.includes(platform)) {
    throw createHttpError(
      400,
      "platform must be one of: android, ios, web"
    );
  }

  if (!VALID_PERMISSION_STATUSES.includes(permissionStatus)) {
    throw createHttpError(
      400,
      "permissionStatus must be one of: not_requested, granted, denied, unknown"
    );
  }

  return {
    deviceToken,
    anonymousDeviceId,
    platform,
    permissionStatus,
  };
}

export async function registerDeviceToken(data = {}, userId = null) {
  const parsed = validateDeviceTokenPayload(data);

  if (!userId && !parsed.anonymousDeviceId) {
    throw createHttpError(
      400,
      "anonymousDeviceId is required for guest device token registration"
    );
  }

  const existingToken = await prisma.deviceToken.findUnique({
    where: {
      deviceToken: parsed.deviceToken,
    },
    select: {
      id: true,
    },
  });

  if (existingToken) {
    return prisma.deviceToken.update({
      where: {
        id: existingToken.id,
      },
      data: {
        userId,
        anonymousDeviceId: userId ? null : parsed.anonymousDeviceId,
        platform: parsed.platform,
        permissionStatus: parsed.permissionStatus,
        isActive: true,
        lastUsedAt: new Date(),
      },
      select: deviceTokenSelect,
    });
  }

  return prisma.deviceToken.create({
    data: {
      userId,
      anonymousDeviceId: userId ? null : parsed.anonymousDeviceId,
      deviceToken: parsed.deviceToken,
      platform: parsed.platform,
      permissionStatus: parsed.permissionStatus,
      isActive: true,
      lastUsedAt: new Date(),
    },
    select: deviceTokenSelect,
  });
}

export async function deactivateDeviceToken(deviceTokenId, userId = null) {
  const existingToken = await prisma.deviceToken.findUnique({
    where: {
      id: deviceTokenId,
    },
    select: {
      id: true,
      userId: true,
      anonymousDeviceId: true,
      isActive: true,
    },
  });

  if (!existingToken) {
    throw createHttpError(404, "Device token not found");
  }

  if (userId && existingToken.userId && existingToken.userId !== userId) {
    throw createHttpError(
      403,
      "You cannot deactivate another user's device token"
    );
  }

  return prisma.deviceToken.update({
    where: {
      id: deviceTokenId,
    },
    data: {
      isActive: false,
    },
    select: deviceTokenSelect,
  });
}