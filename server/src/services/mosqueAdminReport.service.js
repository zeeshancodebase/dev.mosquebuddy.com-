import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";
import cleanValue from "../utils/cleanValue.js";
import { logAdminActivity } from "../utils/adminActivityLogger.js";

/*
|--------------------------------------------------------------------------
| Mosque Admin Report Service
|--------------------------------------------------------------------------
| Purpose:
| Allows mosque admins to review reports only for assigned mosques.
|
| Product rules:
| - Requires active venue_admin_assignment.
| - Requires canReviewReports.
| - Approving daily timing report requires canEditDailyTimings.
| - Approving Jumu‘ah timing report requires canEditJumuahTimings.
| - Mosque admin cannot review reports for other mosques.
| - Public timing updates are controlled by assignment trust permissions.
*/

const ALLOWED_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "needs_more_info",
];

function toPositiveInt(value, fallback) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return fallback;
  }

  return number;
}

function getTrustUpdateData(assignment) {
  if (assignment.canMarkVerified) {
    return {
      verificationStatus: "verified",
      lastVerifiedAt: new Date(),
    };
  }

  return {
    verificationStatus: "community_updated",
  };
}

function buildApprovedReportSourceNote(report, reviewNote) {
  const parts = [`Updated from mosque-admin approved report ${report.id}`];

  if (report.issueType) {
    parts.push(`Issue: ${report.issueType}`);
  }

  if (reviewNote) {
    parts.push(`Review note: ${reviewNote}`);
  }

  if (report.userNote) {
    parts.push(`User note: ${report.userNote}`);
  }

  return parts.join(" | ");
}

function stringifyHistoryValue(value) {
  if (value === undefined || value === null) return null;

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

async function createTimingReportUpdateHistory({
  tx,
  entityType,
  entityId,
  venueId,
  dailyTimingId = null,
  jumuahTimingId = null,
  changedById,
  oldData = {},
  newData = {},
  sourceNote,
}) {
  const ignoredFields = ["updatedById", "sourceNote"];
  const historyRows = [];

  for (const fieldName of Object.keys(newData)) {
    if (ignoredFields.includes(fieldName)) continue;

    const oldValue = stringifyHistoryValue(oldData[fieldName]);
    const newValue = stringifyHistoryValue(newData[fieldName]);

    if (oldValue === newValue) continue;

    historyRows.push({
      entityType,
      entityId,
      venueId,
      dailyTimingId,
      jumuahTimingId,
      fieldName,
      oldValue,
      newValue,
      changedById,
      sourceNote: sourceNote || null,
    });
  }

  if (historyRows.length > 0) {
    await tx.updateHistory.createMany({
      data: historyRows,
    });
  }
}

const mosqueAdminReportSelect = {
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
  reviewNote: true,
  resolvedAt: true,

  createdAt: true,
  updatedAt: true,

  venue: {
    select: {
      id: true,
      name: true,
      venueType: true,
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

  dailyTiming: {
    select: {
      id: true,
      prayerName: true,
      azaanTime: true,
      jamaahTime: true,
      timingType: true,
      relativeTimeText: true,
      verificationStatus: true,
      lastVerifiedAt: true,
    },
  },

  jumuahTiming: {
    select: {
      id: true,
      slotNumber: true,
      azaanTime: true,
      khutbahTime: true,
      jamaahTime: true,
      khutbahLanguage: true,
      womenPrayerSpace: true,
      verificationStatus: true,
      lastVerifiedAt: true,
    },
  },

  submittedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },

  reviewedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },

  attachments: {
    select: {
      id: true,
      fileUrl: true,
      fileName: true,
      fileType: true,
      fileSize: true,
      purpose: true,
      createdAt: true,
    },
  },
};

async function getReviewableAssignments(userId) {
  return prisma.venueAdminAssignment.findMany({
    where: {
      userId,
      isActive: true,
      canReviewReports: true,
    },
    select: {
      venueId: true,
      canEditDailyTimings: true,
      canEditJumuahTimings: true,
      canMarkVerified: true,
    },
  });
}

async function getAssignmentForReport(userId, venueId) {
  const assignment = await prisma.venueAdminAssignment.findFirst({
    where: {
      userId,
      venueId,
      isActive: true,
      canReviewReports: true,
    },
    select: {
      id: true,
      venueId: true,
      canEditDailyTimings: true,
      canEditJumuahTimings: true,
      canMarkVerified: true,
    },
  });

  if (!assignment) {
    throw createHttpError(
      403,
      "You do not have permission to review reports for this mosque"
    );
  }

  return assignment;
}

export async function getMosqueAdminReports(userId, query = {}) {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, 20), 50);
  const skip = (page - 1) * limit;

  const status = cleanValue(query.status);
  const issueType = cleanValue(query.issueType);
  const venueId = cleanValue(query.venueId);
  const search = cleanValue(query.search);

  if (status && !ALLOWED_STATUSES.includes(status)) {
    throw createHttpError(400, "Invalid report status");
  }

  const assignments = await getReviewableAssignments(userId);
  const allowedVenueIds = assignments.map((assignment) => assignment.venueId);

  if (allowedVenueIds.length === 0) {
    return {
      reports: [],
      pagination: {
        page,
        limit,
        totalReports: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  if (venueId && !allowedVenueIds.includes(venueId)) {
    throw createHttpError(
      403,
      "You do not have permission to review reports for this mosque"
    );
  }

  const where = {
    venueId: venueId || {
      in: allowedVenueIds,
    },

    ...(status && { status }),
    ...(issueType && { issueType }),

    ...(search && {
      OR: [
        {
          venue: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          userNote: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          submittedBy: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ],
    }),
  };

  const [reports, totalReports] = await prisma.$transaction([
    prisma.timingReport.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        {
          status: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
      select: mosqueAdminReportSelect,
    }),

    prisma.timingReport.count({
      where,
    }),
  ]);

  return {
    reports,
    pagination: {
      page,
      limit,
      totalReports,
      totalPages: Math.ceil(totalReports / limit),
      hasNextPage: page * limit < totalReports,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getMosqueAdminReportById(userId, reportId) {
  const report = await prisma.timingReport.findUnique({
    where: {
      id: reportId,
    },
    select: mosqueAdminReportSelect,
  });

  if (!report) {
    throw createHttpError(404, "Timing report not found");
  }

  await getAssignmentForReport(userId, report.venueId);

  return report;
}

async function applyApprovedReportChange({ tx, report, assignment, reviewedById, reviewNote }) {
  const sourceNote = buildApprovedReportSourceNote(report, reviewNote);
  const trustData = getTrustUpdateData(assignment);

  if (report.dailyTimingId) {
    if (!assignment.canEditDailyTimings) {
      throw createHttpError(
        403,
        "You do not have permission to approve daily timing changes for this mosque"
      );
    }

    const existingDailyTiming = await tx.dailyPrayerTiming.findUnique({
      where: {
        id: report.dailyTimingId,
      },
      select: {
        id: true,
        azaanTime: true,
        jamaahTime: true,
        timingType: true,
        relativeTimeText: true,
        verificationStatus: true,
      },
    });

    const updateData = {};

    if (report.suggestedAzaanTime) {
      updateData.azaanTime = report.suggestedAzaanTime;
    }

    if (report.suggestedJamaahTime) {
      updateData.jamaahTime = report.suggestedJamaahTime;
      updateData.timingType = "fixed";
      updateData.relativeTimeText = null;
    }

    if (Object.keys(updateData).length === 0) {
      throw createHttpError(
        400,
        "This report does not contain timing changes to approve"
      );
    }

    updateData.verificationStatus = trustData.verificationStatus;
    if (trustData.lastVerifiedAt) {
      updateData.lastVerifiedAt = trustData.lastVerifiedAt;
    }
    updateData.updatedById = reviewedById;
    updateData.sourceNote = sourceNote;

    const updatedTiming = await tx.dailyPrayerTiming.update({
      where: {
        id: report.dailyTimingId,
      },
      data: updateData,
      select: {
        id: true,
        prayerName: true,
        azaanTime: true,
        jamaahTime: true,
        verificationStatus: true,
      },
    });

    await createTimingReportUpdateHistory({
      tx,
      entityType: "daily_prayer_timing",
      entityId: updatedTiming.id,
      venueId: report.venueId,
      dailyTimingId: updatedTiming.id,
      changedById: reviewedById,
      oldData: existingDailyTiming || {},
      newData: updateData,
      sourceNote,
    });

    return {
      timingType: "daily_prayer_timing",
      timingId: updatedTiming.id,
      updatedFields: Object.keys(updateData),
      verificationStatus: updatedTiming.verificationStatus,
    };
  }

  if (report.jumuahTimingId) {
    if (!assignment.canEditJumuahTimings) {
      throw createHttpError(
        403,
        "You do not have permission to approve Jumu‘ah timing changes for this mosque"
      );
    }

    const existingJumuahTiming = await tx.jumuahTiming.findUnique({
      where: {
        id: report.jumuahTimingId,
      },
      select: {
        id: true,
        azaanTime: true,
        khutbahTime: true,
        jamaahTime: true,
        verificationStatus: true,
      },
    });

    const updateData = {};

    if (report.suggestedAzaanTime) {
      updateData.azaanTime = report.suggestedAzaanTime;
    }

    if (report.suggestedKhutbahTime) {
      updateData.khutbahTime = report.suggestedKhutbahTime;
    }

    if (report.suggestedJamaahTime) {
      updateData.jamaahTime = report.suggestedJamaahTime;
    }

    if (Object.keys(updateData).length === 0) {
      throw createHttpError(
        400,
        "This report does not contain timing changes to approve"
      );
    }

    updateData.verificationStatus = trustData.verificationStatus;
    if (trustData.lastVerifiedAt) {
      updateData.lastVerifiedAt = trustData.lastVerifiedAt;
    }
    updateData.updatedById = reviewedById;
    updateData.sourceNote = sourceNote;

    const updatedTiming = await tx.jumuahTiming.update({
      where: {
        id: report.jumuahTimingId,
      },
      data: updateData,
      select: {
        id: true,
        slotNumber: true,
        azaanTime: true,
        khutbahTime: true,
        jamaahTime: true,
        verificationStatus: true,
      },
    });

    await createTimingReportUpdateHistory({
      tx,
      entityType: "jumuah_timing",
      entityId: updatedTiming.id,
      venueId: report.venueId,
      jumuahTimingId: updatedTiming.id,
      changedById: reviewedById,
      oldData: existingJumuahTiming || {},
      newData: updateData,
      sourceNote,
    });

    return {
      timingType: "jumuah_timing",
      timingId: updatedTiming.id,
      updatedFields: Object.keys(updateData),
      verificationStatus: updatedTiming.verificationStatus,
    };
  }

  return null;
}

export async function updateMosqueAdminReportStatus(
  userId,
  reportId,
  data = {}
) {
  const status = cleanValue(data.status);
  const reviewNote = cleanValue(data.reviewNote);

  if (!status) {
    throw createHttpError(400, "status is required");
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    throw createHttpError(400, "Invalid report status");
  }

  const result = await prisma.$transaction(async (tx) => {
    const report = await tx.timingReport.findUnique({
      where: {
        id: reportId,
      },
      select: {
        id: true,
        status: true,
        venueId: true,
        dailyTimingId: true,
        jumuahTimingId: true,
        prayerName: true,
        issueType: true,
        suggestedAzaanTime: true,
        suggestedJamaahTime: true,
        suggestedKhutbahTime: true,
        userNote: true,
      },
    });

    if (!report) {
      throw createHttpError(404, "Timing report not found");
    }

    const assignment = await tx.venueAdminAssignment.findFirst({
      where: {
        userId,
        venueId: report.venueId,
        isActive: true,
        canReviewReports: true,
      },
      select: {
        id: true,
        venueId: true,
        canEditDailyTimings: true,
        canEditJumuahTimings: true,
        canMarkVerified: true,
      },
    });

    if (!assignment) {
      throw createHttpError(
        403,
        "You do not have permission to review reports for this mosque"
      );
    }

    let appliedTimingUpdate = null;

    if (status === "approved" && report.status !== "approved") {
      appliedTimingUpdate = await applyApprovedReportChange({
        tx,
        report,
        assignment,
        reviewedById: userId,
        reviewNote,
      });
    }

    const updatedReport = await tx.timingReport.update({
      where: {
        id: reportId,
      },
      data: {
        status,
        reviewNote: reviewNote || null,
        reviewedById: userId,
        resolvedAt: status === "pending" ? null : new Date(),
      },
      select: mosqueAdminReportSelect,
    });

    return {
      previousStatus: report.status,
      report: updatedReport,
      appliedTimingUpdate,
    };
  });

  await logAdminActivity({
    actorId: userId,
    action: "mosque_admin_timing_report_reviewed",
    entityType: "timing_report",
    entityId: result.report.id,
    venueId: result.report.venueId,
    metadata: {
      previousStatus: result.previousStatus,
      newStatus: result.report.status,
      issueType: result.report.issueType,
      prayerName: result.report.prayerName,
      reviewNote: result.report.reviewNote,
      appliedTimingUpdate: result.appliedTimingUpdate,
    },
  });

  return result;
}