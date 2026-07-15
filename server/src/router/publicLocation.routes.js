import express from "express";
import {
  getPublicCountriesController,
  getPublicStatesController,
  getPublicCitiesController,
  getPublicAreasController,
} from "../controllers/publicLocation.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public Location Routes
|--------------------------------------------------------------------------
| These routes are used by public/mobile app flows.
|
| They are intentionally not protected because users should be able to:
| - browse locations
| - manually select city/area
| - recover from denied location permission
| - filter public mosque results
*/

router.get("/countries", getPublicCountriesController);
router.get("/states", getPublicStatesController);
router.get("/cities", getPublicCitiesController);
router.get("/areas", getPublicAreasController);

export default router;