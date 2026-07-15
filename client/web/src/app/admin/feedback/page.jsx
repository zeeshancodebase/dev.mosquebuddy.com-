// src/app/admin/feedback/page.jsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  MessageSquare, Star, Bug, Lightbulb, Database, HelpCircle,
  Search, RotateCcw, User, CheckCircle2, Circle, Save,
  ChevronLeft, ChevronRight, AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import PageHeader from "@/components/shared/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import StatCard from "@/components/shared/StatCard";
import { PageLoader } from "@/components/ui/Spinner";

// ── Type → display config ──────────────────────────────────
const TYPE_CONFIG = {
  general:         { label: "General",         icon: MessageSquare, color: "#059669", bg: "#ECFDF5" },
  bug:             { label: "Bug report",       icon: Bug,           color: "#DC2626", bg: "#FEF2F2" },
  feature_request: { label: "Feature request",  icon: Lightbulb,     color: "#D97706", bg: "#FFFBEB" },
  data_quality:    { label: "Data quality",     icon: Database,      color: "#2563EB", bg: "#EFF6FF" },
  other:           { label: "Other",            icon: HelpCircle,    color: "#6B7280", bg: "#F9FAFB" },
};

const TYPE_FILTER_OPTIONS = Object.entries(TYPE_CONFIG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

const STATUS_FILTER_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
];

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
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

function StarRating({ rating, size = 13 }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            className={n <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-gray-500">{rating}/5</span>
    </div>
  );
}

function Avatar({ name }) {
  if (!name) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <User size={14} className="text-gray-400" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-emerald-700">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

const PAGE_SIZE = 20;

export default function FeedbackPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");

  const [selected, setSelected] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", PAGE_SIZE);
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await api.get(`/admin/feedback?${params.toString()}`);
      setItems(res.data || []);
      setPagination(res.meta?.pagination || null);
    } catch (err) {
      console.error("Failed to fetch feedback:", err);
      setError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get("/admin/feedback/summary");
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to fetch feedback summary:", err);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleResetFilters() {
    setSearchInput("");
    setSearch("");
    setTypeFilter("");
    setStatusFilter("");
    setPage(1);
  }

  const hasActiveFilters = search || typeFilter || statusFilter !== "open";

  function openDetail(item) {
    setSelected(item);
    setNoteDraft(item.internalNote || "");
  }

  function closeDetail() {
    setSelected(null);
    setNoteDraft("");
  }

  async function handleSave(nextStatus) {
    setSaving(true);
    try {
      const res = await api.patch(`/admin/feedback/${selected.id}`, {
        status: nextStatus,
        internalNote: noteDraft,
      });

      // Update the item in place so the list reflects the change immediately
      setItems((prev) =>
        prev.map((f) => (f.id === selected.id ? res.data : f))
      );

      closeDetail();
      fetchSummary();
    } catch (err) {
      console.error("Failed to update feedback:", err);
      // Keep modal open so the admin can retry
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Feedback"
        subtitle="What users are telling us about Sabeel"
        breadcrumbs={[{ label: "Community" }, { label: "Feedback" }]}
      />

      {/* ── Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Feedback"
          value={summary ? summary.total : null}
          subtitle="All time"
          icon={MessageSquare}
          iconColor="emerald"
          loading={!summary}
        />
        <StatCard
          title="Open"
          value={summary ? summary.open : null}
          subtitle="Awaiting review"
          icon={Circle}
          iconColor="orange"
          loading={!summary}
        />
        <StatCard
          title="Open Bug Reports"
          value={summary ? summary.bugOpen : null}
          subtitle="Needs attention"
          icon={Bug}
          iconColor="red"
          loading={!summary}
        />
        <StatCard
          title="Avg. Rating"
          value={summary ? (summary.avgRating ?? "—") : null}
          subtitle="From rated feedback"
          icon={Star}
          iconColor="blue"
          loading={!summary}
        />
      </div>

      {/* ── Filter bar ──────────────────────────────────── */}
      <Card padding={false} className="mb-4">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search feedback or submitter..."
              icon={Search}
              containerClassName="flex-1"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
          <Select
            placeholder="All types"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            options={TYPE_FILTER_OPTIONS}
            containerClassName="sm:w-48"
          />
          <Select
            placeholder="All statuses"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={STATUS_FILTER_OPTIONS}
            containerClassName="sm:w-40"
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

      {/* ── Feedback list ───────────────────────────────── */}
      {loading ? (
        <Card padding={false}>
          <PageLoader message="Loading feedback..." />
        </Card>
      ) : error ? (
        <Card padding={false}>
          <EmptyState
            icon={AlertCircle}
            title="Could not load feedback"
            description="Something went wrong while fetching feedback. Please try again."
            action={fetchFeedback}
            actionLabel="Retry"
          />
        </Card>
      ) : items.length === 0 ? (
        <Card padding={false}>
          <EmptyState
            icon={MessageSquare}
            title="No feedback found"
            description={
              hasActiveFilters
                ? "Try adjusting your filters to see more results."
                : "User feedback from the mobile app will appear here."
            }
            action={hasActiveFilters ? handleResetFilters : undefined}
            actionLabel={hasActiveFilters ? "Reset filters" : undefined}
          />
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {items.map((item) => {
              const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.other;
              const Icon = cfg.icon;

              return (
                <Card
                  key={item.id}
                  hover
                  onClick={() => openDetail(item)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: cfg.bg }}
                    >
                      <Icon size={16} style={{ color: cfg.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: cfg.color, backgroundColor: cfg.bg }}
                        >
                          {cfg.label}
                        </span>
                        {item.status === "open" ? (
                          <Badge variant="warning" size="sm" dot>Open</Badge>
                        ) : (
                          <Badge variant="success" size="sm" dot>Resolved</Badge>
                        )}
                        {item.rating != null && <StarRating rating={item.rating} />}
                      </div>

                      <p className="text-sm text-gray-800 leading-relaxed line-clamp-2">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-2 mt-3">
                        <Avatar name={item.submittedBy?.name} />
                        <div className="flex flex-col leading-tight">
                          <span className="text-xs font-medium text-gray-700">
                            {item.submittedBy?.name || "Anonymous"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatRelative(item.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* ── Pagination ──────────────────────────────── */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-xs text-gray-500">
                Page <span className="font-medium text-gray-700">{pagination.page}</span> of{" "}
                <span className="font-medium text-gray-700">{pagination.totalPages}</span>
                {" · "}
                <span className="font-medium text-gray-700">{pagination.totalFeedback}</span> total
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

      {/* ── Detail / action modal ───────────────────────── */}
      <Modal
        isOpen={!!selected}
        onClose={closeDetail}
        title="Feedback Detail"
        subtitle={selected ? formatDate(selected.createdAt) : ""}
        footer={
          selected && (
            <div className="flex items-center justify-between w-full">
              <Button variant="ghost" onClick={closeDetail}>
                Close
              </Button>
              <div className="flex items-center gap-2">
                {selected.status === "open" ? (
                  <Button
                    variant="success"
                    icon={CheckCircle2}
                    loading={saving}
                    onClick={() => handleSave("resolved")}
                  >
                    Mark Resolved
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    icon={Circle}
                    loading={saving}
                    onClick={() => handleSave("open")}
                  >
                    Reopen
                  </Button>
                )}
                <Button
                  variant="primary"
                  icon={Save}
                  loading={saving}
                  onClick={() => handleSave(selected.status)}
                >
                  Save Note
                </Button>
              </div>
            </div>
          )
        }
      >
        {selected && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 flex-wrap">
              {(() => {
                const cfg = TYPE_CONFIG[selected.type] || TYPE_CONFIG.other;
                const Icon = cfg.icon;
                return (
                  <span
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ color: cfg.color, backgroundColor: cfg.bg }}
                  >
                    <Icon size={12} />
                    {cfg.label}
                  </span>
                );
              })()}
              {selected.status === "open" ? (
                <Badge variant="warning" size="sm" dot>Open</Badge>
              ) : (
                <Badge variant="success" size="sm" dot>Resolved</Badge>
              )}
              {selected.rating != null && <StarRating rating={selected.rating} size={15} />}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Message
              </p>
              <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 rounded-lg p-3.5 border border-gray-100">
                {selected.message}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Submitted by
              </p>
              <div className="flex items-center gap-2.5">
                <Avatar name={selected.submittedBy?.name} />
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium text-gray-800">
                    {selected.submittedBy?.name || "Anonymous"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {selected.submittedBy?.email || "No account linked — cannot follow up"}
                  </span>
                </div>
              </div>
            </div>

            <Textarea
              label="Internal note"
              placeholder="Add a note for the team — not visible to the user..."
              hint="Visible only to admins. Use this to track what action was taken."
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={3}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}




// // src/app/admin/feedback/page.jsx
// "use client";

// import { useState, useMemo } from "react";
// import {
//   MessageSquare, Star, Bug, Lightbulb, Database, HelpCircle,
//   Search, RotateCcw, User, CheckCircle2, Circle, Save,
// } from "lucide-react";
// import PageHeader from "@/components/shared/PageHeader";
// import Card from "@/components/ui/Card";
// import Input from "@/components/ui/Input";
// import Select from "@/components/ui/Select";
// import Button from "@/components/ui/Button";
// import Badge from "@/components/ui/Badge";
// import Textarea from "@/components/ui/Textarea";
// import Modal from "@/components/ui/Modal";
// import EmptyState from "@/components/ui/EmptyState";
// import StatCard from "@/components/shared/StatCard";

// // ─────────────────────────────────────────────────────────
// // MOCK DATA — matches Feedback Prisma model exactly.
// // SWAP: replace with `await api.get("/admin/feedback")` once
// // backend route exists. Shape returned should match this array.
// // ─────────────────────────────────────────────────────────
// const MOCK_FEEDBACK = [
//   {
//     id: "fb_1",
//     type: "general",
//     message: "Really love how clean the Jumu'ah page is. Finding the nearest slot on Fridays used to take forever on other apps — this is so much faster.",
//     rating: 5,
//     submittedBy: { id: "u1", name: "Imran Sheikh", email: "imran.s@gmail.com" },
//     status: "open",
//     internalNote: "",
//     createdAt: "2026-06-18T09:30:00.000Z",
//   },
//   {
//     id: "fb_2",
//     type: "bug",
//     message: "App crashes when I tap 'Directions' on a venue that doesn't have a Google Maps link saved. Happened twice on Masjid Al-Furqan.",
//     rating: null,
//     submittedBy: { id: "u2", name: "Ayesha Khan", email: "ayesha.k@gmail.com" },
//     status: "open",
//     internalNote: "",
//     createdAt: "2026-06-17T18:12:00.000Z",
//   },
//   {
//     id: "fb_3",
//     type: "data_quality",
//     message: "Masjid Ibrahim in Jayanagar still shows old Asr timing. I was there yesterday and they've shifted Jamā'ah to 5:00 PM, not 4:45 PM as shown.",
//     rating: null,
//     submittedBy: null,
//     status: "open",
//     internalNote: "",
//     createdAt: "2026-06-17T14:45:00.000Z",
//   },
//   {
//     id: "fb_4",
//     type: "feature_request",
//     message: "Would be amazing if Sabeel could send a notification 10 minutes before Jamā'ah for my saved mosque. That's the one feature I'm waiting for.",
//     rating: null,
//     submittedBy: { id: "u3", name: "Zubair Ahmed", email: "zubair.a@outlook.com" },
//     status: "resolved",
//     internalNote: "Already on roadmap — notification foundation exists in DB, full reminders planned for next phase.",
//     createdAt: "2026-06-15T11:20:00.000Z",
//   },
//   {
//     id: "fb_5",
//     type: "general",
//     message: "App is good but feels a bit slow to load nearby mosques on my older phone.",
//     rating: 3,
//     submittedBy: { id: "u4", name: "Faisal Rahman", email: "faisal.r@gmail.com" },
//     status: "open",
//     internalNote: "",
//     createdAt: "2026-06-14T20:05:00.000Z",
//   },
//   {
//     id: "fb_6",
//     type: "other",
//     message: "Just wanted to say JazakAllahu khair for building this. May Allah reward the team.",
//     rating: null,
//     submittedBy: null,
//     status: "resolved",
//     internalNote: "Read and appreciated by the team.",
//     createdAt: "2026-06-12T08:00:00.000Z",
//   },
// ];

// // ── Type → display config ──────────────────────────────────
// const TYPE_CONFIG = {
//   general:         { label: "General",         icon: MessageSquare, color: "#059669", bg: "#ECFDF5" },
//   bug:             { label: "Bug report",       icon: Bug,           color: "#DC2626", bg: "#FEF2F2" },
//   feature_request: { label: "Feature request",  icon: Lightbulb,     color: "#D97706", bg: "#FFFBEB" },
//   data_quality:    { label: "Data quality",     icon: Database,      color: "#2563EB", bg: "#EFF6FF" },
//   other:           { label: "Other",            icon: HelpCircle,    color: "#6B7280", bg: "#F9FAFB" },
// };

// const TYPE_FILTER_OPTIONS = Object.entries(TYPE_CONFIG).map(([value, cfg]) => ({
//   value,
//   label: cfg.label,
// }));

// const STATUS_FILTER_OPTIONS = [
//   { value: "open", label: "Open" },
//   { value: "resolved", label: "Resolved" },
// ];

// function formatDate(isoString) {
//   return new Date(isoString).toLocaleDateString("en-IN", {
//     day: "numeric", month: "short", year: "numeric",
//   });
// }

// function formatRelative(isoString) {
//   const diff = Math.floor((new Date() - new Date(isoString)) / 1000);
//   if (diff < 60) return "just now";
//   if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
//   if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
//   if (diff < 172800) return "yesterday";
//   return `${Math.floor(diff / 86400)}d ago`;
// }

// function StarRating({ rating, size = 13 }) {
//   if (!rating) return null;
//   return (
//     <div className="flex items-center gap-1">
//       <div className="flex items-center gap-0.5">
//         {[1, 2, 3, 4, 5].map((n) => (
//           <Star
//             key={n}
//             size={size}
//             className={n <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}
//           />
//         ))}
//       </div>
//       <span className="text-xs font-medium text-gray-500">{rating}/5</span>
//     </div>
//   );
// }

// function Avatar({ name }) {
//   if (!name) {
//     return (
//       <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
//         <User size={14} className="text-gray-400" />
//       </div>
//     );
//   }
//   return (
//     <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
//       <span className="text-xs font-bold text-emerald-700">
//         {name.charAt(0).toUpperCase()}
//       </span>
//     </div>
//   );
// }

// export default function FeedbackPage() {
//   const [feedback, setFeedback] = useState(MOCK_FEEDBACK);
//   const [search, setSearch] = useState("");
//   const [typeFilter, setTypeFilter] = useState("");
//   const [statusFilter, setStatusFilter] = useState("open");
//   const [selected, setSelected] = useState(null);
//   const [noteDraft, setNoteDraft] = useState("");
//   const [saving, setSaving] = useState(false);

//   const stats = useMemo(() => {
//     const open = feedback.filter((f) => f.status === "open").length;
//     const bugs = feedback.filter((f) => f.type === "bug" && f.status === "open").length;
//     const ratings = feedback.filter((f) => f.rating != null).map((f) => f.rating);
//     const avgRating = ratings.length
//       ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
//       : "—";
//     return { total: feedback.length, open, bugs, avgRating };
//   }, [feedback]);

//   const filtered = useMemo(() => {
//     return feedback
//       .filter((f) => (typeFilter ? f.type === typeFilter : true))
//       .filter((f) => (statusFilter ? f.status === statusFilter : true))
//       .filter((f) =>
//         search
//           ? f.message.toLowerCase().includes(search.toLowerCase()) ||
//             f.submittedBy?.name?.toLowerCase().includes(search.toLowerCase())
//           : true
//       )
//       .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//   }, [feedback, typeFilter, statusFilter, search]);

//   const hasActiveFilters = search || typeFilter || statusFilter !== "open";

//   function openDetail(item) {
//     setSelected(item);
//     setNoteDraft(item.internalNote || "");
//   }

//   function closeDetail() {
//     setSelected(null);
//     setNoteDraft("");
//   }

//   function handleResetFilters() {
//     setSearch("");
//     setTypeFilter("");
//     setStatusFilter("");
//   }

//   // SWAP: call `await api.patch(`/admin/feedback/${selected.id}`, { status, internalNote })`
//   // once backend route exists. For now this updates local mock state only.
//   function handleSave(nextStatus) {
//     setSaving(true);
//     setTimeout(() => {
//       setFeedback((prev) =>
//         prev.map((f) =>
//           f.id === selected.id
//             ? { ...f, status: nextStatus, internalNote: noteDraft }
//             : f
//         )
//       );
//       setSaving(false);
//       closeDetail();
//     }, 400);
//   }

//   return (
//     <div>
//       <PageHeader
//         title="Feedback"
//         subtitle="What users are telling us about Sabeel"
//         breadcrumbs={[{ label: "Community" }, { label: "Feedback" }]}
//       />

//       {/* ── Stats ───────────────────────────────────────── */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//         <StatCard
//           title="Total Feedback"
//           value={stats.total}
//           subtitle="All time"
//           icon={MessageSquare}
//           iconColor="emerald"
//         />
//         <StatCard
//           title="Open"
//           value={stats.open}
//           subtitle="Awaiting review"
//           icon={Circle}
//           iconColor="orange"
//         />
//         <StatCard
//           title="Open Bug Reports"
//           value={stats.bugs}
//           subtitle="Needs attention"
//           icon={Bug}
//           iconColor="red"
//         />
//         <StatCard
//           title="Avg. Rating"
//           value={stats.avgRating}
//           subtitle="From rated feedback"
//           icon={Star}
//           iconColor="blue"
//         />
//       </div>

//       {/* ── Filter bar ──────────────────────────────────── */}
//       <Card padding={false} className="mb-4">
//         <div className="p-4 flex flex-col sm:flex-row gap-3">
//           <Input
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             placeholder="Search feedback or submitter..."
//             icon={Search}
//             containerClassName="flex-1"
//           />
//           <Select
//             placeholder="All types"
//             value={typeFilter}
//             onChange={(e) => setTypeFilter(e.target.value)}
//             options={TYPE_FILTER_OPTIONS}
//             containerClassName="sm:w-48"
//           />
//           <Select
//             placeholder="All statuses"
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//             options={STATUS_FILTER_OPTIONS}
//             containerClassName="sm:w-40"
//           />
//           {hasActiveFilters && (
//             <button
//               onClick={handleResetFilters}
//               className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
//             >
//               <RotateCcw size={13} />
//               Reset
//             </button>
//           )}
//         </div>
//       </Card>

//       {/* ── Feedback list ───────────────────────────────── */}
//       {filtered.length === 0 ? (
//         <Card padding={false}>
//           <EmptyState
//             icon={MessageSquare}
//             title="No feedback found"
//             description={
//               hasActiveFilters
//                 ? "Try adjusting your filters to see more results."
//                 : "User feedback from the mobile app will appear here."
//             }
//             action={hasActiveFilters ? handleResetFilters : undefined}
//             actionLabel={hasActiveFilters ? "Reset filters" : undefined}
//           />
//         </Card>
//       ) : (
//         <div className="flex flex-col gap-3">
//           {filtered.map((item) => {
//             const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.other;
//             const Icon = cfg.icon;

//             return (
//               <Card
//                 key={item.id}
//                 hover
//                 onClick={() => openDetail(item)}
//                 className="cursor-pointer"
//               >
//                 <div className="flex items-start gap-3.5">
//                   <div
//                     className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
//                     style={{ backgroundColor: cfg.bg }}
//                   >
//                     <Icon size={16} style={{ color: cfg.color }} />
//                   </div>

//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center gap-2 flex-wrap mb-1.5">
//                       <span
//                         className="text-xs font-semibold px-2 py-0.5 rounded-full"
//                         style={{ color: cfg.color, backgroundColor: cfg.bg }}
//                       >
//                         {cfg.label}
//                       </span>
//                       {item.status === "open" ? (
//                         <Badge variant="warning" size="sm" dot>Open</Badge>
//                       ) : (
//                         <Badge variant="success" size="sm" dot>Resolved</Badge>
//                       )}
//                       {item.rating != null && <StarRating rating={item.rating} />}
//                     </div>

//                     <p className="text-sm text-gray-800 leading-relaxed line-clamp-2">
//                       {item.message}
//                     </p>

//                     <div className="flex items-center gap-2 mt-3">
//                       <Avatar name={item.submittedBy?.name} />
//                       <div className="flex flex-col leading-tight">
//                         <span className="text-xs font-medium text-gray-700">
//                           {item.submittedBy?.name || "Anonymous"}
//                         </span>
//                         <span className="text-xs text-gray-400">
//                           {formatRelative(item.createdAt)}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </Card>
//             );
//           })}
//         </div>
//       )}

//       {/* ── Detail / action modal ───────────────────────── */}
//       <Modal
//         isOpen={!!selected}
//         onClose={closeDetail}
//         title="Feedback Detail"
//         subtitle={selected ? formatDate(selected.createdAt) : ""}
//         footer={
//           selected && (
//             <div className="flex items-center justify-between w-full">
//               <Button variant="ghost" onClick={closeDetail}>
//                 Close
//               </Button>
//               <div className="flex items-center gap-2">
//                 {selected.status === "open" ? (
//                   <Button
//                     variant="success"
//                     icon={CheckCircle2}
//                     loading={saving}
//                     onClick={() => handleSave("resolved")}
//                   >
//                     Mark Resolved
//                   </Button>
//                 ) : (
//                   <Button
//                     variant="secondary"
//                     icon={Circle}
//                     loading={saving}
//                     onClick={() => handleSave("open")}
//                   >
//                     Reopen
//                   </Button>
//                 )}
//                 <Button
//                   variant="primary"
//                   icon={Save}
//                   loading={saving}
//                   onClick={() => handleSave(selected.status)}
//                 >
//                   Save Note
//                 </Button>
//               </div>
//             </div>
//           )
//         }
//       >
//         {selected && (
//           <div className="flex flex-col gap-5">
//             {/* Type + status row */}
//             <div className="flex items-center gap-2 flex-wrap">
//               {(() => {
//                 const cfg = TYPE_CONFIG[selected.type] || TYPE_CONFIG.other;
//                 const Icon = cfg.icon;
//                 return (
//                   <span
//                     className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
//                     style={{ color: cfg.color, backgroundColor: cfg.bg }}
//                   >
//                     <Icon size={12} />
//                     {cfg.label}
//                   </span>
//                 );
//               })()}
//               {selected.status === "open" ? (
//                 <Badge variant="warning" size="sm" dot>Open</Badge>
//               ) : (
//                 <Badge variant="success" size="sm" dot>Resolved</Badge>
//               )}
//               {selected.rating != null && <StarRating rating={selected.rating} size={15} />}
//             </div>

//             {/* Message */}
//             <div>
//               <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
//                 Message
//               </p>
//               <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 rounded-lg p-3.5 border border-gray-100">
//                 {selected.message}
//               </p>
//             </div>

//             {/* Submitted by */}
//             <div>
//               <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
//                 Submitted by
//               </p>
//               <div className="flex items-center gap-2.5">
//                 <Avatar name={selected.submittedBy?.name} />
//                 <div className="flex flex-col leading-tight">
//                   <span className="text-sm font-medium text-gray-800">
//                     {selected.submittedBy?.name || "Anonymous"}
//                   </span>
//                   <span className="text-xs text-gray-400">
//                     {selected.submittedBy?.email || "No account linked — cannot follow up"}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Internal note */}
//             <Textarea
//               label="Internal note"
//               placeholder="Add a note for the team — not visible to the user..."
//               hint="Visible only to admins. Use this to track what action was taken."
//               value={noteDraft}
//               onChange={(e) => setNoteDraft(e.target.value)}
//               rows={3}
//             />
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// }