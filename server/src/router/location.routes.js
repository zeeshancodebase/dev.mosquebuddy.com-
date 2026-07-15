import express from "express";

import {
  createCountry,
  createState,
  createCity,
  createArea,
  getCountries,
  getStates,
  getCities,
  getAreas,
} from "../controllers/location.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("super_admin"));

router.post("/countries", createCountry);
router.post("/states", createState);
router.post("/cities", createCity);
router.post("/areas", createArea);

router.get("/countries", getCountries);
router.get("/states", getStates);
router.get("/cities", getCities);
router.get("/areas", getAreas);

export default router;