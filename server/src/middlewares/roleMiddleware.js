/*
|--------------------------------------------------------------------------
| Role Middleware
|--------------------------------------------------------------------------
| Allows route access only if logged-in user has one of the allowed roles.
|
| Example:
| router.get("/users", authMiddleware, roleMiddleware("super_admin"), getUsers)
*/
import createHttpError from "../utils/createHttpError.js";


export const roleMiddleware = (...allowedRoles) => {
return (req, res, next) => {
  if (!req.user) {
    return next(createHttpError(401, "Authentication required"));
  }

  const hasAllowedRole = req.user.roles.some((role) =>
    allowedRoles.includes(role)
  );

  if (!hasAllowedRole) {
    return next(
      createHttpError(
        403,
        "You do not have permission to access this resource"
      )
    );
  }

  return next();
};
};