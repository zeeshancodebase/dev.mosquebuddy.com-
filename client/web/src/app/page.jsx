// src/app/page.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  CheckCircle,
  Navigation,
  ChevronRight,
  Star,
  Users,
  Building2,
  Smartphone,
  Globe,
  Shield,
  ArrowRight,
  Menu,
  X,
  Moon,
  Search,
} from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";

// ── Utility: scroll reveal hook ───────────────────────────
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// ── Reveal wrapper ────────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Islamic geometric pattern SVG ─────────────────────────
function IslamicPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.04]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="islamic"
          x="0"
          y="0"
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M40 0 L80 40 L40 80 L0 40 Z"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <path
            d="M40 10 L70 40 L40 70 L10 40 Z"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <path
            d="M40 20 L60 40 L40 60 L20 40 Z"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <circle
            cx="40"
            cy="40"
            r="3"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <circle
            cx="0"
            cy="0"
            r="3"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <circle
            cx="80"
            cy="0"
            r="3"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <circle
            cx="0"
            cy="80"
            r="3"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <circle
            cx="80"
            cy="80"
            r="3"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islamic)" />
    </svg>
  );
}

// ── Floating orb ──────────────────────────────────────────
function Orb({ className }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-20 ${className}`}
      style={{ background: "radial-gradient(circle, #059669, transparent)" }}
    />
  );
}

// ── Phone mockup ──────────────────────────────────────────
function PhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 260, height: 520 }}>
      {/* Glow behind phone */}
      <div
        className="absolute inset-0 rounded-[40px] blur-2xl opacity-30"
        style={{
          background: "#059669",
          transform: "scale(0.85) translateY(20px)",
        }}
      />

      {/* Phone shell */}
      <div
        className="relative w-full h-full rounded-[40px] border-2 overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #1a1a2e, #0f3d2e)",
          borderColor: "#2D5A45",
          boxShadow:
            "0 40px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {/* Status bar */}
        <div className="flex justify-between items-center px-6 pt-4 pb-2">
          <span className="text-white text-xs font-medium opacity-70">
            9:41
          </span>
          <div className="w-20 h-5 rounded-full bg-black flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-600" />
          </div>
          <div className="flex gap-1 opacity-70">
            <div className="w-4 h-2.5 rounded-sm border border-white" />
          </div>
        </div>

        {/* App header */}
        <div className="px-5 pt-2 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white text-xs opacity-60">Assalamu Alaikum</p>
              <p className="text-white text-sm font-bold">Ahmad</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
          </div>

          {/* Next prayer card */}
          <div
            className="rounded-2xl p-4 mb-3"
            style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
          >
            <p className="text-emerald-100 text-xs mb-1">Next Prayer</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white text-xl font-bold">Asr</p>
                <p className="text-emerald-200 text-xs">Jamā'ah at 4:45 PM</p>
              </div>
              <div className="text-right">
                <p className="text-white text-lg font-mono font-bold">2:14</p>
                <p className="text-emerald-200 text-xs">remaining</p>
              </div>
            </div>
          </div>

          {/* Mosque cards */}
          <p className="text-white text-xs font-semibold mb-2 opacity-70">
            NEARBY MOSQUES
          </p>
          {[
            {
              name: "Masjid Al-Noor",
              area: "BTM Layout",
              time: "4:45 PM",
              dist: "0.8 km",
              verified: true,
            },
            {
              name: "Masjid Ibrahim",
              area: "Jayanagar",
              time: "4:50 PM",
              dist: "1.2 km",
              verified: true,
            },
            {
              name: "Islamic Center",
              area: "Koramangala",
              time: "5:00 PM",
              dist: "2.1 km",
              verified: false,
            },
          ].map((mosque, i) => (
            <div
              key={i}
              className="rounded-xl p-3 mb-2 flex items-center justify-between"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-900 flex items-center justify-center">
                  <Building2 size={12} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">
                    {mosque.name}
                  </p>
                  <p className="text-xs opacity-50 text-white">
                    {mosque.area} · {mosque.dist}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 text-xs font-mono font-bold">
                  {mosque.time}
                </p>
                {mosque.verified && (
                  <p className="text-emerald-500 text-xs opacity-70">
                    ✓ verified
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Jumu'ah badge */}
      <div
        className="absolute -right-8 top-24 rounded-2xl px-3 py-2 text-xs font-semibold"
        style={{
          background: "linear-gradient(135deg, #059669, #047857)",
          color: "white",
          boxShadow: "0 8px 24px rgba(5,150,105,0.4)",
          animation: "float 3s ease-in-out infinite",
        }}
      >
        <p className="text-xs opacity-80">Jumu'ah</p>
        <p className="font-bold">1:20 PM</p>
      </div>

      {/* Floating verified badge */}
      <div
        className="absolute -left-10 bottom-32 rounded-2xl px-3 py-2 text-xs"
        style={{
          background: "rgba(255,255,255,0.95)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          animation: "float 3s ease-in-out infinite 1.5s",
        }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
            <CheckCircle size={10} className="text-white" />
          </div>
          <span className="text-gray-800 font-semibold text-xs">Verified</span>
        </div>
      </div>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(12,26,20,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Building2 size={16} className="text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-bold text-sm">
              {APP_CONFIG.name}
            </span>
            <span
              className="text-xs"
              style={{ color: "#34D399", lineHeight: 1 }}
            >
              {APP_CONFIG.nameArabic}
            </span>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Features", href: "#features" },
            { label: "For Mosques", href: "#mosques" },
            { label: "How it works", href: "#how" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: "rgba(255,255,255,0.65)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(255,255,255,0.65)")
              }
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={APP_CONFIG.playStoreLink}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200"
            style={{ background: "#059669" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#047857")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#059669")}
          >
            Download App
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden px-6 pb-6 pt-2"
          style={{ background: "rgba(12,26,20,0.98)" }}
        >
          {[
            { label: "Features", href: "#features" },
            { label: "For Mosques", href: "#mosques" },
            { label: "How it works", href: "#how" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-sm font-medium border-b"
              style={{
                color: "rgba(255,255,255,0.7)",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              {item.label}
            </a>
          ))}
          <a
            href={APP_CONFIG.playStoreLink}
            onClick={() => setMobileOpen(false)}
            className="block mt-4 px-4 py-3 rounded-xl text-sm font-semibold text-white text-center"
            style={{ background: "#059669" }}
          >
            Download App
          </a>
        </div>
      )}
    </nav>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div
      className="overflow-x-hidden"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* Global animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(5,150,105,0.3); }
          50% { box-shadow: 0 0 40px rgba(5,150,105,0.6); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        html { scroll-behavior: smooth; }
      `}</style>

      <Navbar />

      {/* ── HERO ───────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0C1A14 0%, #0a2018 50%, #071510 100%)",
        }}
      >
        <IslamicPattern />
        <Orb className="w-96 h-96 -top-20 -left-20" />
        <Orb className="w-80 h-80 bottom-20 right-10" />

        <div className="relative max-w-6xl mx-auto px-6 py-32 grid lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left content */}
          <div>
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
              style={{
                background: "rgba(5,150,105,0.15)",
                border: "1px solid rgba(5,150,105,0.3)",
                color: "#34D399",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Now available · Find mosques near you
            </div>

            {/* Headline */}
            <h1
              className="text-5xl lg:text-6xl font-black leading-tight mb-6"
              style={{ color: "white", letterSpacing: "-0.02em" }}
            >
              Never miss
              <span
                className="block"
                style={{
                  background: "linear-gradient(135deg, #34D399, #059669)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {/* Jamā'ah again */}
                Jamā&apos;ah again
              </span>
            </h1>

            {/* Subline */}
            <p
              className="text-lg leading-relaxed mb-10 max-w-lg"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              {APP_CONFIG.descriptionPublic} Real timings. Verified sources. For
              every Muslim, everywhere.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mb-12">
              <a
                href={APP_CONFIG.playStoreLink}
                className="flex items-center gap-3 px-6 py-3.5 rounded-2xl text-white font-semibold transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #059669, #047857)",
                  boxShadow: "0 8px 32px rgba(5,150,105,0.35)",
                  animation: "pulse-glow 3s ease-in-out infinite",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <Smartphone size={20} />
                <div className="text-left">
                  <p className="text-xs opacity-75 leading-tight">Get it on</p>
                  <p className="text-sm font-bold leading-tight">Google Play</p>
                </div>
              </a>
              <a
                href={APP_CONFIG.appStoreLink}
                className="flex items-center gap-3 px-6 py-3.5 rounded-2xl font-semibold transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "white",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.14)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Globe size={20} />
                <div className="text-left">
                  <p className="text-xs opacity-75 leading-tight">
                    Coming soon on
                  </p>
                  <p className="text-sm font-bold leading-tight">App Store</p>
                </div>
              </a>
            </div>

            {/* Social proof numbers */}
            <div className="flex gap-8">
              {[
                { value: "50+", label: "Mosques listed" },
                { value: "5", label: "Daily prayers tracked" },
                { value: "1", label: "City at launch" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Phone mockup */}
          <div className="hidden lg:flex justify-center items-center">
            <PhoneMockup />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            Scroll to explore
          </p>
          <div
            className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5"
            style={{ borderColor: "rgba(255,255,255,0.2)" }}
          >
            <div
              className="w-1 h-2 rounded-full"
              style={{
                background: "#059669",
                animation: "float 1.5s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      </section>

      {/* ── PROBLEM STATEMENT ──────────────────────────── */}
      <section className="py-24" style={{ background: "#F8FAF9" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6"
              style={{
                background: "#ECFDF5",
                color: "#059669",
                border: "1px solid #A7F3D0",
              }}
            >
              <Moon size={13} />
              The real problem
            </div>
            <h2
              className="text-4xl lg:text-5xl font-black mb-6"
              style={{ color: "#0C1A14", letterSpacing: "-0.02em" }}
            >
              Muslims shouldn't have to
              <span style={{ color: "#059669" }}> guess</span> prayer times
            </h2>
            <p
              className="text-lg leading-relaxed max-w-2xl mx-auto"
              style={{ color: "#6B7280" }}
            >
              General prayer apps show calculated times — not the actual Jamā'ah
              time at your local mosque. Every mosque sets its own timing.
              Finding the right one means calling ahead, checking WhatsApp
              groups, or showing up and hoping.
            </p>
          </Reveal>

          {/* Pain points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {[
              {
                icon: Clock,
                title: "Wrong timings everywhere",
                desc: "Apps show calculated astronomical times, not actual mosque Jamā'ah times.",
                color: "#DC2626",
                bg: "#FEF2F2",
              },
              {
                icon: Search,
                title: "No central directory",
                desc: "No single place to find all mosques in your area with accurate timings.",
                color: "#EA580C",
                bg: "#FFF7ED",
              },
              {
                icon: Users,
                title: "Missing Jumu'ah",
                desc: "Different mosques hold Jumu'ah at different times. Missing it means waiting a week.",
                color: "#7C3AED",
                bg: "#F5F3FF",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <Reveal key={i} delay={i * 150}>
                  <div
                    className="p-6 rounded-2xl text-left transition-all duration-200"
                    style={{
                      background: "white",
                      border: "1px solid #E5E7EB",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "translateY(-4px)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "translateY(0)")
                    }
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: item.bg }}
                    >
                      <Icon size={20} style={{ color: item.color }} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────── */}
      <section id="how" className="py-24" style={{ background: "white" }}>
        <div className="max-w-5xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6"
                style={{
                  background: "#ECFDF5",
                  color: "#059669",
                  border: "1px solid #A7F3D0",
                }}
              >
                Simple as 1, 2, 3
              </div>
              <h2
                className="text-4xl font-black mb-4"
                style={{ color: "#0C1A14", letterSpacing: "-0.02em" }}
              >
                How {APP_CONFIG.name} works
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                From opening the app to reaching the mosque in under a minute.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div
              className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px"
              style={{
                background: "linear-gradient(90deg, #059669, #34D399, #059669)",
              }}
            />

            {[
              {
                step: "01",
                icon: MapPin,
                title: "Find mosques near you",
                desc: `Open ${APP_CONFIG.name} and instantly see all mosques and prayer venues in your area, sorted by distance.`,
              },
              {
                step: "02",
                icon: Clock,
                title: "Check real timings",
                desc: "See actual Jamā'ah and Jumu'ah timings — verified by mosque admins, not calculated estimates.",
              },
              {
                step: "03",
                icon: Navigation,
                title: "Get there on time",
                desc: "One tap opens directions. See how long you have before the next Jamā'ah starts.",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <Reveal key={i} delay={i * 200}>
                  <div className="text-center relative">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 relative"
                      style={{
                        background: "linear-gradient(135deg, #0C1A14, #1E3D2F)",
                        boxShadow: "0 8px 32px rgba(5,150,105,0.2)",
                      }}
                    >
                      <Icon size={28} className="text-emerald-400" />
                      <span
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-black flex items-center justify-center"
                        style={{ background: "#059669", color: "white" }}
                      >
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────── */}
      <section
        id="features"
        className="py-24"
        style={{ background: "#F8FAF9" }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6"
                style={{
                  background: "#ECFDF5",
                  color: "#059669",
                  border: "1px solid #A7F3D0",
                }}
              >
                Everything you need
              </div>
              <h2
                className="text-4xl font-black mb-4"
                style={{ color: "#0C1A14", letterSpacing: "-0.02em" }}
              >
                Built for Muslim life
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Every feature is designed around one goal — helping you pray in
                congregation, on time, every day.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: MapPin,
                title: "Mosque Discovery",
                desc: "Find every mosque, musalla, Islamic center, and prayer room near you. All venue types supported.",
                color: "#059669",
                bg: "#ECFDF5",
                tag: "Core",
              },
              {
                icon: Clock,
                title: "Real Jamā'ah Timings",
                desc: "Actual congregation times from mosque admins — not astronomical calculations. For all 5 daily prayers.",
                color: "#2563EB",
                bg: "#EFF6FF",
                tag: "Core",
              },
              {
                icon: Star,
                title: "Jumu'ah Timings",
                desc: "Multiple Friday prayer slots, khutbah times, language information, and women's space availability.",
                color: "#7C3AED",
                bg: "#F5F3FF",
                tag: "Core",
              },
              {
                icon: CheckCircle,
                title: "Verified Data",
                desc: "Every timing shows its verification status — Verified, Community Updated, or Needs Update.",
                color: "#059669",
                bg: "#ECFDF5",
                tag: "Trust",
              },
              {
                icon: Navigation,
                title: "One-tap Directions",
                desc: "Instantly open directions to any mosque. Never get lost looking for a new masjid.",
                color: "#EA580C",
                bg: "#FFF7ED",
                tag: "Convenience",
              },
              {
                icon: Users,
                title: "Women's Space Info",
                desc: "Know in advance whether a mosque has space for women, for Jumu'ah or daily prayers.",
                color: "#D97706",
                bg: "#FFFBEB",
                tag: "Inclusivity",
              },
              {
                icon: Building2,
                title: "Venue Profiles",
                desc: "Wudu facilities, parking, contact info, important notices — everything before you arrive.",
                color: "#0891B2",
                bg: "#ECFEFF",
                tag: "Info",
              },
              {
                icon: Shield,
                title: "Report & Correct",
                desc: "Wrong timing? Report it in seconds. Community-driven accuracy with admin oversight.",
                color: "#DC2626",
                bg: "#FEF2F2",
                tag: "Community",
              },
              {
                icon: Moon,
                title: "Ramadan & Eid",
                desc: "Special timings for Tarawih, Qiyam, and Eid prayers. Coming soon.",
                color: "#7C3AED",
                bg: "#F5F3FF",
                tag: "Coming Soon",
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Reveal key={i} delay={(i % 3) * 100}>
                  <div
                    className="p-6 rounded-2xl transition-all duration-200 h-full"
                    style={{
                      background: "white",
                      border: "1px solid #E5E7EB",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow =
                        "0 12px 32px rgba(0,0,0,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(0,0,0,0.04)";
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ background: feature.bg }}
                      >
                        <Icon size={20} style={{ color: feature.color }} />
                      </div>
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background:
                            feature.tag === "Coming Soon"
                              ? "#F5F3FF"
                              : "#F3F4F6",
                          color:
                            feature.tag === "Coming Soon"
                              ? "#7C3AED"
                              : "#6B7280",
                        }}
                      >
                        {feature.tag}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOR MOSQUE ADMINS ──────────────────────────── */}
      <section
        id="mosques"
        className="py-24 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0C1A14 0%, #0a2018 100%)",
        }}
      >
        <IslamicPattern />
        <Orb className="w-96 h-96 -bottom-20 -right-20" />

        <div className="relative max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <div>
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6"
                  style={{
                    background: "rgba(5,150,105,0.15)",
                    border: "1px solid rgba(5,150,105,0.3)",
                    color: "#34D399",
                  }}
                >
                  <Building2 size={13} />
                  For Mosque Admins
                </div>
                <h2
                  className="text-4xl font-black text-white mb-6"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  Put your mosque
                  <span style={{ color: "#34D399" }}> on the map</span>
                </h2>
                <p
                  className="text-lg mb-8"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Help your community find you. Keep your timings accurate.
                  Reach Muslims who are new to the area, traveling, or simply
                  looking for the nearest mosque.
                </p>

                <div className="flex flex-col gap-4 mb-10">
                  {[
                    "List your mosque with accurate daily timings",
                    "Manage Jumu'ah slots and khutbah times",
                    "Update timings instantly from your phone",
                    "Reach Muslims searching near your location",
                    "Verification badge builds community trust",
                  ].map((point, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={12} className="text-white" />
                      </div>
                      <p
                        className="text-sm"
                        style={{ color: "rgba(255,255,255,0.75)" }}
                      >
                        {point}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={APP_CONFIG.mosqueAdminLink}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                    style={{ background: "#059669" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#047857";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#059669";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    Register your mosque
                    <ArrowRight size={16} />
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "white",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.14)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.08)")
                    }
                  >
                    Learn more
                  </a>
                </div>
              </div>
            </Reveal>

            {/* Admin feature cards */}
            <Reveal delay={200}>
              <div className="flex flex-col gap-4">
                {[
                  {
                    icon: Clock,
                    title: "Real-time updates",
                    desc: "Change a timing and it reflects instantly for all users nearby.",
                  },
                  {
                    icon: Shield,
                    title: "Verified badge",
                    desc: "Mosque admin updates earn the Verified status — building trust with your community.",
                  },
                  {
                    icon: Users,
                    title: "Multiple Jumu'ah slots",
                    desc: "Run two or three Jumu'ah? List all slots with different languages and spaces.",
                  },
                  {
                    icon: Smartphone,
                    title: "Manage from your phone",
                    desc: `No laptop needed. Update timings from the ${APP_CONFIG.name} app in seconds.`,
                  },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-4 p-5 rounded-2xl transition-all duration-200"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.09)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.05)")
                      }
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(5,150,105,0.2)" }}
                      >
                        <Icon size={18} className="text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">
                          {item.title}
                        </p>
                        <p
                          className="text-xs leading-relaxed"
                          style={{ color: "rgba(255,255,255,0.5)" }}
                        >
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD CTA ───────────────────────────────── */}
      <section id="download" className="py-24" style={{ background: "white" }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-8 mx-auto"
              style={{
                background: "linear-gradient(135deg, #0C1A14, #1E3D2F)",
                boxShadow: "0 16px 48px rgba(5,150,105,0.25)",
              }}
            >
              <Building2 size={36} className="text-emerald-400" />
            </div>

            <h2
              className="text-4xl lg:text-5xl font-black mb-6"
              style={{ color: "#0C1A14", letterSpacing: "-0.02em" }}
            >
              Start praying in
              <span style={{ color: "#059669" }}> congregation</span>
            </h2>
            <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
              Join thousands of Muslims finding their nearest mosque and never
              missing Jamā'ah again. Free forever.
            </p>

            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <a
                href={APP_CONFIG.playStoreLink}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #059669, #047857)",
                  boxShadow: "0 8px 32px rgba(5,150,105,0.3)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-3px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <Smartphone size={22} />
                <div className="text-left">
                  <p className="text-xs opacity-75">Download on</p>
                  <p className="font-bold">Google Play</p>
                </div>
              </a>

              <a
                href={APP_CONFIG.appStoreLink}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold transition-all duration-200"
                style={{
                  background: "#F9FAFB",
                  border: "2px solid #E5E7EB",
                  color: "#111827",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#059669";
                  e.currentTarget.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E5E7EB";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Globe size={22} />
                <div className="text-left">
                  <p className="text-xs text-gray-400">Coming soon on</p>
                  <p className="font-bold">App Store</p>
                </div>
              </a>
            </div>

            <p className="text-sm text-gray-400">
              Free to use · No account required to browse · Available on Android
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer
        className="py-12"
        style={{ background: "#0C1A14", borderTop: "1px solid #1F3028" }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center">
                <Building2 size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">
                  {APP_CONFIG.name}
                </p>
                <p className="text-xs" style={{ color: "#34D399" }}>
                  {APP_CONFIG.nameArabic}
                </p>
              </div>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6">
              {[
                { label: "Features", href: "#features" },
                { label: "For Mosques", href: "#mosques" },
                { label: "Download", href: APP_CONFIG.playStoreLink },
                { label: "Feedback", href: "/feedback" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-xs transition-colors"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.8)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.4)")
                  }
                >
                  {link.label}
                </a>
              ))}
              {/* Admin login — small, not prominent */}
              <Link
                href="/login"
                className="text-xs transition-colors"
                style={{ color: "rgba(255,255,255,0.2)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.5)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.2)")
                }
              >
                Admin
              </Link>
            </div>

            {/* Copyright */}
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              © {new Date().getFullYear()} {APP_CONFIG.name}. All rights
              reserved.
            </p>
          </div>
          {/* Legal links */}
          <div
            className="flex items-center justify-center gap-6 mt-8 pt-6"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            {[
              { label: "Privacy Policy", href: "/privacy-policy" },
              { label: "Terms of Use", href: "/terms" },
              { label: "Delete Account", href: "/delete-account" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs transition-colors"
                style={{ color: "rgba(255,255,255,0.35)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.7)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.35)")
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
