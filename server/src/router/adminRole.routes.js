import express from "express";

import {
  getAdminRoles,
  assignAdminUserRole,
  removeAdminUserRole,
} from "../controllers/adminRole.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get(
  "/roles",
  authMiddleware,
  roleMiddleware("super_admin"),
  getAdminRoles
);

router.post(
  "/users/:userId/roles",
  authMiddleware,
  roleMiddleware("super_admin"),
  assignAdminUserRole
);

router.delete(
  "/users/:userId/roles/:roleName",
  authMiddleware,
  roleMiddleware("super_admin"),
  removeAdminUserRole
);

export default router;