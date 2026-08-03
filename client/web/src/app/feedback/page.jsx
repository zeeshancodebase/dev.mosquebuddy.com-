// src/app/feedback/page.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { APP_CONFIG } from "@/lib/constants";

const FEEDBACK_TYPES = [
  { key: "general", label: "General", icon: "💬" },
  { key: "bug", label: "Bug Report", icon: "🐛" },
  { key: "feature_request", label: "Feature Request", icon: "✨" },
  { key: "data_quality", label: "Wrong Data", icon: "🕌" },
  { key: "other", label: "Other", icon: "📝" },
];

const RATING_LABELS = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Great", 5: "Excellent" };

function StarRating({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? null : star)}
          className="p-1 text-3xl leading-none transition-transform"
          style={{ color: star <= (value || 0) ? "#D4A843" : "#E5E7EB" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          ★
        </button>
      ))}
      {value && (
        <span className="text-sm font-semibold ml-2" style={{ color: "#374151" }}>
          {RATING_LABELS[value]}
        </span>
      )}
    </div>
  );
}

export default function FeedbackPage() {
  const [type, setType] = useState("general");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = message.trim().length > 0 && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await api.post("/feedback", {
        type,
        message: message.trim(),
        ...(rating && { rating }),
      });
      setSubmitted(true);
    } catch (err) {
      // api.js already shows a toast on failure — nothing else to do here
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#F0F4F2" }}>
        <div
          className="w-full max-w-md rounded-2xl p-10 text-center"
          style={{ background: "white", border: "1px solid #E5E7EB", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "#ECFDF5" }}
          >
            <CheckCircle2 size={30} style={{ color: "#059669" }} />
          </div>
          <h1 className="text-2xl font-black mb-3" style={{ color: "#0C1A14" }}>
            JazakAllahu Khair
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            Your feedback helps us make {APP_CONFIG.name} better for every Muslim.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#059669" }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#F0F4F2" }}>
      {/* Header */}
      <div className="py-12 px-6" style={{ background: "#0C1A14" }}>
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium mb-6"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            <ArrowLeft size={16} /> Back
          </Link>
          <h1 className="text-3xl font-black text-white mb-2">Send Feedback</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            Help us improve {APP_CONFIG.name} — every message is read.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 md:p-8"
          style={{ background: "white", border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        >
          {/* Type */}
          <p className="text-xs font-bold tracking-wide mb-3" style={{ color: "#6B7280" }}>
            WHAT IS THIS ABOUT?
          </p>
          <div className="flex flex-wrap gap-2 mb-8">
            {FEEDBACK_TYPES.map((t) => {
              const active = type === t.key;
              return (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                  style={{
                    background: active ? "#ECFDF5" : "white",
                    border: `1.5px solid ${active ? "#059669" : "#E5E7EB"}`,
                    color: active ? "#059669" : "#374151",
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  <span>{t.icon}</span> {t.label}
                </button>
              );
            })}
          </div>

          {/* Rating */}
          <p className="text-xs font-bold tracking-wide mb-3" style={{ color: "#6B7280" }}>
            RATE YOUR EXPERIENCE (OPTIONAL)
          </p>
          <div
            className="rounded-xl p-4 mb-8"
            style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB" }}
          >
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* Message */}
          <p className="text-xs font-bold tracking-wide mb-3" style={{ color: "#6B7280" }}>
            YOUR MESSAGE
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              type === "bug"
                ? "Describe what happened and what you expected instead..."
                : type === "feature_request"
                ? "What would make Sabeel more useful for you?"
                : type === "data_quality"
                ? "Tell us which mosque or timing has wrong information..."
                : "Share anything — what you love, what could be better, or ideas..."
            }
            maxLength={1000}
            rows={6}
            className="w-full rounded-xl p-4 text-sm resize-none focus:outline-none"
            style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", color: "#111827" }}
          />
          <p className="text-xs text-right mt-1 mb-8" style={{ color: "#9CA3AF" }}>
            {message.length}/1000
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-4 rounded-xl text-sm font-bold text-white transition-opacity"
            style={{
              background: "#059669",
              opacity: canSubmit ? 1 : 0.5,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            {submitting ? "Sending..." : "Send Feedback"}
          </button>

          <p className="text-xs text-center mt-5" style={{ color: "#9CA3AF" }}>
            For urgent issues with mosque timings, please use "Report Wrong Timing"
            on the mosque page in the app instead.
          </p>
        </form>
      </div>
    </div>
  );
}