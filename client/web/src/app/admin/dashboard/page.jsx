"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  FileText,
  Users,
  AlertTriangle,
  Building2,
  Activity,
  MessageSquare,
} from "lucide-react";
import { api } from "@/lib/api";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import Card, { CardHeader } from "@/components/ui/Card";
import Badge, { VerificationBadge } from "@/components/ui/Badge";

// ── Action label mapping from backend action strings ──────
const ACTION_CONFIG = {
  venue_created: { label: "New venue added", type: "venue" },
  venue_updated: { label: "Venue updated", type: "venue" },
  daily_timing_updated: { label: "Daily timing updated", type: "timing" },
  jumuah_timing_updated: { label: "Jumu'ah timing updated", type: "timing" },
  report_approved: { label: "Report approved", type: "report" },
  report_rejected: { label: "Report rejected", type: "report" },
  venue_suggestion_approved: { label: "Suggestion approved", type: "venue" },
  venue_suggestion_rejected: { label: "Suggestion rejected", type: "report" },
  timing_marked_needs_update: { label: "Timing flagged", type: "timing" },
  user_role_assigned: { label: "Role assigned", type: "user" },
  venue_admin_assigned: { label: "Mosque admin assigned", type: "venue" },
};

const ACTIVITY_ICON = {
  timing: { icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
  venue: { icon: MapPin, color: "text-emerald-500", bg: "bg-emerald-50" },
  report: { icon: FileText, color: "text-orange-500", bg: "bg-orange-50" },
  user: { icon: Users, color: "text-violet-500", bg: "bg-violet-50" },
};

const QUICK_ACTIONS = [
  { label: "Add new venue", icon: MapPin, href: "/admin/venues/new" },
  { label: "Review reports", icon: FileText, href: "/admin/reports" },
  {
    label: "Review suggestions",
    icon: AlertTriangle,
    href: "/admin/suggestions",
  },
  { label: "Manage users", icon: Users, href: "/admin/users" },
  { label: "View feedback", icon: MessageSquare, href: "/admin/feedback" },
  { label: "Activity logs", icon: Activity, href: "/admin/activity-logs" },
];

const VERIFICATION_STATUSES = [
  { key: "verified", label: "Verified" },
  { key: "communityUpdated", label: "Community updated" },
  { key: "needsUpdate", label: "Need attention" },
  { key: "pendingReview", label: "Pending review" },
];

function timeAgo(isoString) {
  const now = new Date();
  const then = new Date(isoString);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return then.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [featureInterest, setFeatureInterest] = useState([]);

  useEffect(() => {
    api
      .get("/admin/feature-interest/summary")
      .then((res) => setFeatureInterest(res.data ?? []))
      .catch(() => setFeatureInterest([]));
  }, []);

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      try {
        const res = await api.get("/admin/dashboard/summary");
        setData(res.data);
      } catch (err) {
        // console.error("Dashboard fetch failed:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const stats = data?.stats || {};
  const quality = data?.dataQuality || {};
  const activity = data?.recentActivity || [];

  const timingHealth = data?.timingHealth || {};

  const timingIssues =
    (timingHealth.dailyTimingsNeedsUpdate || 0) +
    (timingHealth.jumuahTimingsNeedsUpdate || 0);

  const incompleteVenues =
    (timingHealth.venuesWithoutDailyTimings || 0) +
    (timingHealth.venuesWithoutJumuahTimings || 0);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back. Here is what needs your attention today."
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      {/* ── Stat cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Pending Reports"
          value={loading ? null : (stats.pendingReports ?? "—")}
          subtitle="Awaiting review"
          icon={AlertTriangle}
          iconColor="orange"
          loading={loading}
        />
        <StatCard
          title="Pending Suggestions"
          value={loading ? null : (stats.pendingSuggestions ?? "—")}
          subtitle="New venue submissions"
          icon={Building2}
          iconColor="blue"
          loading={loading}
        />
        <StatCard
          title="Timing Issues"
          value={loading ? null : timingIssues}
          subtitle="Daily & Jumu'ah records"
          icon={Clock}
          iconColor="red"
          loading={loading}
        />
        <StatCard
          title="Incomplete Venues"
          value={loading ? null : incompleteVenues}
          subtitle="Missing daily or Jumu'ah timings"
          icon={MapPin}
          iconColor="emerald"
          loading={loading}
        />
      </div>
      <Card>
        <CardHeader
          title="Feature Interest"
          subtitle="Signals from coming-soon polls"
        />
        {featureInterest.length === 0 ? (
          <p className="text-sm text-gray-400">No signals yet</p>
        ) : (
          <div className="flex flex-col gap-3">
            {featureInterest.map((f) => (
              <div
                key={f.featureKey}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-gray-600 capitalize">
                  {f.featureKey.replace(/_/g, " ")}
                </span>
                <span className="text-sm font-semibold text-emerald-700">
                  {f.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Bottom row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent activity */}
        <div className="lg:col-span-2">
          <Card padding={false}>
            <div className="p-5 border-b border-gray-100">
              <CardHeader
                title="Recent Activity"
                subtitle="Latest changes across all venues"
                action={
                  <Badge variant="neutral" size="sm">
                    Live
                  </Badge>
                }
              />
            </div>

            {loading ? (
              // Skeleton rows
              <ul className="divide-y divide-gray-50">
                {[...Array(4)].map((_, i) => (
                  <li key={i} className="flex items-start gap-3 px-5 py-4">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse flex-shrink-0" />
                    <div className="flex-1 flex flex-col gap-2 py-0.5">
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-48" />
                      <div className="h-2.5 bg-gray-100 rounded animate-pulse w-32" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : error || activity.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-gray-400">
                  {error
                    ? "Could not load activity."
                    : "No recent activity yet."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {activity.map((item) => {
                  const cfg = ACTION_CONFIG[item.action] || {
                    label: item.action?.replace(/_/g, " ") || "Action",
                    type: "venue",
                  };
                  const iconCfg =
                    ACTIVITY_ICON[cfg.type] || ACTIVITY_ICON.venue;
                  const Icon = iconCfg.icon;

                  return (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${iconCfg.bg}`}
                      >
                        <Icon size={15} className={iconCfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {cfg.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {item.venue?.name || "—"}
                          {item.venue?.areaName && (
                            <span className="text-gray-400">
                              {" "}
                              · {item.venue.areaName}
                            </span>
                          )}
                          {item.actor?.name && (
                            <span className="text-gray-400">
                              {" "}
                              · by {item.actor.name}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
                        {timeAgo(item.createdAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Venue Verification */}
          <Card>
            <CardHeader
              title="Venue Verification"
              subtitle="Verification status of venues"
            />
            <div className="flex flex-col gap-3">
              {VERIFICATION_STATUSES.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between"
                >
                  <VerificationBadge
                    status={
                      item.key === "communityUpdated"
                        ? "community_updated"
                        : item.key === "needsUpdate"
                          ? "needs_update"
                          : item.key === "pendingReview"
                            ? "pending_review"
                            : "verified"
                    }
                    size="sm"
                  />
                  {loading ? (
                    <div className="w-6 h-4 bg-gray-100 rounded animate-pulse" />
                  ) : (
                    <span className="text-sm font-semibold text-gray-700">
                      {quality[item.key] ?? "—"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Timing Freshness"
              subtitle="Records requiring verification"
            />

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Daily timings stale
                </span>

                <span className="text-sm font-semibold">
                  {loading ? "—" : (data?.timingHealth?.staleDailyTimings ?? 0)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Jumu'ah timings stale
                </span>

                <span className="text-sm font-semibold">
                  {loading
                    ? "—"
                    : (data?.timingHealth?.staleJumuahTimings ?? 0)}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Data Completeness"
              subtitle="Venues missing critical information"
            />

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">No Daily Timings</span>

                <span className="text-sm font-semibold">
                  {loading
                    ? "—"
                    : (data?.timingHealth?.venuesWithoutDailyTimings ?? 0)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  No Jumu'ah Timings
                </span>

                <span className="text-sm font-semibold">
                  {loading
                    ? "—"
                    : (data?.timingHealth?.venuesWithoutJumuahTimings ?? 0)}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader title="Quick Actions" />
            <div className="flex flex-col gap-1">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-emerald-600" />
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">
                      {action.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
// *--------------------------------------
// Dummy Dashboard page
// *--------------------------------------

// // src/app/admin/dashboard/page.jsx
// "use client";

// import Link from "next/link";
// import {
//   MapPin, Clock, FileText,
//   Users, AlertTriangle,
// } from "lucide-react";
// import PageHeader from "@/components/shared/PageHeader";
// import StatCard from "@/components/shared/StatCard";
// import Card, { CardHeader } from "@/components/ui/Card";
// import Badge, { VerificationBadge } from "@/components/ui/Badge";

// const recentActivity = [
//   {
//     id: 1,
//     action: "Daily timing updated",
//     venue: "Masjid Al-Noor",
//     area: "BTM Layout",
//     time: "2 mins ago",
//     type: "timing",
//   },
//   {
//     id: 2,
//     action: "New venue added",
//     venue: "Musalla Al-Aman",
//     area: "Koramangala",
//     time: "1 hour ago",
//     type: "venue",
//   },
//   {
//     id: 3,
//     action: "Report approved",
//     venue: "Islamic Center Whitefield",
//     area: "Whitefield",
//     time: "3 hours ago",
//     type: "report",
//   },
//   {
//     id: 4,
//     action: "Jumu'ah timing updated",
//     venue: "Masjid Ibrahim",
//     area: "Jayanagar",
//     time: "Yesterday",
//     type: "timing",
//   },
// ];

// const activityIcon = {
//   timing: { icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
//   venue: { icon: MapPin, color: "text-emerald-500", bg: "bg-emerald-50" },
//   report: { icon: FileText, color: "text-orange-500", bg: "bg-orange-50" },
// };

// const quickActions = [
//   { label: "Add new venue", icon: MapPin, href: "/admin/venues" },
//   { label: "Review reports", icon: FileText, href: "/admin/reports" },
//   { label: "Manage locations", icon: AlertTriangle, href: "/admin/locations" },
//   { label: "Manage users", icon: Users, href: "/admin/users" },
// ];

// const verificationItems = [
//   { status: "verified", count: 0, label: "Verified timings" },
//   { status: "community_updated", count: 0, label: "Community updated" },
//   { status: "needs_update", count: 0, label: "Need attention" },
//   { status: "pending_review", count: 0, label: "Pending review" },
// ];

// export default function DashboardPage() {
//   return (
//     <div>
//       <PageHeader
//         title="Dashboard"
//         subtitle="Welcome back. Here is what needs your attention today."
//         breadcrumbs={[{ label: "Dashboard" }]}
//       />

//       {/* Stat cards */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//         <StatCard
//           title="Total Venues"
//           value="0"
//           subtitle="Mosques & prayer venues"
//           icon={MapPin}
//           iconColor="emerald"
//         />
//         <StatCard
//           title="Pending Reports"
//           value="0"
//           subtitle="Awaiting your review"
//           icon={AlertTriangle}
//           iconColor="orange"
//         />
//         <StatCard
//           title="Needs Update"
//           value="0"
//           subtitle="Timings outdated"
//           icon={Clock}
//           iconColor="red"
//         />
//         <StatCard
//           title="Total Users"
//           value="0"
//           subtitle="Registered accounts"
//           icon={Users}
//           iconColor="blue"
//         />
//       </div>

//       {/* Bottom row */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

//         {/* Recent activity */}
//         <div className="lg:col-span-2">
//           <Card padding={false}>
//             <div className="p-5 border-b border-gray-100">
//               <CardHeader
//                 title="Recent Activity"
//                 subtitle="Latest changes across all venues"
//                 action={
//                   <Badge variant="neutral" size="sm">
//                     Today
//                   </Badge>
//                 }
//               />
//             </div>
//             <ul className="divide-y divide-gray-50">
//               {recentActivity.map((item) => {
//                 const config = activityIcon[item.type];
//                 const Icon = config.icon;
//                 return (
//                   <li
//                     key={item.id}
//                     className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
//                   >
//                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${config.bg}`}>
//                       <Icon size={15} className={config.color} />
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <p className="text-sm font-medium text-gray-900">
//                         {item.action}
//                       </p>
//                       <p className="text-xs text-gray-500 mt-0.5 truncate">
//                         {item.venue}
//                         <span className="text-gray-400"> · {item.area}</span>
//                       </p>
//                     </div>
//                     <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
//                       {item.time}
//                     </span>
//                   </li>
//                 );
//               })}
//             </ul>
//           </Card>
//         </div>

//         {/* Right column */}
//         <div className="flex flex-col gap-4">

//           {/* Data quality */}
//           <Card>
//             <CardHeader
//               title="Data Quality"
//               subtitle="Verification overview"
//             />
//             <div className="flex flex-col gap-3">
//               {verificationItems.map((item) => (
//                 <div
//                   key={item.status}
//                   className="flex items-center justify-between"
//                 >
//                   <VerificationBadge status={item.status} size="sm" />
//                   <span className="text-sm font-semibold text-gray-700">
//                     {item.count}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </Card>

//           {/* Quick actions */}
//           <Card>
//             <CardHeader title="Quick Actions" />
//             <div className="flex flex-col gap-1">
//               {quickActions.map((action) => {
//                 const Icon = action.icon;
//                 return (
//                   <Link
//                     key={action.label}
//                     href={action.href}
//                     className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
//                   >
//                     <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
//                       <Icon size={14} className="text-emerald-600" />
//                     </div>
//                     <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">
//                       {action.label}
//                     </span>
//                   </Link>
//                 );
//               })}
//             </div>
//           </Card>

//         </div>
//       </div>
//     </div>
//   );
// }
