import createHttpError from "../utils/createHttpError.js";

function extractCoordsFromUrl(url) {
  // Most precise: pinned point format !3d<lat>!4d<lng>
  let match = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (match) {
    return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
  }

  // Map center format: @<lat>,<lng>,<zoom>z
  match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (match) {
    return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
  }

  // Query param format: ?q=<lat>,<lng>
  match = url.match(/[?&](?:q|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (match) {
    return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
  }

  return null;
}

export async function resolveMapsLink(inputUrl) {
  if (!inputUrl || typeof inputUrl !== "string") {
    throw createHttpError(400, "A Google Maps link is required.");
  }

  let finalUrl = inputUrl.trim();

  try {
    // Follows maps.app.goo.gl short-link redirects to the full URL
    const response = await fetch(finalUrl, { method: "GET", redirect: "follow" });
    finalUrl = response.url || finalUrl;
  } catch (err) {
    throw createHttpError(400, "Could not open that Google Maps link. Please check it and try again.");
  }

  const coords = extractCoordsFromUrl(finalUrl);

  if (!coords) {
    throw createHttpError(422, "Could not find coordinates in that link. Try dropping a pin instead.");
  }

  return coords;
}