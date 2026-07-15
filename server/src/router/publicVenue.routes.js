import express from "express";
import {
  getPublicVenuesController,
  getPublicVenueByIdController,
} from "../controllers/publicVenue.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public Venue Routes
|--------------------------------------------------------------------------
| These routes are used by the mobile app/public user experience.
|
| They only expose active + public venues.
| They do not expose admin/internal data.
*/

router.get("/", getPublicVenuesController);
router.get("/:venueId", getPublicVenueByIdController);

export default router;