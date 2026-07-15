// src/components/shared/PageHeader.jsx
"use client";

import { clsx } from "clsx";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  className = "",
}) {
  return (
    <div className={clsx("mb-6", className)}>
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight size={14} className="text-gray-400" />
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-xs text-gray-400">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}