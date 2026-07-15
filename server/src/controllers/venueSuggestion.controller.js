import { submitVenueSuggestion } from "../services/venueSuggestion.service.js";

/*
|--------------------------------------------------------------------------
| Venue Suggestion Controller
|--------------------------------------------------------------------------
| Purpose:
| Registered-user suggestion submission for missing mosques/prayer venues.
|
| Frontend behavior:
| - Suggest Missing Mosque button can be visible to guests.
| - If guest taps it, frontend should ask user to login.
|
| Backend behavior:
| - Requires authMiddleware.
| - Saves suggestion as pending.
| - Does not create public venue automatically.
| - Returns contribution count for toast/encouragement.
*/

export const submitVenueSuggestionController = async (req, res, next) => {
  try {
    const result = await submitVenueSuggestion(req.body, req.user.id);

    return res.status(201).json({
      success: true,
      message:
        "JazakAllahu khair. Your mosque suggestion has been submitted for review.",
      contribution: result.contribution,
      data: result.suggestion,
    });
  } catch (error) {
    return next(error);
  }
};