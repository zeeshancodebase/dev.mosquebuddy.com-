import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";
import cleanValue from "../utils/cleanValue.js";

/*
|--------------------------------------------------------------------------
| Venue Suggestion Service
|--------------------------------------------------------------------------
| Purpose:
| Handles registered-user suggestions for missing mosques/prayer venues.
|
| Important Sabeel rules:
| - Users may suggest missing mosques.
| - Suggestions do NOT become public automatically.
| - Super Admin / reviewer must approve, edit, reject, or mark duplicate.
| - Suggestion is linked to submittedById for future contribution history.
| - Response includes contribution count for a respectful recognition toast.
*/

const VALID_VENUE_TYPES = [
  "masjid",
  "musalla",
  "islamic_center",
  "prayer_room",
  "temporary_jumuah_venue",
  "eidgah_open_ground",
  "hall_community_venue",
  "other",
];

function toOptionalNumber(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw createHttpError(400, `${fieldName} must be a valid number`);
  }

  return number;
}

function getOrdinalSuffix(number) {
  const lastTwoDigits = number % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return "th";
  }

  const lastDigit = number % 10;

  if (lastDigit === 1) return "st";
  if (lastDigit === 2) return "nd";
  if (lastDigit === 3) return "rd";

  return "th";
}

function getContributionMessage(totalContributionCount) {
  const suffix = getOrdinalSuffix(totalContributionCount);

  return `JazakAllahu khair. This is your ${totalContributionCount}${suffix} contribution to Sabeel.`;
}

const submittedVenueSuggestionSelect = {
  id: true,
  suggestedName: true,
  venueType: true,

  address: true,
  areaText: true,
  cityText: true,
  stateText: true,
  countryText: true,
  cityId: true,  
  areaId: true, 
  pincode: true,
  googleMapsLink: true,
  latitude: true,
  longitude: true,
  phone: true,

  optionalTimingNote: true,
  userNote: true,

  status: true,
  submittedById: true,
  createdAt: true,
  updatedAt: true,
};

export async function submitVenueSuggestion(body = {}, submittedById) {
  if (!submittedById) {
    throw createHttpError(401, "Login is required to suggest a mosque");
  }

  const suggestedName = cleanValue(body.suggestedName);
  const venueType = cleanValue(body.venueType);

  const address = cleanValue(body.address);
  const areaText = cleanValue(body.areaText);
  const cityText = cleanValue(body.cityText);
  const stateText = cleanValue(body.stateText);
  const countryText = cleanValue(body.countryText);
   const cityId = cleanValue(body.cityId);  
  const areaId = cleanValue(body.areaId);
  const pincode = cleanValue(body.pincode);
  const googleMapsLink = cleanValue(body.googleMapsLink);
  const phone = cleanValue(body.phone);

  const optionalTimingNote = cleanValue(body.optionalTimingNote);
  const userNote = cleanValue(body.userNote);

  const latitude = toOptionalNumber(body.latitude, "latitude");
  const longitude = toOptionalNumber(body.longitude, "longitude");

  if (!suggestedName) {
    throw createHttpError(400, "Mosque name is required");
  }

  if (suggestedName.length < 2) {
    throw createHttpError(400, "Mosque name is too short");
  }

  if (venueType && !VALID_VENUE_TYPES.includes(venueType)) {
    throw createHttpError(400, "Invalid venueType");
  }

  if (
    (latitude !== null && longitude === null) ||
    (longitude !== null && latitude === null)
  ) {
    throw createHttpError(
      400,
      "Both latitude and longitude are required when using coordinates"
    );
  }

  const hasLocationClue =
    address ||
    areaText ||
    cityText ||
    pincode ||
    googleMapsLink ||
    (latitude !== null && longitude !== null);

  if (!hasLocationClue) {
    throw createHttpError(
      400,
      "Please provide at least one location detail such as area, city, address, pincode, map link, or coordinates"
    );
  }

   if (cityId) {
    const city = await prisma.city.findUnique({
      where: { id: cityId },
      select: { id: true },
    });
    if (!city) {
      throw createHttpError(400, "Selected city was not found");
    }
  }

  if (areaId) {
    const area = await prisma.area.findUnique({
      where: { id: areaId },
      select: { id: true, cityId: true },
    });
    if (!area) {
      throw createHttpError(400, "Selected area was not found");
    }
    if (cityId && area.cityId !== cityId) {
      throw createHttpError(400, "Selected area does not belong to the selected city");
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const suggestion = await tx.venueSuggestion.create({
      data: {
        suggestedName,
        venueType: venueType || null,

        address,
        areaText,
        cityText,
        stateText,
        countryText,
        cityId: cityId || null,  
        areaId: areaId || null,  
        pincode,
        googleMapsLink,
        latitude,
        longitude,
        phone,

        optionalTimingNote,
        userNote,

        submittedById,
        status: "pending",
      },
      select: submittedVenueSuggestionSelect,
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
      suggestion,
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