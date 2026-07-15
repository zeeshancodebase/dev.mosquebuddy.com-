import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";

const timingReportSelect = {
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
      isPublic: true,
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

export async function getTimingReports(query = {}) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const status = query.status || undefined;
  const issueType = query.issueType || undefined;
  const venueId = query.venueId || undefined;
  const search = query.search || undefined;

  const where = {
    ...(status && { status }),
    ...(issueType && { issueType }),
    ...(venueId && { venueId }),

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
      ],
    }),
  };

  const [reports, totalReports] = await prisma.$transaction([
    prisma.timingReport.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: timingReportSelect,
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
    },
  };
}

export async function getTimingReportById(reportId) {
  const report = await prisma.timingReport.findUnique({
    where: {
      id: reportId,
    },
    select: timingReportSelect,
  });

  if (!report) {
    throw createHttpError(404, "Timing report not found");
  }

  return report;
}

export async function updateTimingReportStatus(reportId, data, reviewedById) {
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

    let appliedTimingUpdate = null;

    if (data.status === "approved" && report.status !== "approved") {
      appliedTimingUpdate = await applyApprovedTimingReportChange({
        tx,
        report,
        reviewedById,
        reviewNote: data.reviewNote,
      });
    }

    const updatedReport = await tx.timingReport.update({
      where: {
        id: reportId,
      },
      data: {
        status: data.status,
        reviewNote: data.reviewNote || null,
        reviewedById,
        resolvedAt: data.status === "pending" ? null : new Date(),
      },
      select: timingReportSelect,
    });

    return {
      previousStatus: report.status,
      report: updatedReport,
      appliedTimingUpdate,
    };
  });

  return result;
}
async function applyApprovedTimingReportChange({
  tx,
  report,
  reviewedById,
  reviewNote,
}) {
  const sourceNote = buildApprovedReportSourceNote(report, reviewNote);

  if (report.dailyTimingId) {
    const existingDailyTiming = await tx.dailyPrayerTiming.findUnique({
      where: {
        id: report.dailyTimingId,
      },
      select: {
        id: true,
        venueId: true,
        prayerName: true,
        azaanTime: true,
        jamaahTime: true,
        timingType: true,
        relativeTimeText: true,
        verificationStatus: true,
        sourceNote: true,
      },
    });

    if (!existingDailyTiming) {
      return null;
    }

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
      return null;
    }

    updateData.verificationStatus = "community_updated";
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
      oldData: existingDailyTiming,
      newData: updateData,
      sourceNote,
    });

    return {
      timingType: "daily_prayer_timing",
      timingId: updatedTiming.id,
      updatedFields: Object.keys(updateData),
    };
  }

  if (report.jumuahTimingId) {
    const existingJumuahTiming = await tx.jumuahTiming.findUnique({
      where: {
        id: report.jumuahTimingId,
      },
      select: {
        id: true,
        venueId: true,
        slotNumber: true,
        azaanTime: true,
        khutbahTime: true,
        jamaahTime: true,
        verificationStatus: true,
        sourceNote: true,
      },
    });

    if (!existingJumuahTiming) {
      return null;
    }

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
      return null;
    }

    updateData.verificationStatus = "community_updated";
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
      oldData: existingJumuahTiming,
      newData: updateData,
      sourceNote,
    });

    return {
      timingType: "jumuah_timing",
      timingId: updatedTiming.id,
      updatedFields: Object.keys(updateData),
    };
  }

  return null;
}

function buildApprovedReportSourceNote(report, reviewNote) {
  const parts = [`Updated from approved timing report ${report.id}`];

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