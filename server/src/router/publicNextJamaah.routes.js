import express from "express";
import { getPublicNextJamaahController } from "../controllers/publicNextJamaah.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public Next Jamā‘ah Routes
|--------------------------------------------------------------------------
| Used by the Sabeel home screen.
|
| Example:
| GET /api/public/next-jamaah?latitude=12.9716&longitude=77.5946&radiusKm=5&currentTime=16:10
*/

router.get("/", getPublicNextJamaahController);

export default router;