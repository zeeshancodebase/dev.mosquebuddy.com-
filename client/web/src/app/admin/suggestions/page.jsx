"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  Lightbulb,
  ExternalLink,
} from "lucide-react";

import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardDivider } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { PageLoader } from "@/components/ui/Spinner";
import Pagination from "@/components/ui/Pagination";
import { APP_CONFIG } from "@/lib/constants";
import CopyToClipboard from "@/components/ui/CopyToClipboard";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const VENUE_TYPE_LABELS = {
  masjid: "Masjid",
  musalla: "Musalla",
  islamic_center: "Islamic Center",
  prayer_room: "Prayer Room",
  temporary_jumuah_venue: "Temporary Jumu'ah Venue",
  eidgah_open_ground: "Eidgah / Open Ground",
  hall_community_venue: "Hall / Community Venue",
  other: "Other",
};

const STATUS_CONFIG = {
  pending: { label: "Pending", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  duplicate: { label: "Duplicate", variant: "neutral" },
  needs_more_info: { label: "More Info Needed", variant: "info" },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Suggestion Detail Modal ──────────────────────────────────────────────────
function SuggestionDetailModal({
  suggestion,
  onClose,
  onApprove,
  onReject,
  actionLoading,
  reviewNote,
  setReviewNote,
}) {
  if (!suggestion) return null;

  const statusCfg = STATUS_CONFIG[suggestion.status];
  const venueTypeLabel =
    VENUE_TYPE_LABELS[suggestion.venueType] || suggestion.venueType;

  return (
    <Modal
      isOpen={!!suggestion}
      onClose={onClose}
      title="Venue Suggestion"
      subtitle={`Submitted by ${suggestion.submittedBy.name} · ${formatDate(suggestion.createdAt)}`}
      footer={
        suggestion.status === "pending" ? (
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="danger"
              icon={XCircle}
              onClick={() => onReject(suggestion.id, reviewNote)}
              loading={actionLoading === "reject"}
              disabled={!!actionLoading}
            >
              Reject
            </Button>
            {/* <Button
              variant="primary"
              onClick={() =>
                router.push(`/admin/venues/new?suggestion=${suggestion.id}`)
              }
            >
              Create Venue
            </Button> */}
            <Button
              variant="success"
              icon={CheckCircle}
              onClick={() => onApprove(suggestion.id, reviewNote)}
              loading={actionLoading === "approve"}
              disabled={!!actionLoading}
            >
              Approve & Create Venue
            </Button>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        )
      }
    >
      <div className="flex flex-col gap-5">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Suggestion Status</span>
          <Badge variant={statusCfg.variant} dot>
            {statusCfg.label}
          </Badge>
        </div>

        {/* Venue name + type */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">
            Suggested Venue
          </p>
          <p className="text-base font-bold text-gray-900">
            {suggestion.suggestedName}
          </p>
          <p className="text-sm text-emerald-700 mt-0.5">{venueTypeLabel}</p>
        </div>

        {/* Location info */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Location Details
          </p>
          <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
            {[
              { label: "Address", value: suggestion.address },
              { label: "Area", value: suggestion.areaText },
              { label: "City", value: suggestion.cityText },
              { label: "State", value: suggestion.stateText },
              { label: "Country", value: suggestion.countryText },
              { label: "Pincode", value: suggestion.pincode },
              { label: "Latitude", value: suggestion.latitude, copy: true },
              { label: "Longitude", value: suggestion.longitude, copy: true },
              { label: "Phone", value: suggestion.phone || "—" },
            ].map(({ label, value, copy }) => (
              <div
                key={label}
                className="grid grid-cols-5 px-4 py-2.5 text-sm items-center"
              >
                <span className="col-span-2 text-gray-400">{label}</span>

                <div className="col-span-3 flex items-center gap-2">
                  <span className="text-gray-800 font-medium">
                    {value || "—"}
                  </span>

                  {copy && value && (
                    <CopyToClipboard
                      value={value}
                      label={label.toLowerCase()}
                      successMessage={`${label} copied!`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Google Maps link */}
        {suggestion.googleMapsLink && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={ExternalLink}
              onClick={() => window.open(suggestion.googleMapsLink, "_blank")}
            >
              Open in Google Maps
            </Button>
          </div>
        )}

        {/* Optional timing note */}
        {suggestion.optionalTimingNote && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Timing Note (from user)
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <p className="text-sm text-blue-900">
                {suggestion.optionalTimingNote}
              </p>
            </div>
          </div>
        )}

        {/* User note */}
        {suggestion.userNote && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Additional Note
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <p className="text-sm text-amber-900 leading-relaxed">
                "{suggestion.userNote}"
              </p>
            </div>
          </div>
        )}

        {/* Review note */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Review Note
          </p>

          <textarea
            rows={4}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Optional note for approval or rejection..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Submitted by */}
        <CardDivider />
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Submitted by</p>
            <p className="font-medium text-gray-800">
              {suggestion.submittedBy.name}
            </p>
            <p className="text-xs text-gray-500">
              {suggestion.submittedBy.email}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-0.5">Submitted on</p>
            <p className="font-medium text-gray-800">
              {formatDate(suggestion.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SuggestionsPage() {
  // States Initialisation
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [reviewNote, setReviewNote] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 20;

  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalSuggestions: 0,
  });

  // Stats
  const total = suggestions.length;
  const pending = suggestions.filter((s) => s.status === "pending").length;
  const approved = suggestions.filter((s) => s.status === "approved").length;
  const rejected = suggestions.filter((s) => s.status === "rejected").length;

  const fetchSuggestions = async () => {
    try {
      setLoading(true);

      const res = await api.get("/admin/venue-suggestions", {
        params: {
          page: currentPage,
          limit: PAGE_SIZE,
          search: search || undefined,
          status: statusFilter || undefined,
          venueType: typeFilter || undefined,
        },
      });
      // console.log(res.data);
      setSuggestions(res.data || []);
      setPagination(res.meta.pagination);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load venue suggestions.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [currentPage, search, statusFilter, typeFilter]);
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, typeFilter]);

  const handleApprove = async (id, approvedVenueId, reviewNote) => {
    // MVP: approvedVenueId not required yet.
    // Future: wire "Create Venue from Suggestion" flow and pass approvedVenueId here.
    // if (!approvedVenueId) {
    //   toast.error(
    //     "Please create or select a venue before approving this suggestion.",
    //   );
    //   return;
    // }

    try {
      setActionLoading("approve");

      await api.patch(`/admin/venue-suggestions/${id}/status`, {
        status: "approved",
        reviewNote,
      });

      toast.success("Venue suggestion approved successfully.");

      setSelectedSuggestion(null);

      await fetchSuggestions();
    } catch (error) {
      console.error("Approve suggestion failed:", error);

      toast.error(
        error?.response?.data?.message || "Failed to approve venue suggestion.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id, reviewNote) => {
    try {
      setActionLoading("reject");

      await api.patch(`/admin/venue-suggestions/${id}/status`, {
        status: "rejected",
        reviewNote,
      });

      toast.success("Venue suggestion rejected successfully.");

      setSelectedSuggestion(null);

      await fetchSuggestions();
    } catch (error) {
      console.error("Reject suggestion failed:", error);

      toast.error(
        error?.response?.data?.message || "Failed to reject venue suggestion.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <PageHeader
        title="Venue Suggestions"
        subtitle={`Review mosques and prayer venues suggested by users that are missing from ${APP_CONFIG.name}.`}
        actions={
          pending > 0 && (
            <Badge variant="warning" dot>
              {pending} pending
            </Badge>
          )
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Suggestions"
          value={total}
          icon={Lightbulb}
          iconColor="blue"
        />
        <StatCard
          title="Pending Review"
          value={pending}
          icon={Clock}
          iconColor="orange"
          subtitle={pending > 0 ? "Needs attention" : "All clear"}
        />
        <StatCard
          title="Approved"
          value={approved}
          icon={CheckCircle}
          iconColor="emerald"
          subtitle="Venues created"
        />
        <StatCard
          title="Rejected"
          value={rejected}
          icon={XCircle}
          iconColor="red"
          subtitle="Closed"
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by name, area, or city..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              placeholder="All statuses"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
                { value: "duplicate", label: "Duplicate" },
                { value: "needs_more_info", label: "More Info Needed" },
              ]}
            />
          </div>
          <div className="w-full md:w-52">
            <Select
              placeholder="All venue types"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={Object.entries(VENUE_TYPE_LABELS).map(
                ([value, label]) => ({
                  value,
                  label,
                }),
              )}
            />
          </div>
          {(search || statusFilter || typeFilter) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setTypeFilter("");
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Suggestions list */}
      <Card padding={false}>
        {loading ? (
          <PageLoader />
        ) : total === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No suggestions found"
            description="No venue suggestions match your current filters."
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider rounded-t-xl">
              <div className="col-span-3">Suggested Venue</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-3">Location</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Submitted by</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            {suggestions.map((suggestion) => {
              const statusCfg = STATUS_CONFIG[suggestion.status];
              return (
                <div
                  key={suggestion.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 hover:bg-gray-50 transition-colors items-center"
                >
                  {/* Name */}
                  <div className="col-span-3">
                    <p className="text-sm font-semibold text-gray-900">
                      {suggestion.suggestedName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(suggestion.createdAt)}
                    </p>
                  </div>

                  {/* Type */}
                  <div className="col-span-2">
                    <p className="text-sm text-gray-700">
                      {VENUE_TYPE_LABELS[suggestion.venueType] ||
                        suggestion.venueType}
                    </p>
                  </div>

                  {/* Location */}
                  <div className="col-span-3">
                    <p className="text-sm text-gray-700">
                      {suggestion.areaText}
                    </p>
                    <p className="text-xs text-gray-400">
                      {suggestion.cityText}, {suggestion.stateText}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <Badge variant={statusCfg.variant} size="sm" dot>
                      {statusCfg.label}
                    </Badge>
                  </div>

                  {/* Submitted by */}
                  <div className="col-span-2">
                    <p className="text-sm text-gray-700">
                      {suggestion.submittedBy.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {suggestion.submittedBy.email}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Eye}
                      onClick={() => setSelectedSuggestion(suggestion)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!loading && pagination.totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalSuggestions}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      {/* Detail modal */}
      <SuggestionDetailModal
        suggestion={selectedSuggestion}
        onClose={() => {
          setSelectedSuggestion(null);
          setReviewNote("");
        }}
        reviewNote={reviewNote}
        setReviewNote={setReviewNote}
        onApprove={handleApprove}
        onReject={handleReject}
        actionLoading={actionLoading}
      />
    </div>
  );
}

// UI prototype with mock data can be deleted if UI is good with real data
// "use client";

// import { useState } from "react";
// import {
//   MapPin,
//   CheckCircle,
//   XCircle,
//   Clock,
//   Eye,
//   Search,
//   Lightbulb,
//   ExternalLink,
// } from "lucide-react";

// import PageHeader from "@/components/shared/PageHeader";
// import StatCard from "@/components/shared/StatCard";
// import Button from "@/components/ui/Button";
// import Badge from "@/components/ui/Badge";
// import Input from "@/components/ui/Input";
// import Select from "@/components/ui/Select";
// import Card, { CardDivider } from "@/components/ui/Card";
// import Modal from "@/components/ui/Modal";
// import EmptyState from "@/components/ui/EmptyState";
// import toast from "react-hot-toast";

// // ─── Mock data — replace with API call when backend is ready ────────────────
// const MOCK_SUGGESTIONS = [
//   {
//     id: "s1",
//     suggestedName: "Masjid Umar Ibn Al-Khattab",
//     venueType: "masjid",
//     address: "14th Cross, Sector 6, HSR Layout",
//     areaText: "HSR Layout",
//     cityText: "Bengaluru",
//     stateText: "Karnataka",
//     countryText: "India",
//     pincode: "560102",
//     googleMapsLink: "https://maps.google.com/?q=Masjid+Umar+HSR",
//     phone: "+91 98765 43210",
//     optionalTimingNote: "Fajr around 5:15 AM, Jumu'ah at 1:15 PM",
//     userNote:
//       "This mosque has been here for over 10 years but is not listed anywhere online. Very active community.",
//     status: "pending",
//     submittedBy: { name: "Khalid Ansari", email: "khalid@example.com" },
//     createdAt: "2026-06-13T08:20:00Z",
//   },
//   {
//     id: "s2",
//     suggestedName: "Al-Furqan Prayer Room",
//     venueType: "prayer_room",
//     address: "Prestige Tech Park, Block C, Whitefield",
//     areaText: "Whitefield",
//     cityText: "Bengaluru",
//     stateText: "Karnataka",
//     countryText: "India",
//     pincode: "560066",
//     googleMapsLink: null,
//     phone: null,
//     optionalTimingNote: "Only Dhuhr and Asr on weekdays",
//     userNote:
//       "There is a dedicated prayer room inside the tech park for Muslim employees.",
//     status: "pending",
//     submittedBy: { name: "Faisal Rahman", email: "faisal@example.com" },
//     createdAt: "2026-06-11T12:45:00Z",
//   },
//   {
//     id: "s3",
//     suggestedName: "Eidgah Ground Hennur",
//     venueType: "eidgah_open_ground",
//     address: "Near Hennur Bus Depot, Hennur Main Road",
//     areaText: "Hennur",
//     cityText: "Bengaluru",
//     stateText: "Karnataka",
//     countryText: "India",
//     pincode: "560043",
//     googleMapsLink: "https://maps.google.com/?q=Eidgah+Hennur",
//     phone: null,
//     optionalTimingNote: null,
//     userNote: "Used for Eid prayers. Very large ground, accommodates thousands.",
//     status: "approved",
//     approvedVenueId: "v7",
//     submittedBy: { name: "Salman Qureshi", email: "salman@example.com" },
//     createdAt: "2026-06-05T09:00:00Z",
//   },
//   {
//     id: "s4",
//     suggestedName: "Friday Prayers — Leela Palace Ballroom",
//     venueType: "temporary_jumuah_venue",
//     address: "The Leela Palace, Airport Road",
//     areaText: "Airport Road",
//     cityText: "Bengaluru",
//     stateText: "Karnataka",
//     countryText: "India",
//     pincode: "560008",
//     googleMapsLink: null,
//     phone: null,
//     optionalTimingNote: "Jumu'ah at 1:30 PM every Friday",
//     userNote: "Temporary Friday prayers arranged by a local Islamic association.",
//     status: "rejected",
//     submittedBy: { name: "Imran Siddiqui", email: "imran@example.com" },
//     createdAt: "2026-06-02T15:30:00Z",
//   },
//   {
//     id: "s5",
//     suggestedName: "Masjid Bilal",
//     venueType: "masjid",
//     address: "3rd Block, Rajajinagar",
//     areaText: "Rajajinagar",
//     cityText: "Bengaluru",
//     stateText: "Karnataka",
//     countryText: "India",
//     pincode: "560010",
//     googleMapsLink: "https://maps.google.com/?q=Masjid+Bilal+Rajajinagar",
//     phone: "+91 80 2345 6789",
//     optionalTimingNote: "All 5 prayers with jamā'ah. Jumu'ah at 1:00 PM.",
//     userNote: "Active mosque, recently renovated. Should definitely be on {APP_CONFIG.name}.",
//     status: "pending",
//     submittedBy: { name: "Hassan Baig", email: "hassan@example.com" },
//     createdAt: "2026-06-14T07:10:00Z",
//   },
// ];

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const VENUE_TYPE_LABELS = {
//   masjid: "Masjid",
//   musalla: "Musalla",
//   islamic_center: "Islamic Center",
//   prayer_room: "Prayer Room",
//   temporary_jumuah_venue: "Temporary Jumu'ah Venue",
//   eidgah_open_ground: "Eidgah / Open Ground",
//   hall_community_venue: "Hall / Community Venue",
//   other: "Other",
// };

// const STATUS_CONFIG = {
//   pending: { label: "Pending", variant: "warning" },
//   approved: { label: "Approved", variant: "success" },
//   rejected: { label: "Rejected", variant: "danger" },
//   duplicate: { label: "Duplicate", variant: "neutral" },
//   needs_more_info: { label: "More Info Needed", variant: "info" },
// };

// function formatDate(iso) {
//   return new Date(iso).toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   });
// }

// // ─── Suggestion Detail Modal ──────────────────────────────────────────────────
// function SuggestionDetailModal({ suggestion, onClose, onApprove, onReject, actionLoading }) {
//   if (!suggestion) return null;

//   const statusCfg = STATUS_CONFIG[suggestion.status];
//   const venueTypeLabel = VENUE_TYPE_LABELS[suggestion.venueType] || suggestion.venueType;

//   return (
//     <Modal
//       isOpen={!!suggestion}
//       onClose={onClose}
//       title="Venue Suggestion"
//       subtitle={`Submitted by ${suggestion.submittedBy.name} · ${formatDate(suggestion.createdAt)}`}
//       footer={
//         suggestion.status === "pending" ? (
//           <div className="flex items-center justify-end gap-2">
//             <Button variant="secondary" onClick={onClose}>
//               Close
//             </Button>
//             <Button
//               variant="danger"
//               icon={XCircle}
//               onClick={() => onReject(suggestion.id)}
//               loading={actionLoading === "reject"}
//               disabled={!!actionLoading}
//             >
//               Reject
//             </Button>
//             <Button
//               variant="success"
//               icon={CheckCircle}
//               onClick={() => onApprove(suggestion.id)}
//               loading={actionLoading === "approve"}
//               disabled={!!actionLoading}
//             >
//               Approve & Create Venue
//             </Button>
//           </div>
//         ) : (
//           <div className="flex justify-end">
//             <Button variant="secondary" onClick={onClose}>
//               Close
//             </Button>
//           </div>
//         )
//       }
//     >
//       <div className="flex flex-col gap-5">

//         {/* Status */}
//         <div className="flex items-center justify-between">
//           <span className="text-sm text-gray-500">Suggestion Status</span>
//           <Badge variant={statusCfg.variant} dot>
//             {statusCfg.label}
//           </Badge>
//         </div>

//         {/* Venue name + type */}
//         <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
//           <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">
//             Suggested Venue
//           </p>
//           <p className="text-base font-bold text-gray-900">
//             {suggestion.suggestedName}
//           </p>
//           <p className="text-sm text-emerald-700 mt-0.5">{venueTypeLabel}</p>
//         </div>

//         {/* Location info */}
//         <div>
//           <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
//             Location Details
//           </p>
//           <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
//             {[
//               { label: "Address", value: suggestion.address },
//               { label: "Area", value: suggestion.areaText },
//               { label: "City", value: suggestion.cityText },
//               { label: "State", value: suggestion.stateText },
//               { label: "Country", value: suggestion.countryText },
//               { label: "Pincode", value: suggestion.pincode },
//               { label: "Phone", value: suggestion.phone || "—" },
//             ].map(({ label, value }) => (
//               <div key={label} className="grid grid-cols-5 px-4 py-2.5 text-sm">
//                 <span className="col-span-2 text-gray-400">{label}</span>
//                 <span className="col-span-3 text-gray-800 font-medium">
//                   {value || "—"}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Google Maps link */}
//         {suggestion.googleMapsLink && (
//           <div className="flex items-center gap-2">
//             <Button
//               variant="ghost"
//               size="sm"
//               icon={ExternalLink}
//               onClick={() => window.open(suggestion.googleMapsLink, "_blank")}
//             >
//               Open in Google Maps
//             </Button>
//           </div>
//         )}

//         {/* Optional timing note */}
//         {suggestion.optionalTimingNote && (
//           <div>
//             <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
//               Timing Note (from user)
//             </p>
//             <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
//               <p className="text-sm text-blue-900">{suggestion.optionalTimingNote}</p>
//             </div>
//           </div>
//         )}

//         {/* User note */}
//         {suggestion.userNote && (
//           <div>
//             <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
//               Additional Note
//             </p>
//             <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
//               <p className="text-sm text-amber-900 leading-relaxed">
//                 "{suggestion.userNote}"
//               </p>
//             </div>
//           </div>
//         )}

//         {/* Submitted by */}
//         <CardDivider />
//         <div className="flex items-center justify-between text-sm">
//           <div>
//             <p className="text-xs text-gray-400 mb-0.5">Submitted by</p>
//             <p className="font-medium text-gray-800">{suggestion.submittedBy.name}</p>
//             <p className="text-xs text-gray-500">{suggestion.submittedBy.email}</p>
//           </div>
//           <div className="text-right">
//             <p className="text-xs text-gray-400 mb-0.5">Submitted on</p>
//             <p className="font-medium text-gray-800">
//               {formatDate(suggestion.createdAt)}
//             </p>
//           </div>
//         </div>
//       </div>
//     </Modal>
//   );
// }

// // ─── Main Page ────────────────────────────────────────────────────────────────
// export default function SuggestionsPage() {
//   const [suggestions, setSuggestions] = useState(MOCK_SUGGESTIONS);
//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [typeFilter, setTypeFilter] = useState("");
//   const [selectedSuggestion, setSelectedSuggestion] = useState(null);
//   const [actionLoading, setActionLoading] = useState(null);

//   // Stats
//   const total = suggestions.length;
//   const pending = suggestions.filter((s) => s.status === "pending").length;
//   const approved = suggestions.filter((s) => s.status === "approved").length;
//   const rejected = suggestions.filter((s) => s.status === "rejected").length;

//   // Filtered list
//   const filtered = suggestions.filter((s) => {
//     const matchesSearch =
//       !search ||
//       s.suggestedName.toLowerCase().includes(search.toLowerCase()) ||
//       s.areaText.toLowerCase().includes(search.toLowerCase()) ||
//       s.cityText.toLowerCase().includes(search.toLowerCase());
//     const matchesStatus = !statusFilter || s.status === statusFilter;
//     const matchesType = !typeFilter || s.venueType === typeFilter;
//     return matchesSearch && matchesStatus && matchesType;
//   });

//   // Approve — swap with real API when backend ready
//   const handleApprove = async (id) => {
//     setActionLoading("approve");
//     await new Promise((res) => setTimeout(res, 1000));
//     setSuggestions((prev) =>
//       prev.map((s) => (s.id === id ? { ...s, status: "approved" } : s))
//     );
//     setActionLoading(null);
//     setSelectedSuggestion(null);
//     toast.success("Suggestion approved. You can now create the venue record.");
//   };

//   // Reject — swap with real API when backend ready
//   const handleReject = async (id) => {
//     setActionLoading("reject");
//     await new Promise((res) => setTimeout(res, 800));
//     setSuggestions((prev) =>
//       prev.map((s) => (s.id === id ? { ...s, status: "rejected" } : s))
//     );
//     setActionLoading(null);
//     setSelectedSuggestion(null);
//     toast.success("Suggestion rejected and closed.");
//   };

//   return (
//     <div className="flex flex-col gap-6">

//       {/* Page header */}
//       <PageHeader
//         title="Venue Suggestions"
//         subtitle="Review mosques and prayer venues suggested by users that are missing from {APP_CONFIG.name}."
//         actions={
//           pending > 0 && (
//             <Badge variant="warning" dot>
//               {pending} pending
//             </Badge>
//           )
//         }
//       />

//       {/* Stats */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         <StatCard
//           title="Total Suggestions"
//           value={total}
//           icon={Lightbulb}
//           iconColor="blue"
//         />
//         <StatCard
//           title="Pending Review"
//           value={pending}
//           icon={Clock}
//           iconColor="orange"
//           subtitle={pending > 0 ? "Needs attention" : "All clear"}
//         />
//         <StatCard
//           title="Approved"
//           value={approved}
//           icon={CheckCircle}
//           iconColor="emerald"
//           subtitle="Venues created"
//         />
//         <StatCard
//           title="Rejected"
//           value={rejected}
//           icon={XCircle}
//           iconColor="red"
//           subtitle="Closed"
//         />
//       </div>

//       {/* Filters */}
//       <Card>
//         <div className="flex flex-col md:flex-row gap-3">
//           <div className="flex-1">
//             <Input
//               placeholder="Search by name, area, or city..."
//               icon={Search}
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//           </div>
//           <div className="w-full md:w-48">
//             <Select
//               placeholder="All statuses"
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//               options={[
//                 { value: "pending", label: "Pending" },
//                 { value: "approved", label: "Approved" },
//                 { value: "rejected", label: "Rejected" },
//                 { value: "duplicate", label: "Duplicate" },
//               ]}
//             />
//           </div>
//           <div className="w-full md:w-52">
//             <Select
//               placeholder="All venue types"
//               value={typeFilter}
//               onChange={(e) => setTypeFilter(e.target.value)}
//               options={Object.entries(VENUE_TYPE_LABELS).map(([value, label]) => ({
//                 value,
//                 label,
//               }))}
//             />
//           </div>
//           {(search || statusFilter || typeFilter) && (
//             <Button
//               variant="ghost"
//               onClick={() => {
//                 setSearch("");
//                 setStatusFilter("");
//                 setTypeFilter("");
//               }}
//             >
//               Clear
//             </Button>
//           )}
//         </div>
//       </Card>

//       {/* Suggestions list */}
//       <Card padding={false}>
//         {filtered.length === 0 ? (
//           <EmptyState
//             icon={MapPin}
//             title="No suggestions found"
//             description="No venue suggestions match your current filters."
//           />
//         ) : (
//           <div className="divide-y divide-gray-100">

//             {/* Table header */}
//             <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider rounded-t-xl">
//               <div className="col-span-3">Suggested Venue</div>
//               <div className="col-span-2">Type</div>
//               <div className="col-span-3">Location</div>
//               <div className="col-span-1">Status</div>
//               <div className="col-span-2">Submitted by</div>
//               <div className="col-span-1 text-right">Action</div>
//             </div>

//             {filtered.map((suggestion) => {
//               const statusCfg = STATUS_CONFIG[suggestion.status];
//               return (
//                 <div
//                   key={suggestion.id}
//                   className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 hover:bg-gray-50 transition-colors items-center"
//                 >
//                   {/* Name */}
//                   <div className="col-span-3">
//                     <p className="text-sm font-semibold text-gray-900">
//                       {suggestion.suggestedName}
//                     </p>
//                     <p className="text-xs text-gray-400">
//                       {formatDate(suggestion.createdAt)}
//                     </p>
//                   </div>

//                   {/* Type */}
//                   <div className="col-span-2">
//                     <p className="text-sm text-gray-700">
//                       {VENUE_TYPE_LABELS[suggestion.venueType] || suggestion.venueType}
//                     </p>
//                   </div>

//                   {/* Location */}
//                   <div className="col-span-3">
//                     <p className="text-sm text-gray-700">
//                       {suggestion.areaText}
//                     </p>
//                     <p className="text-xs text-gray-400">
//                       {suggestion.cityText}, {suggestion.stateText}
//                     </p>
//                   </div>

//                   {/* Status */}
//                   <div className="col-span-1">
//                     <Badge variant={statusCfg.variant} size="sm" dot>
//                       {statusCfg.label}
//                     </Badge>
//                   </div>

//                   {/* Submitted by */}
//                   <div className="col-span-2">
//                     <p className="text-sm text-gray-700">
//                       {suggestion.submittedBy.name}
//                     </p>
//                     <p className="text-xs text-gray-400">
//                       {suggestion.submittedBy.email}
//                     </p>
//                   </div>

//                   {/* Action */}
//                   <div className="col-span-1 flex justify-end">
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       icon={Eye}
//                       onClick={() => setSelectedSuggestion(suggestion)}
//                     >
//                       View
//                     </Button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </Card>

//       {/* Detail modal */}
//       <SuggestionDetailModal
//         suggestion={selectedSuggestion}
//         onClose={() => setSelectedSuggestion(null)}
//         onApprove={handleApprove}
//         onReject={handleReject}
//         actionLoading={actionLoading}
//       />
//     </div>
//   );
// }
