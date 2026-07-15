import express from "express";
import { submitTimingReportController } from "../controllers/timingReport.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Timing Report Routes
|--------------------------------------------------------------------------
| Used by registered users to report wrong timing or mosque information.
|
| Important:
| Viewing mosque data is public.
| Contributing reports requires login.
*/

router.post("/timing", authMiddleware, submitTimingReportController);

export default router;