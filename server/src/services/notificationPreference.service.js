import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";

const notificationPreferenceSelect = {
  id: true,
  userId: true,
  notificationsEnabled: true,
  prayerRemindersEnabled: true,
  jumuahRemindersEnabled: true,
  announcementNotificationsEnabled: true,
  preferredReminderMinutesBefore: true,
  createdAt: true,
  updatedAt: true,
};

function toOptionalBoolean(value) {
  if (value === undefined) return undefined;

  if (typeof value === "boolean") {
    return value;
  }

  throw createHttpError(400, "Boolean fields must be true or false");
}

function toOptionalReminderMinutes(value) {
  if (value === undefined) return undefined;

  const number = Number(value);

  if (!Number.isInteger(number) || number < 0 || number > 180) {
    throw createHttpError(
      400,
      "preferredReminderMinutesBefore must be an integer between 0 and 180"
    );
  }

  return number;
}

export async function getMyNotificationPreferences(userId) {
  let preferences = await prisma.notificationPreference.findUnique({
    where: {
      userId,
    },
    select: notificationPreferenceSelect,
  });

  if (!preferences) {
    preferences = await prisma.notificationPreference.create({
      data: {
        userId,
      },
      select: notificationPreferenceSelect,
    });
  }

  return preferences;
}

export async function updateMyNotificationPreferences(userId, data = {}) {
  const updateData = {
    notificationsEnabled: toOptionalBoolean(data.notificationsEnabled),
    prayerRemindersEnabled: toOptionalBoolean(data.prayerRemindersEnabled),
    jumuahRemindersEnabled: toOptionalBoolean(data.jumuahRemindersEnabled),
    announcementNotificationsEnabled: toOptionalBoolean(
      data.announcementNotificationsEnabled
    ),
    preferredReminderMinutesBefore: toOptionalReminderMinutes(
      data.preferredReminderMinutesBefore
    ),
  };

  for (const key of Object.keys(updateData)) {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw createHttpError(400, "No notification preference fields provided");
  }

  return prisma.notificationPreference.upsert({
    where: {
      userId,
    },
    update: updateData,
    create: {
      userId,
      ...updateData,
    },
    select: notificationPreferenceSelect,
  });
}