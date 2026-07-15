import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";

/*
|--------------------------------------------------------------------------
| Public Location Service
|--------------------------------------------------------------------------
| Purpose:
| Provides clean location lists for the mobile app/public experience.
|
| This supports:
| - manual location selection
| - search filters
| - location permission denied fallback
| - future public web city/area pages
*/

export async function getPublicCountries() {
  const countries = await prisma.country.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      countryCode: true,
    },
  });

  return countries.map((country) => ({
    id: country.id,
    name: country.name,
    countryCode: country.countryCode,
    label: country.name,
  }));
}

export async function getPublicStates(countryId) {
  if (!countryId) {
    throw createHttpError(400, "countryId is required");
  }

  const country = await prisma.country.findUnique({
    where: {
      id: countryId,
    },
    select: {
      id: true,
    },
  });

  if (!country) {
    throw createHttpError(404, "Country not found");
  }

  const states = await prisma.state.findMany({
    where: {
      countryId,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      countryId: true,
    },
  });

  return states.map((state) => ({
    id: state.id,
    name: state.name,
    countryId: state.countryId,
    label: state.name,
  }));
}

export async function getPublicCities(stateId) {
  if (!stateId) {
    throw createHttpError(400, "stateId is required");
  }

  const state = await prisma.state.findUnique({
    where: {
      id: stateId,
    },
    select: {
      id: true,
    },
  });

  if (!state) {
    throw createHttpError(404, "State not found");
  }

  const cities = await prisma.city.findMany({
    where: {
      stateId,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      stateId: true,
      timezone: true,
    },
  });

  return cities.map((city) => ({
    id: city.id,
    name: city.name,
    stateId: city.stateId,
    timezone: city.timezone,
    label: city.name,
  }));
}

export async function getPublicAreas(cityId) {
  if (!cityId) {
    throw createHttpError(400, "cityId is required");
  }

  const city = await prisma.city.findUnique({
    where: {
      id: cityId,
    },
    select: {
      id: true,
    },
  });

  if (!city) {
    throw createHttpError(404, "City not found");
  }

  const areas = await prisma.area.findMany({
    where: {
      cityId,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      cityId: true,
    },
  });

  return areas.map((area) => ({
    id: area.id,
    name: area.name,
    cityId: area.cityId,
    label: area.name,
  }));
}