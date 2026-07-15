import { getPublicJumuahSlots } from "../services/publicJumuah.service.js";

/*
|--------------------------------------------------------------------------
| Public Jumu‘ah Controller
|--------------------------------------------------------------------------
| Purpose:
| Handles the public/mobile Jumu‘ah screen API.
|
| Product behavior:
| Returns Jumu‘ah slots as separate results because one mosque may have
| multiple slots and users care about available time options.
*/

export const getPublicJumuahSlotsController = async (req, res, next) => {
  try {
    const result = await getPublicJumuahSlots(req.query);

    return res.status(200).json({
      success: true,
      message: "Jumu‘ah slots fetched successfully",
      meta: result.meta,
      pagination: result.pagination,
      data: result.slots,
    });
  } catch (error) {
    return next(error);
  }
};