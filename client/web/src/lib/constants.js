// src/lib/constants.js
// Central config — change these values to rebrand the entire app

// export const APP_CONFIG = {
//   name: "Sabeel",
//   nameFull: "Sabeel Admin",
//   nameArabic: "سبيل",
//   tagline: "Mosque & Prayer Timing Management",
//   version: "1.0.0",
// };
// export const APP_CONFIG = {
//   name: "Sabeel",
//   nameFull: "Sabeel Admin",
//   nameArabic: "سبيل",
//   tagline: "Mosque & Prayer Timing Management",
//   taglinePublic: "Find nearby mosques and never miss a Jamā'ah",
//   descriptionPublic: "Sabeel helps Muslims find accurate mosque timings, Jumu'ah slots, and directions — all in one place.",
//   appStoreLink: "#",        // placeholder
//   playStoreLink: "#",       // placeholder
//   mosqueAdminLink: "/login", // mosque admins go to admin login
//   version: "1.0.0",
// };

export const APP_CONFIG = {
  name: "MosqueBuddy",
  nameFull: "MosqueBuddy Admin",
  nameArabic: "مسجد کا ساتھی",
  tagline: "Mosque & Prayer Timing Management",
  taglinePublic: "Find nearby mosques and never miss a Jamā'ah",
  descriptionPublic: "MosqueBuddy helps Muslims find accurate mosque timings, Jumu'ah slots, and directions — all in one place.",
  appStoreLink: "#",        // placeholder
  playStoreLink: "#",       // placeholder
  mosqueAdminLink: "/login", // mosque admins go to admin login
  version: "1.0.0",
  SUPPORT_EMAIL:"support@mosquebuddy.app",
};

export const VERIFICATION_STATUS = {
  verified: {
    label: "Verified",
    color: "verified",
    description: "Timing confirmed by mosque admin or trusted source",
  },
  community_updated: {
    label: "Community Updated",
    color: "community",
    description: "Timing submitted by community, awaiting confirmation",
  },
  needs_update: {
    label: "Needs Update",
    color: "needs",
    description: "Timing is old or doubtful",
  },
  pending_review: {
    label: "Pending Review",
    color: "pending",
    description: "Submitted but not yet reviewed",
  },
};

export const VENUE_TYPES = {
  masjid: "Masjid",
  musalla: "Musalla",
  islamic_center: "Islamic Center",
  prayer_room: "Prayer Room",
  temporary_jumuah_venue: "Temporary Jumu'ah Venue",
  eidgah_open_ground: "Eidgah / Open Ground",
  hall_community_venue: "Hall / Community Venue",
  other: "Other",
};

export const PRAYER_NAMES = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export const WOMEN_PRAYER_SPACE = {
  available: "Available",
  not_available: "Not Available",
  jumuah_only: "Jumu'ah Only",
  ramadan_eid_only: "Ramadan / Eid Only",
  unknown: "Unknown",
};

export const USER_ROLES = {
  registered_user: "Registered User",
  mosque_admin: "Mosque Admin",
  trusted_volunteer: "Trusted Volunteer",
  super_admin: "Super Admin",
};

export const REPORT_STATUS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  needs_more_info: "Needs More Info",
};