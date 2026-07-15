// src/components/ui/Badge.jsx
"use client";

import { clsx } from "clsx";
import { VERIFICATION_STATUS } from "@/lib/constants";

const variants = {
  // Verification statuses
  verified: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  community: "bg-orange-50 text-orange-700 border border-orange-200",
  needs: "bg-red-50 text-red-700 border border-red-200",
  pending: "bg-violet-50 text-violet-700 border border-violet-200",

  // General purpose
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  danger: "bg-red-50 text-red-700 border border-red-200",
  info: "bg-blue-50 text-blue-700 border border-blue-200",
  neutral: "bg-gray-100 text-gray-600 border border-gray-200",

  // Role badges
  super_admin: "bg-violet-50 text-violet-700 border border-violet-200",
  mosque_admin: "bg-blue-50 text-blue-700 border border-blue-200",
  trusted_volunteer: "bg-amber-50 text-amber-700 border border-amber-200",
  registered_user: "bg-gray-100 text-gray-600 border border-gray-200",
};

const dotColors = {
  verified: "bg-emerald-500",
  community: "bg-orange-500",
  needs: "bg-red-500",
  pending: "bg-violet-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-gray-400",
  super_admin: "bg-violet-500",
  mosque_admin: "bg-blue-500",
  trusted_volunteer: "bg-amber-500",
  registered_user: "bg-gray-400",
};

const sizes = {
  sm: "px-2 py-0.5 text-2xs font-medium rounded-md",
  md: "px-2.5 py-1 text-xs font-medium rounded-md",
  lg: "px-3 py-1.5 text-sm font-medium rounded-lg",
};

export default function Badge({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
  className = "",
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            "inline-block rounded-full flex-shrink-0",
            size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2",
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
}

// Convenience component — pass verificationStatus string directly
export function VerificationBadge({ status, size = "md" }) {
  const map = {
    verified: { variant: "verified", label: "Verified" },
    community_updated: { variant: "community", label: "Community Updated" },
    needs_update: { variant: "needs", label: "Needs Update" },
    pending_review: { variant: "pending", label: "Pending Review" },
  };

  const config = map[status] || { variant: "neutral", label: status };

  return (
    <Badge variant={config.variant} size={size} dot>
      {config.label}
    </Badge>
  );
}

// Convenience component — pass role string directly
export function RoleBadge({ role, size = "md" }) {
  const map = {
    super_admin: "Super Admin",
    mosque_admin: "Mosque Admin",
    trusted_volunteer: "Trusted Volunteer",
    registered_user: "Registered User",
  };

  return (
    <Badge variant={role} size={size}>
      {map[role] || role}
    </Badge>
  );
}



/*
What this gives you:
jsx// General badges
<Badge variant="success">Active</Badge>
<Badge variant="danger">Inactive</Badge>
<Badge variant="warning">Review</Badge>

// With dot indicator
<Badge variant="verified" dot>Verified</Badge>

// Convenience — just pass the status string from your API
<VerificationBadge status="verified" />
<VerificationBadge status="community_updated" />
<VerificationBadge status="needs_update" />
<VerificationBadge status="pending_review" />

// Role badges
<RoleBadge role="super_admin" />
<RoleBadge role="mosque_admin" />
*/