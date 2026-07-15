import express from "express";
import { submitVenueSuggestionController } from "../controllers/venueSuggestion.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Venue Suggestion Routes
|--------------------------------------------------------------------------
| Used by registered users to suggest missing mosques/prayer venues.
|
| Important:
| Viewing mosque data is public.
| Suggesting missing mosque requires login.
*/

router.post("/venues", authMiddleware, submitVenueSuggestionController);

export default router;