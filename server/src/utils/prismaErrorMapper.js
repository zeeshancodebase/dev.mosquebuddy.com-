// server/src/utils/prismaErrorMapper.js

import { Prisma } from "@prisma/client";

/*
Maps any Prisma error into a safe { statusCode, message } pair for the client.
Raw query/data/connection detail is only returned in logMeta, for server-side logging.
*/
const KNOWN_CODE_MESSAGES = {
  P2002: { statusCode: 409, message: "A record with this value already exists." },
  P2003: { statusCode: 400, message: "This action references data that doesn't exist." },
  P2025: { statusCode: 404, message: "The requested record was not found." },
  P2011: { statusCode: 400, message: "A required field is missing." },
  P2000: { statusCode: 400, message: "One of the provided values is too long." },
};

export const mapPrismaError = (err) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const known = KNOWN_CODE_MESSAGES[err.code];
    return {
      statusCode: known?.statusCode ?? 400,
      message: known?.message ?? "The request could not be processed due to invalid data.",
      logMeta: { prismaCode: err.code, meta: err.meta },
    };
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return {
      statusCode: 400,
      message: "Invalid request data. Please check the values you submitted.",
      logMeta: { type: "PrismaClientValidationError" },
    };
  }

  if (
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientRustPanicError
  ) {
    return {
      statusCode: 503,
      message: "Service is temporarily unavailable. Please try again in a moment.",
      logMeta: { type: err.constructor.name, critical: true },
    };
  }

  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    return {
      statusCode: 500,
      message: "Something went wrong while processing your request.",
      logMeta: { type: "PrismaClientUnknownRequestError" },
    };
  }

  return null; // not a Prisma error
};