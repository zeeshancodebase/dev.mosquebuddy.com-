import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";

export async function createCountry({ name, countryCode }) {
  const cleanName = name.trim();
  const cleanCountryCode = countryCode.trim().toUpperCase();

  const existingCountry = await prisma.country.findFirst({
    where: {
      OR: [
        {
          name: {
            equals: cleanName,
            mode: "insensitive",
          },
        },
        {
          countryCode: {
            equals: cleanCountryCode,
            mode: "insensitive",
          },
        },
      ],
    },
  });

  if (existingCountry) {
    throw createHttpError(409, "Country already exists");
  }

  return prisma.country.create({
    data: {
      name: cleanName,
      countryCode: cleanCountryCode,
    },
  });
}

export async function createState({ name, countryId }) {
  const country = await prisma.country.findUnique({
    where: { id: countryId },
  });

  if (!country) {
    throw createHttpError(404, "Country not found");
  }

  const existingState = await prisma.state.findFirst({
    where: {
      countryId,
      name: {
        equals: name.trim(),
        mode: "insensitive",
      },
    },
  });

  if (existingState) {
    throw createHttpError(409, "State already exists in this country");
  }

  return prisma.state.create({
    data: {
      name: name.trim(),
      countryId,
    },
  });
}

export async function createCity({ name, stateId, timezone }) {
  const state = await prisma.state.findUnique({
    where: { id: stateId },
  });

  if (!state) {
    throw createHttpError(404, "State not found");
  }

  const existingCity = await prisma.city.findFirst({
    where: {
      stateId,
      name: {
        equals: name.trim(),
        mode: "insensitive",
      },
    },
  });

  if (existingCity) {
    throw createHttpError(409, "City already exists in this state");
  }

  return prisma.city.create({
  data: {
    name: name.trim(),
    stateId,
    timezone: timezone?.trim() || null,
  },
});
}

export async function createArea({ name, cityId }) {
  const city = await prisma.city.findUnique({
    where: { id: cityId },
  });

  if (!city) {
    throw createHttpError(404, "City not found");
  }

  const existingArea = await prisma.area.findFirst({
    where: {
      cityId,
      name: {
        equals: name.trim(),
        mode: "insensitive",
      },
    },
  });

  if (existingArea) {
    throw createHttpError(409, "Area already exists in this city");
  }

  return prisma.area.create({
    data: {
      name: name.trim(),
      cityId,
    },
  });
}

export async function getCountries() {
  return prisma.country.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function getStates(countryId) {
  const where = {};

  if (countryId) {
    where.countryId = countryId;
  }

  return prisma.state.findMany({
    where,
    orderBy: {
      name: "asc",
    },
    include: {
      country: true,
    },
  });
}

export async function getCities(stateId) {
  const where = {};

  if (stateId) {
    where.stateId = stateId;
  }

  return prisma.city.findMany({
    where,
    orderBy: {
      name: "asc",
    },
    include: {
      state: true,
    },
  });
}

export async function getAreas(cityId) {
  const where = {};

  if (cityId) {
    where.cityId = cityId;
  }

  return prisma.area.findMany({
    where,
    orderBy: {
      name: "asc",
    },
    include: {
      city: true,
    },
  });
}