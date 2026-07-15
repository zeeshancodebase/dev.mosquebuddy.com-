import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { env } from "../config/env.js";
import createHttpError from "../utils/createHttpError.js";

/*
|--------------------------------------------------------------------------
| Auth Middleware
|--------------------------------------------------------------------------
| Checks if request has a valid JWT token.
| If valid, attaches the logged-in user to req.user.
*/
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(createHttpError(401, "Authentication token missing"));
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, env.jwtSecret);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        accountStatus: true,
        userRoles: {
          where: {
            isActive: true,
          },
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return next(createHttpError(401, "Invalid authentication token"));
    }

    if (user.accountStatus !== "active") {
      return next(createHttpError(403, "Your account is not active"));
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roles: user.userRoles.map((userRole) => userRole.role.name),
    };

    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(createHttpError(401, "Invalid authentication token"));
    }

    if (error.name === "TokenExpiredError") {
      return next(createHttpError(401, "Authentication token expired"));
    }

    return next(error);
  }
};