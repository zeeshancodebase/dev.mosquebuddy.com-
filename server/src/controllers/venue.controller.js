import * as venueService from "../services/venue.service.js";
import { successResponse } from "../utils/apiResponse.js";
import createHttpError from "../utils/createHttpError.js";
import getValidationMessage from "../utils/getValidationMessage.js";

import {
  createVenueSchema,
  updateVenueSchema,
  updateVenueStatusSchema,
  venueQuerySchema,
} from "../validators/venue.validator.js";

export async function createVenue(req, res, next) {
  try {
    const parsed = createVenueSchema.safeParse(req.body);

    if (!parsed.success) {
      throw createHttpError(400, getValidationMessage(parsed.error));
    }

    const venue = await venueService.createVenue(parsed.data, req.user.id);

    return successResponse(res, {
      statusCode: 201,
      message: "Venue created successfully",
      data: venue,
    });
  } catch (error) {
    next(error);
  }
}

export async function getVenues(req, res, next) {
  try {
    const parsed = venueQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw createHttpError(400, getValidationMessage(parsed.error));
    }

    const result = await venueService.getVenues(parsed.data);

    return successResponse(res, {
      message: "Venues fetched successfully",
      data: result.venues,
      meta: {
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getVenueById(req, res, next) {
  try {
    const venue = await venueService.getVenueById(req.params.id);

    return successResponse(res, {
      message: "Venue fetched successfully",
      data: venue,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateVenue(req, res, next) {
  try {
    const parsed = updateVenueSchema.safeParse(req.body);

    if (!parsed.success) {
      throw createHttpError(400, getValidationMessage(parsed.error));
    }

    const venue = await venueService.updateVenue(
      req.params.id,
      parsed.data,
      req.user.id
    );

    return successResponse(res, {
      message: "Venue updated successfully",
      data: venue,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateVenueStatus(req, res, next) {
  try {
    const parsed = updateVenueStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      throw createHttpError(400, getValidationMessage(parsed.error));
    }

    const venue = await venueService.updateVenueStatus(
      req.params.id,
      parsed.data,
      req.user.id
    );


    return successResponse(res, {
      message: "Venue status updated successfully",
      data: venue,
    });
  } catch (error) {
    next(error);
  }
}


/*

sample data


{
  "name": "Masjid Al-Noor",
  "venueType": "masjid",
  "address": "BTM Layout, Bengaluru",
  "pincode": "560076",
  "latitude": 12.9165,
  "longitude": 77.6101,
  "googleMapsLink": "https://maps.google.com/?q=Masjid+Al+Noor+BTM",
  "womenPrayerSpace": "not_available",
  "wuduFacility": "available",
  "parking": "limited",
  "defaultKhutbahLanguage": "Urdu",
  "facilityNotes": "Parking may be difficult during Jumu'ah.",
  "importantNotice": "Use side entrance for wudu area.",
  "isPublic": false,
  "verificationStatus": "pending_review"
}


{
  "name": "Masjid Al-Noor",
  "venueType": "masjid",
  "countryId": "99381d5d-5d44-4a15-9f2a-fa2cb1bed686",
  "stateId": "e487e077-5d05-4c00-98f7-6558f5e51e6a",
  "cityId": "d5743098-3ef2-42f3-b94c-26302fb05334",
  "areaId": "44527aaf-f3ab-4968-b8fe-d72797b7b724",
  "address": "BTM Layout, Bengaluru",
  "pincode": "560076",
  "latitude": 12.9165,
  "longitude": 77.6101,
  "googleMapsLink": "https://maps.google.com/?q=Masjid+Al+Noor+BTM",
  "timezone": "Asia/Kolkata",
  "womenPrayerSpace": "not_available",
  "wuduFacility": "available",
  "parking": "limited",
  "defaultKhutbahLanguage": "Urdu",
  "facilityNotes": "Parking may be difficult during Jumu'ah.",
  "importantNotice": "Use side entrance for wudu area.",
  "isPublic": false,
  "verificationStatus": "pending_review"
}
  
*/