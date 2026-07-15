import express from "express";
import { getPublicJumuahSlotsController } from "../controllers/publicJumuah.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public Jumu‘ah Routes
|--------------------------------------------------------------------------
| Used by the public/mobile Jumu‘ah screen.
|
| Example:
|// GET /api/public/jumuah?latitude=12.9716&longitude=77.5946&radiusKm=5&onlyUpcoming=true&currentTime=13:10
*/

router.get("/", getPublicJumuahSlotsController);

export default router;