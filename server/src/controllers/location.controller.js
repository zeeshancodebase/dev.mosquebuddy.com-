import * as locationService from "../services/location.service.js";
import { logAdminActivity } from "../utils/adminActivityLogger.js";
import createHttpError from "../utils/createHttpError.js";

export async function createCountry(req, res, next) {
  try {
    const { name, countryCode } = req.body;

    if (!name || !countryCode) {
      throw createHttpError(400, "Country name and countryCode are required");
    }

    const country = await locationService.createCountry({
      name,
      countryCode,
    });


    await logAdminActivity({
      actorId: req.user?.id,
      action: "country_created",
      entityType: "country",
      entityId: country.id,
      metadata: {
        name: country.name,
        countryCode: country.countryCode,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Country created successfully",
      data: country,
    });
  } catch (error) {
    next(error);
  }
}

export async function createState(req, res, next) {
  try {
    const { name, countryId } = req.body;

    if (!name || !countryId) {
      throw createHttpError(400, "State name and countryId are required");
    }

    const state = await locationService.createState({ name, countryId });

    await logAdminActivity({
      actorId: req.user?.id,
      action: "state_created",
      entityType: "state",
      entityId: state.id,
      metadata: {
        name: state.name,
        countryId: state.countryId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "State created successfully",
      data: state,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCity(req, res, next) {
  try {
    const { name, stateId, timezone } = req.body;

    if (!name || !stateId) {
      throw createHttpError(400, "City name and stateId are required");
    }

    const city = await locationService.createCity({ name, stateId, timezone });

    await logAdminActivity({
      actorId: req.user?.id,
      action: "city_created",
      entityType: "city",
      entityId: city.id,
      metadata: {
        name: city.name,
        stateId: city.stateId,
        timezone: city.timezone,
      },
    });

    return res.status(201).json({
      success: true,
      message: "City created successfully",
      data: city,
    });
  } catch (error) {
    next(error);
  }
}

export async function createArea(req, res, next) {
  try {
    const { name, cityId } = req.body;

    if (!name || !cityId) {
      throw createHttpError(400, "Area name and cityId are required");
    }

    const area = await locationService.createArea({ name, cityId });

    await logAdminActivity({
      actorId: req.user?.id,
      action: "area_created",
      entityType: "area",
      entityId: area.id,
      metadata: {
        name: area.name,
        cityId: area.cityId,
      },
    });


    return res.status(201).json({
      success: true,
      message: "Area created successfully",
      data: area,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCountries(req, res, next) {
  try {
    const countries = await locationService.getCountries();

    return res.json({
      success: true,
      message: "Countries fetched successfully",
      data: countries,
    });
  } catch (error) {
    next(error);
  }
}

export async function getStates(req, res, next) {
  try {
    const { countryId } = req.query;

    const states = await locationService.getStates(countryId);

    return res.json({
      success: true,
      message: "States fetched successfully",
      data: states,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCities(req, res, next) {
  try {
    const { stateId } = req.query;

    const cities = await locationService.getCities(stateId);

    return res.json({
      success: true,
      message: "Cities fetched successfully",
      data: cities,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAreas(req, res, next) {
  try {
    const { cityId } = req.query;

    const areas = await locationService.getAreas(cityId);

    return res.json({
      success: true,
      message: "Areas fetched successfully",
      data: areas,
    });
  } catch (error) {
    next(error);
  }
}