// src/lib/qiblaUtils.js
// Calculates the great-circle bearing from a user's location to the Kaaba.
import { Platform } from "react-native";

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

// Returns Qibla bearing in degrees (0–360, measured clockwise from true North)
export function getQiblaBearing(userLat, userLng) {
  const lat1 = toRad(userLat);
  const lat2 = toRad(KAABA_LAT);
  const deltaLng = toRad(KAABA_LNG - userLng);

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  let bearing = toDeg(Math.atan2(y, x));
  bearing = (bearing + 360) % 360;
  return bearing;
}

// Converts raw magnetometer {x,y,z} into a compass heading (0–360, N=0)
export function getHeadingFromMagnetometer({ x, y }) {
  let angle = toDeg(Math.atan2(y, x));
  angle = (angle + 360) % 360;
  // Sensor axis offset — 0° should point North on most devices
  angle = (angle + 270) % 360;
  return angle;
}

// Great-circle distance to Kaaba in km (Haversine) — shown as a nice detail
export function getDistanceToKaabaKm(userLat, userLng) {
  const R = 6371;
  const dLat = toRad(KAABA_LAT - userLat);
  const dLng = toRad(KAABA_LNG - userLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(userLat)) * Math.cos(toRad(KAABA_LAT)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Shortest signed angular difference (-180..180) from `a` to `b`
export function angleDiff(a, b) {
  return ((b - a + 540) % 360) - 180;
}

// Exponential smoothing for a circular value (0-360), avoids the
// average-jumps-across-0/360 problem a naive lerp would have.
export function smoothAngle(prev, next, alpha = 0.15) {
  const diff = angleDiff(prev, next);
  return (prev + diff * alpha + 360) % 360;
}

// 16-point cardinal label for a bearing, e.g. 37 -> "NE"
const CARDINALS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];
export function getCardinalLabel(bearing) {
  const idx = Math.round(((bearing % 360) / 22.5)) % 16;
  return CARDINALS[idx];
}

// Formats a lat/lng pair the way most map/compass apps display it.
export function formatCoordinates(lat, lng) {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}

// Normalizes the platform-specific heading accuracy value from
// Location.watchHeadingAsync into a simple level we can show + act on.
// iOS reports degrees of possible error (lower = better, negative = invalid).
// Android reports SensorManager accuracy constants (0-3, higher = better).
export function getHeadingAccuracyLevel(rawAccuracy) {
  if (rawAccuracy === null || rawAccuracy === undefined) return "unknown";

  if (Platform.OS === "ios") {
    if (rawAccuracy < 0) return "unreliable";
    if (rawAccuracy <= 5) return "high";
    if (rawAccuracy <= 15) return "medium";
    return "low";
  }

  // Android
  if (rawAccuracy >= 3) return "high";
  if (rawAccuracy === 2) return "medium";
  if (rawAccuracy === 1) return "low";
  return "unreliable";
}