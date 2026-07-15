// src/lib/dateUtils.js
//
// Shared date/time formatting helpers used across venue cards,
// detail screens, and verification badges.

/**
 * Formats an ISO date string into a short human "freshness" label.
 * Used next to VerificationBadge — e.g. "Updated today", "3 days ago".
 */
export function formatRelativeDate(isoString) {
  if (!isoString) return "Unknown";

  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Returns current time as "HH:mm" (24-hour), matching exactly what the
 * backend's next-jamaah and jumuah endpoints require as `currentTime`.
 */
export function getCurrentTimeHHmm() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Converts a 24-hour "HH:mm" backend time string into a 12-hour
 * display string, e.g. "17:05" -> "5:05 PM". Returns null safely
 * for missing/relative timings so callers can fall back to relative text.
 */
export function formatTime12h(time24) {
  if (!time24 || typeof time24 !== "string" || !time24.includes(":")) {
    return null;
  }

  const [hourStr, minuteStr] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr;

  if (Number.isNaN(hour)) return null;

  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${hour}:${minute} ${period}`;
}

/**
 * Returns a human countdown like "in 23m" or "in 1h 21m" between now
 * and a given "HH:mm" time today (or tomorrow, if dayOffset is 1).
 */
export function getCountdown(time24, dayOffset = 0) {
  if (!time24) return null;

  const [hourStr, minuteStr] = time24.split(":");
  const targetHour = parseInt(hourStr, 10);
  const targetMinute = parseInt(minuteStr, 10);

  if (Number.isNaN(targetHour) || Number.isNaN(targetMinute)) return null;

  const now = new Date();
  const target = new Date(now);
  target.setDate(target.getDate() + dayOffset);
  target.setHours(targetHour, targetMinute, 0, 0);

  const diffMs = target - now;
  if (diffMs < 0) return null;

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) return `in ${m}m`;
  if (m === 0) return `in ${h}h`;
  return `in ${h}h ${m}m`;
}

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatTodayDateString() {
  const now = new Date();
  return `${DAY_NAMES[now.getDay()]}, ${now.getDate()} ${MONTH_NAMES[now.getMonth()]}`;
}

export function isTodayFriday() {
  return new Date().getDay() === 5;
}