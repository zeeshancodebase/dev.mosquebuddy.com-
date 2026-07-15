import { getPublicNextJamaah } from "../services/publicNextJamaah.service.js";

/*
|--------------------------------------------------------------------------
| Public Next Jamā‘ah Controller
|--------------------------------------------------------------------------
| Purpose:
| Handles the home-screen API:
| "Where can I still catch the next jamā‘ah?"
|
| This is a product API, not a raw timing CRUD endpoint.
*/

export const getPublicNextJamaahController = async (req, res, next) => {
  try {
    const result = await getPublicNextJamaah(req.query);

    return res.status(200).json({
      success: true,
      message: result.meta.targetPrayerName
        ? "Next jamā‘ah options fetched successfully"
        : "No upcoming jamā‘ah options found",
      meta: result.meta,
      pagination: result.pagination,
      data: result.cards,
    });
  } catch (error) {
    return next(error);
  }
};