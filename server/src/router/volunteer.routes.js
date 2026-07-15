// server\src\router\volunteer.routes.js
import express from "express";

import {
  getMyVolunteerAssignmentsController,
  getVolunteerVenuesController,
  getVolunteerReportsController,
  getVolunteerSuggestionsController,
  createVolunteerDailyTimingController,
  updateVolunteerDailyTimingController,
  verifyVolunteerDailyTimingController,
  createVolunteerJumuahTimingController,
  updateVolunteerJumuahTimingController,
  verifyVolunteerJumuahTimingController,
  updateVolunteerReportStatusController,
  updateVolunteerSuggestionStatusController,
  getVolunteerVenueByIdController,
} from "../controllers/volunteer.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Volunteer Routes
|--------------------------------------------------------------------------
| Used by trusted volunteers in the mobile app.
|
| MVP scope:
| - View assigned scope
| - View assigned venues
| - View reports in assigned scope
| - View suggestions queue
|
| Write/update actions can be added later once volunteer operations are tested.
*/

router.use(authMiddleware);
router.use(roleMiddleware("trusted_volunteer"));

router.get("/my-assignments", getMyVolunteerAssignmentsController);
router.get("/venues/:venueId", getVolunteerVenueByIdController);
router.get("/venues", getVolunteerVenuesController);
router.get("/reports", getVolunteerReportsController);
router.get("/suggestions", getVolunteerSuggestionsController);

router.post("/venues/:venueId/daily-timings", createVolunteerDailyTimingController);
router.patch("/daily-timings/:timingId", updateVolunteerDailyTimingController);
router.patch("/daily-timings/:timingId/verify", verifyVolunteerDailyTimingController);

router.post("/venues/:venueId/jumuah-timings", createVolunteerJumuahTimingController);
router.patch("/jumuah-timings/:timingId", updateVolunteerJumuahTimingController);
router.patch("/jumuah-timings/:timingId/verify", verifyVolunteerJumuahTimingController);

router.patch("/reports/:reportId/status", updateVolunteerReportStatusController);
router.patch("/suggestions/:suggestionId/status", updateVolunteerSuggestionStatusController);

export default router;