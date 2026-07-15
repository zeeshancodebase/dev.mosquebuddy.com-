// src/lib/location.js
//
// Centralized device-location helper. Designed to degrade gracefully:
// if expo-location isn't installed yet, getUserLocation() resolves to
// null and screens fall back to non-distance-sorted results (still
// fully functional — just without "X km away" and proximity sorting).
//
// Once you run `npx expo install expo-location`, this file will
// automatically start requesting and returning real coordinates —
// no other code changes needed.

let Location = null;
try {
  // Wrapped in try/catch because the package may not be installed yet.
  Location = require("expo-location");
} catch (e) {
  Location = null;
}

let cachedLocation = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Requests (if needed) and returns the device's current location as
 * { latitude, longitude, label }, or null if location is unavailable,
 * permission was denied, or expo-location isn't installed yet.
 *
 * Caches for 5 minutes to avoid hammering the GPS on every screen focus.
 */
export async function getUserLocation({ forceRefresh = false } = {}) {
  if (!Location) {
    return null;
  }

  const now = Date.now();
  if (!forceRefresh && cachedLocation && now - cachedAt < CACHE_TTL_MS) {
    return cachedLocation;
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return null;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    let label = "Near you";
    try {
      const places = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      if (places?.[0]?.city) {
        label = places[0].city;
      } else if (places?.[0]?.subregion) {
        label = places[0].subregion;
      }
    } catch (e) {
      // Reverse geocoding is best-effort; ignore failures silently.
    }

    cachedLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      label,
    };
    cachedAt = now;

    return cachedLocation;
  } catch (error) {
    console.log("Location error:", error.message);
    return null;
  }
}

export function clearLocationCache() {
  cachedLocation = null;
  cachedAt = 0;
}