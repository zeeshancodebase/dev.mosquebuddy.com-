import express from "express";

import {
  registerDeviceTokenController,
  deactivateDeviceTokenController,
} from "../controllers/deviceToken.controller.js";

import { optionalAuthMiddleware } from "../middlewares/optionalAuthMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Device Token Routes
|--------------------------------------------------------------------------
| MVP notification foundation only.
| This stores device tokens and permission status.
| Actual push sending can come later.
*/

router.post("/", optionalAuthMiddleware, registerDeviceTokenController);

router.patch(
  "/:deviceTokenId/deactivate",
  optionalAuthMiddleware,
  deactivateDeviceTokenController
);

export default router;