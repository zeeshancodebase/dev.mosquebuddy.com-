// src/components/ui/DateRangePicker.jsx
"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

/**
 * Single popover date range picker.
 * value: { fromDate: "YYYY-MM-DD" | "", toDate: "YYYY-MM-DD" | "" }
 * onChange: (next) => void
 */
export default function DateRangePicker({ value, onChange, className = "" }) {
  const { fromDate, toDate } = value;
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const base = fromDate ? new Date(fromDate + "T00:00:00") : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [hoverDate, setHoverDate] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fromObj = fromDate ? new Date(fromDate + "T00:00:00") : null;
  const toObj = toDate ? new Date(toDate + "T00:00:00") : null;

  function handleDayClick(day) {
    if (!day) return;

    // Fresh selection or both already set → start new range
    if (!fromObj || (fromObj && toObj)) {
      onChange({ fromDate: toISODate(day), toDate: "" });
      return;
    }

    // Only "from" is set → this click sets "to"
    if (day < fromObj) {
      // Clicked before the start → flip range
      onChange({ fromDate: toISODate(day), toDate: toISODate(fromObj) });
    } else {
      onChange({ fromDate: toISODate(fromObj), toDate: toISODate(day) });
    }
    setOpen(false);
  }

  function isInRange(day) {
    if (!day || !fromObj) return false;
    const end = toObj || hoverDate;
    if (!end) return false;
    const lo = fromObj < end ? fromObj : end;
    const hi = fromObj < end ? end : fromObj;
    return day >= lo && day <= hi;
  }

  function isEndpoint(day) {
    if (!day) return false;
    return (
      (fromObj && day.toDateString() === fromObj.toDateString()) ||
      (toObj && day.toDateString() === toObj.toDateString())
    );
  }

  function shiftMonth(delta) {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  function handleClear(e) {
    e.stopPropagation();
    onChange({ fromDate: "", toDate: "" });
  }

  const cells = getMonthGrid(viewDate.getFullYear(), viewDate.getMonth());
  const hasValue = fromDate || toDate;

  const label = !hasValue
    ? "All time"
    : fromDate && toDate
    ? `${formatDisplay(fromDate)} – ${formatDisplay(toDate)}`
    : `${formatDisplay(fromDate)} – ...`;

  return (
    <div className={clsx("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "w-full flex items-center gap-2 rounded-lg border bg-white text-sm",
          "px-3.5 py-2.5 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
          open ? "border-emerald-500 ring-2 ring-emerald-500" : "border-gray-300 hover:border-gray-400"
        )}
      >
        <Calendar size={15} className="text-gray-400 flex-shrink-0" />
        <span className={clsx("flex-1 text-left truncate", hasValue ? "text-gray-900" : "text-gray-400")}>
          {label}
        </span>
        {hasValue && (
          <span
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 cursor-pointer"
          >
            <X size={14} />
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 bg-white rounded-xl border border-gray-200 p-4"
          style={{ boxShadow: "0 10px 40px -5px rgba(0,0,0,0.12)", width: "300px" }}
        >
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-gray-900">
              {viewDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 mb-1">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="text-2xs font-semibold text-gray-400 text-center py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1" onMouseLeave={() => setHoverDate(null)}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;

              const inRange = isInRange(day);
              const endpoint = isEndpoint(day);
              const isToday = day.toDateString() === new Date().toDateString();

              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => setHoverDate(day)}
                  className={clsx(
                    "h-8 w-8 text-xs rounded-lg flex items-center justify-center mx-auto transition-colors",
                    endpoint && "bg-emerald-600 text-white font-semibold",
                    !endpoint && inRange && "bg-emerald-50 text-emerald-700",
                    !endpoint && !inRange && "text-gray-700 hover:bg-gray-100",
                    isToday && !endpoint && "ring-1 ring-emerald-400"
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {fromDate && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {toDate ? "Range selected" : "Pick an end date"}
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}