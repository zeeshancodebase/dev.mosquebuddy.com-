// src/lib/prayerTime.js
//
// Client-side "which prayer row should be highlighted as next" logic
// for VenueDetailScreen, working off already-12h-formatted timing
// arrays (as produced by adaptVenueDetail). Kept separate from
// adapters.js since this operates on already-adapted data, not raw
// backend responses.

const PRAYER_ORDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

function to24Hour(time12h) {
  if (!time12h) return null;
  const match = time12h.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return null;

  let [, hourStr, minuteStr, period] = match;
  let hour = parseInt(hourStr, 10);

  if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (period.toUpperCase() === "AM" && hour === 12) hour = 0;

  return `${String(hour).padStart(2, "0")}:${minuteStr}`;
}

/**
 * Given a venue's dailyPrayerTimings (already formatted to 12h strings
 * by adaptVenueDetail), returns the prayerName of the next upcoming
 * fixed-time prayer today, falling back to Fajr if all of today's
 * fixed prayers have passed.
 */
export function getNextUpcomingPrayerName(dailyPrayerTimings = []) {
  const now = new Date();
  const currentHHmm = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  const withTime24 = dailyPrayerTimings
    .filter((t) => t.timingType === "fixed" && t.jamaahTime)
    .map((t) => ({ ...t, time24: to24Hour(t.jamaahTime) }))
    .filter((t) => t.time24 !== null);

  const upcoming = withTime24
    .filter((t) => t.time24 >= currentHHmm)
    .sort((a, b) => a.time24.localeCompare(b.time24));

  if (upcoming[0]) return upcoming[0].prayerName;

  // All fixed prayers today have passed — highlight tomorrow's Fajr reference point.
  const fajr = withTime24.find((t) => t.prayerName === "fajr");
  return fajr ? fajr.prayerName : null;
}