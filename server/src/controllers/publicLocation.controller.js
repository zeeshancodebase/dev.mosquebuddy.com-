import {
  getPublicCountries,
  getPublicStates,
  getPublicCities,
  getPublicAreas,
} from "../services/publicLocation.service.js";

/*
|--------------------------------------------------------------------------
| Public Location Controller
|--------------------------------------------------------------------------
| Purpose:
| Handles public/mobile location selection APIs.
|
| These endpoints support:
| - manual location selection
| - location permission denied fallback
| - venue filters
| - future city/area based discovery
*/

/*
|--------------------------------------------------------------------------
| Get Countries
|--------------------------------------------------------------------------
*/
export const getPublicCountriesController = async (req, res, next) => {
  try {
    const countries = await getPublicCountries();

    return res.status(200).json({
      success: true,
      message: "Countries fetched successfully",
      data: countries,
    });
  } catch (error) {
    return next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get States By Country
|--------------------------------------------------------------------------
*/
export const getPublicStatesController = async (req, res, next) => {
  try {
    const { countryId } = req.query;

    const states = await getPublicStates(countryId);

    return res.status(200).json({
      success: true,
      message: "States fetched successfully",
      data: states,
    });
  } catch (error) {
    return next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get Cities By State
|--------------------------------------------------------------------------
*/
export const getPublicCitiesController = async (req, res, next) => {
  try {
    const { stateId } = req.query;

    const cities = await getPublicCities(stateId);

    return res.status(200).json({
      success: true,
      message: "Cities fetched successfully",
      data: cities,
    });
  } catch (error) {
    return next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get Areas By City
|--------------------------------------------------------------------------
*/
export const getPublicAreasController = async (req, res, next) => {
  try {
    const { cityId } = req.query;

    const areas = await getPublicAreas(cityId);

    return res.status(200).json({
      success: true,
      message: "Areas fetched successfully",
      data: areas,
    });
  } catch (error) {
    return next(error);
  }
};