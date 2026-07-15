// src/components/layout/Topbar.jsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { LogOut, User, ChevronDown, Shield } from "lucide-react";
import { auth } from "@/lib/auth";
import { APP_CONFIG } from "@/lib/constants";
import { RoleBadge } from "@/components/ui/Badge";

const rolePriority = ["super_admin", "mosque_admin", "trusted_volunteer", "registered_user"];

export default function Topbar() {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => { setUser(auth.getUser()); }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    auth.clearSession();
    router.push("/login");
  }

  const allRoles = user?.userRoles || user?.roles || [];
  const roleNames = allRoles.map((r) => r.role?.name || r.roleName || r);
  const primaryRole = rolePriority.find((r) => roleNames.includes(r)) || "registered_user";
  const displayRoles = roleNames.filter((r) => r !== "registered_user");
  if (displayRoles.length === 0) displayRoles.push("registered_user");

  return (
    <header
      className="h-16 bg-white flex items-center justify-between px-8 flex-shrink-0"
      style={{ borderBottom: "1px solid #E5E7EB", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
    >
      {/* Left */}
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
          <Shield size={13} className="text-emerald-600" />
        </div>
        <span className="text-sm font-semibold text-gray-800">{APP_CONFIG.nameFull}</span>
        <span className="text-gray-300 text-sm">·</span>
        <span className="text-sm text-gray-400">Admin Panel</span>
      </div>

      {/* Right */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-3 pl-3 pr-2.5 py-2 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150"
        >
          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </span>
          </div>
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-xs font-semibold text-gray-800">
              {user?.name || "Admin"}
            </span>
            <span className="text-xs text-gray-400 capitalize">
              {primaryRole.replace(/_/g, " ")}
            </span>
          </div>
          <ChevronDown
            size={14}
            className={clsx(
              "text-gray-400 transition-transform duration-200 ml-1",
              dropdownOpen && "rotate-180"
            )}
          />
        </button>

        {dropdownOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl border border-gray-200 overflow-hidden z-50"
            style={{ boxShadow: "0 10px 40px -5px rgba(0,0,0,0.12)" }}
          >
            <div className="px-4 py-3.5" style={{ borderBottom: "1px solid #F3F4F6" }}>
              <p className="text-sm font-semibold text-gray-900">
                {user?.name || "Admin User"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {user?.email || ""}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {displayRoles.map((role) => (
                  <RoleBadge key={role} role={role} size="sm" />
                ))}
              </div>
            </div>

            <div className="p-2">
              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <User size={15} className="text-gray-400" />
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} className="text-red-400" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}