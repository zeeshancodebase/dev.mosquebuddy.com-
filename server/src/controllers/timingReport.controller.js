import { submitTimingReport } from "../services/timingReport.service.js";

/*
|--------------------------------------------------------------------------
| Timing Report Controller
|--------------------------------------------------------------------------
| Purpose:
| Registered-user report submission.
|
| Frontend behavior:
| - Report button may be visible to guests.
| - If guest taps it, frontend should ask user to login.
|
| Backend behavior:
| - This endpoint requires authMiddleware.
| - Every report is linked to submittedById.
| - Response includes contribution count for toast/encouragement.
*/

export const submitTimingReportController = async (req, res, next) => {
  try {
    const result = await submitTimingReport(req.body, req.user.id);

    return res.status(201).json({
      success: true,
      message:
        "JazakAllahu khair. Your report has been submitted for review.",
      contribution: result.contribution,
      data: result.report,
    });
  } catch (error) {
    return next(error);
  }
};