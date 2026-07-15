"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  Filter,
  MessageSquare,
} from "lucide-react";
import { api } from "@/lib/api";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import Button from "@/components/ui/Button";
import Badge, { VerificationBadge } from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardHeader, CardDivider } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import Spinner, { PageLoader } from "@/components/ui/Spinner";
import toast from "react-hot-toast";

// ─── Mock data — replace with API call when backend is ready ────────────────
const MOCK_REPORTS = [
  {
    id: "r1",
    venue: { id: "v1", name: "Masjid Al-Noor", area: "BTM Layout" },
    prayerName: "asr",
    issueType: "wrong_time",
    currentJamaahTime: "04:30",
    suggestedJamaahTime: "04:45",
    currentAzaanTime: "04:15",
    suggestedAzaanTime: "04:25",
    userNote: "The timing on the board shows 4:45 PM, the app shows 4:30 PM.",
    status: "pending",
    submittedBy: { name: "Ahmed Raza", email: "ahmed@example.com" },
    createdAt: "2026-06-12T10:30:00Z",
  },
  {
    id: "r2",
    venue: { id: "v2", name: "Masjid Ibrahim", area: "Koramangala" },
    prayerName: "fajr",
    issueType: "outdated",
    currentJamaahTime: "05:15",
    suggestedJamaahTime: "05:00",
    currentAzaanTime: null,
    suggestedAzaanTime: null,
    userNote: "Fajr jamā'ah changed to 5:00 AM since last month.",
    status: "pending",
    submittedBy: { name: "Umar Farooq", email: "umar@example.com" },
    createdAt: "2026-06-11T06:15:00Z",
  },
  {
    id: "r3",
    venue: {
      id: "v3",
      name: "Jumu'ah Center Indiranagar",
      area: "Indiranagar",
    },
    prayerName: "jumuah",
    issueType: "wrong_time",
    currentJamaahTime: "13:30",
    suggestedJamaahTime: "13:20",
    currentAzaanTime: null,
    suggestedAzaanTime: null,
    userNote: "Second slot starts at 1:20 PM, not 1:30 PM.",
    status: "approved",
    submittedBy: { name: "Bilal Sheikh", email: "bilal@example.com" },
    createdAt: "2026-06-09T13:00:00Z",
  },
  {
    id: "r4",
    venue: { id: "v1", name: "Masjid Al-Noor", area: "BTM Layout" },
    prayerName: "isha",
    issueType: "missing",
    currentJamaahTime: null,
    suggestedJamaahTime: "21:00",
    currentAzaanTime: null,
    suggestedAzaanTime: "20:45",
    userNote: "Isha timing is missing in the app. It's at 9 PM.",
    status: "rejected",
    submittedBy: { name: "Zaid Hussain", email: "zaid@example.com" },
    createdAt: "2026-06-08T21:10:00Z",
  },
  {
    id: "r5",
    venue: { id: "v4", name: "Musalla Al-Salam", area: "HSR Layout" },
    prayerName: "maghrib",
    issueType: "wrong_time",
    currentJamaahTime: "18:45",
    suggestedJamaahTime: "19:00",
    currentAzaanTime: null,
    suggestedAzaanTime: null,
    userNote: "Maghrib is always after 7 PM here.",
    status: "pending",
    submittedBy: { name: "Yusuf Malik", email: "yusuf@example.com" },
    createdAt: "2026-06-13T19:15:00Z",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PRAYER_LABELS = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
  jumuah: "Jumu'ah",
};

// const ISSUE_LABELS = {
//   wrong_time: "Wrong Time",
//   outdated: "Outdated",
//   missing: "Missing",
//   other: "Other",
// };

const ISSUE_LABELS = {
  both_times_wrong: "Both Times Wrong",
  azaan_time_wrong: "Azaan Time Wrong",
  jamaah_time_wrong: "Jamā'ah Time Wrong",
  jumuah_time_wrong: "Jumu'ah Time Wrong",
  location_wrong: "Location Wrong",
  women_prayer_info_wrong: "Women's Prayer Info Wrong",
  facility_info_wrong: "Facility Info Wrong",
  venue_closed_or_inactive: "Venue Closed / Inactive",
  other: "Other",
};

const STATUS_CONFIG = {
  pending: { label: "Pending", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  needs_more_info: { label: "More Info Needed", variant: "info" },
};

function formatTime(t) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Report Detail Modal ──────────────────────────────────────────────────────
function ReportDetailModal({
  report,
  onClose,
  onApprove,
  onReject,
  actionLoading,
}) {
  if (!report) return null;

  const statusCfg = STATUS_CONFIG[report.status];
  const isJumuahReport = report.issueType === "jumuah_time_wrong";

  return (
    <Modal
      isOpen={!!report}
      onClose={onClose}
      title="Report Details"
      subtitle={`Submitted for ${report.venue.name} · ${PRAYER_LABELS[report.prayerName]}`}
      footer={
        report.status === "pending" ? (
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="danger"
              icon={XCircle}
              onClick={() => onReject(report.id)}
              loading={actionLoading === "reject"}
              disabled={!!actionLoading}
            >
              Reject
            </Button>
            <Button
              variant="success"
              icon={CheckCircle}
              onClick={() => onApprove(report.id)}
              loading={actionLoading === "approve"}
              disabled={!!actionLoading}
            >
              Approve & Update Timing
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
          <span className="text-sm text-gray-500">Report Status</span>
          <Badge variant={statusCfg.variant} dot>
            {statusCfg.label}
          </Badge>
        </div>

        {/* Venue + Prayer */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Mosque</p>
            <p className="text-sm font-semibold text-gray-900">
              {report.venue.name}
            </p>
            <p className="text-xs text-gray-500">{report.venue.area.name}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">
              {isJumuahReport ? "Jumu'ah Slot · Issue" : "Prayer · Issue"}
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {isJumuahReport
                ? `Slot ${report.jumuahTiming?.slotNumber ?? "—"}`
                : PRAYER_LABELS[report.prayerName]}
            </p>
            <p className="text-xs text-gray-500">
              {ISSUE_LABELS[report.issueType]}
            </p>
          </div>
        </div>

        {/* Timing comparison */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Timing Comparison
          </p>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-3 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Field</span>
              <span className="text-center">Current (App)</span>
              <span className="text-center">Suggested (User)</span>
            </div>
            {/* <CardDivider /> */}
            <div className="divide-y divide-gray-100">
              <div className="grid grid-cols-3 px-4 py-3 text-sm">
                <span className="text-gray-500">Azaan</span>
                <span className="text-center text-gray-700">
                  {formatTime(report.currentAzaanTime)}
                </span>
                <span className="text-center font-medium text-emerald-700">
                  {formatTime(report.suggestedAzaanTime)}
                </span>
              </div>
              {isJumuahReport && (
                <div className="grid grid-cols-3 px-4 py-3 text-sm">
                  <span className="text-gray-500">Khutbah</span>
                  <span className="text-center text-gray-700">
                    {formatTime(report.currentKhutbahTime)}
                  </span>
                  <span className="text-center font-medium text-emerald-700">
                    {formatTime(report.suggestedKhutbahTime)}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-3 px-4 py-3 text-sm">
                <span className="text-gray-500">Jamā'ah</span>
                <span className="text-center text-gray-700">
                  {formatTime(report.currentJamaahTime)}
                </span>
                <span className="text-center font-medium text-emerald-700">
                  {formatTime(report.suggestedJamaahTime)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User note */}
        {report.userNote && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              User Note
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <p className="text-sm text-amber-900 leading-relaxed">
                "{report.userNote}"
              </p>
            </div>
          </div>
        )}

        {/* Submitted by */}
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Submitted by</p>
            <p className="font-medium text-gray-800">
              {report.submittedBy.name}
            </p>
            <p className="text-xs text-gray-500">{report.submittedBy.email}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-0.5">Submitted on</p>
            <p className="font-medium text-gray-800">
              {formatDate(report.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [prayerFilter, setPrayerFilter] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    setLoading(true);
    try {
      const res = await api.get("/admin/timing-reports?limit=100");
      console.log(res.data);
      setReports(res.data || []);
    } catch (err) {
      toast.error(err.message || "Couldn't load reports.");
    } finally {
      setLoading(false);
    }
  }

  // Stats
  const total = reports.length;
  const pending = reports.filter((r) => r.status === "pending").length;
  const approved = reports.filter((r) => r.status === "approved").length;
  const rejected = reports.filter((r) => r.status === "rejected").length;

  // Filtered list
  const filtered = reports.filter((r) => {
    const matchesSearch =
  !search ||
  r.venue.name.toLowerCase().includes(search.toLowerCase()) ||
  r.venue.area.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || r.status === statusFilter;
    const matchesPrayer = !prayerFilter || r.prayerName === prayerFilter;
    return matchesSearch && matchesStatus && matchesPrayer;
  });

  const handleApprove = async (id) => {
    setActionLoading("approve");
    try {
      const res = await api.patch(`/admin/timing-reports/${id}/status`, {
        status: "approved",
      });
      const updated = res.data;
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setSelectedReport(null);

      if (res.appliedTimingUpdate || updated.status === "approved") {
        toast.success("Report approved. Timing has been updated.");
      } else {
        toast.success("Report approved.");
      }
    } catch (err) {
      toast.error(err.message || "Couldn't approve this report.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading("reject");
    try {
      const res = await api.patch(`/admin/timing-reports/${id}/status`, {
        status: "rejected",
      });
      const updated = res.data;
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setSelectedReport(null);
      toast.success("Report rejected and closed.");
    } catch (err) {
      toast.error(err.message || "Couldn't reject this report.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <PageHeader
        title="Timing Reports"
        subtitle="Review and resolve timing correction reports submitted by users."
        actions={
          pending > 0 && (
            <Badge variant="warning" dot>
              {pending} pending
            </Badge>
          )
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Reports"
          value={total}
          icon={MessageSquare}
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
          subtitle="Timings updated"
        />
        <StatCard
          title="Rejected"
          value={rejected}
          icon={XCircle}
          iconColor="red"
          subtitle="Closed reports"
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by mosque name or area..."
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
              ]}
            />
          </div>
          <div className="w-full md:w-44">
            <Select
              placeholder="All prayers"
              value={prayerFilter}
              onChange={(e) => setPrayerFilter(e.target.value)}
              options={[
                { value: "fajr", label: "Fajr" },
                { value: "dhuhr", label: "Dhuhr" },
                { value: "asr", label: "Asr" },
                { value: "maghrib", label: "Maghrib" },
                { value: "isha", label: "Isha" },
                { value: "jumuah", label: "Jumu'ah" },
              ]}
            />
          </div>
          {(search || statusFilter || prayerFilter) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setPrayerFilter("");
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Reports list */}
       <Card padding={false}>
        {loading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No reports found"
            description="No timing reports match your current filters."
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider rounded-t-xl">
              <div className="col-span-3">Mosque</div>
              <div className="col-span-2">Prayer · Issue</div>
              <div className="col-span-2">Current Time</div>
              <div className="col-span-2">Suggested Time</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Date</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            {filtered.map((report) => {
              const statusCfg = STATUS_CONFIG[report.status];
              return (
                <div
                  key={report.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 hover:bg-gray-50 transition-colors items-center"
                >
                  {/* Mosque */}
                  <div className="col-span-3">
                    <p className="text-sm font-semibold text-gray-900">
                      {report.venue.name}
                    </p>
                    <p className="text-xs text-gray-500">{report.venue.area.name}</p>
                  </div>

                  {/* Prayer + issue */}
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-800">
                      {PRAYER_LABELS[report.prayerName]}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ISSUE_LABELS[report.issueType]}
                    </p>
                  </div>

                  {/* Current time */}
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">
                      {formatTime(report.currentJamaahTime)}
                    </p>
                    <p className="text-xs text-gray-400">Jamā'ah</p>
                  </div>

                  {/* Suggested time */}
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-emerald-700">
                      {formatTime(report.suggestedJamaahTime)}
                    </p>
                    <p className="text-xs text-gray-400">Suggested</p>
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <Badge variant={statusCfg.variant} size="sm" dot>
                      {statusCfg.label}
                    </Badge>
                  </div>

                  {/* Date */}
                  <div className="col-span-1">
                    <p className="text-xs text-gray-500">
                      {formatDate(report.createdAt)}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Eye}
                      onClick={() => setSelectedReport(report)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Detail modal */}
      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        actionLoading={actionLoading}
      />
    </div>
  );
}
