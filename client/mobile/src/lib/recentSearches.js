// src/lib/recentSearches.js
//
// Persists the user's recent search terms locally on-device using
// AsyncStorage. Capped at 5 entries, most-recent-first, de-duplicated
// case-insensitively so "BTM Layout" and "btm layout" collapse to one entry.

import AsyncStorage from "@react-native-async-storage/async-storage";

const RECENT_SEARCHES_KEY = "sabeel_recent_searches";
const MAX_RECENT = 5;

export async function getRecentSearches() {
  try {
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.log("getRecentSearches error:", error);
    return [];
  }
}

export async function addRecentSearch(term) {
  const trimmed = term.trim();
  if (!trimmed) return getRecentSearches();

  try {
    const existing = await getRecentSearches();
    const deduped = existing.filter(
      (t) => t.toLowerCase() !== trimmed.toLowerCase()
    );
    const updated = [trimmed, ...deduped].slice(0, MAX_RECENT);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.log("addRecentSearch error:", error);
    return getRecentSearches();
  }
}

export async function clearRecentSearches() {
  try {
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (error) {
    console.log("clearRecentSearches error:", error);
  }
}