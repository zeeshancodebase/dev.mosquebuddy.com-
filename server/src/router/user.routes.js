import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deactivateUser,
  deleteUserPermanently,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Temporary User Routes
|--------------------------------------------------------------------------
| Now that auth exists:
| - Public user registration should use /api/auth/register
| - User management should be Super Admin only
*/

router.post("/", authMiddleware, roleMiddleware("super_admin"), createUser);
router.get("/", authMiddleware, roleMiddleware("super_admin"), getUsers);
router.get("/:userId", authMiddleware, roleMiddleware("super_admin"), getUserById);
router.patch("/:userId", authMiddleware, roleMiddleware("super_admin"), updateUser);
router.delete("/:userId", authMiddleware, roleMiddleware("super_admin"), deactivateUser);

router.delete(
  "/:userId/permanent",
  authMiddleware,
  roleMiddleware("super_admin"),
  deleteUserPermanently
);

export default router;


// import express from "express";
// import {
//   createUser,
//   getUsers,
//   getUserById,
//   updateUser,
//   deactivateUser,
// } from "../controllers/user.controller.js";

// const router = express.Router();

// router.post("/", createUser);
// router.get("/", getUsers);
// router.get("/:userId", getUserById);
// router.patch("/:userId", updateUser);
// router.delete("/:userId", deactivateUser);

// export default router;