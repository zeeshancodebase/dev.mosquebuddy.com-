// src/lib/adapters.js
//
// Translates real backend response shapes into the flatter shapes
// the existing UI components (VenueCard, EnhancedVenueCard, JumuahScreen
// cards, VenueDetailScreen) already expect.
//
// Why this file exists: the backend returns deeply nested, namespaced
// objects (venue.location.distanceKm, venue.trust.verificationStatus,
// etc.) which is the *correct* shape for an API — explicit and
// unambiguous. The UI components were already built expecting a flatter
// shape (venue.distance as a formatted string, venue.verificationStatus
// at the top level, venue.nextPrayer as a single object). Rather than
// rewrite already-polished, tested UI components, we adapt the data
// once here.

import { formatRelativeDate, formatTime12h, getCountdown } from "./dateUtils";

/**
 * Adapts a single venue object from /public/venues (list or detail)
 * into the flat shape VenueCard / EnhancedVenueCard / VenueDetailScreen expect.
 *
 * Accepts the raw backend venue (with .location, .facilities, .trust, .timings)
 * and returns a flat venue object. nextPrayer is NOT set here because the
 * /public/venues endpoint doesn't compute "next prayer" — that's the job
 * of /public/next-jamaah. Screens that need nextPrayer should use
 * adaptNextJamaahCard instead, or compute it client-side from timings.daily
 * (see getNextUpcomingPrayer below).
 */
export function adaptVenue(raw) {
  if (!raw) return null;

  const distanceKm = raw.location?.distanceKm;

  return {
    id: raw.id,
    name: raw.name,
    venueType: raw.venueType,
    alternateNames: raw.alternateNames || [],

    area: raw.location?.area || null,
    city: raw.location?.city || null,
    state: raw.location?.state || null,
    country: raw.location?.country || null,
    address: raw.location?.address || null,
    pincode: raw.location?.pincode || null,
    latitude: raw.location?.latitude ?? null,
    longitude: raw.location?.longitude ?? null,
    googleMapsLink: raw.location?.googleMapsLink || null,

    distance:
      typeof distanceKm === "number" ? formatDistanceKm(distanceKm) : null,
    distanceKm: typeof distanceKm === "number" ? distanceKm : null,

    phone: raw.contact?.phone || null,

    womenPrayerSpace: raw.facilities?.womenPrayerSpace || null,
    wuduFacility: raw.facilities?.wuduFacility || null,
    parking: raw.facilities?.parking || null,
    defaultKhutbahLanguage: raw.facilities?.defaultKhutbahLanguage || null,
    facilityNotes: raw.facilities?.facilityNotes || null,
    importantNotice: raw.facilities?.importantNotice || null,

    verificationStatus: raw.trust?.verificationStatus || "pending_review",
    lastVerifiedAt: raw.trust?.lastVerifiedAt || null,
    lastUpdatedAt: raw.trust?.lastUpdatedAt || null,

    // Keep raw timing arrays available as-is for VenueDetailScreen,
    // just renamed to match what it already expects.
    dailyPrayerTimings: raw.timings?.daily || [],
    jumuahTimings: raw.timings?.jumuah || [],

    // Best-effort "next prayer" computed client-side from today's
    // fixed timings, so list cards (VenueCard/EnhancedVenueCard) have
    // something to show without a second network call per venue.
    nextPrayer: getNextUpcomingPrayer(raw.timings?.daily || []),
  };
}

export function adaptVenueList(rawList = []) {
  return rawList.map(adaptVenue);
}

/**
 * Adapts a single card from /public/next-jamaah into the flat venue
 * shape used by VenueCard/EnhancedVenueCard. This is the authoritative
 * source for "next prayer" — computed server-side, so prefer this over
 * the client-side fallback in adaptVenue wherever possible (Home screen).
 */
export function adaptNextJamaahCard(card) {
  if (!card) return null;

  const distanceKm = card.venue?.location?.distanceKm;
  const jamaahTime12h = formatTime12h(card.times?.jamaahTime);

  return {
    id: card.venue.id,
    name: card.venue.name,
    venueType: card.venue.venueType,

    area: card.venue.location?.area || null,
    city: card.venue.location?.city || null,
    address: card.venue.location?.address || null,
    googleMapsLink: card.venue.location?.googleMapsLink || null,

    distance:
      typeof distanceKm === "number" ? formatDistanceKm(distanceKm) : null,
    distanceKm: typeof distanceKm === "number" ? distanceKm : null,

    womenPrayerSpace: card.venue.facilities?.womenPrayerSpace || null,
    wuduFacility: card.venue.facilities?.wuduFacility || null,
    parking: card.venue.facilities?.parking || null,
    importantNotice: card.venue.facilities?.importantNotice || null,

    verificationStatus: card.trust?.venueVerificationStatus || "pending_review",
    lastVerifiedAt: card.trust?.venueLastVerifiedAt || null,

    nextPrayer: {
      prayerName: card.prayerName,
      dayOffset: card.dayOffset,
      dayLabel: card.dayLabel,
      azaanTime: formatTime12h(card.times?.azaanTime),
      jamaahTime:
        card.times?.timingType === "relative"
          ? card.times?.relativeTimeText
          : jamaahTime12h,
      relativeTimeText: card.times?.relativeTimeText || null,
      timingType: card.times?.timingType,
      countdown: getCountdown(card.times?.jamaahTime, card.dayOffset),
      verificationStatus: card.trust?.timingVerificationStatus || "pending_review",
    },
  };
}

export function adaptNextJamaahCards(cards = []) {
  return cards.map(adaptNextJamaahCard);
}

/**
 * Adapts a single Jumu'ah slot from /public/jumuah into the flat shape
 * JumuahScreen's JumuahCard component expects.
 */
export function adaptJumuahSlot(slot) {
  if (!slot) return null;

  const distanceKm = slot.venue?.location?.distanceKm;

  return {
    id: slot.id,
    venueId: slot.venue.id,
    venueName: slot.venue.name,
    area: slot.venue.location?.area?.name || null,
    distance:
      typeof distanceKm === "number" ? formatDistanceKm(distanceKm) : null,
    distanceKm: typeof distanceKm === "number" ? distanceKm : null,

    verificationStatus: slot.trust?.slotVerificationStatus || "pending_review",

    slotNumber: slot.slotNumber,
    azaanTime: formatTime12h(slot.times?.azaanTime),
    khutbahTime: formatTime12h(slot.times?.khutbahTime),
    jamaahTime: formatTime12h(slot.times?.jamaahTime),
    khutbahLanguage: slot.khutbahLanguage,
    womenPrayerSpace: slot.womenPrayerSpace,
    importantNotice: slot.notices?.slotNotice || slot.notices?.venueNotice || null,
  };
}

export function adaptJumuahSlots(slots = []) {
  return slots.map(adaptJumuahSlot);
}

/**
 * Adapts the /public/venues/:id detail response. Same shape as
 * adaptVenue, plus 12-hour-formatted daily/jumuah timing arrays so
 * VenueDetailScreen's PrayerRow/JumuahSlotCard render correctly
 * (those components display azaanTime/jamaahTime as already-formatted
 * strings, matching the original mock data shape).
 */
export function adaptVenueDetail(raw) {
  const adapted = adaptVenue(raw);
  if (!adapted) return null;

  return {
    ...adapted,
    dailyPrayerTimings: (raw.timings?.daily || []).map((t) => ({
      id: t.id,
      prayerName: t.prayerName,
      azaanTime: formatTime12h(t.azaanTime),
      jamaahTime: formatTime12h(t.jamaahTime),
      timingType: t.timingType,
      relativeTimeText: t.relativeTimeText,
      verificationStatus: t.verificationStatus,
    })),
    jumuahTimings: (raw.timings?.jumuah || []).map((s) => ({
      id: s.id,
      slotNumber: s.slotNumber,
      azaanTime: formatTime12h(s.azaanTime),
      khutbahTime: formatTime12h(s.khutbahTime),
      jamaahTime: formatTime12h(s.jamaahTime),
      khutbahLanguage: s.khutbahLanguage,
      womenPrayerSpace: s.womenPrayerSpace,
      importantNotice: s.importantNotice,
      verificationStatus: s.verificationStatus,
    })),
  };
}

// ── Internal helpers ──

function formatDistanceKm(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

const PRAYER_ORDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

/**
 * Best-effort client-side "what's the next upcoming fixed-time prayer
 * today" calculator, used as a fallback when a list of venues comes
 * from /public/venues (which doesn't compute this) rather than
 * /public/next-jamaah (which does, server-side, more reliably).
 */
function getNextUpcomingPrayer(dailyTimings = []) {
  const now = new Date();
  const currentHHmm = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  const fixedUpcoming = dailyTimings
    .filter((t) => t.timingType === "fixed" && t.jamaahTime)
    .filter((t) => t.jamaahTime >= currentHHmm)
    .sort((a, b) => a.jamaahTime.localeCompare(b.jamaahTime));

  const chosen =
    fixedUpcoming[0] ||
    // After all fixed prayers for today have passed, fall back to
    // showing the first prayer of the day (Fajr) as a reference point.
    [...dailyTimings]
      .filter((t) => t.timingType === "fixed" && t.jamaahTime)
      .sort(
        (a, b) =>
          PRAYER_ORDER.indexOf(a.prayerName) - PRAYER_ORDER.indexOf(b.prayerName)
      )[0];

  if (!chosen) return null;

  return {
    prayerName: chosen.prayerName,
    jamaahTime: formatTime12h(chosen.jamaahTime),
    countdown: getCountdown(chosen.jamaahTime, 0),
    verificationStatus: chosen.verificationStatus,
  };
}