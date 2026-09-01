// src/lib/tasbeehStorage.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const TODAY_KEY = () => `tasbeeh:day:${new Date().toISOString().slice(0, 10)}`;
const STREAK_KEY = "tasbeeh:streak";
const ALLTIME_KEY = "tasbeeh:allTime";

function yesterday(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function getTodayData() {
  try {
    const raw = await AsyncStorage.getItem(TODAY_KEY());
    return raw ? JSON.parse(raw) : { total: 0, byPhrase: {} };
  } catch {
    return { total: 0, byPhrase: {} };
  }
}

export async function getAllTime() {
  try {
    const raw = await AsyncStorage.getItem(ALLTIME_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export async function getStreak() {
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    return raw ? JSON.parse(raw) : { count: 0, lastActiveDate: null };
  } catch {
    return { count: 0, lastActiveDate: null };
  }
}

// Call whenever the user taps at least once today
async function bumpStreak() {
  const today = new Date().toISOString().slice(0, 10);
  const streak = await getStreak();

  if (streak.lastActiveDate === today) return streak; // already counted today

  const isConsecutive = streak.lastActiveDate === yesterday(today);
  const updated = {
    count: isConsecutive ? streak.count + 1 : 1,
    lastActiveDate: today,
  };
  await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(updated));
  return updated;
}

export async function incrementCount(phraseId, amount = 1) {
  const data = await getTodayData();
  const nextByPhrase = { ...data.byPhrase, [phraseId]: (data.byPhrase[phraseId] || 0) + amount };
  const next = { total: Math.max(0, data.total + amount), byPhrase: nextByPhrase };

  await AsyncStorage.setItem(TODAY_KEY(), JSON.stringify(next));

  const allTime = await getAllTime();
  await AsyncStorage.setItem(ALLTIME_KEY, String(Math.max(0, allTime + amount)));

  const streak = amount > 0 ? await bumpStreak() : await getStreak();

  return { today: next, allTime: Math.max(0, allTime + amount), streak };
}

export async function resetToday() {
  await AsyncStorage.setItem(TODAY_KEY(), JSON.stringify({ total: 0, byPhrase: {} }));
}