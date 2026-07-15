// src/components/ui/TimeInput.jsx
"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { to12hr, to24hr } from "@/lib/timeUtils";

// Accepts value as "HH:mm" 24hr string (matches what the form state holds)
// Fires onChange with a synthetic event: { target: { name, value } }
// where value is always "HH:mm" 24hr — identical to what <input type="time"> fires
export default function TimeInput({
  label,
  name,
  value = "", // 24hr string e.g. "13:30" or ""
  onChange,
  required = false,
  hint,
  disabled = false,
}) {
  // Internal state in 12hr parts
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [period, setPeriod] = useState("AM");
  const [touched, setTouched] = useState(false);

  // Sync from external 24hr value into internal 12hr parts
  useEffect(() => {
    if (value && value.includes(":")) {
      const display = to12hr(value); // "1:30 PM"
      const match = display.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
      if (match) {
        setHour(match[1]);
        setMinute(match[2]);
        setPeriod(match[3]);
      }
    } else if (!value) {
      // Reset when form resets
      setHour("");
      setMinute("");
      setPeriod("AM");
      setTouched(false);
    }
  }, [value]);

  function fire(h, m, p) {
    if (!h || !m) return;

    const time12 = `${h}:${m} ${p}`;
    const time24 = to24hr(time12);

    if (onChange && time24) {
      onChange({
        target: { name, value: time24 },
      });
    }
  }

  function handleHourChange(e) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);

    setHour(val);
    setTouched(true);
  }

  function handleHourBlur() {
    if (!hour) return;

    let h = parseInt(hour, 10);

    if (isNaN(h)) {
      setHour("");
      return;
    }

    if (h < 1) h = 1;
    if (h > 12) h = 12;

    const finalHour = String(h);

    setHour(finalHour);

    if (minute) {
      fire(finalHour, minute, period);
    }
  }

  function handleMinuteChange(e) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);

    setMinute(val);
    setTouched(true);
  }

  function handleMinuteBlur() {
    if (!minute) return;

    let m = parseInt(minute, 10);

    if (isNaN(m)) {
      setMinute("");
      return;
    }

    if (m > 59) m = 59;

    const finalMinute = String(m).padStart(2, "0");

    setMinute(finalMinute);

    if (hour) {
      fire(hour, finalMinute, period);
    }
  }

  function togglePeriod() {
    const next = period === "AM" ? "PM" : "AM";
    setPeriod(next);
    setTouched(true);
    fire(hour, minute, next);
  }

  const isEmpty = !touched && !value;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={clsx(
          "flex items-center rounded-lg border bg-white transition-all duration-200",
          "focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500",
          disabled
            ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
            : "border-gray-300 hover:border-gray-400",
        )}
      >
        {/* Hour */}
        <input
          type="text"
          inputMode="numeric"
          placeholder="HH"
          value={hour}
          onChange={handleHourChange}
          onBlur={handleHourBlur}
          disabled={disabled}
          maxLength={2}
          className={clsx(
            "w-10 text-center text-sm font-semibold text-gray-900 bg-transparent",
            "focus:outline-none py-2.5 pl-3",
            disabled && "cursor-not-allowed",
          )}
        />

        <span className="text-gray-400 font-bold text-sm select-none">:</span>

        {/* Minute */}
        <input
          type="text"
          inputMode="numeric"
          placeholder="MM"
          value={minute}
          onChange={handleMinuteChange}
          onBlur={handleMinuteBlur}
          disabled={disabled}
          maxLength={2}
          className={clsx(
            "w-10 text-center text-sm font-semibold text-gray-900 bg-transparent",
            "focus:outline-none py-2.5",
            disabled && "cursor-not-allowed",
          )}
        />

        {/* AM/PM toggle */}
        <button
          type="button"
          onClick={togglePeriod}
          disabled={disabled}
          className={clsx(
            "ml-1 mr-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold tracking-wide",
            "transition-colors duration-150 select-none",
            disabled
              ? "cursor-not-allowed text-gray-400"
              : period === "AM"
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "bg-gray-800 text-white hover:bg-gray-700",
          )}
        >
          {period}
        </button>
      </div>

      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
