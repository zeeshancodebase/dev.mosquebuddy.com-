// src/app/login/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Building2 } from "lucide-react";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { APP_CONFIG } from "@/lib/constants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", {
        identifier: form.email,
        password: form.password,
      });
      auth.setSession(res.token, res.data);
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "#F0F4F2" }}
    >
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-12"
        style={{ backgroundColor: "#0C1A14" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg">
            <Building2 size={20} className="text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-bold text-base tracking-wide">
              {APP_CONFIG.name}
            </span>
            <span className="text-sm" style={{ color: "#34D399" }}>
              {APP_CONFIG.nameArabic}
            </span>
          </div>
        </div>

        {/* Middle content */}
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ backgroundColor: "#1E3D2F", color: "#34D399" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Admin Panel
          </div>
          <h1 className="text-3xl font-bold text-white leading-snug mb-4">
            Manage mosque data with confidence
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#6B9E85" }}>
            {APP_CONFIG.tagline}. Keep prayer timings accurate, trustworthy, and up to date for every Muslim who depends on them.
          </p>

          {/* Stats row */}
          <div className="flex gap-6 mt-10">
            {[
              { label: "Prayer venues", value: "50+" },
              { label: "Daily timings", value: "250+" },
              { label: "Cities", value: "1" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "#6B9E85" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="text-xs" style={{ color: "#3D6B54" }}>
          © {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Building2 size={17} className="text-white" />
            </div>
            <span className="text-gray-900 font-bold text-base">
              {APP_CONFIG.name}
            </span>
          </div>

          {/* Form card */}
          <div
            className="bg-white rounded-2xl p-8"
            style={{
              border: "1px solid #E5E7EB",
              boxShadow: "0 4px 24px -4px rgba(0,0,0,0.08)",
            }}
          >
            <div className="mb-7">
              <h2 className="text-xl font-bold text-gray-900">
                Sign in to your account
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Enter your credentials to access the admin panel.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Email address"
                name="email"
                // type="email"
                placeholder="admin@example.com"
                icon={Mail}
                required
                value={form.email}
                onChange={handleChange}
                disabled={loading}
              />

              {/* Password with show/hide */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-gray-400" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-gray-400 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "#DC2626",
                  }}
                >
                  <span className="mt-0.5 flex-shrink-0">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                fullWidth
                loading={loading}
                size="lg"
                className="mt-1"
              >
                Sign in
              </Button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
              Access restricted to authorized administrators only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}