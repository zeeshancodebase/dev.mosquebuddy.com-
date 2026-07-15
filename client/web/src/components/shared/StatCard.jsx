// src/components/shared/StatCard.jsx
"use client";

import { clsx } from "clsx";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "emerald",
  trend,
  trendLabel,
  loading = false,
}) {
  const iconBg = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>

          {loading ? (
            <div className="mt-2 h-8 w-24 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <p className="mt-1.5 text-3xl font-bold text-gray-900 tracking-tight">
              {value ?? "—"}
            </p>
          )}

          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}

          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {trend >= 0 ? (
                <TrendingUp size={14} className="text-emerald-500" />
              ) : (
                <TrendingDown size={14} className="text-red-500" />
              )}
              <span
                className={clsx(
                  "text-xs font-medium",
                  trend >= 0 ? "text-emerald-600" : "text-red-600"
                )}
              >
                {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-xs text-gray-400">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={clsx(
              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-4",
              iconBg[iconColor]
            )}
          >
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}