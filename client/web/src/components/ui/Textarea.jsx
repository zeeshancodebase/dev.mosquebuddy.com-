// src/components/ui/Textarea.jsx
"use client";

import { clsx } from "clsx";

export default function Textarea({
  label,
  error,
  hint,
  required = false,
  disabled = false,
  rows = 4,
  className = "",
  containerClassName = "",
  id,
  ...props
}) {
  const inputId = id || props.name;

  return (
    <div className={clsx("flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <textarea
        id={inputId}
        rows={rows}
        disabled={disabled}
        className={clsx(
          "w-full rounded-lg border bg-white text-sm text-gray-900",
          "placeholder:text-gray-400 resize-none",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
          "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
          error
            ? "border-red-400 focus:ring-red-400"
            : "border-gray-300 hover:border-gray-400",
          "px-3.5 py-2.5",
          className
        )}
        {...props}
      />

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}