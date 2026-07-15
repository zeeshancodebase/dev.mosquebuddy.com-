// src/app/not-found.jsx
"use client";

import Link from "next/link";
import { Building2, ArrowLeft, Search } from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: "#F0F4F2" }}
    >
      {/* Card */}
      <div
        className="w-full max-w-md bg-white rounded-2xl p-10 text-center"
        style={{
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 24px -4px rgba(0,0,0,0.08)",
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center">
            <Building2 size={22} className="text-white" />
          </div>
        </div>

        {/* 404 */}
        <div className="mb-6">
          <p
            className="text-8xl font-black mb-2"
            style={{
              background: "linear-gradient(135deg, #0C1A14, #059669)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1,
            }}
          >
            404
          </p>
          <h1 className="text-lg font-bold text-gray-900 mt-4 mb-2">
            Page not found
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 my-6" />

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href="/admin/dashboard"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
            style={{ background: "#059669" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#047857"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#059669"}
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-gray-50"
            style={{ border: "1px solid #E5E7EB" }}
          >
            <ArrowLeft size={15} />
            Back to Home
          </Link>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 mt-6">
          {APP_CONFIG.name} · {APP_CONFIG.nameArabic}
        </p>
      </div>
    </div>
  );
}