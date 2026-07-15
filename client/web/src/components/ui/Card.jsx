// src/components/ui/Card.jsx
"use client";

import { clsx } from "clsx";

export default function Card({
  children,
  className = "",
  padding = true,
  hover = false,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-white rounded-xl border border-gray-200",
        "shadow-[0_1px_3px_0_rgba(0,0,0,0.06),0_1px_2px_-1px_rgba(0,0,0,0.04)]",
        padding && "p-6",
        hover &&
          "cursor-pointer transition-shadow duration-200 hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.08)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = "" }) {
  return (
    <div className={clsx("flex items-start justify-between mb-5", className)}>
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  );
}

export function CardDivider() {
  return <hr className="border-gray-100 my-5" />;
}