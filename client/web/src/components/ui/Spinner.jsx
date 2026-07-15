// src/components/ui/Spinner.jsx
"use client";

import { clsx } from "clsx";

const sizes = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-[3px]",
  xl: "w-12 h-12 border-4",
};

export default function Spinner({ size = "md", className = "" }) {
  return (
    <div
      className={clsx(
        "rounded-full border-gray-200 border-t-emerald-600 animate-spin",
        sizes[size],
        className
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}