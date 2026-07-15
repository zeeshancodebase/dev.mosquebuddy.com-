import prisma from "../config/prisma.js";

const THIRTY_DAYS_AGO = () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date;
};

const NINETY_DAYS_AGO = () => {
  const date = new Date();
  date.setDate(date.getDate() - 90);
  return date;
};

export const getAdminDashboardSummaryService = async () => {
  const thirtyDaysAgo = THIRTY_DAYS_AGO();
  const ninetyDaysAgo = NINETY_DAYS_AGO();

  const [
    totalVenues,
    publicVenues,
    activeVenues,
    pendingReviewVenues,
    needsUpdateVenues,
    pendingReports,
    pendingSuggestions,
    totalUsers,

    verifiedVenues,
    communityUpdatedVenues,

    dailyTimingsNeedsUpdate,
    jumuahTimingsNeedsUpdate,

    venuesWithoutDailyTimings,
    venuesWithoutJumuahTimings,

    staleDailyTimings,
    staleJumuahTimings,

    countries,
    states,
    cities,
    areas,

    recentActivity,
  ] = await Promise.all([
    prisma.venue.count(),

    prisma.venue.count({
      where: {
        isPublic: true,
      },
    }),

    prisma.venue.count({
      where: {
        isActive: true,
      },
    }),

    prisma.venue.count({
      where: {
        verificationStatus: "pending_review",
      },
    }),

    prisma.venue.count({
      where: {
        verificationStatus: "needs_update",
      },
    }),

    prisma.timingReport.count({
      where: {
        status: "pending",
      },
    }),

    prisma.venueSuggestion.count({
      where: {
        status: "pending",
      },
    }),

    prisma.user.count({
      where: {
        accountStatus: "active",
      },
    }),

    prisma.venue.count({
      where: {
        verificationStatus: "verified",
      },
    }),

    prisma.venue.count({
      where: {
        verificationStatus: "community_updated",
      },
    }),

    prisma.dailyPrayerTiming.count({
      where: {
        verificationStatus: "needs_update",
      },
    }),

    prisma.jumuahTiming.count({
      where: {
        verificationStatus: "needs_update",
      },
    }),

    prisma.venue.count({
      where: {
        isActive: true,
        dailyPrayerTimings: {
          none: {},
        },
      },
    }),

    prisma.venue.count({
      where: {
        isActive: true,
        jumuahTimings: {
          none: {},
        },
      },
    }),

    prisma.dailyPrayerTiming.count({
      where: {
        OR: [
          {
            lastVerifiedAt: null,
          },
          {
            lastVerifiedAt: {
              lt: thirtyDaysAgo,
            },
          },
        ],
      },
    }),

    prisma.jumuahTiming.count({
      where: {
        OR: [
          {
            lastVerifiedAt: null,
          },
          {
            lastVerifiedAt: {
              lt: ninetyDaysAgo,
            },
          },
        ],
      },
    }),

    prisma.country.count(),
    prisma.state.count(),
    prisma.city.count(),
    prisma.area.count(),

    prisma.adminActivityLog.findMany({
      take: 8,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
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
      },
    }),
  ]);

  const needsUpdate =
    needsUpdateVenues + dailyTimingsNeedsUpdate + jumuahTimingsNeedsUpdate;

  return {
    stats: {
      totalVenues,
      publicVenues,
      activeVenues,
      pendingReview: pendingReviewVenues,
      needsUpdate,
      pendingReports,
      pendingSuggestions,
      totalUsers,
    },

    dataQuality: {
      verified: verifiedVenues,
      communityUpdated: communityUpdatedVenues,
      needsUpdate: needsUpdateVenues,
      pendingReview: pendingReviewVenues,
    },

    timingHealth: {
      dailyTimingsNeedsUpdate,
      jumuahTimingsNeedsUpdate,
      venuesWithoutDailyTimings,
      venuesWithoutJumuahTimings,
      staleDailyTimings,
      staleJumuahTimings,
    },

    coverage: {
      countries,
      states,
      cities,
      areas,
      activeVenues,
      publicVenues,
      privateVenues: Math.max(totalVenues - publicVenues, 0),
    },

    recentActivity: recentActivity.map((item) => ({
      id: item.id,
      action: item.action,
      entityType: item.entityType,
      entityId: item.entityId,
      metadata: item.metadata,
      createdAt: item.createdAt,
      actor: item.actor,
      venue: item.venue
        ? {
          id: item.venue.id,
          name: item.venue.name,
          areaName: item.venue.area?.name || null,
          cityName: item.venue.city?.name || null,
        }
        : null,
    })),
  };
};