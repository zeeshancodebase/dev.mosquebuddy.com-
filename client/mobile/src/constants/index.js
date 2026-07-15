
// client\mobile\src\constants\index.js
export const APP_CONFIG = {
  name: "MosqueBuddy",
  nameArabic: "مسجد کا ساتھی",
  tagline: "Find nearby mosques and never miss a Jamā'ah",

//   رفيق المسجد (Rafiq al-Masjid) — "companion of the mosque"
// Urdu: مسجد کا ساتھی (Masjid ka Sathi)

  // Temporary until the app is published
  website: "https://MosqueBuddy.com",

  // Share this with others
  appStoreUrl: "https://play.google.com/store/apps/details?id=com.sabeel.app",

  // Open directly to ratings
  appReviewUrl:
    "https://play.google.com/store/apps/details?id=com.sabeel.app&showAllReviews=true",
};

export const COLORS = {
  // Core brand
  primary: "#059669",
  primaryDark: "#047857",
  primaryDeep: "#065F46",
  primaryLight: "#ECFDF5",
  primaryMid: "#D1FAE5",

  // Backgrounds
  background: "#F0F4F2",
  surface: "#E8F0EC",
  card: "#FFFFFF",
  dark: "#0C1A14",

  // Text
  textPrimary: "#0D1F17",
  textSecondary: "#374151",
  textMuted: "#6B7280",
  textLight: "#9CA3AF",
  textOnDark: "#FFFFFF",
  textOnPrimary: "#FFFFFF",

  // Borders
  border: "#D1D5DB",
  borderLight: "#E5E7EB",

  // Status colors
  verified: "#059669",
  verifiedBg: "#ECFDF5",
  communityUpdated: "#D97706",
  communityUpdatedBg: "#FFFBEB",
  needsUpdate: "#DC2626",
  needsUpdateBg: "#FEF2F2",
  pendingReview: "#7C3AED",
  pendingReviewBg: "#F5F3FF",

  // UI feedback
  error: "#DC2626",
  errorBg: "#FEF2F2",
  success: "#059669",
  successBg: "#ECFDF5",
  warning: "#D97706",
  warningBg: "#FFFBEB",

  // Utility
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
  overlay: "rgba(0,0,0,0.5)",
  overlayLight: "rgba(0,0,0,0.3)",
};

export const VERIFICATION_STATUS = {
  verified: {
    label: "Verified",
    color: "#059669",
    bg: "#ECFDF5",
  },
  community_updated: {
    label: "Community Updated",
    color: "#D97706",
    bg: "#FFFBEB",
  },
  needs_update: {
    label: "Needs Update",
    color: "#DC2626",
    bg: "#FEF2F2",
  },
  pending_review: {
    label: "Pending Review",
    color: "#7C3AED",
    bg: "#F5F3FF",
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

export const FACILITIES = {
  available: "Available",
  not_available: "Not Available",
  limited: "Limited",
  unknown: "Unknown",
};

export const API_BASE_URL = "https://sabeel-staging-500201.el.r.appspot.com/api";

// export const API_BASE_URL = "http://192.168.1.77:5000/api";

// export const API_BASE_URL = "http://YOUR_PC_IP:5000/api";

/*
just colour differences
export const APP_CONFIG = {
  name: "Sabeel",
  nameArabic: "سبيل",
  tagline: "Find nearby mosques and never miss a Jamā'ah",
};

export const COLORS = {
  primary: "#059669",
  primaryDark: "#047857",
  primaryLight: "#D1FAE5",
  background: "#F0F4F2",
  dark: "#0C1A14",
  card: "#FFFFFF",
  textPrimary: "#111827",
  textSecondary: "#4B5563",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  error: "#DC2626",
  warning: "#EA580C",
  violet: "#7C3AED",
};

export const VERIFICATION_STATUS = {
  verified: {
    label: "Verified",
    color: "#059669",
    bg: "#D1FAE5",
  },
  community_updated: {
    label: "Community Updated",
    color: "#EA580C",
    bg: "#FEF3C7",
  },
  needs_update: {
    label: "Needs Update",
    color: "#DC2626",
    bg: "#FEE2E2",
  },
  pending_review: {
    label: "Pending Review",
    color: "#7C3AED",
    bg: "#EDE9FE",
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

export const FACILITIES = {
  available: "Available",
  not_available: "Not Available",
  limited: "Limited",
  unknown: "Unknown",
};

export const API_BASE_URL = "http://192.168.1.100:5000/api";
*/