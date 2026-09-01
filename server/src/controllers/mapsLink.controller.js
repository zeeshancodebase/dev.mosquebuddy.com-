import { resolveMapsLink } from "../services/mapsLink.service.js";
import { successResponse } from "../utils/apiResponse.js";

export const resolveMapsLinkController = async (req, res, next) => {
  try {
    const { url } = req.body;
    const coords = await resolveMapsLink(url);
    return successResponse(res, {
      statusCode: 200,
      message: "Location extracted from link.",
      data: coords,
    });
  } catch (err) {
    next(err);
  }
};