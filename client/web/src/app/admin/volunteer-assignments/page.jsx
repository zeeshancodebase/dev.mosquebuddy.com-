// src/app/admin/volunteer-assignments/page.jsx
//
// Standalone admin page for managing volunteer assignments across ALL scope
// types (venue / area / city). Deliberately separate from the venue detail
// page — this assignment isn't "about" one mosque, so it doesn't belong
// cluttering that page or re-fetching on every single venue.
//
// NOTE — a few imports below reference components/paths I'm inferring from
// your other pages (PermissionCheckbox, SearchableSelect, VOLUNTEER_PERMISSIONS).
// Double check these paths match your actual project structure; where I
// wasn't sure, I've written a self-contained fallback instead of guessing
// wrong silently (see inline comments).

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  UserPlus,
  Building2,
  MapPin,
  Globe,
  X,
  Info,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import PageHeader from "@/components/shared/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardDivider } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import Badge from "@/components/ui/Badge";
import Tooltip from "@/components/ui/Tooltip";
import SearchableSelect from "@/components/ui/SearchableSelect"; // adjust path if different

// ── Permission config ─────────────────────────────────────
// If you already have this constant defined/exported elsewhere (you
// reference VOLUNTEER_PERMISSIONS in the venue detail page), delete this
// and import that one instead so there's a single source of truth.
const VOLUNTEER_PERMISSIONS = [
  { key: "canVerifyTimings", label: "Verify Timings", tooltip: "Can verify submitted prayer timings" },
  { key: "canUpdateTimings", label: "Update Timings", tooltip: "Can add/edit prayer timings directly" },
  { key: "canReviewReports", label: "Review Reports", tooltip: "Can review and action user-submitted reports" },
  { key: "canReviewSuggestions", label: "Review Suggestions", tooltip: "Can review and action venue suggestions" },
];

const SCOPE_OPTIONS = [
  { key: "venue", label: "Venue", icon: Building2 },
  { key: "area", label: "Area", icon: MapPin },
  { key: "city", label: "City", icon: Globe },
];

function getAssignmentScope(a) {
  if (a.venue) return { type: "Venue", name: a.venue.name };
  if (a.area) return { type: "Area", name: a.area.name };
  if (a.city) return { type: "City", name: a.city.name };
  return { type: "Unknown", name: "—" };
}

const scopeBadgeClass = {
  Venue: "bg-gray-200 text-gray-700",
  Area: "bg-amber-100 text-amber-700",
  City: "bg-purple-100 text-purple-700",
  Unknown: "bg-red-100 text-red-700",
};

export default function VolunteerAssignmentsPage() {
  // ── List state ──────────────────────────────────────────
  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("true"); // 'true' | 'false' | ''
  const [scopeTypeFilter, setScopeTypeFilter] = useState("all"); // client-side only
  const [searchText, setSearchText] = useState(""); // client-side only, filters visible rows

  // ── Modal / form state ──────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [updatingPermission, setUpdatingPermission] = useState(null);

  const [form, setForm] = useState({
    userId: "",
    canVerifyTimings: true,
    canUpdateTimings: false,
    canReviewReports: false,
    canReviewSuggestions: false,
  });

  const [scopeType, setScopeType] = useState("venue");
  const [scopeVenueId, setScopeVenueId] = useState("");
  const [scopeCityId, setScopeCityId] = useState("");
  const [scopeAreaId, setScopeAreaId] = useState("");

  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [venuesList, setVenuesList] = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(false);

  const [citiesList, setCitiesList] = useState([]);
  const [areasList, setAreasList] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [areasLoading, setAreasLoading] = useState(false);

  // ── Fetch assignments ────────────────────────────────────
  const fetchAssignments = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", targetPage);
        params.set("limit", "20");
        if (statusFilter) params.set("isActive", statusFilter);

        const res = await api.get(`/admin/volunteer-assignments?${params.toString()}`);
        setAssignments(res.data || []);
        setPagination(res.meta?.pagination || null);
        setPage(targetPage);
      } catch (err) {
        // toast already shown by api layer
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    fetchAssignments(1);
  }, [fetchAssignments]);

  // ── Fetch users (trusted volunteers only) ────────────────
  async function fetchUsersIfNeeded() {
    if (allUsers.length > 0) return;
    setUsersLoading(true);
    try {
      const res = await api.get("/users?limit=200&role=trusted_volunteer");
      setAllUsers(res.data || []);
    } catch (err) {
      // handled by api layer
    } finally {
      setUsersLoading(false);
    }
  }

 const volunteerUserOptions = allUsers.map((u) => ({
    value: u.id,
    label: `${u.name} — ${u.email}`,
  }));

  // ── Fetch venues (for venue-scope picker) ────────────────
  // NOTE: adjust the endpoint/param below to match whatever your main
  // venues list page actually calls (I'm assuming something like
  // GET /venues?limit=200 based on the pattern used for /users?limit=100).
  async function fetchVenuesIfNeeded() {
    if (venuesList.length > 0) return;
    setVenuesLoading(true);
    try {
      const res = await api.get("/venues?limit=200");
      setVenuesList(res.data || []);
    } catch (err) {
      // handled by api layer
    } finally {
      setVenuesLoading(false);
    }
  }

  const venueOptions = venuesList.map((v) => ({
    value: v.id,
    label: v.city?.name ? `${v.name} (${v.city.name})` : v.name,
  }));

  // ── Fetch cities / areas (for area & city scope pickers) ─
  async function fetchCitiesIfNeeded() {
    if (citiesList.length > 0) return;
    setCitiesLoading(true);
    try {
      const res = await api.get("/locations/cities");
      setCitiesList(res.data || []);
    } catch (err) {
      // handled by api layer
    } finally {
      setCitiesLoading(false);
    }
  }

  async function fetchAreasForCity(cityId) {
    if (!cityId) {
      setAreasList([]);
      return;
    }
    setAreasLoading(true);
    try {
      const res = await api.get(`/locations/areas?cityId=${cityId}`);
      setAreasList(res.data || []);
    } catch (err) {
      // handled by api layer
    } finally {
      setAreasLoading(false);
    }
  }

  // ── Modal open / scope handlers ──────────────────────────
  function openAssignModal() {
    setForm({
      userId: "",
      canVerifyTimings: true,
      canUpdateTimings: false,
      canReviewReports: false,
      canReviewSuggestions: false,
    });
    setScopeType("venue");
    setScopeVenueId("");
    setScopeCityId("");
    setScopeAreaId("");
    setAreasList([]);
    setError("");
    fetchUsersIfNeeded();
    fetchVenuesIfNeeded();
    setModalOpen(true);
  }

  function handleScopeTypeChange(type) {
    setScopeType(type);
    setScopeVenueId("");
    setScopeCityId("");
    setScopeAreaId("");
    setAreasList([]);
    if (type === "venue") fetchVenuesIfNeeded();
    if (type === "area" || type === "city") fetchCitiesIfNeeded();
  }

  function handleScopeCityChange(cityId) {
    setScopeCityId(cityId);
    setScopeAreaId("");
    if (scopeType === "area") fetchAreasForCity(cityId);
  }

  // ── Save new assignment ───────────────────────────────────
  async function saveAssignment() {
    setError("");
    if (!form.userId) {
      setError("Please select a volunteer.");
      return;
    }
    if (scopeType === "venue" && !scopeVenueId) {
      setError("Please select a venue.");
      return;
    }
    if (scopeType === "area" && !scopeAreaId) {
      setError("Please select an area.");
      return;
    }
    if (scopeType === "city" && !scopeCityId) {
      setError("Please select a city.");
      return;
    }

    const scopePayload =
      scopeType === "venue"
        ? { venueId: scopeVenueId }
        : scopeType === "area"
        ? { areaId: scopeAreaId }
        : { cityId: scopeCityId };

    setSaving(true);
    try {
      await api.post("/admin/volunteer-assignments", {
        userId: form.userId,
        ...scopePayload,
        canVerifyTimings: form.canVerifyTimings,
        canUpdateTimings: form.canUpdateTimings,
        canReviewReports: form.canReviewReports,
        canReviewSuggestions: form.canReviewSuggestions,
      });
      setModalOpen(false);
      await fetchAssignments(1);
      toast.success("Volunteer assigned successfully.");
    } catch (err) {
      setError(err.message || "Failed to assign volunteer.");
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle a permission on an existing assignment ────────
  async function togglePermission(assignmentId, key, newValue) {
    setUpdatingPermission(`${assignmentId}-${key}`);
    try {
      await api.patch(`/admin/volunteer-assignments/${assignmentId}`, { [key]: newValue });
      setAssignments((prev) =>
        prev.map((a) => (a.id === assignmentId ? { ...a, [key]: newValue } : a))
      );
      toast.success(newValue ? "Permission granted." : "Permission removed.");
    } catch (err) {
      toast.error("Failed to update permission.");
    } finally {
      setUpdatingPermission(null);
    }
  }

  // ── Deactivate assignment ────────────────────────────────
  async function removeAssignment(assignmentId) {
    setRemovingId(assignmentId);
    try {
      await api.delete(`/admin/volunteer-assignments/${assignmentId}`);
      await fetchAssignments(page);
      toast.success("Assignment deactivated.");
    } catch (err) {
      toast.error("Failed to deactivate assignment.");
    } finally {
      setRemovingId(null);
    }
  }

  // ── Client-side filters (scope type + text search) ───────
  const visibleAssignments = assignments.filter((a) => {
    const scope = getAssignmentScope(a);
    if (scopeTypeFilter !== "all" && scope.type.toLowerCase() !== scopeTypeFilter) {
      return false;
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      const haystack = `${a.user?.name || ""} ${a.user?.email || ""} ${scope.name}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Volunteer Assignments"
        subtitle="Assign trusted volunteers to a specific venue, an entire area, or an entire city."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Volunteer Assignments" },
        ]}
        actions={
          <Button icon={UserPlus} onClick={openAssignModal}>
            Assign Volunteer
          </Button>
        }
      />

      {/* ── Filters ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or scope..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {["all", "venue", "area", "city"].map((opt) => (
            <button
              key={opt}
              onClick={() => setScopeTypeFilter(opt)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
                scopeTypeFilter === opt
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: "true", label: "Active" },
            { key: "false", label: "Inactive" },
            { key: "", label: "All" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setStatusFilter(opt.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                statusFilter === opt.key
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => fetchAssignments(page)}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ml-auto"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* ── Table ────────────────────────────────────────── */}
      <Card padding={false}>
        {loading ? (
          <PageLoader />
        ) : visibleAssignments.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="No volunteer assignments yet"
            description="Assign a trusted volunteer to a venue, area, or city to get started."
            action={openAssignModal}
            actionLabel="Assign Volunteer"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Volunteer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Scope</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Permissions</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visibleAssignments.map((a) => {
                  const scope = getAssignmentScope(a);
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors align-top">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-gray-900">{a.user?.name}</p>
                        <p className="text-xs text-gray-500">{a.user?.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${scopeBadgeClass[scope.type]}`}>
                          {scope.type}
                        </span>
                        <p className="text-sm text-gray-700 mt-1">{scope.name}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {VOLUNTEER_PERMISSIONS.map((p) => {
                            const checked = !!a[p.key];
                            const isUpdating = updatingPermission === `${a.id}-${p.key}`;
                            return (
                              <Tooltip key={p.key} content={checked ? p.tooltip : `Grant: ${p.tooltip}`} position="top">
                                <button
                                  onClick={() => togglePermission(a.id, p.key, !checked)}
                                  disabled={isUpdating}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                                    checked
                                      ? "bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700"
                                      : "border border-dashed border-gray-300 text-gray-400 hover:border-emerald-400 hover:text-emerald-600"
                                  }`}
                                >
                                  {isUpdating ? (
                                    <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                                  ) : checked ? (
                                    <X size={10} />
                                  ) : (
                                    <Plus size={10} />
                                  )}
                                  {p.label}
                                </button>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={a.isActive ? "success" : "neutral"} size="sm">
                          {a.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        {a.isActive? (
                          <button
                            onClick={() => removeAssignment(a.id)}
                            disabled={removingId === a.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Deactivate assignment"
                          >
                            {removingId === a.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <X size={14} />
                            )}
                          </button>
                        ):(<Button>delete</Button>)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Pagination ───────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={!pagination.hasPreviousPage}
              onClick={() => fetchAssignments(page - 1)}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              disabled={!pagination.hasNextPage}
              onClick={() => fetchAssignments(page + 1)}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Assign Volunteer Modal ───────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Assign Volunteer"
        subtitle="Choose a volunteer and the scope they should cover."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={saveAssignment} icon={UserPlus}>
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
            placeholder={usersLoading ? "Loading users..." : "Choose a volunteer..."}
            searchPlaceholder="Search by name or email..."
            value={form.userId}
            onChange={(val) => setForm((p) => ({ ...p, userId: val }))}
            options={volunteerUserOptions}
            hint="Only users with the trusted_volunteer role are shown."
          />

          {volunteerUserOptions.length === 0 && !usersLoading && (
            <div className="px-3.5 py-3 rounded-lg text-sm text-amber-700 bg-amber-50 border border-amber-200">
              No volunteers found. Assign the trusted_volunteer role first from the Users page.
            </div>
          )}

          {/* ── Scope selector ─────────────────────────── */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-sm font-semibold text-gray-800">Assignment Scope</p>
              <Tooltip
                content="Venue = one mosque. Area = every mosque in a neighborhood, including ones added later. City = every mosque in a city, including ones added later."
                position="right"
              >
                <Info size={13} className="text-gray-400 cursor-help" />
              </Tooltip>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-3">
              {SCOPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = scopeType === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleScopeTypeChange(opt.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      active ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon size={13} />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {scopeType === "venue" && (
              <SearchableSelect
                label="Venue"
                required
                placeholder={venuesLoading ? "Loading venues..." : "Search for a venue..."}
                searchPlaceholder="Search by mosque name..."
                value={scopeVenueId}
                onChange={(val) => setScopeVenueId(val)}
                options={venueOptions}
              />
            )}

            {scopeType === "city" && (
              <Select
                label="City"
                required
                placeholder={citiesLoading ? "Loading cities..." : "Select a city"}
                options={citiesList.map((c) => ({ value: c.id, label: c.name }))}
                value={scopeCityId}
                onChange={(e) => handleScopeCityChange(e.target.value)}
                hint="Volunteer will cover every mosque in this city, including ones added later."
              />
            )}

            {scopeType === "area" && (
              <div className="flex flex-col gap-3">
                <Select
                  label="City"
                  required
                  placeholder={citiesLoading ? "Loading cities..." : "Select a city first"}
                  options={citiesList.map((c) => ({ value: c.id, label: c.name }))}
                  value={scopeCityId}
                  onChange={(e) => handleScopeCityChange(e.target.value)}
                />
                <Select
                  label="Area"
                  required
                  placeholder={
                    !scopeCityId ? "Select a city first" : areasLoading ? "Loading areas..." : "Select an area"
                  }
                  options={areasList.map((a) => ({ value: a.id, label: a.name }))}
                  value={scopeAreaId}
                  onChange={(e) => setScopeAreaId(e.target.value)}
                  hint="Volunteer will cover every mosque in this area, including ones added later."
                />
              </div>
            )}
          </div>

          <CardDivider />

          {/* ── Permissions ────────────────────────────── */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-3">Permissions</p>
            <div className="flex flex-col gap-2">
              {VOLUNTEER_PERMISSIONS.map((p) => (
                <label
                  key={p.key}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-800">{p.label}</span>
                    <Tooltip content={p.tooltip} position="top">
                      <Info size={12} className="text-gray-300 cursor-help" />
                    </Tooltip>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!form[p.key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [p.key]: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}