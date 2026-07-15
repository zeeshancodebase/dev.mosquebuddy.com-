// src/lib/endpoints.js
//
// One function per backend endpoint. Screens call these instead of
// building query strings by hand. Keeps src/lib/api.js (the raw
// fetch wrapper) untouched and generic.

import { api } from "./api";

function buildQueryString(params = {}) {
  const cleaned = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );
  if (cleaned.length === 0) return "";
  const search = new URLSearchParams(
    cleaned.map(([key, value]) => [key, String(value)])
  );
  return `?${search.toString()}`;
}

// ── Public Venues (Nearby, Search, Venue Detail) ──
export function fetchPublicVenues(params = {}) {
  // params: page, limit, search, countryId, stateId, cityId, areaId,
  //         venueType, womenPrayerSpace, latitude, longitude, radiusKm
  return api.get(`/public/venues${buildQueryString(params)}`);
}

export function fetchPublicVenueById(venueId) {
  return api.get(`/public/venues/${venueId}`);
}

// ── Next Jamā'ah (Home screen) ──
export function fetchNextJamaah(params = {}) {
  // REQUIRED: currentTime in "HH:mm" format
  // optional: latitude, longitude, radiusKm, prayerName, page, limit
  return api.get(`/public/next-jamaah${buildQueryString(params)}`);
}

// ── Jumu'ah (Jumu'ah screen) ──
export function fetchPublicJumuah(params = {}) {
  // optional: latitude, longitude, radiusKm, currentTime, onlyUpcoming,
  //           countryId, stateId, cityId, areaId, womenPrayerSpace
  return api.get(`/public/jumuah${buildQueryString(params)}`);
}

// ── Locations (for future location picker / city selection) ──
export function fetchCountries() {
  return api.get(`/public/locations/countries`);
}
export function fetchStates(countryId) {
  return api.get(`/public/locations/states${buildQueryString({ countryId })}`);
}
export function fetchCities(stateId) {
  return api.get(`/public/locations/cities${buildQueryString({ stateId })}`);
}
export function fetchAreas(cityId) {
  return api.get(`/public/locations/areas${buildQueryString({ cityId })}`);
}

// ── Contributions (Report / Suggest — require login) ──
export function submitTimingReport(body) {
  // body: { venueId, dailyTimingId?, jumuahTimingId?, prayerName, issueType,
  //         suggestedAzaanTime?, suggestedJamaahTime?, suggestedKhutbahTime?, userNote? }
  return api.post(`/reports/timing`, body);
}

export function submitVenueSuggestion(body) {
  // body: { suggestedName, venueType, areaText, cityText, stateText, countryText,
  //         address?, pincode?, googleMapsLink?, latitude?, longitude?, phone?,
  //         optionalTimingNote?, userNote? }
  return api.post(`/suggestions/venues`, body);
}

// ── Feedback (optional auth) ──
export function submitFeedback(body) {
  return api.post(`/feedback`, body);
}


// ── Mosque Admin ──
export function fetchMyVenues() {
  return api.get("/mosque-admin/my-venues");
}
export function fetchMyVenueById(venueId) {
  return api.get(`/mosque-admin/venues/${venueId}`);
}
export function updateMyVenueProfile(venueId, body) {
  return api.patch(`/mosque-admin/venues/${venueId}/profile`, body);
}
export function createMyDailyTiming(venueId, body) {
  return api.post(`/mosque-admin/venues/${venueId}/daily-timings`, body);
}
export function updateMyDailyTiming(timingId, body) {
  return api.patch(`/mosque-admin/daily-timings/${timingId}`, body);
}
export function createMyJumuahTiming(venueId, body) {
  return api.post(`/mosque-admin/venues/${venueId}/jumuah-timings`, body);
}
export function updateMyJumuahTiming(timingId, body) {
  return api.patch(`/mosque-admin/jumuah-timings/${timingId}`, body);
}
export function fetchMyMosqueReports(params = {}) {
  return api.get(`/mosque-admin/reports${buildQueryString(params)}`);
}
export function updateMosqueReportStatus(reportId, body) {
  return api.patch(`/mosque-admin/reports/${reportId}/status`, body);
}

// ── Volunteer ──
export function fetchVolunteerAssignments() {
  return api.get("/volunteer/my-assignments");
}
export function fetchVolunteerVenues(params = {}) {
  return api.get(`/volunteer/venues${buildQueryString(params)}`);
}
export function fetchVolunteerVenueById(venueId) {
  return api.get(`/volunteer/venues/${venueId}`);
}
export function fetchVolunteerReports(params = {}) {
  return api.get(`/volunteer/reports${buildQueryString(params)}`);
}
export function fetchVolunteerSuggestions(params = {}) {
  return api.get(`/volunteer/suggestions${buildQueryString(params)}`);
}
export function createVolunteerDailyTiming(venueId, body) {
  return api.post(`/volunteer/venues/${venueId}/daily-timings`, body);
}
export function updateVolunteerDailyTiming(timingId, body) {
  return api.patch(`/volunteer/daily-timings/${timingId}`, body);
}
export function verifyVolunteerDailyTiming(timingId) {
  return api.patch(`/volunteer/daily-timings/${timingId}/verify`, {});
}
export function createVolunteerJumuahTiming(venueId, body) {
  return api.post(`/volunteer/venues/${venueId}/jumuah-timings`, body);
}
export function updateVolunteerJumuahTiming(timingId, body) {
  return api.patch(`/volunteer/jumuah-timings/${timingId}`, body);
}
export function verifyVolunteerJumuahTiming(timingId) {
  return api.patch(`/volunteer/jumuah-timings/${timingId}/verify`, {});
}
export function updateVolunteerReportStatus(reportId, body) {
  return api.patch(`/volunteer/reports/${reportId}/status`, body);
}
export function updateVolunteerSuggestionStatus(suggestionId, body) {
  return api.patch(`/volunteer/suggestions/${suggestionId}/status`, body);
}



// ── Locations ──

export function fetchPublicStates(countryId) {
    return api.get(`/public/locations/states?countryId=${countryId}`);
 
}

export function fetchPublicCities(stateId) {
  return api.get(`/public/locations/cities?stateId=${stateId}`);
}

export function fetchPublicAreas(cityId) {
  return api.get(`/public/locations/areas?cityId=${cityId}`);
}