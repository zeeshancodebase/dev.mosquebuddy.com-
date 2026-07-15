// src/app/admin/activity-logs/page.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity, Search, ChevronLeft, ChevronRight,
  MapPin, Clock, FileText, Users, Lightbulb, ShieldCheck,
  AlertCircle, RotateCcw,
} from "lucide-react";
import { api } from "@/lib/api";
import PageHeader from "@/components/shared/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import DateRangePicker from "@/components/ui/DateRangePicker";

// ── Action → display config ────────────────────────────────
const ACTION_CONFIG = {
  venue_created:               { label: "Venue created",          icon: MapPin,       color: "#059669", bg: "#ECFDF5" },
  venue_updated:                { label: "Venue updated",          icon: MapPin,       color: "#059669", bg: "#ECFDF5" },
  daily_timing_updated:         { label: "Daily timing updated",   icon: Clock,        color: "#2563EB", bg: "#EFF6FF" },
  jumuah_timing_updated:        { label: "Jumu'ah timing updated", icon: Clock,        color: "#2563EB", bg: "#EFF6FF" },
  timing_marked_needs_update:   { label: "Timing flagged",         icon: AlertCircle,  color: "#DC2626", bg: "#FEF2F2" },
  report_approved:              { label: "Report approved",        icon: FileText,     color: "#D97706", bg: "#FFFBEB" },
  report_rejected:              { label: "Report rejected",        icon: FileText,     color: "#DC2626", bg: "#FEF2F2" },
  venue_suggestion_approved:    { label: "Suggestion approved",    icon: Lightbulb,    color: "#D97706", bg: "#FFFBEB" },
  venue_suggestion_rejected:    { label: "Suggestion rejected",    icon: Lightbulb,    color: "#DC2626", bg: "#FEF2F2" },
  user_role_assigned:           { label: "Role assigned",          icon: Users,        color: "#7C3AED", bg: "#F5F3FF" },
  venue_admin_assigned:         { label: "Mosque admin assigned",  icon: ShieldCheck,  color: "#7C3AED", bg: "#F5F3FF" },
  volunteer_assigned:           { label: "Volunteer assigned",     icon: ShieldCheck,  color: "#7C3AED", bg: "#F5F3FF" },
};

function getActionConfig(action) {
  return (
    ACTION_CONFIG[action] || {
      label: action ? action.replace(/_/g, " ") : "Unknown action",
      icon: Activity,
      color: "#6B7280",
      bg: "#F9FAFB",
    }
  );
}

const ACTION_FILTER_OPTIONS = Object.entries(ACTION_CONFIG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

function formatDateTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function formatRelative(isoString) {
  const diff = Math.floor((new Date() - new Date(isoString)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "yesterday";
  return `${Math.floor(diff / 86400)}d ago`;
}

const PAGE_SIZE = 25;

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateRange, setDateRange] = useState({ fromDate: "", toDate: "" });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", PAGE_SIZE);
      if (search) params.set("search", search);
      if (actionFilter) params.set("action", actionFilter);
      if (dateRange.fromDate) params.set("fromDate", dateRange.fromDate);
      if (dateRange.toDate) params.set("toDate", dateRange.toDate);

      const res = await api.get(`/admin/activity-logs?${params.toString()}`);
      setLogs(res.data || []);
      setPagination(res.meta?.pagination || null);
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
      setError(true);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, dateRange]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleResetFilters() {
    setSearchInput("");
    setSearch("");
    setActionFilter("");
    setDateRange({ fromDate: "", toDate: "" });
    setPage(1);
  }

  const hasActiveFilters = search || actionFilter || dateRange.fromDate || dateRange.toDate;

  return (
    <div>
      <PageHeader
        title="Activity Logs"
        subtitle="Full audit trail of every action taken across Sabeel"
        breadcrumbs={[{ label: "Administration" }, { label: "Activity Logs" }]}
      />

      {/* ── Filter bar ──────────────────────────────────── */}
      <Card padding={false} className="mb-4">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by actor, venue, or action..."
              icon={Search}
              containerClassName="flex-1"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          <Select
            placeholder="All actions"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            options={ACTION_FILTER_OPTIONS}
            containerClassName="sm:w-56"
          />

          <DateRangePicker
            value={dateRange}
            onChange={(next) => {
              setDateRange(next);
              setPage(1);
            }}
            className="sm:w-64"
          />

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}
        </div>
      </Card>

      {/* ── Log list ────────────────────────────────────── */}
      <Card padding={false}>
        {loading ? (
          <PageLoader message="Loading activity logs..." />
        ) : error ? (
          <EmptyState
            icon={AlertCircle}
            title="Could not load activity logs"
            description="Something went wrong while fetching the audit trail. Please try again."
            action={fetchLogs}
            actionLabel="Retry"
          />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={Activity}
            title={hasActiveFilters ? "No matching activity" : "No activity yet"}
            description={
              hasActiveFilters
                ? "Try adjusting your filters to see more results."
                : "Actions taken across Sabeel will appear here as they happen."
            }
            action={hasActiveFilters ? handleResetFilters : undefined}
            actionLabel={hasActiveFilters ? "Reset filters" : undefined}
          />
        ) : (
          <>
            <ul className="divide-y divide-gray-50">
              {logs.map((log) => {
                const cfg = getActionConfig(log.action);
                const Icon = cfg.icon;

                return (
                  <li
                    key={log.id}
                    className="flex items-start gap-3.5 px-5 py-4 hover:bg-gray-50/70 transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: cfg.bg }}
                    >
                      <Icon size={16} style={{ color: cfg.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">
                          {cfg.label}
                        </p>
                        {log.entityType && (
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                            {log.entityType}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-1 flex items-center flex-wrap gap-x-1.5">
                        {log.venue?.name && (
                          <>
                            <span className="font-medium text-gray-600">{log.venue.name}</span>
                            {(log.venue.areaName || log.venue.cityName) && (
                              <span className="text-gray-400">
                                · {log.venue.areaName || log.venue.cityName}
                              </span>
                            )}
                            <span className="text-gray-300">·</span>
                          </>
                        )}
                        <span>
                          by{" "}
                          <span className="font-medium text-gray-600">
                            {log.actor?.name || "System"}
                          </span>
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                      <span className="text-xs font-medium text-gray-500" title={formatDateTime(log.createdAt)}>
                        {formatRelative(log.createdAt)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* ── Pagination ──────────────────────────────── */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Page <span className="font-medium text-gray-700">{pagination.page}</span> of{" "}
                  <span className="font-medium text-gray-700">{pagination.totalPages}</span>
                  {" · "}
                  <span className="font-medium text-gray-700">{pagination.totalLogs}</span> total
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPreviousPage}
                    className="flex items-center gap-1 text-sm text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={14} />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.hasNextPage}
                    className="flex items-center gap-1 text-sm text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}