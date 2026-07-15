// src/components/ui/Select.jsx
"use client";

import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";

export default function Select({
  label,
  error,
  hint,
  required = false,
  disabled = false,
  placeholder = "Select an option",
  options = [],
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

      <div className="relative">
        <select
          id={inputId}
          disabled={disabled}
          className={clsx(
            "w-full rounded-lg border bg-white text-sm text-gray-900",
            "appearance-none cursor-pointer",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
            "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
            error
              ? "border-red-400 focus:ring-red-400"
              : "border-gray-300 hover:border-gray-400",
            "pl-3.5 pr-10 py-2.5",
            className
          )}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>

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