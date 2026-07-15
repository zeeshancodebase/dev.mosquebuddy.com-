// src/components/ui/Toggle.jsx
"use client";

import clsx from "clsx";
import { useId } from "react";

/**
 * Toggle
 *
 * A controlled on/off switch component.
 *
 * Props:
 *   checked       boolean              — controlled state
 *   onChange      (checked) => void    — called with new boolean
 *   label         string               — label text shown beside the toggle
 *   description   string               — optional secondary line below label
 *   disabled      boolean
 *   size          "sm" | "md"          — default "md"
 *   id            string               — optional, auto-generated if not provided
 */
export default function Toggle({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  size = "md",
  id,
}) {
  const uid = useId();
  const toggleId = id || uid;

  const sizes = {
    sm: {
      track: "h-4 w-7",
      thumb: "h-3 w-3",
      translate: "translate-x-3",
    },
    md: {
      track: "h-5 w-9",
      thumb: "h-4 w-4",
      translate: "translate-x-4",
    },
  };

  const s = sizes[size] || sizes.md;

  function handleClick() {
    if (disabled) return;
    onChange?.(!checked);
  }

  return (
    <div
      className={clsx(
        "flex items-center gap-3",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={clsx(
          "relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent",
          "transition-colors duration-200 ease-in-out",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1",
          s.track,
          checked ? "bg-emerald-500" : "bg-gray-300",
          disabled && "cursor-not-allowed"
        )}
      >
        <span
          className={clsx(
            "pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
            s.thumb,
            checked ? s.translate : "translate-x-0"
          )}
        />
      </button>

      {(label || description) && (
        <label
          htmlFor={toggleId}
          className={clsx(
            "flex flex-col",
            !disabled && "cursor-pointer select-none"
          )}
        >
          {label && (
            <span className="text-sm font-medium text-gray-800">{label}</span>
          )}
          {description && (
            <span className="text-xs text-gray-500">{description}</span>
          )}
        </label>
      )}
    </div>
  );
}