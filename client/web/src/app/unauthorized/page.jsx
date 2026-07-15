// src/app/unauthorized/page.jsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogIn, ShieldX, LogOut } from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";
import { auth } from "@/lib/auth";
import Button from "@/components/ui/Button";

export default function UnauthorizedPage() {
  const router = useRouter();
  const isLoggedIn = auth.isLoggedIn();

  function handleSignOut() {
    auth.clearSession();
    router.replace("/login");
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: "#F0F4F2" }}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl p-10 text-center"
        style={{
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 24px -4px rgba(0,0,0,0.08)",
        }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
          >
            <ShieldX size={28} className="text-red-500" />
          </div>
        </div>

        {/* 403 */}
        <div className="mb-6">
          <p
            className="text-8xl font-black mb-2"
            style={{
              background: "linear-gradient(135deg, #DC2626, #991B1B)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1,
            }}
          >
            403
          </p>
          <h1 className="text-lg font-bold text-gray-900 mt-4 mb-2">
            Access denied
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            You do not have permission to view this page. Contact your
            administrator if you believe this is a mistake.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 my-6" />

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isLoggedIn ? (
            <>
              <Link
                href="/admin/dashboard"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                style={{ background: "#059669" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#047857")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#059669")
                }
              >
                Go to Dashboard
              </Link>
              <Button variant="secondary" onClick={handleSignOut}>
                <LogOut size={15} />
                Sign out
              </Button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
              style={{ background: "#059669" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#047857")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#059669")
              }
            >
              <LogIn size={15} />
              Sign in
            </Link>
          )}

          <Button variant="ghost">
            <ArrowLeft size={15} />
            Go back
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 mt-6">
          {APP_CONFIG.name} · {APP_CONFIG.nameArabic}
        </p>
      </div>
    </div>
  );
}
