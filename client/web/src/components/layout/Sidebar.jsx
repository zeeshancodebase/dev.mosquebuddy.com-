// src/components/layout/Sidebar.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { APP_CONFIG } from "@/lib/constants";
import {
  LayoutDashboard,
  MapPin,
  Clock,
  FileText,
  Lightbulb,
  Users,
  Map,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Activity,
  Building2,
  UserPlus,
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Mosque Data",
    items: [
      {
        label: "Venues",
        href: "/admin/venues",
        icon: MapPin,
        description: "Mosques & prayer venues",
      },
      {
        label: "Timings",
        href: "/admin/timings",
        icon: Clock,
        description: "Daily & Jumu'ah timings",
      },
    ],
  },
  {
    label: "Community",
    items: [
      {
        label: "Reports",
        href: "/admin/reports",
        icon: FileText,
        description: "User timing & issue reports",
        badgeKey: "pendingReports",
        children: [
          { label: "All Reports", href: "/admin/reports" },
          { label: "Timing Issues", href: "/admin/reports?type=timing" },
          { label: "Other Issues", href: "/admin/reports?type=other" },
        ],
      },
      {
        label: "Suggestions",
        href: "/admin/suggestions",
        icon: Lightbulb,
        description: "Missing venue suggestions",
      },
      {
        label: "Feedback",
        href: "/admin/feedback",
        icon: MessageSquare,
        description: "App feedback",
        badgeKey: "openFeedback",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "People & Access",
        href: "/admin/users",
        icon: Users,
        description: "Admins, volunteers & users",
        children: [
          { label: "Mosque Admins", href: "/admin/users?scope=mosque_admin" },
          { label: "Volunteers", href: "/admin/users?scope=volunteer" },
          { label: "All Users", href: "/admin/users" },
        ],
      },
      {
        // label: "Volunteers Assignments",
        label: "Volunteers",
        href: "/admin/volunteer-assignments",
        icon: UserPlus,
        description: "Venue, area & city volunteer coverage",
      },
      {
        label: "Locations",
        href: "/admin/locations",
        icon: Map,
        description: "Countries, cities & areas",
      },
      {
        label: "Activity Logs",
        href: "/admin/activity-logs",
        icon: Activity,
        description: "Admin action history",
      },
    ],
  },
];

export default function Sidebar({ pendingReports = 0, openFeedback = 0 }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [hoveredParent, setHoveredParent] = useState(null);

  const badgeValues = { pendingReports, openFeedback };

  // Matches a href (with or without ?query=params) against the current route.
  function isActive(href) {
    const [base, query] = href.split("?");
    if (pathname !== base && !pathname.startsWith(base + "/")) return false;
    if (!query) return true;
    const target = new URLSearchParams(query);
    for (const [key, value] of target.entries()) {
      if (searchParams.get(key) !== value) return false;
    }
    return true;
  }

  function isGroupActive(item) {
    if (!item.children) return isActive(item.href);
    return item.children.some((c) => isActive(c.href));
  }

  // Auto-expand a parent when the current route matches one of its children.
  useEffect(() => {
    const next = {};
    navGroups.forEach((g) =>
      g.items.forEach((item) => {
        if (item.children?.some((c) => isActive(c.href))) {
          next[item.href] = true;
        }
      }),
    );
    setExpanded((prev) => ({ ...prev, ...next }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  function toggleExpand(href) {
    setExpanded((prev) => ({ ...prev, [href]: !prev[href] }));
  }

  function isActive(href) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      className={clsx(
        "flex flex-col h-screen sticky top-0 flex-shrink-0",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60",
      )}
      style={{ backgroundColor: "#0C1A14" }}
    >
      {/* ── Logo ─────────────────────────────────────────── */}
      <div
        className="flex items-center h-16 px-4 flex-shrink-0 border-b"
        style={{ borderColor: "#1F3028" }}
      >
        <div
          className={clsx(
            "flex items-center gap-3 overflow-hidden",
            collapsed && "justify-center w-full",
          )}
        >
          {/* Icon mark */}
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <Building2 size={16} className="text-white" />
          </div>

          {/* Wordmark */}
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-white font-bold text-sm tracking-wide">
                {APP_CONFIG.name}
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: "#4ADE80", opacity: 0.8 }}
              >
                {APP_CONFIG.nameArabic}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-5">
            {/* Group label */}
            {!collapsed && (
              <p
                className="text-xs font-semibold uppercase tracking-widest px-3 mb-1.5"
                style={{ color: "#4B6858" }}
              >
                {group.label}
              </p>
            )}

            {/* Nav items */}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                        "transition-all duration-150 relative group",
                        collapsed && "justify-center",
                        active
                          ? "text-white"
                          : "text-gray-400 hover:text-gray-200",
                      )}
                      style={active ? { backgroundColor: "#1E3D2F" } : {}}
                      onMouseEnter={(e) => {
                        if (!active)
                          e.currentTarget.style.backgroundColor = "#1A3327";
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.currentTarget.style.backgroundColor = "";
                      }}
                    >
                      {/* Active indicator */}
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-emerald-500" />
                      )}

                      <Icon
                        size={18}
                        className={clsx(
                          "flex-shrink-0",
                          active
                            ? "text-emerald-400"
                            : "text-gray-500 group-hover:text-gray-300",
                        )}
                      />

                      {!collapsed && (
                        <div className="flex items-center justify-between flex-1 min-w-0">
                          <span className="text-sm font-medium truncate">
                            {item.label}
                          </span>
                          {/* Pending badge for reports */}
                          {item.href === "/admin/reports" &&
                            pendingReports > 0 && (
                              <span className="ml-2 bg-orange-500 text-white text-2xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                                {pendingReports > 99 ? "99+" : pendingReports}
                              </span>
                            )}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      {/* <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-5">
            {!collapsed && (
              <p
                className="text-2xs font-semibold uppercase tracking-widest px-3 mb-1.5"
                style={{ color: "#4B6858" }}
              >
                {group.label}
              </p>
            )}

            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isGroupActive(item);
                const Icon = item.icon;
                const hasChildren = !!item.children;
                const isOpen = expanded[item.href];
                const badgeCount = item.badgeKey ? badgeValues[item.badgeKey] : 0;

                return (
                  <li
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => collapsed && hasChildren && setHoveredParent(item.href)}
                    onMouseLeave={() => collapsed && hasChildren && setHoveredParent(null)}
                  >
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => !collapsed && toggleExpand(item.href)}
                        title={collapsed ? item.label : undefined}
                        className={clsx(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
                          "transition-all duration-150 relative group",
                          collapsed && "justify-center",
                          active ? "text-white" : "text-gray-400 hover:text-gray-200"
                        )}
                        style={active ? { backgroundColor: "#1E3D2F" } : {}}
                        onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = "#1A3327"; }}
                        onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = ""; }}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-emerald-500" />
                        )}
                        <Icon
                          size={18}
                          className={clsx("flex-shrink-0", active ? "text-emerald-400" : "text-gray-500 group-hover:text-gray-300")}
                        />
                        {!collapsed && (
                          <div className="flex items-center justify-between flex-1 min-w-0">
                            <span className="text-sm font-medium truncate">{item.label}</span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {badgeCount > 0 && (
                                <span className="bg-orange-500 text-white text-2xs font-bold px-1.5 py-0.5 rounded-full">
                                  {badgeCount > 99 ? "99+" : badgeCount}
                                </span>
                              )}
                              <ChevronDown
                                size={14}
                                className={clsx("transition-transform duration-200 text-gray-500", isOpen && "rotate-180")}
                              />
                            </div>
                          </div>
                        )}
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={clsx(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                          "transition-all duration-150 relative group",
                          collapsed && "justify-center",
                          active ? "text-white" : "text-gray-400 hover:text-gray-200"
                        )}
                        style={active ? { backgroundColor: "#1E3D2F" } : {}}
                        onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = "#1A3327"; }}
                        onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = ""; }}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-emerald-500" />
                        )}
                        <Icon
                          size={18}
                          className={clsx("flex-shrink-0", active ? "text-emerald-400" : "text-gray-500 group-hover:text-gray-300")}
                        />
                        {!collapsed && (
                          <div className="flex items-center justify-between flex-1 min-w-0">
                            <span className="text-sm font-medium truncate">{item.label}</span>
                            {badgeCount > 0 && (
                              <span className="ml-2 bg-orange-500 text-white text-2xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                                {badgeCount > 99 ? "99+" : badgeCount}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    )}

                     Expanded state: sub-items slide open inline below the parent 
                    {hasChildren && !collapsed && isOpen && (
                      <ul
                        className="mt-0.5 ml-[1.625rem] pl-3 flex flex-col gap-0.5 border-l"
                        style={{ borderColor: "#1F3028" }}
                      >
                        {item.children.map((child) => {
                          const childActive = isActive(child.href);
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={clsx(
                                  "block px-3 py-2 rounded-lg text-sm truncate transition-all duration-150",
                                  childActive ? "text-emerald-400 font-medium" : "text-gray-500 hover:text-gray-300"
                                )}
                                style={childActive ? { backgroundColor: "#16281F" } : {}}
                              >
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                     Collapsed state: sub-items appear as a flyout on hover 
                    {hasChildren && collapsed && hoveredParent === item.href && (
                      <div
                        className="absolute left-full top-0 ml-2 min-w-[180px] rounded-lg shadow-xl py-2 z-50"
                        style={{ backgroundColor: "#132318", border: "1px solid #1F3028" }}
                      >
                        <p
                          className="px-3 pb-1.5 text-2xs font-semibold uppercase tracking-widest"
                          style={{ color: "#4B6858" }}
                        >
                          {item.label}
                        </p>
                        {item.children.map((child) => {
                          const childActive = isActive(child.href);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={clsx(
                                "block px-3 py-2 text-sm truncate transition-colors duration-150",
                                childActive ? "text-emerald-400 font-medium" : "text-gray-300 hover:text-white"
                              )}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav> */}

      {/* ── Collapse toggle ──────────────────────────────── */}
      <div
        className="p-3 border-t flex-shrink-0"
        style={{ borderColor: "#1F3028" }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={clsx(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer",
            "text-gray-500 hover:text-gray-300 transition-all duration-150",
            collapsed && "justify-center",
          )}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1A3327";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "";
          }}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span className="text-xs font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
// // the below is normal sidebar with main and limited options above is a sidebar with dropdown and multiple options
// // src/components/layout/Sidebar.jsx
// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { clsx } from "clsx";
// import { APP_CONFIG } from "@/lib/constants";
// import {
//   LayoutDashboard,
//   MapPin,
//   Clock,
//   FileText,
//   Lightbulb,
//   Users,
//   Map,
//   ChevronLeft,
//   ChevronRight,
// //   Mosque,
//   Building2,
// } from "lucide-react";

// const navGroups = [
//   {
//     label: "Overview",
//     items: [
//       { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
//     ],
//   },
//   {
//     label: "Mosque Data",
//     items: [
//       { label: "Venues", href: "/admin/venues", icon: MapPin, description: "Mosques & prayer venues" },
//       { label: "Timings", href: "/admin/timings", icon: Clock, description: "Daily & Jumu'ah timings" },
//     ],
//   },
//   {
//     label: "Community",
//     items: [
//       { label: "Reports", href: "/admin/reports", icon: FileText, description: "User timing reports" },
//       { label: "Suggestions", href: "/admin/suggestions", icon: Lightbulb, description: "Missing venue suggestions" },
//     ],
//   },
//   {
//     label: "Administration",
//     items: [
//       { label: "Users & Roles", href: "/admin/users", icon: Users, description: "Manage roles & access" },
//       { label: "Locations", href: "/admin/locations", icon: Map, description: "Countries, cities & areas" },
//     ],
//   },
// ];

// export default function Sidebar({ pendingReports = 0 }) {
//   const pathname = usePathname();
//   const [collapsed, setCollapsed] = useState(false);

//   function isActive(href) {
//     return pathname === href || pathname.startsWith(href + "/");
//   }

//   return (
//     <aside
//       className={clsx(
//         "flex flex-col h-screen sticky top-0 flex-shrink-0",
//         "transition-all duration-300 ease-in-out",
//         collapsed ? "w-16" : "w-60"
//       )}
//       style={{ backgroundColor: "#0C1A14" }}
//     >
//       {/* ── Logo ─────────────────────────────────────────── */}
//       <div
//         className="flex items-center h-16 px-4 flex-shrink-0 border-b"
//         style={{ borderColor: "#1F3028" }}
//       >
//         <div
//           className={clsx(
//             "flex items-center gap-3 overflow-hidden",
//             collapsed && "justify-center w-full"
//           )}
//         >
//           {/* Icon mark */}
//           <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
//             <Building2 size={16} className="text-white" />
//           </div>

//           {/* Wordmark */}
//           {!collapsed && (
//             <div className="flex flex-col leading-tight">
//               <span className="text-white font-bold text-sm tracking-wide">
//                 {APP_CONFIG.name}
//               </span>
//               <span className="text-xs font-medium" style={{ color: "#4ADE80", opacity: 0.8 }}>
//                 {APP_CONFIG.nameArabic}
//               </span>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ── Navigation ───────────────────────────────────── */}
//       <nav className="flex-1 overflow-y-auto py-4 px-2">
//         {navGroups.map((group, groupIndex) => (
//           <div key={groupIndex} className="mb-5">
//             {/* Group label */}
//             {!collapsed && (
//               <p
//                 className="text-2xs font-semibold uppercase tracking-widest px-3 mb-1.5"
//                 style={{ color: "#4B6858" }}
//               >
//                 {group.label}
//               </p>
//             )}

//             {/* Nav items */}
//             <ul className="flex flex-col gap-0.5">
//               {group.items.map((item) => {
//                 const active = isActive(item.href);
//                 const Icon = item.icon;

//                 return (
//                   <li key={item.href}>
//                     <Link
//                       href={item.href}
//                       title={collapsed ? item.label : undefined}
//                       className={clsx(
//                         "flex items-center gap-3 px-3 py-2.5 rounded-lg",
//                         "transition-all duration-150 relative group",
//                         collapsed && "justify-center",
//                         active
//                           ? "text-white"
//                           : "text-gray-400 hover:text-gray-200"
//                       )}
//                       style={
//                         active
//                           ? { backgroundColor: "#1E3D2F" }
//                           : {}
//                       }
//                       onMouseEnter={(e) => {
//                         if (!active)
//                           e.currentTarget.style.backgroundColor = "#1A3327";
//                       }}
//                       onMouseLeave={(e) => {
//                         if (!active)
//                           e.currentTarget.style.backgroundColor = "";
//                       }}
//                     >
//                       {/* Active indicator */}
//                       {active && (
//                         <span
//                           className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-emerald-500"
//                         />
//                       )}

//                       <Icon
//                         size={18}
//                         className={clsx(
//                           "flex-shrink-0",
//                           active ? "text-emerald-400" : "text-gray-500 group-hover:text-gray-300"
//                         )}
//                       />

//                       {!collapsed && (
//                         <div className="flex items-center justify-between flex-1 min-w-0">
//                           <span className="text-sm font-medium truncate">
//                             {item.label}
//                           </span>
//                           {/* Pending badge for reports */}
//                           {item.href === "/admin/reports" && pendingReports > 0 && (
//                             <span className="ml-2 bg-orange-500 text-white text-2xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
//                               {pendingReports > 99 ? "99+" : pendingReports}
//                             </span>
//                           )}
//                         </div>
//                       )}
//                     </Link>
//                   </li>
//                 );
//               })}
//             </ul>
//           </div>
//         ))}
//       </nav>

//       {/* ── Collapse toggle ──────────────────────────────── */}
//       <div
//         className="p-3 border-t flex-shrink-0"
//         style={{ borderColor: "#1F3028" }}
//       >
//         <button
//           onClick={() => setCollapsed(!collapsed)}
//           className={clsx(
//             "w-full flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer",
//             "text-gray-500 hover:text-gray-300 transition-all duration-150",
//             collapsed && "justify-center"
//           )}
//           onMouseEnter={(e) => {
//             e.currentTarget.style.backgroundColor = "#1A3327";
//           }}
//           onMouseLeave={(e) => {
//             e.currentTarget.style.backgroundColor = "";
//           }}
//         >
//           {collapsed ? (
//             <ChevronRight size={16} />
//           ) : (
//             <>
//               <ChevronLeft size={16} />
//               <span className="text-xs font-medium">Collapse</span>
//             </>
//           )}
//         </button>
//       </div>
//     </aside>
//   );
// }
