// src/components/ui/Input.jsx
"use client";

import { clsx } from "clsx";

export default function Input({
  label,
  error,
  hint,
  icon: Icon,
  iconPosition = "left",
  required = false,
  disabled = false,
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
          {required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
      )}

      <div className="relative">
        {Icon && iconPosition === "left" && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon size={16} className="text-gray-400" />
          </div>
        )}

        <input
          id={inputId}
          disabled={disabled}
          className={clsx(
            "w-full rounded-lg border bg-white text-sm text-gray-900",
            "placeholder:text-gray-400",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 focus:border-emerald-500",
            "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
            error
              ? "border-red-400 focus:ring-red-400 focus:border-red-400"
              : "border-gray-300 hover:border-gray-400",
            Icon && iconPosition === "left" ? "pl-10" : "pl-3.5",
            Icon && iconPosition === "right" ? "pr-10" : "pr-3.5",
            "py-2.5",
            className
          )}
          {...props}
        />

        {Icon && iconPosition === "right" && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Icon size={16} className="text-gray-400" />
          </div>
        )}
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