import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";
import cleanValue from "../utils/cleanValue.js";

/*
|--------------------------------------------------------------------------
| Admin Venue Suggestion Service
|--------------------------------------------------------------------------
| Purpose:
| Allows Super Admin to review missing mosque/prayer venue suggestions.
|
| Product rule:
| User suggestions do NOT automatically become public venues.
| Admin should review, create/merge venue if needed, then mark suggestion status.
*/

const ALLOWED_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "duplicate",
  "needs_more_info",
];

function toPositiveInt(value, fallback) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return fallback;
  }

  return number;
}

const venueSuggestionSelect = {
  id: true,
  suggestedName: true,
  venueType: true,

  address: true,
  areaText: true,
  cityText: true,
  stateText: true,
  countryText: true,
  pincode: true,
  googleMapsLink: true,
  latitude: true,
  longitude: true,
  phone: true,

  optionalTimingNote: true,
  userNote: true,

  status: true,
  reviewNote: true,
  resolvedAt: true,

  submittedById: true,
  reviewedById: true,
  approvedVenueId: true,

  createdAt: true,
  updatedAt: true,

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

  approvedVenue: {
    select: {
      id: true,
      name: true,
      venueType: true,
      isPublic: true,
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

export async function getVenueSuggestions(query = {}) {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, 20), 50);
  const skip = (page - 1) * limit;

  const status = cleanValue(query.status);
  const venueType = cleanValue(query.venueType);
  const search = cleanValue(query.search);

  if (status && !ALLOWED_STATUSES.includes(status)) {
    throw createHttpError(400, "Invalid suggestion status");
  }

  const where = {
    ...(status && { status }),
    ...(venueType && { venueType }),

    ...(search && {
      OR: [
        {
          suggestedName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          areaText: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          cityText: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          stateText: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          countryText: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          pincode: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          userNote: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          optionalTimingNote: {
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

  const [suggestions, totalSuggestions] = await prisma.$transaction([
    prisma.venueSuggestion.findMany({
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
      select: venueSuggestionSelect,
    }),

    prisma.venueSuggestion.count({
      where,
    }),
  ]);

  return {
    suggestions,
    pagination: {
      page,
      limit,
      totalSuggestions,
      totalPages: Math.ceil(totalSuggestions / limit),
      hasNextPage: page * limit < totalSuggestions,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getVenueSuggestionById(suggestionId) {
  const suggestion = await prisma.venueSuggestion.findUnique({
    where: {
      id: suggestionId,
    },
    select: venueSuggestionSelect,
  });

  if (!suggestion) {
    throw createHttpError(404, "Venue suggestion not found");
  }

  return suggestion;
}

export async function updateVenueSuggestionStatus(
  suggestionId,
  data = {},
  reviewedById
) {
  const status = cleanValue(data.status);
  const reviewNote = cleanValue(data.reviewNote);
  const approvedVenueId = cleanValue(data.approvedVenueId);

  if (!status) {
    throw createHttpError(400, "status is required");
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    throw createHttpError(400, "Invalid suggestion status");
  }

  // MVP: approvedVenueId made optional for now.
  // When a proper "Create Venue from Suggestion" flow is built,
  // uncomment this to enforce the venue link on approval.
  // if (status === "approved" && !approvedVenueId) {
  //   throw createHttpError(
  //     400,
  //     "approvedVenueId is required when approving a venue suggestion"
  //   );
  // }

  if (!reviewedById) {
    throw createHttpError(401, "Reviewer is required");
  }

  const result = await prisma.$transaction(async (tx) => {
    const existingSuggestion = await tx.venueSuggestion.findUnique({
      where: {
        id: suggestionId,
      },
      select: {
        id: true,
        status: true,
        suggestedName: true,
        submittedById: true,
        approvedVenueId: true,
      },
    });

    if (!existingSuggestion) {
      throw createHttpError(404, "Venue suggestion not found");
    }

    let finalApprovedVenueId = null;

    if (status === "approved" || status === "duplicate") {
      finalApprovedVenueId =
        approvedVenueId || existingSuggestion.approvedVenueId || null;

      //      // MVP: venue link not required on approval.
      // // Uncomment when "Create Venue from Suggestion" flow is implemented.
      //       if (status === "approved" && !finalApprovedVenueId) {
      //       throw createHttpError(
      //         400,
      //         "approvedVenueId is required when approving a venue suggestion"
      //       );
      //     }

      if (finalApprovedVenueId) {
        const venue = await tx.venue.findUnique({
          where: {
            id: finalApprovedVenueId,
          },
          select: {
            id: true,
          },
        });

        if (!venue) {
          throw createHttpError(404, "Approved/duplicate venue not found");
        }
      }
    }

    const updatedSuggestion = await tx.venueSuggestion.update({
      where: {
        id: suggestionId,
      },
      data: {
        status,
        reviewNote: reviewNote || null,
        reviewedById,
        approvedVenueId: finalApprovedVenueId,
        resolvedAt: status === "pending" ? null : new Date(),
      },
      select: venueSuggestionSelect,
    });

    return {
      previousStatus: existingSuggestion.status,
      suggestion: updatedSuggestion,
    };
  });

  return result;
}