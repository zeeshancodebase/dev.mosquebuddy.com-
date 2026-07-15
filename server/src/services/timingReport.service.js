import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";
import cleanValue from "../utils/cleanValue.js";

/*
|--------------------------------------------------------------------------
| Timing Report Service
|--------------------------------------------------------------------------
| Purpose:
| Handles registered-user submission of wrong timing / mosque data reports.
|
| Important Sabeel rules:
| - Viewing mosque data is public.
| - Contributing reports requires login.
| - Reports do NOT directly change public timings.
| - Reports go to admin/reviewer workflow.
| - User contribution count is returned so frontend can encourage the user.
*/

const VALID_ISSUE_TYPES = [
  "both_times_wrong",
  "azaan_time_wrong",
  "jamaah_time_wrong",
  "jumuah_time_wrong",
  "location_wrong",
  "women_prayer_info_wrong",
  "facility_info_wrong",
  "venue_closed_or_inactive",
  "other",
];

const VALID_DAILY_PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

function isValidTime(value) {
  if (!value) return true;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function normalizeTime(value) {
  const cleaned = cleanValue(value);
  return cleaned || null;
}

function validateTimeField(value, fieldName) {
  if (!isValidTime(value)) {
    throw createHttpError(400, `${fieldName} must be in HH:mm format`);
  }
}

function getContributionMessage(totalContributionCount) {
  if (totalContributionCount === 1) {
    return "JazakAllahu khair. This is your 1st contribution to Sabeel.";
  }

  if (totalContributionCount === 2) {
    return "JazakAllahu khair. This is your 2nd contribution to Sabeel.";
  }

  if (totalContributionCount === 3) {
    return "JazakAllahu khair. This is your 3rd contribution to Sabeel.";
  }

  return `JazakAllahu khair. This is your ${totalContributionCount}th contribution to Sabeel.`;
}

const submittedTimingReportSelect = {
  id: true,
  venueId: true,
  dailyTimingId: true,
  jumuahTimingId: true,
  prayerName: true,
  issueType: true,

  currentAzaanTime: true,
  currentJamaahTime: true,
  suggestedAzaanTime: true,
  suggestedJamaahTime: true,
  suggestedKhutbahTime: true,

  userNote: true,
  status: true,
  submittedById: true,

  createdAt: true,
  updatedAt: true,

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

export async function submitTimingReport(body = {}, submittedById) {
  if (!submittedById) {
    throw createHttpError(401, "Login is required to submit a report");
  }

  const venueId = cleanValue(body.venueId);
  const dailyTimingId = cleanValue(body.dailyTimingId);
  const jumuahTimingId = cleanValue(body.jumuahTimingId);
  const prayerName = cleanValue(body.prayerName);
  const issueType = cleanValue(body.issueType);

  const currentAzaanTime = normalizeTime(body.currentAzaanTime);
  const currentJamaahTime = normalizeTime(body.currentJamaahTime);
  const suggestedAzaanTime = normalizeTime(body.suggestedAzaanTime);
  const suggestedJamaahTime = normalizeTime(body.suggestedJamaahTime);
  const suggestedKhutbahTime = normalizeTime(body.suggestedKhutbahTime);
  const userNote = cleanValue(body.userNote);

  if (!venueId) {
    throw createHttpError(400, "venueId is required");
  }

  if (!issueType) {
    throw createHttpError(400, "issueType is required");
  }

  if (!VALID_ISSUE_TYPES.includes(issueType)) {
    throw createHttpError(400, "Invalid issueType");
  }

  if (prayerName && !VALID_DAILY_PRAYERS.includes(prayerName)) {
    throw createHttpError(
      400,
      "prayerName must be one of: fajr, dhuhr, asr, maghrib, isha"
    );
  }

  validateTimeField(currentAzaanTime, "currentAzaanTime");
  validateTimeField(currentJamaahTime, "currentJamaahTime");
  validateTimeField(suggestedAzaanTime, "suggestedAzaanTime");
  validateTimeField(suggestedJamaahTime, "suggestedJamaahTime");
  validateTimeField(suggestedKhutbahTime, "suggestedKhutbahTime");

  const isDailyTimingIssue = ["both_times_wrong", "azaan_time_wrong", "jamaah_time_wrong"].includes(issueType);

  const isJumuahTimingIssue = issueType === "jumuah_time_wrong";

  if (isDailyTimingIssue && jumuahTimingId) {
    throw createHttpError(
      400,
      "jumuahTimingId should not be used for daily prayer timing reports"
    );
  }

  if (isJumuahTimingIssue && dailyTimingId) {
    throw createHttpError(
      400,
      "dailyTimingId should not be used for Jumu‘ah reports"
    );
  }

  if (isDailyTimingIssue && !dailyTimingId && !prayerName) {
    throw createHttpError(
      400,
      "prayerName is required when dailyTimingId is not provided"
    );
  }

  const hasUsefulInput =
    suggestedAzaanTime ||
    suggestedJamaahTime ||
    suggestedKhutbahTime ||
    userNote;

  if (!hasUsefulInput) {
    throw createHttpError(
      400,
      "Please provide a suggested time or a short note"
    );
  }

  const venue = await prisma.venue.findFirst({
    where: {
      id: venueId,
      isActive: true,
      isPublic: true,
    },
    select: {
      id: true,
    },
  });

  if (!venue) {
    throw createHttpError(404, "Public mosque not found");
  }

  let dailyTiming = null;
  let jumuahTiming = null;

  if (dailyTimingId) {
    dailyTiming = await prisma.dailyPrayerTiming.findFirst({
      where: {
        id: dailyTimingId,
        venueId,
        effectiveTo: null,
      },
      select: {
        id: true,
        prayerName: true,
        azaanTime: true,
        jamaahTime: true,
      },
    });

    if (!dailyTiming) {
      throw createHttpError(404, "Daily timing not found for this mosque");
    }
  }

  if (jumuahTimingId) {
    jumuahTiming = await prisma.jumuahTiming.findFirst({
      where: {
        id: jumuahTimingId,
        venueId,
        effectiveTo: null,
      },
      select: {
        id: true,
        azaanTime: true,
        khutbahTime: true,
        jamaahTime: true,
      },
    });

    if (!jumuahTiming) {
      throw createHttpError(404, "Jumu‘ah timing not found for this mosque");
    }
  }

  const finalPrayerName = dailyTiming?.prayerName || prayerName || null;

  const finalCurrentAzaanTime =
    currentAzaanTime ||
    dailyTiming?.azaanTime ||
    jumuahTiming?.azaanTime ||
    null;

  const finalCurrentJamaahTime =
    currentJamaahTime ||
    dailyTiming?.jamaahTime ||
    jumuahTiming?.jamaahTime ||
    null;

  const result = await prisma.$transaction(async (tx) => {
    const report = await tx.timingReport.create({
      data: {
        venueId,
        dailyTimingId: dailyTiming?.id || null,
        jumuahTimingId: jumuahTiming?.id || null,
        prayerName: finalPrayerName,
        issueType,

        currentAzaanTime: finalCurrentAzaanTime,
        currentJamaahTime: finalCurrentJamaahTime,
        suggestedAzaanTime,
        suggestedJamaahTime,
        suggestedKhutbahTime,

        userNote,
        submittedById,
        status: "pending",
      },
      select: submittedTimingReportSelect,
    });

    const [timingReportContributionCount, venueSuggestionContributionCount] =
      await Promise.all([
        tx.timingReport.count({
          where: {
            submittedById,
          },
        }),
        tx.venueSuggestion.count({
          where: {
            submittedById,
          },
        }),
      ]);

    const totalContributionCount =
      timingReportContributionCount + venueSuggestionContributionCount;

    return {
      report,
      contribution: {
        totalContributionCount,
        timingReportContributionCount,
        venueSuggestionContributionCount,
        message: getContributionMessage(totalContributionCount),
      },
    };
  });

  return result;
}