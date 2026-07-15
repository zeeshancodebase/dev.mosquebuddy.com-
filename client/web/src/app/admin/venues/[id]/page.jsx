// src/app/admin/venues/[id]/page.jsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Clock,
  Edit,
  ExternalLink,
  Building2,
  Phone,
  Globe,
  Users,
  Droplets,
  Car,
  MessageSquare,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Info,
  X,
  UserCheck,
  UserPlus,
  User,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  History,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import { VENUE_TYPES, PRAYER_NAMES } from "@/lib/constants";
import PageHeader from "@/components/shared/PageHeader";
import Button from "@/components/ui/Button";
import Badge, { VerificationBadge } from "@/components/ui/Badge";
import Card, { CardHeader, CardDivider } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import EmptyState from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { to12hr } from "@/lib/timeUtils";
import TimeInput from "@/components/ui/TimeInput";
import toast from "react-hot-toast";
import Tooltip from "@/components/ui/Tooltip";
import Pagination from "@/components/ui/Pagination";
import SearchableSelect from "@/components/ui/SearchableSelect";

// ── Constants ─────────────────────────────────────────────
const TABS = [
  { key: "timings", label: "Timings" },
  { key: "history", label: "Update History" },
];

const FIELD_LABELS = {
  jamaahTime: "Jamā'ah Time",
  azaanTime: "Azaan Time",
  khutbahTime: "Khutbah Time",
  prayerName: "Prayer",
  timingType: "Timing Type",
  relativeTimeText: "Relative Timing",
  verificationStatus: "Verification",
  effectiveFrom: "Effective From",
  effectiveTo: "Effective To",
  slotNumber: "Slot Number",
  khutbahLanguage: "Khutbah Language",
  womenPrayerSpace: "Women's Space",
  importantNotice: "Important Notice",
};

const ENTITY_LABELS = {
  daily_prayer_timing: "Daily Timing",
  jumuah_timing: "Jumu'ah Timing",
};

// ── Options ───────────────────────────────────────────────
const timingTypeOptions = [
  { value: "fixed", label: "Fixed Time" },
  { value: "relative", label: "Relative (e.g. after sunset)" },
];

const verificationOptions = [
  { value: "verified", label: "Verified" },
  { value: "community_updated", label: "Community Updated" },
  { value: "needs_update", label: "Needs Update" },
  { value: "pending_review", label: "Pending Review" },
];

const prayerOptions = Object.entries(PRAYER_NAMES).map(([value, label]) => ({
  value,
  label,
}));

const venueTypeOptions = Object.entries(VENUE_TYPES).map(([value, label]) => ({
  value,
  label,
}));

const facilityOptions = [
  { value: "available", label: "Available" },
  { value: "not_available", label: "Not Available" },
  { value: "limited", label: "Limited" },
  { value: "unknown", label: "Unknown" },
];

// ── Admin permissions config ──────────────────────────────
const ADMIN_PERMISSIONS = [
  {
    key: "canEditVenueProfile",
    label: "Edit Profile",
    tooltip: "Can update mosque name, address, facilities, and contact info.",
  },
  {
    key: "canEditDailyTimings",
    label: "Edit Daily Timings",
    tooltip: "Can add and update Azaan and Jamā'ah timings for all 5 prayers.",
  },
  {
    key: "canEditJumuahTimings",
    label: "Edit Jumu'ah",
    tooltip: "Can add, update, and delete Jumu'ah slots for this mosque.",
  },
  {
    key: "canReviewReports",
    label: "Review Reports",
    tooltip:
      "Can view and respond to user-submitted timing correction reports.",
  },
  {
    key: "canMarkVerified",
    label: "Mark Verified",
    tooltip:
      "Can mark timings as Verified without super admin approval. Grant only to trusted admins.",
  },
];

// ── Volunteer permissions config ──────────────────────────
const VOLUNTEER_PERMISSIONS = [
  {
    key: "canVerifyTimings",
    label: "Verify Timings",
    tooltip: "Can mark timings as verified after field confirmation.",
  },
  {
    key: "canUpdateTimings",
    label: "Update Timings",
    tooltip: "Can update timing data for assigned venues.",
  },
  {
    key: "canReviewReports",
    label: "Review Reports",
    tooltip: "Can view and help resolve user timing reports.",
  },
  {
    key: "canReviewSuggestions",
    label: "Review Suggestions",
    tooltip: "Can review and verify missing venue suggestions.",
  },
];

const emptyDailyForm = {
  prayerName: "fajr",
  azaanTime: "",
  jamaahTime: "",
  timingType: "fixed",
  relativeTimeText: "",
  effectiveFrom: new Date().toISOString().split("T")[0],
  verificationStatus: "verified",
  sourceNote: "",
};

const emptyJumuahForm = {
  slotNumber: 1,
  azaanTime: "",
  khutbahTime: "",
  jamaahTime: "",
  khutbahLanguage: "",
  womenPrayerSpace: "unknown",
  importantNotice: "",
  effectiveFrom: new Date().toISOString().split("T")[0],
  verificationStatus: "verified",
  sourceNote: "",
};

const womenSpaceOptions = [
  { value: "available", label: "Available" },
  { value: "not_available", label: "Not Available" },
  { value: "jumuah_only", label: "Jumu'ah Only" },
  { value: "ramadan_eid_only", label: "Ramadan / Eid Only" },
  { value: "unknown", label: "Unknown" },
];

// ── Permission checkbox component ─────────────────────────
function PermissionCheckbox({ permission, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all cursor-pointer group">
      <div className="flex-shrink-0 mt-0.5">
        <div
          onClick={() => onChange(permission.key, !checked)}
          className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-all ${
            checked
              ? "bg-emerald-600 border-emerald-600"
              : "border-gray-300 group-hover:border-emerald-400"
          }`}
        >
          {checked && <Check size={10} className="text-white" />}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-800">
            {permission.label}
          </span>
          <Tooltip content={permission.tooltip} position="top">
            <Info
              size={12}
              className="text-gray-400 cursor-help flex-shrink-0"
            />
          </Tooltip>
        </div>
      </div>
    </label>
  );
}
// ── Assigned person row ───────────────────────────────────
function AssignedPersonRow({
  person,
  assignmentId,
  permissions,
  permConfig,
  onRemove,
  onTogglePermission,
  removing,
  updatingPermission,
}) {
  const activePerms = permConfig.filter((p) => permissions[p.key]);

  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 group hover:border-gray-200 transition-all">
      <div className="flex items-start gap-3 min-w-0">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-emerald-700">
            {person.name?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>

        {/* Info */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {person.name}
          </p>
          <p className="text-xs text-gray-500 truncate">{person.email}</p>

          {/* Active permissions 
          {activePerms.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {activePerms.map((p) => (
                <Tooltip key={p.key} content={p.tooltip} position="top">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 cursor-help">
                    {p.label}
                  </span>
                </Tooltip>
              ))}
            </div>
          )}*/}
          {/* Permissions — click a filled pill to revoke, a dashed pill to grant */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {permConfig.map((p) => {
              const checked = !!permissions[p.key];
              const isUpdating =
                updatingPermission === `${assignmentId}-${p.key}`;

              if (checked) {
                return (
                  <Tooltip key={p.key} content={p.tooltip} position="top">
                    <button className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50 group/pill">
                      {p.label}
                      {isUpdating ? (
                        <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <X
                          onClick={() => onTogglePermission(p.key, false)}
                          disabled={isUpdating}
                          size={10}
                          className="opacity-60 group-hover/pill:opacity-100 cursor-pointer transition-opacity"
                        />
                      )}
                    </button>
                  </Tooltip>
                );
              }

              return (
                <Tooltip
                  key={p.key}
                  content={`Grant: ${p.tooltip}`}
                  position="top"
                >
                  <button className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border border-dashed border-gray-300 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors disabled:opacity-50">
                    {isUpdating ? (
                      <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus
                        onClick={() => onTogglePermission(p.key, true)}
                        disabled={isUpdating}
                        size={10}
                        className="cursor-pointer"
                      />
                    )}
                    {p.label}
                  </button>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        disabled={removing}
        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 disabled:opacity-50"
        title="Remove assignment"
      >
        {removing ? (
          <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
        ) : (
          <X size={14} />
        )}
      </button>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────
function formatFieldValue(fieldName, value) {
  if (!value || value === "null") return "—";
  if (
    fieldName === "jamaahTime" ||
    fieldName === "azaanTime" ||
    fieldName === "khutbahTime"
  ) {
    return to12hr(value);
  }
  if (fieldName === "effectiveFrom" || fieldName === "effectiveTo") {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  if (fieldName === "verificationStatus") {
    return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return value.replace(/_/g, " ");
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isTimeField(fieldName) {
  return ["jamaahTime", "azaanTime", "khutbahTime"].includes(fieldName);
}

// ── History Entry Component ───────────────────────────────
function HistoryEntry({ entry }) {
  const isCreation = !entry.oldValue || entry.oldValue === "null";
  const entityLabel = ENTITY_LABELS[entry.entityType] || entry.entityType;
  const fieldLabel = FIELD_LABELS[entry.fieldName] || entry.fieldName;

  return (
    <div className="flex gap-3 py-4 px-5 hover:bg-gray-50 transition-colors group">
      {/* Timeline dot */}
      <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
        <div
          className={`w-2 h-2 rounded-full mt-1 ${
            isCreation ? "bg-emerald-500" : "bg-amber-400"
          }`}
        />
        <div className="w-px flex-1 bg-gray-100 mt-1.5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Entity + field */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                {entityLabel}
              </span>
              <ChevronRight size={10} className="text-gray-300" />
              <span className="text-xs font-semibold text-gray-700">
                {fieldLabel}
              </span>
            </div>

            {/* Value change */}
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              {isCreation ? (
                <span
                  className={`text-sm font-medium ${
                    isTimeField(entry.fieldName)
                      ? "font-mono text-emerald-700"
                      : "text-gray-700"
                  }`}
                >
                  Set to {formatFieldValue(entry.fieldName, entry.newValue)}
                </span>
              ) : (
                <>
                  <span
                    className={`text-sm line-through text-gray-400 ${
                      isTimeField(entry.fieldName) ? "font-mono" : ""
                    }`}
                  >
                    {formatFieldValue(entry.fieldName, entry.oldValue)}
                  </span>
                  <ArrowRight
                    size={12}
                    className="text-gray-300 flex-shrink-0"
                  />
                  <span
                    className={`text-sm font-semibold ${
                      isTimeField(entry.fieldName)
                        ? "font-mono text-emerald-700"
                        : "text-gray-800"
                    }`}
                  >
                    {formatFieldValue(entry.fieldName, entry.newValue)}
                  </span>
                </>
              )}
            </div>

            {/* Source note */}
            {entry.sourceNote && (
              <p className="text-xs text-gray-400 mt-1 italic">
                {entry.sourceNote}
              </p>
            )}
          </div>

          {/* Right: who + when */}
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
              <User size={10} className="text-gray-300" />
              {entry.changedBy?.name || "System"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {timeAgo(entry.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────

export default function VenueDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [venue, setVenue] = useState(null);
  const [dailyTimings, setDailyTimings] = useState([]);
  const [jumuahTimings, setJumuahTimings] = useState([]);
  const [adminAssignments, setAdminAssignments] = useState([]);
  const [volunteerAssignments, setVolunteerAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("timings");

  // History state
  const [history, setHistory] = useState([]);
  const [historyPagination, setHistoryPagination] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const historyScrollRef = useRef(null);

  // Modal states
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [jumuahModalOpen, setJumuahModalOpen] = useState(false);
  const [editDailyModalOpen, setEditDailyModalOpen] = useState(false);
  const [editVenueModalOpen, setEditVenueModalOpen] = useState(false);
  const [assignAdminModalOpen, setAssignAdminModalOpen] = useState(false);
  const [assignVolunteerModalOpen, setAssignVolunteerModalOpen] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [updatingPermission, setUpdatingPermission] = useState(null); // `${assignmentId}-${permissionKey}`
  const [error, setError] = useState("");

  // Forms
  const [dailyForm, setDailyForm] = useState(emptyDailyForm);
  const [jumuahForm, setJumuahForm] = useState(emptyJumuahForm);
  const [editDailyForm, setEditDailyForm] = useState(null); // holds timing being edited
  const [editVenueForm, setEditVenueForm] = useState(null); // holds venue fields being edited

  // Assignment forms
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [adminAssignForm, setAdminAssignForm] = useState({
    userId: "",
    canEditVenueProfile: true,
    canEditDailyTimings: true,
    canEditJumuahTimings: true,
    canReviewReports: false,
    canMarkVerified: false,
  });

  const [volunteerAssignForm, setVolunteerAssignForm] = useState({
    userId: "",
    canVerifyTimings: true,
    canUpdateTimings: false,
    canReviewReports: false,
    canReviewSuggestions: false,
  });

  // ── Fetch all data ──────────────────────────────────────
  async function fetchAll() {
    setLoading(true);
    try {
      const [
        venueRes,
        dailyRes,
        jumuahRes,
        adminAssignRes,
        volunteerAssignRes,
      ] = await Promise.all([
        api.get(`/venues/${id}`),
        api.get(`/venues/${id}/daily-timings`),
        api.get(`/venues/${id}/jumuah-timings`),
        api.get(`/admin/venue-admin-assignments?venueId=${id}&isActive=true`),
        api.get(`/admin/volunteer-assignments?venueId=${id}&isActive=true`),
      ]);
      setVenue(venueRes.data);
      // console.log("venueRes.data", venueRes.data);
      setDailyTimings(dailyRes.data || []);
      setJumuahTimings(jumuahRes.data || []);
      setAdminAssignments(adminAssignRes.data || []);
      setVolunteerAssignments(volunteerAssignRes.data || []);
    } catch (err) {
      // console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, [id]);

  // ── Fetch history ──────────────────────────────────────
  const fetchHistory = useCallback(
    async (page = 1) => {
      setHistoryLoading(true);
      try {
        const res = await api.get(
          `/update-history/venues/${id}/history?page=${page}&limit=20`,
        );
        setHistory(res.data || []);
        setHistoryPagination(res.pagination || null);
        setHistoryPage(page);
        if (historyScrollRef.current) {
          historyScrollRef.current.scrollTop = 0;
        }
      } catch (err) {
        // console.error(err);
      } finally {
        setHistoryLoading(false);
      }
    },
    [id],
  );

  // Load history only when tab is first opened
  useEffect(() => {
    if (activeTab === "history" && history.length === 0) {
      fetchHistory(1);
    }
  }, [activeTab, history.length, fetchHistory]);

  // ── Fetch users for assignment modals ───────────────────
  async function fetchUsers() {
    setUsersLoading(true);
    try {
      const res = await api.get("/users?limit=100");
      setAllUsers(res.data || []);
    } catch (err) {
      // console.error(err);
    } finally {
      setUsersLoading(false);
    }
  }

  function openAssignAdminModal() {
    setAdminAssignForm({
      userId: "",
      canEditVenueProfile: true,
      canEditDailyTimings: true,
      canEditJumuahTimings: true,
      canReviewReports: false,
      canMarkVerified: false,
    });
    setError("");
    fetchUsers();
    setAssignAdminModalOpen(true);
  }

  function openAssignVolunteerModal() {
    setVolunteerAssignForm({
      userId: "",
      canVerifyTimings: true,
      canUpdateTimings: false,
      canReviewReports: false,
      canReviewSuggestions: false,
    });
    setError("");
    fetchUsers();
    setAssignVolunteerModalOpen(true);
  }

  // ── Filter users by role for each modal ─────────────────
  const mosqueAdminUsers = allUsers.filter((u) => {
    const roles = u.userRoles || u.roles || [];
    return roles.some(
      (r) => (r.role?.name || r.roleName || r) === "mosque_admin",
    );
  });

  const volunteerUsers = allUsers.filter((u) => {
    const roles = u.userRoles || u.roles || [];
    return roles.some(
      (r) => (r.role?.name || r.roleName || r) === "trusted_volunteer",
    );
  });

  // ── Save admin assignment ───────────────────────────────
  async function saveAdminAssignment() {
    setError("");
    if (!adminAssignForm.userId) {
      setError("Please select a user to assign.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/admin/venue-admin-assignments", {
        userId: adminAssignForm.userId,
        venueId: id,
        canEditVenueProfile: adminAssignForm.canEditVenueProfile,
        canEditDailyTimings: adminAssignForm.canEditDailyTimings,
        canEditJumuahTimings: adminAssignForm.canEditJumuahTimings,
        canReviewReports: adminAssignForm.canReviewReports,
        canMarkVerified: adminAssignForm.canMarkVerified,
      });
      setAssignAdminModalOpen(false);
      await fetchAll();
      toast.success("Mosque admin assigned successfully.");
    } catch (err) {
      setError(err.message || "Failed to assign mosque admin.");
    } finally {
      setSaving(false);
    }
  }

  // ── Save volunteer assignment ───────────────────────────
  async function saveVolunteerAssignment() {
    setError("");
    if (!volunteerAssignForm.userId) {
      setError("Please select a volunteer to assign.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/admin/volunteer-assignments", {
        userId: volunteerAssignForm.userId,
        venueId: id,
        canVerifyTimings: volunteerAssignForm.canVerifyTimings,
        canUpdateTimings: volunteerAssignForm.canUpdateTimings,
        canReviewReports: volunteerAssignForm.canReviewReports,
        canReviewSuggestions: volunteerAssignForm.canReviewSuggestions,
      });
      setAssignVolunteerModalOpen(false);
      await fetchAll();
      toast.success("Volunteer assigned successfully.");
    } catch (err) {
      setError(err.message || "Failed to assign volunteer.");
    } finally {
      setSaving(false);
    }
  }

  // ── Remove admin assignment ─────────────────────────────
  async function removeAdminAssignment(assignmentId) {
    setRemovingId(assignmentId);
    try {
      await api.delete(`/admin/venue-admin-assignments/${assignmentId}`);
      await fetchAll();
      toast.success("Assignment removed.");
    } catch (err) {
      toast.error("Failed to remove assignment.");
    } finally {
      setRemovingId(null);
    }
  }

  // ── Remove volunteer assignment ─────────────────────────
  async function removeVolunteerAssignment(assignmentId) {
    setRemovingId(assignmentId);
    try {
      await api.delete(`/admin/volunteer-assignments/${assignmentId}`);
      await fetchAll();
      toast.success("Volunteer assignment removed.");
    } catch (err) {
      toast.error("Failed to remove assignment.");
    } finally {
      setRemovingId(null);
    }
  }

  // ── Toggle a single admin permission ────────────────────
  async function toggleAdminPermission(assignmentId, key, newValue) {
    setUpdatingPermission(`${assignmentId}-${key}`);
    try {
      await api.patch(`/admin/venue-admin-assignments/${assignmentId}`, {
        [key]: newValue,
      });
      setAdminAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId ? { ...a, [key]: newValue } : a,
        ),
      );
      toast.success(newValue ? "Permission granted." : "Permission removed.");
    } catch (err) {
      toast.error("Failed to update permission.");
    } finally {
      setUpdatingPermission(null);
    }
  }

  // ── Toggle a single volunteer permission ────────────────
  async function toggleVolunteerPermission(assignmentId, key, newValue) {
    setUpdatingPermission(`${assignmentId}-${key}`);
    try {
      await api.patch(`/admin/volunteer-assignments/${assignmentId}`, {
        [key]: newValue,
      });
      setVolunteerAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId ? { ...a, [key]: newValue } : a,
        ),
      );
      toast.success(newValue ? "Permission granted." : "Permission removed.");
    } catch (err) {
      toast.error("Failed to update permission.");
    } finally {
      setUpdatingPermission(null);
    }
  }

  // ── Form handlers ───────────────────────────────────────
  function handleDailyChange(e) {
    setDailyForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  }

  function handleJumuahChange(e) {
    setJumuahForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  }

  function handleEditDailyChange(e) {
    setEditDailyForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  }

  function handleEditVenueChange(e) {
    setEditVenueForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  }

  // ── Open edit daily timing modal ────────────────────────
  function openEditDailyModal(timing) {
    setEditDailyForm({
      id: timing.id,
      prayerName: timing.prayerName,
      azaanTime: timing.azaanTime || "",
      jamaahTime: timing.jamaahTime || "",
      timingType: timing.timingType || "fixed",
      relativeTimeText: timing.relativeTimeText || "",
      effectiveFrom: timing.effectiveFrom
        ? new Date(timing.effectiveFrom).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      verificationStatus: timing.verificationStatus || "verified",
      sourceNote: timing.sourceNote || "",
    });
    setError("");
    setEditDailyModalOpen(true);
  }

  // ── Open edit venue modal ───────────────────────────────
  function openEditVenueModal() {
    setEditVenueForm({
      name: venue.name || "",
      venueType: venue.venueType || "masjid",
      address: venue.address || "",
      pincode: venue.pincode || "",
      phone: venue.phone || "",
      defaultKhutbahLanguage: venue.defaultKhutbahLanguage || "",
      womenPrayerSpace: venue.womenPrayerSpace || "unknown",
      wuduFacility: venue.wuduFacility || "unknown",
      parking: venue.parking || "unknown",
      facilityNotes: venue.facilityNotes || "",
      importantNotice: venue.importantNotice || "",
      verificationStatus: venue.verificationStatus || "pending_review",
    });
    setError("");
    setEditVenueModalOpen(true);
  }

  // ── Save daily timing ───────────────────────────────────
  async function saveDailyTiming() {
    setError("");
    if (!dailyForm.prayerName) {
      setError("Prayer name is required.");
      return;
    }
    if (dailyForm.timingType === "fixed" && !dailyForm.jamaahTime) {
      setError("Jamā'ah time is required for fixed timings.");
      return;
    }
    if (dailyForm.timingType === "relative" && !dailyForm.relativeTimeText) {
      setError("Please describe the relative timing.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...dailyForm,
        effectiveFrom: new Date(dailyForm.effectiveFrom).toISOString(),
        azaanTime: dailyForm.azaanTime || undefined,
        jamaahTime:
          dailyForm.timingType === "fixed" ? dailyForm.jamaahTime : undefined,
        relativeTimeText:
          dailyForm.timingType === "relative"
            ? dailyForm.relativeTimeText
            : undefined,
        sourceNote: dailyForm.sourceNote || undefined,
      };
      await api.post(`/venues/${id}/daily-timings`, payload);
      setDailyModalOpen(false);
      fetchAll();
    } catch (err) {
      setError(err.message || "Failed to save timing.");
    } finally {
      setSaving(false);
    }
  }
  // ── Update existing daily timing ────────────────────────
  async function updateDailyTiming() {
    setError("");
    if (editDailyForm.timingType === "fixed" && !editDailyForm.jamaahTime) {
      setError("Jamā'ah time is required for fixed timings.");
      return;
    }
    if (
      editDailyForm.timingType === "relative" &&
      !editDailyForm.relativeTimeText
    ) {
      setError("Please describe the relative timing.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        prayerName: editDailyForm.prayerName,
        azaanTime: editDailyForm.azaanTime || undefined,
        jamaahTime:
          editDailyForm.timingType === "fixed"
            ? editDailyForm.jamaahTime
            : undefined,
        timingType: editDailyForm.timingType,
        relativeTimeText:
          editDailyForm.timingType === "relative"
            ? editDailyForm.relativeTimeText
            : undefined,
        effectiveFrom: new Date(editDailyForm.effectiveFrom).toISOString(),
        verificationStatus: editDailyForm.verificationStatus,
        sourceNote: editDailyForm.sourceNote || undefined,
      };
      await api.patch(`/daily-timings/${editDailyForm.id}`, payload);
      setEditDailyModalOpen(false);
      await fetchAll();
      toast.success("Timing updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update timing.");
    } finally {
      setSaving(false);
    }
  }

  // ── Update venue profile ────────────────────────────────
  async function updateVenue() {
    setError("");
    if (!editVenueForm.name.trim()) {
      setError("Venue name is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: editVenueForm.name.trim(),
        venueType: editVenueForm.venueType,
        address: editVenueForm.address || undefined,
        pincode: editVenueForm.pincode || undefined,
        phone: editVenueForm.phone || undefined,
        defaultKhutbahLanguage:
          editVenueForm.defaultKhutbahLanguage || undefined,
        womenPrayerSpace: editVenueForm.womenPrayerSpace,
        wuduFacility: editVenueForm.wuduFacility,
        parking: editVenueForm.parking,
        facilityNotes: editVenueForm.facilityNotes || undefined,
        importantNotice: editVenueForm.importantNotice || undefined,
        verificationStatus: editVenueForm.verificationStatus,
      };
      await api.patch(`/venues/${id}`, payload);
      setEditVenueModalOpen(false);
      await fetchAll();
      toast.success("Venue updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update venue.");
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle public / hidden ──────────────────────────────
  async function togglePublicStatus() {
    setToggling(true);
    try {
      await api.patch(`/venues/${id}/status`, {
        isPublic: !venue.isPublic,
        isActive: venue.isActive,
      });
      await fetchAll();
      toast.success(
        venue.isPublic
          ? "Venue is now hidden from public."
          : "Venue is now visible to the public.",
      );
    } catch (err) {
      toast.error("Failed to update venue status.");
    } finally {
      setToggling(false);
    }
  }

  // ── Save Jumu'ah timing ─────────────────────────────────
  async function saveJumuahTiming() {
    setError("");
    if (!jumuahForm.jamaahTime) {
      setError("Jamā'ah time is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...jumuahForm,
        slotNumber: parseInt(jumuahForm.slotNumber),
        effectiveFrom: new Date(jumuahForm.effectiveFrom).toISOString(),
        azaanTime: jumuahForm.azaanTime || undefined,
        khutbahTime: jumuahForm.khutbahTime || undefined,
        khutbahLanguage: jumuahForm.khutbahLanguage || undefined,
        importantNotice: jumuahForm.importantNotice || undefined,
        sourceNote: jumuahForm.sourceNote || undefined,
      };
      await api.post(`/venues/${id}/jumuah-timings`, payload);
      setJumuahModalOpen(false);
      fetchAll();
      toast.success("Jumu'ah slot added successfully.");
    } catch (err) {
      setError(err.message || "Failed to save Jumu'ah timing.");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete Jumu'ah timing ───────────────────────────────
  async function deleteJumuahTiming(timingId) {
    if (!confirm("Delete this Jumu'ah slot?")) return;
    try {
      await api.delete(`/jumuah-timings/${timingId}`);
      fetchAll();
      toast.success("Jumu'ah slot deleted.");
    } catch (err) {
      toast.error("Failed to delete slot.");
    }
  }

  if (loading) return <PageLoader />;
  if (!venue)
    return (
      <EmptyState
        icon={Building2}
        title="Venue not found"
        description="This venue does not exist or has been removed."
        action={() => router.push("/admin/venues")}
        actionLabel="Back to Venues"
      />
    );

  const prayerOrder = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
  const sortedDailyTimings = [...dailyTimings].sort(
    (a, b) =>
      prayerOrder.indexOf(a.prayerName) - prayerOrder.indexOf(b.prayerName),
  );

  // User select options for modals
  const adminUserOptions = mosqueAdminUsers.map((u) => ({
    value: u.id,
    label: `${u.name} — ${u.email}`,
  }));

  const volunteerUserOptions = volunteerUsers.map((u) => ({
    value: u.id,
    label: `${u.name} — ${u.email}`,
  }));

  return (
    <div>
      <PageHeader
        title={venue.name}
        subtitle={`${VENUE_TYPES[venue.venueType] || venue.venueType} · ${venue.area?.name ? venue.area.name + ", " : ""}${venue.city?.name || ""}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Venues", href: "/admin/venues" },
          { label: venue.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <VerificationBadge status={venue.verificationStatus} size="sm" />
            <Button
              variant={venue.isPublic ? "secondary" : "primary"}
              size="sm"
              icon={venue.isPublic ? EyeOff : Eye}
              loading={toggling}
              onClick={togglePublicStatus}
            >
              {venue.isPublic ? "Hide" : "Make Public"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Edit}
              onClick={openEditVenueModal}
            >
              Edit Venue
            </Button>
            {venue.googleMapsLink && (
              <a
                href={venue.googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" size="sm" icon={ExternalLink}>
                  Maps
                </Button>
              </a>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left: Venue info ────────────────────────── */}
        <div className="flex flex-col gap-5">
          {/* Basic info */}
          <Card>
            <CardHeader title="Venue Details" />
            <div className="flex flex-col gap-3">
              {[
                {
                  icon: Building2,
                  label: "Type",
                  value: VENUE_TYPES[venue.venueType] || venue.venueType,
                },
                { icon: MapPin, label: "Address", value: venue.address },
                { icon: MapPin, label: "Area", value: venue.area?.name || "—" },
                { icon: Globe, label: "City", value: venue.city?.name || "—" },
                { icon: Globe, label: "Pincode", value: venue.pincode || "—" },
                { icon: Phone, label: "Phone", value: venue.phone || "—" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={13} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="text-sm text-gray-800 font-medium">
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Facilities */}
          <Card>
            <CardHeader title="Facilities" />
            <div className="flex flex-col gap-3">
              {[
                {
                  icon: Users,
                  label: "Women's Space",
                  value: venue.womenPrayerSpace,
                },
                {
                  icon: Droplets,
                  label: "Wudu Facility",
                  value: venue.wuduFacility,
                },
                { icon: Car, label: "Parking", value: venue.parking },
                {
                  icon: MessageSquare,
                  label: "Khutbah Language",
                  value: venue.defaultKhutbahLanguage || "—",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Icon size={14} className="text-gray-400" />
                      {item.label}
                    </div>
                    <Badge variant="neutral" size="sm">
                      {item.value?.replace(/_/g, " ") || "unknown"}
                    </Badge>
                  </div>
                );
              })}
            </div>

            {venue.facilityNotes && (
              <>
                <CardDivider />
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Facility Notes
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {venue.facilityNotes}
                  </p>
                </div>
              </>
            )}

            {venue.importantNotice && (
              <>
                <CardDivider />
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertCircle
                    size={15}
                    className="text-amber-600 flex-shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-amber-800">
                    {venue.importantNotice}
                  </p>
                </div>
              </>
            )}
          </Card>

          {/* ── Assignments card ─────────────────────── */}
          <Card>
            {/* Mosque Admins section */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserCheck size={15} className="text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Mosque Admins
                </h3>
                {adminAssignments.length > 0 && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                    {adminAssignments.length}
                  </span>
                )}
              </div>
              <Tooltip
                content="Assign a mosque admin who can manage timings for this venue."
                position="left"
              >
                <Button
                  size="sm"
                  variant="ghost"
                  icon={Plus}
                  onClick={openAssignAdminModal}
                >
                  Assign
                </Button>
              </Tooltip>
            </div>

            {adminAssignments.length === 0 ? (
              <div className="flex flex-col items-center py-5 px-3 rounded-xl bg-gray-50 border border-dashed border-gray-200 mb-4">
                <UserCheck size={20} className="text-gray-300 mb-2" />
                <p className="text-xs text-gray-400 text-center">
                  No mosque admin assigned yet.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mb-4">
                {adminAssignments.map((a) => (
                  <AssignedPersonRow
                    key={a.id}
                    person={a.user}
                    assignmentId={a.id}
                    permissions={a}
                    permConfig={ADMIN_PERMISSIONS}
                    onRemove={() => removeAdminAssignment(a.id)}
                    onTogglePermission={(key, val) =>
                      toggleAdminPermission(a.id, key, val)
                    }
                    removing={removingId === a.id}
                    updatingPermission={updatingPermission}
                  />
                ))}
              </div>
            )}

            <CardDivider />

            {/* Volunteers section */}
            <div className="flex items-center justify-between mt-3 mb-3">
              <div className="flex items-center gap-2">
                <UserPlus size={15} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Volunteers
                </h3>
                {volunteerAssignments.length > 0 && (
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full">
                    {volunteerAssignments.length}
                  </span>
                )}
              </div>
              <Tooltip
                content="Assign a trusted volunteer to help verify and update timings for this venue."
                position="left"
              >
                <Button
                  size="sm"
                  variant="ghost"
                  icon={Plus}
                  onClick={openAssignVolunteerModal}
                >
                  Assign
                </Button>
              </Tooltip>
            </div>

            {volunteerAssignments.length === 0 ? (
              <div className="flex flex-col items-center py-5 px-3 rounded-xl bg-gray-50 border border-dashed border-gray-200">
                <UserPlus size={20} className="text-gray-300 mb-2" />
                <p className="text-xs text-gray-400 text-center">
                  No volunteer assigned yet.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {volunteerAssignments.map((a) => (
                  <AssignedPersonRow
                    key={a.id}
                    person={a.user}
                    assignmentId={a.id}
                    permissions={a}
                    permConfig={VOLUNTEER_PERMISSIONS}
                    onRemove={() => removeVolunteerAssignment(a.id)}
                    onTogglePermission={(key, val) =>
                      toggleVolunteerPermission(a.id, key, val)
                    }
                    removing={removingId === a.id}
                    updatingPermission={updatingPermission}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Right column: tabs ───────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-gray-200">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === tab.key
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.key === "history" && <History size={13} />}
                {tab.label}
                {tab.key === "history" && historyPagination && (
                  <span className="ml-1 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                    {historyPagination.total}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Timings tab ──────────────────────────── */}
          {activeTab === "timings" && (
            <div className="flex flex-col gap-5">
              {/* Daily timings */}
              <Card padding={false}>
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Daily Prayer Timings
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Azaan and Jamā'ah times for all five prayers
                    </p>
                  </div>
                  <Button
                    size="sm"
                    icon={Plus}
                    onClick={() => {
                      setDailyForm(emptyDailyForm);
                      setError("");
                      setDailyModalOpen(true);
                    }}
                  >
                    Add Timing
                  </Button>
                </div>

                {sortedDailyTimings.length === 0 ? (
                  <EmptyState
                    icon={Clock}
                    title="No daily timings yet"
                    description="Add Azaan and Jamā'ah timings for this venue."
                    action={() => {
                      setDailyForm(emptyDailyForm);
                      setDailyModalOpen(true);
                    }}
                    actionLabel="Add Timing"
                  />
                ) : (
                  <div className="divide-y divide-gray-50">
                    {sortedDailyTimings.map((timing) => (
                      <div
                        key={timing.id}
                        className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          {/* Prayer name */}
                          <div className="w-20">
                            <p className="text-sm font-semibold text-gray-900 capitalize">
                              {PRAYER_NAMES[timing.prayerName] ||
                                timing.prayerName}
                            </p>
                          </div>

                          {/* Times */}
                          <div className="flex items-center gap-6">
                            <div>
                              <p className="text-xs text-gray-400">Azaan</p>
                              <p className="text-sm font-mono font-medium text-gray-700">
                                {timing.azaanTime
                                  ? to12hr(timing.azaanTime)
                                  : "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Jamā'ah</p>
                              <p className="text-sm font-mono font-semibold text-emerald-700">
                                {timing.timingType === "relative"
                                  ? timing.relativeTimeText
                                  : timing.jamaahTime
                                    ? to12hr(timing.jamaahTime)
                                    : "—"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <VerificationBadge
                            status={timing.verificationStatus}
                            size="sm"
                          />
                          <button
                            onClick={() => openEditDailyModal(timing)}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Edit timing"
                          >
                            <Edit size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Jumu'ah timings */}
              <Card padding={false}>
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Jumu'ah Timings
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Friday prayer slots — multiple slots supported
                    </p>
                  </div>
                  <Button
                    size="sm"
                    icon={Plus}
                    onClick={() => {
                      setJumuahForm({
                        ...emptyJumuahForm,
                        slotNumber: jumuahTimings.length + 1,
                      });
                      setError("");
                      setJumuahModalOpen(true);
                    }}
                  >
                    Add Slot
                  </Button>
                </div>

                {jumuahTimings.length === 0 ? (
                  <EmptyState
                    icon={Clock}
                    title="No Jumu'ah timings yet"
                    description="Add Friday prayer slots for this venue."
                    action={() => {
                      setJumuahForm(emptyJumuahForm);
                      setJumuahModalOpen(true);
                    }}
                    actionLabel="Add Slot"
                  />
                ) : (
                  <div className="divide-y divide-gray-50">
                    {jumuahTimings.map((slot) => (
                      <div
                        key={slot.id}
                        className="px-5 py-4 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            {/* Slot number */}
                            <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-emerald-700">
                                {slot.slotNumber}
                              </span>
                            </div>

                            {/* Times */}
                            <div className="flex items-center gap-6">
                              {slot.azaanTime && (
                                <div>
                                  <p className="text-xs text-gray-400">Azaan</p>
                                  <p className="text-sm font-mono font-medium text-gray-700">
                                    {to12hr(slot.azaanTime)}
                                  </p>
                                </div>
                              )}
                              {slot.khutbahTime && (
                                <div>
                                  <p className="text-xs text-gray-400">
                                    Khutbah
                                  </p>
                                  <p className="text-sm font-mono font-medium text-gray-700">
                                    {to12hr(slot.khutbahTime)}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs text-gray-400">Jamā'ah</p>
                                <p className="text-sm font-mono font-semibold text-emerald-700">
                                  {to12hr(slot.jamaahTime)}
                                </p>
                              </div>
                              {slot.khutbahLanguage && (
                                <div>
                                  <p className="text-xs text-gray-400">
                                    Language
                                  </p>
                                  <p className="text-sm font-medium text-gray-700">
                                    {slot.khutbahLanguage}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <VerificationBadge
                              status={slot.verificationStatus}
                              size="sm"
                            />
                            <button
                              onClick={() => deleteJumuahTiming(slot.id)}
                              className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {slot.importantNotice && (
                          <div className="mt-2 ml-12 flex items-start gap-1.5 text-xs text-amber-700">
                            <AlertCircle
                              size={12}
                              className="mt-0.5 flex-shrink-0"
                            />
                            {slot.importantNotice}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ── History tab ──────────────────────────── */}
          {activeTab === "history" && (
            <Card padding={false}>
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Update History
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Field-level log of every timing change for this mosque
                  </p>
                </div>
                <button
                  onClick={() => {
                    setHistory([]);
                    fetchHistory(1);
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                  title="Refresh history"
                >
                  <RefreshCw
                    size={14}
                    className={historyLoading ? "animate-spin" : ""}
                  />
                </button>
              </div>

              {historyLoading && history.length === 0 ? (
                <div className="py-12 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <RefreshCw size={14} className="animate-spin" />
                    Loading history...
                  </div>
                </div>
              ) : history.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="No history yet"
                  description="Changes to timings will appear here."
                />
              ) : (
                <>
                  <div
                    ref={historyScrollRef}
                    className="max-h-[560px] overflow-y-auto scroll-smooth relative"
                  >
                    {historyLoading && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-start justify-center pt-16 z-10">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <RefreshCw size={14} className="animate-spin" />
                          Loading page {historyPage}...
                        </div>
                      </div>
                    )}
                    <div className="divide-y divide-gray-50">
                      {history.map((entry) => (
                        <HistoryEntry key={entry.id} entry={entry} />
                      ))}
                    </div>
                  </div>

                  {/* Pagination */}
                  {historyPagination && historyPagination.totalPages > 1 && (
                    <div className="px-5 py-3.5 border-t border-gray-100">
                      <Pagination
                        currentPage={historyPage}
                        totalPages={historyPagination.totalPages}
                        totalItems={historyPagination.total}
                        pageSize={20}
                        onPageChange={(page) => fetchHistory(page)}
                        showSummary
                        showFirstLast={historyPagination.totalPages > 7}
                      />
                    </div>
                  )}
                </>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* ── Assign Admin Modal ──────────────────────────── */}
      <Modal
        isOpen={assignAdminModalOpen}
        onClose={() => setAssignAdminModalOpen(false)}
        title="Assign Mosque Admin"
        subtitle="Select a user with the mosque_admin role and set their permissions for this venue."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setAssignAdminModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={saveAdminAssignment}
              icon={UserCheck}
            >
              Assign Admin
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          {error && (
            <div className="px-3.5 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">
              ⚠ {error}
            </div>
          )}

          <SearchableSelect
            label="Select Mosque Admin"
            required
            placeholder={usersLoading ? "Loading users..." : "Choose a user..."}
            searchPlaceholder="Search by name or email..."
            value={adminAssignForm.userId}
            onChange={(val) =>
              setAdminAssignForm((p) => ({ ...p, userId: val }))
            }
            options={adminUserOptions}
            hint="Only users with the mosque_admin role are shown."
          />

          {adminUserOptions.length === 0 && !usersLoading && (
            <div className="px-3.5 py-3 rounded-lg text-sm text-amber-700 bg-amber-50 border border-amber-200">
              No users with mosque_admin role found. Assign the role first from
              the Users page.
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <p className="text-sm font-semibold text-gray-800">Permissions</p>
              <Tooltip
                content="These permissions control exactly what this admin can do for this mosque. You can update them later."
                position="right"
              >
                <Info size={13} className="text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <div className="flex flex-col gap-2">
              {ADMIN_PERMISSIONS.map((p) => (
                <PermissionCheckbox
                  key={p.key}
                  permission={p}
                  checked={adminAssignForm[p.key]}
                  onChange={(key, val) =>
                    setAdminAssignForm((prev) => ({ ...prev, [key]: val }))
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Assign Volunteer Modal ──────────────────────── */}
      <Modal
        isOpen={assignVolunteerModalOpen}
        onClose={() => setAssignVolunteerModalOpen(false)}
        title="Assign Volunteer"
        subtitle="Select a trusted volunteer and set what they can do for this venue."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setAssignVolunteerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={saveVolunteerAssignment}
              icon={UserPlus}
            >
              Assign Volunteer
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          {error && (
            <div className="px-3.5 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">
              ⚠ {error}
            </div>
          )}

          <SearchableSelect
            label="Select Volunteer"
            required
            placeholder={
              usersLoading ? "Loading users..." : "Choose a volunteer..."
            }
            searchPlaceholder="Search by name or email..."
            value={volunteerAssignForm.userId}
            onChange={(val) =>
              setVolunteerAssignForm((p) => ({ ...p, userId: val }))
            }
            options={volunteerUserOptions}
            hint="Only users with the trusted_volunteer role are shown."
          />

          {volunteerUserOptions.length === 0 && !usersLoading && (
            <div className="px-3.5 py-3 rounded-lg text-sm text-amber-700 bg-amber-50 border border-amber-200">
              No volunteers found. Assign the trusted_volunteer role first from
              the Users page.
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <p className="text-sm font-semibold text-gray-800">Permissions</p>
              <Tooltip
                content="Control what this volunteer is allowed to do for this venue."
                position="right"
              >
                <Info size={13} className="text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <div className="flex flex-col gap-2">
              {VOLUNTEER_PERMISSIONS.map((p) => (
                <PermissionCheckbox
                  key={p.key}
                  permission={p}
                  checked={volunteerAssignForm[p.key]}
                  onChange={(key, val) =>
                    setVolunteerAssignForm((prev) => ({ ...prev, [key]: val }))
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>
      {/* ── Daily Timing Modal ──────────────────────────── */}
      <Modal
        isOpen={dailyModalOpen}
        onClose={() => setDailyModalOpen(false)}
        title="Add Daily Prayer Timing"
        subtitle="Enter Azaan and Jamā'ah times for a prayer."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setDailyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button loading={saving} onClick={saveDailyTiming}>
              Save Timing
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {error && (
            <div className="px-3.5 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">
              ⚠ {error}
            </div>
          )}
          <Select
            label="Prayer"
            name="prayerName"
            required
            options={prayerOptions}
            value={dailyForm.prayerName}
            onChange={handleDailyChange}
          />
          <Select
            label="Timing Type"
            name="timingType"
            required
            options={timingTypeOptions}
            value={dailyForm.timingType}
            onChange={handleDailyChange}
          />
          <div className="grid grid-cols-2 gap-3">
            <TimeInput
              label="Azaan Time"
              name="azaanTime"
              type="time"
              value={dailyForm.azaanTime}
              onChange={handleDailyChange}
              hint="Optional"
            />
            {dailyForm.timingType === "fixed" ? (
              <TimeInput
                label="Jamā'ah Time"
                name="jamaahTime"
                type="time"
                required
                value={dailyForm.jamaahTime}
                onChange={handleDailyChange}
              />
            ) : (
              <Input
                label="Relative Description"
                name="relativeTimeText"
                placeholder="e.g. 5 mins after sunset"
                required
                value={dailyForm.relativeTimeText}
                onChange={handleDailyChange}
              />
            )}
          </div>
          <Input
            label="Effective From"
            name="effectiveFrom"
            type="date"
            required
            value={dailyForm.effectiveFrom}
            onChange={handleDailyChange}
          />
          <Select
            label="Verification Status"
            name="verificationStatus"
            options={verificationOptions}
            value={dailyForm.verificationStatus}
            onChange={handleDailyChange}
          />
          <Input
            label="Source Note"
            name="sourceNote"
            placeholder="e.g. Confirmed from mosque timing board"
            value={dailyForm.sourceNote}
            onChange={handleDailyChange}
            hint="Optional"
          />
        </div>
      </Modal>

      {/* ── Edit Daily Timing Modal ─────────────────────── */}
      {editDailyForm && (
        <Modal
          isOpen={editDailyModalOpen}
          onClose={() => setEditDailyModalOpen(false)}
          title={`Edit ${PRAYER_NAMES[editDailyForm.prayerName] || editDailyForm.prayerName} Timing`}
          subtitle="Update the timing details for this prayer."
          footer={
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setEditDailyModalOpen(false)}
              >
                Cancel
              </Button>
              <Button loading={saving} onClick={updateDailyTiming}>
                Update Timing
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            {error && (
              <div className="px-3.5 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">
                ⚠ {error}
              </div>
            )}
            <Select
              label="Timing Type"
              name="timingType"
              required
              options={timingTypeOptions}
              value={editDailyForm.timingType}
              onChange={handleEditDailyChange}
            />
            <div className="grid grid-cols-2 gap-3">
              <TimeInput
                label="Azaan Time"
                name="azaanTime"
                type="time"
                value={editDailyForm.azaanTime}
                onChange={handleEditDailyChange}
                hint="Optional"
              />
              {editDailyForm.timingType === "fixed" ? (
                <TimeInput
                  label="Jamā'ah Time"
                  name="jamaahTime"
                  type="time"
                  required
                  value={editDailyForm.jamaahTime}
                  onChange={handleEditDailyChange}
                />
              ) : (
                <Input
                  label="Relative Description"
                  name="relativeTimeText"
                  placeholder="e.g. 5 mins after sunset"
                  required
                  value={editDailyForm.relativeTimeText}
                  onChange={handleEditDailyChange}
                />
              )}
            </div>
            <Input
              label="Effective From"
              name="effectiveFrom"
              type="date"
              required
              value={editDailyForm.effectiveFrom}
              onChange={handleEditDailyChange}
            />
            <Select
              label="Verification Status"
              name="verificationStatus"
              options={verificationOptions}
              value={editDailyForm.verificationStatus}
              onChange={handleEditDailyChange}
            />
            <Input
              label="Source Note"
              name="sourceNote"
              placeholder="e.g. Updated from mosque notice board"
              value={editDailyForm.sourceNote}
              onChange={handleEditDailyChange}
              hint="Optional"
            />
          </div>
        </Modal>
      )}

      {/* ── Edit Venue Modal ────────────────────────────── */}
      {editVenueForm && (
        <Modal
          isOpen={editVenueModalOpen}
          onClose={() => setEditVenueModalOpen(false)}
          title="Edit Venue"
          subtitle="Update the mosque or prayer venue profile."
          footer={
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setEditVenueModalOpen(false)}
              >
                Cancel
              </Button>
              <Button loading={saving} onClick={updateVenue}>
                Save Changes
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            {error && (
              <div className="px-3.5 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">
                ⚠ {error}
              </div>
            )}
            <Input
              label="Venue Name"
              name="name"
              required
              placeholder="e.g. Masjid Al-Noor"
              value={editVenueForm.name}
              onChange={handleEditVenueChange}
            />
            <Select
              label="Venue Type"
              name="venueType"
              required
              options={venueTypeOptions}
              value={editVenueForm.venueType}
              onChange={handleEditVenueChange}
            />
            <Input
              label="Address"
              name="address"
              placeholder="Street address"
              value={editVenueForm.address}
              onChange={handleEditVenueChange}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Pincode"
                name="pincode"
                placeholder="560076"
                value={editVenueForm.pincode}
                onChange={handleEditVenueChange}
              />
              <Input
                label="Phone"
                name="phone"
                placeholder="+91 98765 43210"
                value={editVenueForm.phone}
                onChange={handleEditVenueChange}
                hint="Optional"
              />
            </div>
            <Input
              label="Khutbah Language"
              name="defaultKhutbahLanguage"
              placeholder="e.g. Urdu, English, Kannada"
              value={editVenueForm.defaultKhutbahLanguage}
              onChange={handleEditVenueChange}
              hint="Optional"
            />
            <div className="grid grid-cols-3 gap-3">
              <Select
                label="Women's Space"
                name="womenPrayerSpace"
                options={womenSpaceOptions}
                value={editVenueForm.womenPrayerSpace}
                onChange={handleEditVenueChange}
              />
              <Select
                label="Wudu Facility"
                name="wuduFacility"
                options={facilityOptions}
                value={editVenueForm.wuduFacility}
                onChange={handleEditVenueChange}
              />
              <Select
                label="Parking"
                name="parking"
                options={facilityOptions}
                value={editVenueForm.parking}
                onChange={handleEditVenueChange}
              />
            </div>
            <Select
              label="Verification Status"
              name="verificationStatus"
              options={verificationOptions}
              value={editVenueForm.verificationStatus}
              onChange={handleEditVenueChange}
            />
            <Textarea
              label="Facility Notes"
              name="facilityNotes"
              placeholder="Any general notes about facilities..."
              value={editVenueForm.facilityNotes}
              onChange={handleEditVenueChange}
              rows={2}
              hint="Optional — visible to public"
            />
            <Textarea
              label="Important Notice"
              name="importantNotice"
              placeholder="Urgent or time-sensitive notice..."
              value={editVenueForm.importantNotice}
              onChange={handleEditVenueChange}
              rows={2}
              hint="Optional — shown prominently"
            />
          </div>
        </Modal>
      )}

      {/* ── Jumu'ah Modal ───────────────────────────────── */}
      <Modal
        isOpen={jumuahModalOpen}
        onClose={() => setJumuahModalOpen(false)}
        title="Add Jumu'ah Slot"
        subtitle="Enter Friday prayer timing details."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setJumuahModalOpen(false)}
            >
              Cancel
            </Button>
            <Button loading={saving} onClick={saveJumuahTiming}>
              Save Slot
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {error && (
            <div className="px-3.5 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">
              ⚠ {error}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Slot Number"
              name="slotNumber"
              type="number"
              min="1"
              required
              value={jumuahForm.slotNumber}
              onChange={handleJumuahChange}
            />
            <TimeInput
              label="Azaan Time"
              name="azaanTime"
              type="time"
              value={jumuahForm.azaanTime}
              onChange={handleJumuahChange}
              hint="Optional"
            />
            <TimeInput
              label="Khutbah Time"
              name="khutbahTime"
              type="time"
              value={jumuahForm.khutbahTime}
              onChange={handleJumuahChange}
              hint="Optional"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TimeInput
              label="Jamā'ah Time"
              name="jamaahTime"
              type="time"
              required
              value={jumuahForm.jamaahTime}
              onChange={handleJumuahChange}
            />
            <Input
              label="Khutbah Language"
              name="khutbahLanguage"
              placeholder="e.g. Urdu, English"
              value={jumuahForm.khutbahLanguage}
              onChange={handleJumuahChange}
            />
          </div>
          <Select
            label="Women's Prayer Space"
            name="womenPrayerSpace"
            options={womenSpaceOptions}
            value={jumuahForm.womenPrayerSpace}
            onChange={handleJumuahChange}
          />
          <Input
            label="Effective From"
            name="effectiveFrom"
            type="date"
            required
            value={jumuahForm.effectiveFrom}
            onChange={handleJumuahChange}
          />
          <Select
            label="Verification Status"
            name="verificationStatus"
            options={verificationOptions}
            value={jumuahForm.verificationStatus}
            onChange={handleJumuahChange}
          />
          <Textarea
            label="Important Notice"
            name="importantNotice"
            placeholder="e.g. Arrive early due to crowding."
            value={jumuahForm.importantNotice}
            onChange={handleJumuahChange}
            rows={2}
            hint="Optional"
          />
          <Input
            label="Source Note"
            name="sourceNote"
            placeholder="e.g. Confirmed by mosque representative"
            value={jumuahForm.sourceNote}
            onChange={handleJumuahChange}
            hint="Optional"
          />
        </div>
      </Modal>
    </div>
  );
}

// few additional things are added in the below stuff
/*
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin, Clock, Edit, ExternalLink, CheckCircle,
  Building2, Phone, Globe, Users, Droplets, Car,
  MessageSquare, AlertCircle, Plus, Trash2, Eye, EyeOff,
} from "lucide-react";
import { api } from "@/lib/api";
import { VENUE_TYPES, PRAYER_NAMES } from "@/lib/constants";
import PageHeader from "@/components/shared/PageHeader";
import Button from "@/components/ui/Button";
import Badge, { VerificationBadge } from "@/components/ui/Badge";
import Card, { CardHeader, CardDivider } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import EmptyState from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import toast from "react-hot-toast";

// ── Options ───────────────────────────────────────────────
const timingTypeOptions = [
  { value: "fixed", label: "Fixed Time" },
  { value: "relative", label: "Relative (e.g. after sunset)" },
];

const verificationOptions = [
  { value: "verified", label: "Verified" },
  { value: "community_updated", label: "Community Updated" },
  { value: "needs_update", label: "Needs Update" },
  { value: "pending_review", label: "Pending Review" },
];

const prayerOptions = Object.entries(PRAYER_NAMES).map(([value, label]) => ({ value, label }));

const venueTypeOptions = Object.entries(VENUE_TYPES).map(([value, label]) => ({ value, label }));

const womenSpaceOptions = [
  { value: "available", label: "Available" },
  { value: "not_available", label: "Not Available" },
  { value: "jumuah_only", label: "Jumu'ah Only" },
  { value: "ramadan_eid_only", label: "Ramadan / Eid Only" },
  { value: "unknown", label: "Unknown" },
];

const facilityOptions = [
  { value: "available", label: "Available" },
  { value: "not_available", label: "Not Available" },
  { value: "limited", label: "Limited" },
  { value: "unknown", label: "Unknown" },
];

const emptyDailyForm = {
  prayerName: "fajr", azaanTime: "", jamaahTime: "",
  timingType: "fixed", relativeTimeText: "",
  effectiveFrom: new Date().toISOString().split("T")[0],
  verificationStatus: "verified", sourceNote: "",
};

const emptyJumuahForm = {
  slotNumber: 1, azaanTime: "", khutbahTime: "", jamaahTime: "",
  khutbahLanguage: "", womenPrayerSpace: "unknown",
  importantNotice: "", effectiveFrom: new Date().toISOString().split("T")[0],
  verificationStatus: "verified", sourceNote: "",
};

export default function VenueDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [venue, setVenue] = useState(null);
  const [dailyTimings, setDailyTimings] = useState([]);
  const [jumuahTimings, setJumuahTimings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [jumuahModalOpen, setJumuahModalOpen] = useState(false);
  const [editDailyModalOpen, setEditDailyModalOpen] = useState(false);
  const [editVenueModalOpen, setEditVenueModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");

  // Forms
  const [dailyForm, setDailyForm] = useState(emptyDailyForm);
  const [jumuahForm, setJumuahForm] = useState(emptyJumuahForm);
  const [editDailyForm, setEditDailyForm] = useState(null); // holds timing being edited
  const [editVenueForm, setEditVenueForm] = useState(null); // holds venue fields being edited

  // ── Fetch ───────────────────────────────────────────────
  async function fetchAll() {
    setLoading(true);
    try {
      const [venueRes, dailyRes, jumuahRes] = await Promise.all([
        api.get(`/venues/${id}`),
        api.get(`/venues/${id}/daily-timings`),
        api.get(`/venues/${id}/jumuah-timings`),
      ]);
      setVenue(venueRes.data);
      setDailyTimings(dailyRes.data || []);
      setJumuahTimings(jumuahRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, [id]);

  // ── Form handlers ───────────────────────────────────────
  function handleDailyChange(e) {
    setDailyForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  }

  function handleJumuahChange(e) {
    setJumuahForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  }



  // ── Open edit daily timing modal ────────────────────────
  function openEditDailyModal(timing) {
    setEditDailyForm({
      id: timing.id,
      prayerName: timing.prayerName,
      azaanTime: timing.azaanTime || "",
      jamaahTime: timing.jamaahTime || "",
      timingType: timing.timingType || "fixed",
      relativeTimeText: timing.relativeTimeText || "",
      effectiveFrom: timing.effectiveFrom
        ? new Date(timing.effectiveFrom).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      verificationStatus: timing.verificationStatus || "verified",
      sourceNote: timing.sourceNote || "",
    });
    setError("");
    setEditDailyModalOpen(true);
  }

  // ── Open edit venue modal ───────────────────────────────
  function openEditVenueModal() {
    setEditVenueForm({
      name: venue.name || "",
      venueType: venue.venueType || "masjid",
      address: venue.address || "",
      pincode: venue.pincode || "",
      phone: venue.phone || "",
      defaultKhutbahLanguage: venue.defaultKhutbahLanguage || "",
      womenPrayerSpace: venue.womenPrayerSpace || "unknown",
      wuduFacility: venue.wuduFacility || "unknown",
      parking: venue.parking || "unknown",
      facilityNotes: venue.facilityNotes || "",
      importantNotice: venue.importantNotice || "",
      verificationStatus: venue.verificationStatus || "pending_review",
    });
    setError("");
    setEditVenueModalOpen(true);
  }

  // ── Save new daily timing ───────────────────────────────
  async function saveDailyTiming() {
    setError("");
    if (!dailyForm.prayerName) { setError("Prayer name is required."); return; }
    if (dailyForm.timingType === "fixed" && !dailyForm.jamaahTime) {
      setError("Jamā'ah time is required for fixed timings."); return;
    }
    if (dailyForm.timingType === "relative" && !dailyForm.relativeTimeText) {
      setError("Please describe the relative timing."); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...dailyForm,
        effectiveFrom: new Date(dailyForm.effectiveFrom).toISOString(),
        azaanTime: dailyForm.azaanTime || undefined,
        jamaahTime: dailyForm.timingType === "fixed" ? dailyForm.jamaahTime : undefined,
        relativeTimeText: dailyForm.timingType === "relative" ? dailyForm.relativeTimeText : undefined,
        sourceNote: dailyForm.sourceNote || undefined,
      };
      await api.post(`/venues/${id}/daily-timings`, payload);
      setDailyModalOpen(false);
      await fetchAll();
      toast.success("Daily timing added successfully.");
    } catch (err) {
      setError(err.message || "Failed to save timing.");
    } finally {
      setSaving(false);
    }
  }

  // ── Update existing daily timing ────────────────────────
  async function updateDailyTiming() {
    setError("");
    if (editDailyForm.timingType === "fixed" && !editDailyForm.jamaahTime) {
      setError("Jamā'ah time is required for fixed timings."); return;
    }
    if (editDailyForm.timingType === "relative" && !editDailyForm.relativeTimeText) {
      setError("Please describe the relative timing."); return;
    }
    setSaving(true);
    try {
      const payload = {
        prayerName: editDailyForm.prayerName,
        azaanTime: editDailyForm.azaanTime || undefined,
        jamaahTime: editDailyForm.timingType === "fixed" ? editDailyForm.jamaahTime : undefined,
        timingType: editDailyForm.timingType,
        relativeTimeText: editDailyForm.timingType === "relative" ? editDailyForm.relativeTimeText : undefined,
        effectiveFrom: new Date(editDailyForm.effectiveFrom).toISOString(),
        verificationStatus: editDailyForm.verificationStatus,
        sourceNote: editDailyForm.sourceNote || undefined,
      };
      await api.patch(`/daily-timings/${editDailyForm.id}`, payload);
      setEditDailyModalOpen(false);
      await fetchAll();
      toast.success("Timing updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update timing.");
    } finally {
      setSaving(false);
    }
  }

  // ── Update venue profile ────────────────────────────────
  async function updateVenue() {
    setError("");
    if (!editVenueForm.name.trim()) { setError("Venue name is required."); return; }
    setSaving(true);
    try {
      const payload = {
        name: editVenueForm.name.trim(),
        venueType: editVenueForm.venueType,
        address: editVenueForm.address || undefined,
        pincode: editVenueForm.pincode || undefined,
        phone: editVenueForm.phone || undefined,
        defaultKhutbahLanguage: editVenueForm.defaultKhutbahLanguage || undefined,
        womenPrayerSpace: editVenueForm.womenPrayerSpace,
        wuduFacility: editVenueForm.wuduFacility,
        parking: editVenueForm.parking,
        facilityNotes: editVenueForm.facilityNotes || undefined,
        importantNotice: editVenueForm.importantNotice || undefined,
        verificationStatus: editVenueForm.verificationStatus,
      };
      await api.patch(`/venues/${id}`, payload);
      setEditVenueModalOpen(false);
      await fetchAll();
      toast.success("Venue updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update venue.");
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle public / hidden ──────────────────────────────
  async function togglePublicStatus() {
    setToggling(true);
    try {
      await api.patch(`/venues/${id}/status`, {
        isPublic: !venue.isPublic,
        isActive: venue.isActive,
      });
      await fetchAll();
      toast.success(
        venue.isPublic
          ? "Venue is now hidden from public."
          : "Venue is now visible to the public."
      );
    } catch (err) {
      toast.error("Failed to update venue status.");
    } finally {
      setToggling(false);
    }
  }

  // ── Save Jumu'ah timing ─────────────────────────────────
  async function saveJumuahTiming() {
    setError("");
    if (!jumuahForm.jamaahTime) { setError("Jamā'ah time is required."); return; }
    setSaving(true);
    try {
      const payload = {
        ...jumuahForm,
        slotNumber: parseInt(jumuahForm.slotNumber),
        effectiveFrom: new Date(jumuahForm.effectiveFrom).toISOString(),
        azaanTime: jumuahForm.azaanTime || undefined,
        khutbahTime: jumuahForm.khutbahTime || undefined,
        khutbahLanguage: jumuahForm.khutbahLanguage || undefined,
        importantNotice: jumuahForm.importantNotice || undefined,
        sourceNote: jumuahForm.sourceNote || undefined,
      };
      await api.post(`/venues/${id}/jumuah-timings`, payload);
      setJumuahModalOpen(false);
      await fetchAll();
      toast.success("Jumu'ah slot added successfully.");
    } catch (err) {
      setError(err.message || "Failed to save Jumu'ah timing.");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete Jumu'ah timing ───────────────────────────────
  async function deleteJumuahTiming(timingId) {
    if (!confirm("Delete this Jumu'ah slot?")) return;
    try {
      await api.delete(`/jumuah-timings/${timingId}`);
      await fetchAll();
      toast.success("Jumu'ah slot deleted.");
    } catch (err) {
      toast.error("Failed to delete slot.");
    }
  }

  if (loading) return <PageLoader />;
  if (!venue) return (
    <EmptyState
      icon={Building2}
      title="Venue not found"
      description="This venue does not exist or has been removed."
      action={() => router.push("/admin/venues")}
      actionLabel="Back to Venues"
    />
  );

  const prayerOrder = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
  const sortedDailyTimings = [...dailyTimings].sort(
    (a, b) => prayerOrder.indexOf(a.prayerName) - prayerOrder.indexOf(b.prayerName)
  );

  return (
    <div>
      <PageHeader
        title={venue.name}
        subtitle={`${VENUE_TYPES[venue.venueType] || venue.venueType} · ${venue.area?.name ? venue.area.name + ", " : ""}${venue.city?.name || ""}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Venues", href: "/admin/venues" },
          { label: venue.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <VerificationBadge status={venue.verificationStatus} />
            <Button
              variant={venue.isPublic ? "secondary" : "ghost"}
              size="sm"
              icon={venue.isPublic ? EyeOff : Eye}
              loading={toggling}
              onClick={togglePublicStatus}
            >
              {venue.isPublic ? "Hide" : "Make Public"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Edit}
              onClick={openEditVenueModal}
            >
              Edit Venue
            </Button>
            {venue.googleMapsLink && (
              <a href={venue.googleMapsLink} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" icon={ExternalLink}>
                  Maps
                </Button>
              </a>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left: Venue info ────────────────────────── */
//}
//         <div className="flex flex-col gap-5">
//           <Card>
//             <CardHeader title="Venue Details" />
//             <div className="flex flex-col gap-3">
//               {[
//                 { icon: Building2, label: "Type", value: VENUE_TYPES[venue.venueType] || venue.venueType },
//                 { icon: MapPin, label: "Address", value: venue.address },
//                 { icon: MapPin, label: "Area", value: venue.area?.name || "—" },
//                 { icon: Globe, label: "City", value: venue.city?.name || "—" },
//                 { icon: Globe, label: "Pincode", value: venue.pincode || "—" },
//                 { icon: Phone, label: "Phone", value: venue.phone || "—" },
//               ].map((item) => {
//                 const Icon = item.icon;
//                 return (
//                   <div key={item.label} className="flex items-start gap-2.5">
//                     <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
//                       <Icon size={13} className="text-gray-500" />
//                     </div>
//                     <div>
//                       <p className="text-xs text-gray-400">{item.label}</p>
//                       <p className="text-sm text-gray-800 font-medium">{item.value || "—"}</p>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </Card>

//           <Card>
//             <CardHeader title="Facilities" />
//             <div className="flex flex-col gap-3">
//               {[
//                 { icon: Users, label: "Women's Space", value: venue.womenPrayerSpace },
//                 { icon: Droplets, label: "Wudu Facility", value: venue.wuduFacility },
//                 { icon: Car, label: "Parking", value: venue.parking },
//                 { icon: MessageSquare, label: "Khutbah Language", value: venue.defaultKhutbahLanguage || "—" },
//               ].map((item) => {
//                 const Icon = item.icon;
//                 return (
//                   <div key={item.label} className="flex items-center justify-between">
//                     <div className="flex items-center gap-2 text-sm text-gray-600">
//                       <Icon size={14} className="text-gray-400" />
//                       {item.label}
//                     </div>
//                     <Badge variant="neutral" size="sm">
//                       {item.value?.replace(/_/g, " ") || "unknown"}
//                     </Badge>
//                   </div>
//                 );
//               })}
//             </div>

//             {venue.facilityNotes && (
//               <>
//                 <CardDivider />
//                 <div>
//                   <p className="text-xs font-medium text-gray-500 mb-1">Facility Notes</p>
//                   <p className="text-sm text-gray-700 leading-relaxed">{venue.facilityNotes}</p>
//                 </div>
//               </>
//             )}

//             {venue.importantNotice && (
//               <>
//                 <CardDivider />
//                 <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
//                   <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
//                   <p className="text-sm text-amber-800">{venue.importantNotice}</p>
//                 </div>
//               </>
//             )}
//           </Card>
//         </div>

//         {/* ── Right: Timings ──────────────────────────── */}
//         <div className="lg:col-span-2 flex flex-col gap-5">

//           {/* Daily timings */}
//           <Card padding={false}>
//             <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
//               <div>
//                 <h3 className="text-sm font-semibold text-gray-900">Daily Prayer Timings</h3>
//                 <p className="text-xs text-gray-500 mt-0.5">Azaan and Jamā'ah times for all five prayers</p>
//               </div>
//               <Button size="sm" icon={Plus} onClick={() => {
//                 setDailyForm(emptyDailyForm);
//                 setError("");
//                 setDailyModalOpen(true);
//               }}>
//                 Add Timing
//               </Button>
//             </div>

//             {sortedDailyTimings.length === 0 ? (
//               <EmptyState
//                 icon={Clock}
//                 title="No daily timings yet"
//                 description="Add Azaan and Jamā'ah timings for this venue."
//                 action={() => { setDailyForm(emptyDailyForm); setDailyModalOpen(true); }}
//                 actionLabel="Add Timing"
//               />
//             ) : (
//               <div className="divide-y divide-gray-50">
//                 {sortedDailyTimings.map((timing) => (
//                   <div
//                     key={timing.id}
//                     className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
//                   >
//                     <div className="flex items-center gap-4">
//                       <div className="w-20">
//                         <p className="text-sm font-semibold text-gray-900 capitalize">
//                           {PRAYER_NAMES[timing.prayerName] || timing.prayerName}
//                         </p>
//                       </div>
//                       <div className="flex items-center gap-6">
//                         <div>
//                           <p className="text-xs text-gray-400">Azaan</p>
//                           <p className="text-sm font-mono font-medium text-gray-700">
//                             {timing.azaanTime || "—"}
//                           </p>
//                         </div>
//                         <div>
//                           <p className="text-xs text-gray-400">Jamā'ah</p>
//                           <p className="text-sm font-mono font-semibold text-emerald-700">
//                             {timing.timingType === "relative"
//                               ? timing.relativeTimeText
//                               : timing.jamaahTime || "—"}
//                           </p>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="flex items-center gap-2">
//                       <VerificationBadge status={timing.verificationStatus} size="sm" />
//                       <button
//                         onClick={() => openEditDailyModal(timing)}
//                         className="p-1.5 rounded-lg text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors opacity-0 group-hover:opacity-100"
//                         title="Edit timing"
//                       >
//                         <Edit size={14} />
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </Card>

//           {/* Jumu'ah timings */}
//           <Card padding={false}>
//             <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
//               <div>
//                 <h3 className="text-sm font-semibold text-gray-900">Jumu'ah Timings</h3>
//                 <p className="text-xs text-gray-500 mt-0.5">Friday prayer slots — multiple slots supported</p>
//               </div>
//               <Button size="sm" icon={Plus} onClick={() => {
//                 setJumuahForm({ ...emptyJumuahForm, slotNumber: jumuahTimings.length + 1 });
//                 setError("");
//                 setJumuahModalOpen(true);
//               }}>
//                 Add Slot
//               </Button>
//             </div>

//             {jumuahTimings.length === 0 ? (
//               <EmptyState
//                 icon={Clock}
//                 title="No Jumu'ah timings yet"
//                 description="Add Friday prayer slots for this venue."
//                 action={() => { setJumuahForm(emptyJumuahForm); setJumuahModalOpen(true); }}
//                 actionLabel="Add Slot"
//               />
//             ) : (
//               <div className="divide-y divide-gray-50">
//                 {jumuahTimings.map((slot) => (
//                   <div key={slot.id} className="px-5 py-4 hover:bg-gray-50 transition-colors group">
//                     <div className="flex items-start justify-between">
//                       <div className="flex items-start gap-4">
//                         <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
//                           <span className="text-xs font-bold text-emerald-700">{slot.slotNumber}</span>
//                         </div>
//                         <div className="flex items-center gap-6">
//                           {slot.azaanTime && (
//                             <div>
//                               <p className="text-xs text-gray-400">Azaan</p>
//                               <p className="text-sm font-mono font-medium text-gray-700">{slot.azaanTime}</p>
//                             </div>
//                           )}
//                           {slot.khutbahTime && (
//                             <div>
//                               <p className="text-xs text-gray-400">Khutbah</p>
//                               <p className="text-sm font-mono font-medium text-gray-700">{slot.khutbahTime}</p>
//                             </div>
//                           )}
//                           <div>
//                             <p className="text-xs text-gray-400">Jamā'ah</p>
//                             <p className="text-sm font-mono font-semibold text-emerald-700">{slot.jamaahTime}</p>
//                           </div>
//                           {slot.khutbahLanguage && (
//                             <div>
//                               <p className="text-xs text-gray-400">Language</p>
//                               <p className="text-sm font-medium text-gray-700">{slot.khutbahLanguage}</p>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-2">
//                         <VerificationBadge status={slot.verificationStatus} size="sm" />
//                         <button
//                           onClick={() => deleteJumuahTiming(slot.id)}
//                           className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
//                         >
//                           <Trash2 size={14} />
//                         </button>
//                       </div>
//                     </div>
//                     {slot.importantNotice && (
//                       <div className="mt-2 ml-12 flex items-start gap-1.5 text-xs text-amber-700">
//                         <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
//                         {slot.importantNotice}
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </Card>
//         </div>
//       </div>

//       {/* ── Add Daily Timing Modal ──────────────────────── */}
//       <Modal
//         isOpen={dailyModalOpen}
//         onClose={() => setDailyModalOpen(false)}
//         title="Add Daily Prayer Timing"
//         subtitle="Enter Azaan and Jamā'ah times for a prayer."
//         footer={
//           <div className="flex justify-end gap-2">
//             <Button variant="secondary" onClick={() => setDailyModalOpen(false)}>Cancel</Button>
//             <Button loading={saving} onClick={saveDailyTiming}>Save Timing</Button>
//           </div>
//         }
//       >
//         <div className="flex flex-col gap-4">
//           {error && (
//             <div className="px-3.5 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">
//               ⚠ {error}
//             </div>
//           )}
//           <Select label="Prayer" name="prayerName" required options={prayerOptions} value={dailyForm.prayerName} onChange={handleDailyChange} />
//           <Select label="Timing Type" name="timingType" required options={timingTypeOptions} value={dailyForm.timingType} onChange={handleDailyChange} />
//           <div className="grid grid-cols-2 gap-3">
//             <Input label="Azaan Time" name="azaanTime" type="time" value={dailyForm.azaanTime} onChange={handleDailyChange} hint="Optional" />
//             {dailyForm.timingType === "fixed" ? (
//               <Input label="Jamā'ah Time" name="jamaahTime" type="time" required value={dailyForm.jamaahTime} onChange={handleDailyChange} />
//             ) : (
//               <Input label="Relative Description" name="relativeTimeText" placeholder="e.g. 5 mins after sunset" required value={dailyForm.relativeTimeText} onChange={handleDailyChange} />
//             )}
//           </div>
//           <Input label="Effective From" name="effectiveFrom" type="date" required value={dailyForm.effectiveFrom} onChange={handleDailyChange} />
//           <Select label="Verification Status" name="verificationStatus" options={verificationOptions} value={dailyForm.verificationStatus} onChange={handleDailyChange} />
//           <Input label="Source Note" name="sourceNote" placeholder="e.g. Confirmed from mosque timing board" value={dailyForm.sourceNote} onChange={handleDailyChange} hint="Optional" />
//         </div>
//       </Modal>

//       {/* ── Edit Daily Timing Modal ─────────────────────── */}
//       {editDailyForm && (
//         <Modal
//           isOpen={editDailyModalOpen}
//           onClose={() => setEditDailyModalOpen(false)}
//           title={`Edit ${PRAYER_NAMES[editDailyForm.prayerName] || editDailyForm.prayerName} Timing`}
//           subtitle="Update the timing details for this prayer."
//           footer={
//             <div className="flex justify-end gap-2">
//               <Button variant="secondary" onClick={() => setEditDailyModalOpen(false)}>Cancel</Button>
//               <Button loading={saving} onClick={updateDailyTiming}>Update Timing</Button>
//             </div>
//           }
//         >
//           <div className="flex flex-col gap-4">
//             {error && (
//               <div className="px-3.5 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">
//                 ⚠ {error}
//               </div>
//             )}
//             <Select label="Timing Type" name="timingType" required options={timingTypeOptions} value={editDailyForm.timingType} onChange={handleEditDailyChange} />
//             <div className="grid grid-cols-2 gap-3">
//               <Input label="Azaan Time" name="azaanTime" type="time" value={editDailyForm.azaanTime} onChange={handleEditDailyChange} hint="Optional" />
//               {editDailyForm.timingType === "fixed" ? (
//                 <Input label="Jamā'ah Time" name="jamaahTime" type="time" required value={editDailyForm.jamaahTime} onChange={handleEditDailyChange} />
//               ) : (
//                 <Input label="Relative Description" name="relativeTimeText" placeholder="e.g. 5 mins after sunset" required value={editDailyForm.relativeTimeText} onChange={handleEditDailyChange} />
//               )}
//             </div>
//             <Input label="Effective From" name="effectiveFrom" type="date" required value={editDailyForm.effectiveFrom} onChange={handleEditDailyChange} />
//             <Select label="Verification Status" name="verificationStatus" options={verificationOptions} value={editDailyForm.verificationStatus} onChange={handleEditDailyChange} />
//             <Input label="Source Note" name="sourceNote" placeholder="e.g. Updated from mosque notice board" value={editDailyForm.sourceNote} onChange={handleEditDailyChange} hint="Optional" />
//           </div>
//         </Modal>
//       )}

//       {/* ── Edit Venue Modal ────────────────────────────── */}
//       {editVenueForm && (
//         <Modal
//           isOpen={editVenueModalOpen}
//           onClose={() => setEditVenueModalOpen(false)}
//           title="Edit Venue"
//           subtitle="Update the mosque or prayer venue profile."
//           footer={
//             <div className="flex justify-end gap-2">
//               <Button variant="secondary" onClick={() => setEditVenueModalOpen(false)}>Cancel</Button>
//               <Button loading={saving} onClick={updateVenue}>Save Changes</Button>
//             </div>
//           }
//         >
//           <div className="flex flex-col gap-4">
//             {error && (
//               <div className="px-3.5 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">
//                 ⚠ {error}
//               </div>
//             )}
//             <Input label="Venue Name" name="name" required placeholder="e.g. Masjid Al-Noor" value={editVenueForm.name} onChange={handleEditVenueChange} />
//             <Select label="Venue Type" name="venueType" required options={venueTypeOptions} value={editVenueForm.venueType} onChange={handleEditVenueChange} />
//             <Input label="Address" name="address" placeholder="Street address" value={editVenueForm.address} onChange={handleEditVenueChange} />
//             <div className="grid grid-cols-2 gap-3">
//               <Input label="Pincode" name="pincode" placeholder="560076" value={editVenueForm.pincode} onChange={handleEditVenueChange} />
//               <Input label="Phone" name="phone" placeholder="+91 98765 43210" value={editVenueForm.phone} onChange={handleEditVenueChange} hint="Optional" />
//             </div>
//             <Input label="Khutbah Language" name="defaultKhutbahLanguage" placeholder="e.g. Urdu, English, Kannada" value={editVenueForm.defaultKhutbahLanguage} onChange={handleEditVenueChange} hint="Optional" />
//             <div className="grid grid-cols-3 gap-3">
//               <Select label="Women's Space" name="womenPrayerSpace" options={womenSpaceOptions} value={editVenueForm.womenPrayerSpace} onChange={handleEditVenueChange} />
//               <Select label="Wudu Facility" name="wuduFacility" options={facilityOptions} value={editVenueForm.wuduFacility} onChange={handleEditVenueChange} />
//               <Select label="Parking" name="parking" options={facilityOptions} value={editVenueForm.parking} onChange={handleEditVenueChange} />
//             </div>
//             <Select label="Verification Status" name="verificationStatus" options={verificationOptions} value={editVenueForm.verificationStatus} onChange={handleEditVenueChange} />
//             <Textarea label="Facility Notes" name="facilityNotes" placeholder="Any general notes about facilities..." value={editVenueForm.facilityNotes} onChange={handleEditVenueChange} rows={2} hint="Optional — visible to public" />
//             <Textarea label="Important Notice" name="importantNotice" placeholder="Urgent or time-sensitive notice..." value={editVenueForm.importantNotice} onChange={handleEditVenueChange} rows={2} hint="Optional — shown prominently" />
//           </div>
//         </Modal>
//       )}

//       {/* ── Add Jumu'ah Modal ───────────────────────────── */}
//       <Modal
//         isOpen={jumuahModalOpen}
//         onClose={() => setJumuahModalOpen(false)}
//         title="Add Jumu'ah Slot"
//         subtitle="Enter Friday prayer timing details."
//         footer={
//           <div className="flex justify-end gap-2">
//             <Button variant="secondary" onClick={() => setJumuahModalOpen(false)}>Cancel</Button>
//             <Button loading={saving} onClick={saveJumuahTiming}>Save Slot</Button>
//           </div>
//         }
//       >
//         <div className="flex flex-col gap-4">
//           {error && (
//             <div className="px-3.5 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">
//               ⚠ {error}
//             </div>
//           )}
//           <div className="grid grid-cols-3 gap-3">
//             <Input label="Slot Number" name="slotNumber" type="number" min="1" required value={jumuahForm.slotNumber} onChange={handleJumuahChange} />
//             <Input label="Azaan Time" name="azaanTime" type="time" value={jumuahForm.azaanTime} onChange={handleJumuahChange} hint="Optional" />
//             <Input label="Khutbah Time" name="khutbahTime" type="time" value={jumuahForm.khutbahTime} onChange={handleJumuahChange} hint="Optional" />
//           </div>
//           <div className="grid grid-cols-2 gap-3">
//             <Input label="Jamā'ah Time" name="jamaahTime" type="time" required value={jumuahForm.jamaahTime} onChange={handleJumuahChange} />
//             <Input label="Khutbah Language" name="khutbahLanguage" placeholder="e.g. Urdu, English" value={jumuahForm.khutbahLanguage} onChange={handleJumuahChange} />
//           </div>
//           <Select label="Women's Prayer Space" name="womenPrayerSpace" options={womenSpaceOptions} value={jumuahForm.womenPrayerSpace} onChange={handleJumuahChange} />
//           <Input label="Effective From" name="effectiveFrom" type="date" required value={jumuahForm.effectiveFrom} onChange={handleJumuahChange} />
//           <Select label="Verification Status" name="verificationStatus" options={verificationOptions} value={jumuahForm.verificationStatus} onChange={handleJumuahChange} />
//           <Textarea label="Important Notice" name="importantNotice" placeholder="e.g. Arrive early due to crowding." value={jumuahForm.importantNotice} onChange={handleJumuahChange} rows={2} hint="Optional" />
//           <Input label="Source Note" name="sourceNote" placeholder="e.g. Confirmed by mosque representative" value={jumuahForm.sourceNote} onChange={handleJumuahChange} hint="Optional" />
//         </div>
//       </Modal>
//     </div>
//   );
// }
// */
