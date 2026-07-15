// src/lib/timeUtils.js

// "13:30" → "1:30 PM"
export function to12hr(time24) {
  if (!time24 || !time24.includes(":")) return "—";
  const [hourStr, minute] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  if (isNaN(hour)) return "—";
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
}

// "1:30 PM" → "13:30"
export function to24hr(time12) {
  if (!time12 || typeof time12 !== "string") return "";
  const upper = time12.trim().toUpperCase();
  const match = upper.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return "";
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const period = match[3];
  if (period === "AM") {
    if (hour === 12) hour = 0;
  } else {
    if (hour !== 12) hour += 12;
  }
  return `${String(hour).padStart(2, "0")}:${minute}`;
}