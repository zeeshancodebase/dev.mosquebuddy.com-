import {
  getPublicVenues,
  getPublicVenueById,
} from "../services/publicVenue.service.js";

/*
|--------------------------------------------------------------------------
| Get Public Venues
|--------------------------------------------------------------------------
| Purpose:
| Public/mobile endpoint for mosque discovery.
|
| This is not an admin CRUD endpoint.
| It only returns active + public venues in a mobile-friendly response shape.
|
| Supported query params:
| - page
| - limit
| - search
| - countryId
| - stateId
| - cityId
| - areaId
| - venueType
| - womenPrayerSpace
*/
export const getPublicVenuesController = async (req, res, next) => {
  try {
    const result = await getPublicVenues(req.query);

    return res.status(200).json({
      success: true,
      message: "Public mosques fetched successfully",
      pagination: result.pagination,
      meta: result.meta,
      data: result.venues,
    });
  } catch (error) {
    return next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get Public Venue By ID
|--------------------------------------------------------------------------
| Purpose:
| Public/mobile endpoint for mosque detail page.
|
| This returns one public venue with:
| - location
| - facilities
| - trust status
| - daily timings
| - Jumu‘ah timings
*/
export const getPublicVenueByIdController = async (req, res, next) => {
  try {
    const { venueId } = req.params;

    const venue = await getPublicVenueById(venueId);

    return res.status(200).json({
      success: true,
      message: "Public mosque fetched successfully",
      data: venue,
    });
  } catch (error) {
    return next(error);
  }
};