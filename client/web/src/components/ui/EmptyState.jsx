// src/components/ui/EmptyState.jsx
"use client";

import { clsx } from "clsx";
import { Inbox } from "lucide-react";
import Button from "./Button";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "No data found",
  description,
  action,
  actionLabel,
  className = "",
}) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={24} className="text-gray-400" />
      </div>

      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>

      {description && (
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {action && actionLabel && (
        <div className="mt-5">
          <Button onClick={action} size="sm">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}