// src/components/ui/CopyToClipboard.jsx
"use client";

import { useEffect, useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import Tooltip from "@/components/ui/Tooltip";

export default function CopyToClipboard({
  value = "",
  label = "text",
  successMessage = "Copied!",
  errorMessage = "Failed to copy",
  showToast = true,
  disabled = false,
  size = 16,
  stopPropagation = true,
  copiedDurationMs = 1500,
  className = "",
}) {
  const [copied, setCopied] = useState(false);

  const text = String(value ?? "").trim();
  const isDisabled = disabled || !text;

  useEffect(() => {
    if (!copied) return;

    const timer = setTimeout(() => {
      setCopied(false);
    }, copiedDurationMs);

    return () => clearTimeout(timer);
  }, [copied, copiedDurationMs]);

  const handleCopy = async (e) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isDisabled) return;

    try {
      await navigator.clipboard.writeText(text);

      setCopied(true);

      if (showToast) {
        toast.success(successMessage);
      }
    } catch (err) {
      console.error("Failed to copy:", err);

      if (showToast) {
        toast.error(errorMessage);
      }
    }
  };

  return (
    <Tooltip content={copied ? successMessage : `Copy ${label}`}>
      <button
        type="button"
        onClick={handleCopy}
        disabled={isDisabled}
        aria-label={copied ? successMessage : `Copy ${label}`}
        className={`
          inline-flex items-center justify-center
          w-7 h-7 rounded-md
          transition-all duration-200
          cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1
          disabled:opacity-40 disabled:cursor-not-allowed
          ${
            copied
              ? "text-emerald-600 bg-emerald-50"
              : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          }
          ${className}
        `}
      >
        {copied ? (
          <CheckCircle2 size={size} />
        ) : (
          <Copy size={size} />
        )}
      </button>
    </Tooltip>
  );
}