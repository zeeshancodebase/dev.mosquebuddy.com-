import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { env } from "../config/env.js";

/*
|--------------------------------------------------------------------------
| Optional Auth Middleware
|--------------------------------------------------------------------------
| Purpose:
| For routes that work for both guests and logged-in users
| (e.g. submitting feedback).
|
| Behavior:
| - If a valid Bearer token is present, verifies it and attaches req.user,
|   exactly like authMiddleware does.
| - If no token, an invalid token, or an inactive user is found,
|   it does NOT reject the request — it just leaves req.user undefined
|   and lets the request continue as anonymous.
|
| This middleware never calls next(error). It always calls next().
*/

export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return next();
    }

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
          where: { isActive: true },
          select: {
            role: { select: { name: true } },
          },
        },
      },
    });

    if (!user || user.accountStatus !== "active") {
      return next();
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
    // Invalid/expired token, etc. — treat as anonymous, don't block the request.
    return next();
  }
};