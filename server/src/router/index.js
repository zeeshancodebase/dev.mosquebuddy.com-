import express from "express";
import healthRoutes from "./health.routes.js";

// Future routes
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import venueRoutes from "./venue.routes.js";
import dailyPrayerTimingRoutes from "./dailyPrayerTiming.routes.js";
import jumuahTimingRoutes from "./jumuahTiming.routes.js";
import adminTimingReportRoutes from "./adminTimingReport.routes.js";
import publicVenueRoutes from "./publicVenue.routes.js";
import publicLocationRoutes from "./publicLocation.routes.js";
import publicJumuahRoutes from "./publicJumuah.routes.js";
import publicNextJamaahRoutes from "./publicNextJamaah.routes.js";
import timingReportRoutes from "./timingReport.routes.js";
import venueSuggestionRoutes from "./venueSuggestion.routes.js";
import feedbackRoutes from "./feedback.routes.js";
// import timingRoutes from "./timing.routes.js";
// import jumuahRoutes from "./jumuah.routes.js";
// import reportRoutes from "./report.routes.js";
// import suggestionRoutes from "./suggestion.routes.js";
import locationRoutes from "./location.routes.js";
import adminActivityLogRoutes from "./adminActivityLog.routes.js";
import adminDashboardRoutes from "./adminDashboard.routes.js";
import adminRoleRoutes from "./adminRole.routes.js";
import venueAdminAssignmentRoutes from "./venueAdminAssignment.routes.js";
import adminVenueSuggestionRoutes from "./adminVenueSuggestion.routes.js";
import volunteerAssignmentRoutes from "./volunteerAssignment.routes.js";
import updateHistoryRoutes from "./updateHistory.routes.js";


import mosqueAdminRoutes from "./mosqueAdmin.routes.js";

import volunteerRoutes from "./volunteer.routes.js";

import deviceTokenRoutes from "./deviceToken.routes.js";
import notificationPreferenceRoutes from "./notificationPreference.routes.js";




const router = express.Router();

router.use("/health", healthRoutes);

// Future routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/venues", venueRoutes);
router.use("/admin", adminTimingReportRoutes);
router.use("/public/venues", publicVenueRoutes);
router.use("/public/locations", publicLocationRoutes);
router.use("/public/jumuah", publicJumuahRoutes);
router.use("/public/next-jamaah", publicNextJamaahRoutes);
router.use("/reports", timingReportRoutes);
router.use("/suggestions", venueSuggestionRoutes);
router.use("/", feedbackRoutes);
// router.use("/timings", timingRoutes);
// router.use("/jumuah", jumuahRoutes);
// router.use("/reports", reportRoutes);
// router.use("/suggestions", suggestionRoutes);
router.use("/locations", locationRoutes);


router.use("/admin", adminActivityLogRoutes);
router.use("/admin", adminDashboardRoutes);
router.use("/admin", adminRoleRoutes);
router.use("/admin", venueAdminAssignmentRoutes);
router.use("/admin", adminVenueSuggestionRoutes);
router.use("/admin/volunteer-assignments", volunteerAssignmentRoutes);

router.use("/update-history", updateHistoryRoutes);


router.use("/mosque-admin", mosqueAdminRoutes);

router.use("/volunteer", volunteerRoutes);

router.use("/device-tokens", deviceTokenRoutes);
router.use("/notification-preferences", notificationPreferenceRoutes);


// Broad protected timing routes must come LAST because they are mounted at "/"
router.use("/", dailyPrayerTimingRoutes);
router.use("/", jumuahTimingRoutes);


export default router;