// src/app/admin/venues/page.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  MapPin,
  Search,
  Filter,
  ExternalLink,
  Building2,
  RefreshCw,
  Eye,
  Edit,
} from "lucide-react";
import { api } from "@/lib/api";
import { VENUE_TYPES } from "@/lib/constants";
import PageHeader from "@/components/shared/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import Badge, { VerificationBadge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import { notify } from "@/lib/toast";
import LocationPicker from "@/components/ui/LocationPicker";

const venueTypeOptions = Object.entries(VENUE_TYPES).map(([value, label]) => ({
  value,
  label,
}));

const verificationOptions = [
  { value: "verified", label: "Verified" },
  { value: "community_updated", label: "Community Updated" },
  { value: "needs_update", label: "Needs Update" },
  { value: "pending_review", label: "Pending Review" },
];

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

const emptyVenueForm = {
  name: "",
  alternateNames: "",
  venueType: "masjid",
  countryId: "",
  stateId: "",
  cityId: "",
  areaId: "",
  address: "",
  pincode: "",
  latitude: "",
  longitude: "",
  googleMapsLink: "",
  phone: "",
  timezone: "Asia/Kolkata",
  womenPrayerSpace: "unknown",
  wuduFacility: "unknown",
  parking: "unknown",
  defaultKhutbahLanguage: "",
  facilityNotes: "",
  importantNotice: "",
  isPublic: false,
  verificationStatus: "pending_review",
};

export default function VenuesPage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyVenueForm);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Location dropdowns
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);

  const [assignedVenueIds, setAssignedVenueIds] = useState(new Set());

  // ── Fetch venues ────────────────────────────────────────
  const fetchVenues = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/venues?limit=100";
      if (search) url += `&search=${search}`;
      if (filterType) url += `&venueType=${filterType}`;
      if (filterStatus) url += `&verificationStatus=${filterStatus}`;

      const [venuesRes, assignmentsRes] = await Promise.all([
        api.get(url),
        api.get("/admin/venue-admin-assignments?isActive=true"),
      ]);

      setVenues(venuesRes.data || []);
      setAssignedVenueIds(
        new Set((assignmentsRes.data || []).map((a) => a.venueId)),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterStatus]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  // ── Load countries on mount ─────────────────────────────
  useEffect(() => {
    api.get("/locations/countries").then((r) => setCountries(r.data || []));
  }, []);

  // ── Cascade dropdowns ───────────────────────────────────
  useEffect(() => {
    if (form.countryId) {
      api
        .get(`/locations/states?countryId=${form.countryId}`)
        .then((r) => setStates(r.data || []));
      setForm((p) => ({ ...p, stateId: "", cityId: "", areaId: "" }));
      setCities([]);
      setAreas([]);
    }
  }, [form.countryId]);

  useEffect(() => {
    if (form.stateId) {
      api
        .get(`/locations/cities?stateId=${form.stateId}`)
        .then((r) => setCities(r.data || []));
      setForm((p) => ({ ...p, cityId: "", areaId: "" }));
      setAreas([]);
    }
  }, [form.stateId]);

  useEffect(() => {
    if (form.cityId) {
      api
        .get(`/locations/areas?cityId=${form.cityId}`)
        .then((r) => setAreas(r.data || []));
      setForm((p) => ({ ...p, areaId: "" }));
    }
  }, [form.cityId]);

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  }

  function openModal() {
    setForm(emptyVenueForm);
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit() {
    setError("");
    if (!form.name?.trim()) {
      setError("Venue name is required.");
      return;
    }
    if (!form.countryId) {
      setError("Please select a country.");
      return;
    }
    if (!form.stateId) {
      setError("Please select a state.");
      return;
    }
    if (!form.cityId) {
      setError("Please select a city.");
      return;
    }
    if (!form.address?.trim()) {
      setError("Address is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        areaId: form.areaId || undefined,
        alternateNames: form.alternateNames
          ? form.alternateNames
              .split(",")
              .map((name) => name.trim())
              .filter(Boolean)
          : [],
        phone: form.phone || undefined,
        googleMapsLink: form.googleMapsLink || undefined,
        facilityNotes: form.facilityNotes || undefined,
        importantNotice: form.importantNotice || undefined,
        defaultKhutbahLanguage: form.defaultKhutbahLanguage || undefined,
      };
      await api.post("/venues", payload);
      notify.success("Venue added successfully");
      setModalOpen(false);
      fetchVenues();
    } catch (err) {
      const msg = err.message || "Failed to save venue.";
      setError(msg);
      notify.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Venues"
        subtitle="Manage all mosque and prayer venue records."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Venues" },
        ]}
        actions={
          <>
            <Button icon={Plus} onClick={openModal}>
              Add Venue
            </Button>
            <Link href="/admin/venues/new">
              <Button icon={Plus}>Add Venue with timings</Button>
            </Link>
          </>
        }
      />

      {/* ── Filters ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            placeholder="Search venues..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          placeholder="All types"
          options={venueTypeOptions}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          containerClassName="w-44"
        />
        <Select
          placeholder="All statuses"
          options={verificationOptions}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          containerClassName="w-48"
        />
        <button
          onClick={fetchVenues}
          className="p-2.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* ── Table ──────────────────────────────────────── */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">All Venues</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {venues.length} {venues.length === 1 ? "venue" : "venues"} found
            </p>
          </div>
        </div>

        {loading ? (
          <PageLoader />
        ) : venues.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No venues found"
            description="Add your first mosque or prayer venue to get started."
            action={openModal}
            actionLabel="Add Venue"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    "Venue",
                    "Type",
                    "Location",
                    "Status",
                    "Admin",
                    "Public",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {venues.map((venue) => (
                  <tr
                    key={venue.id}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    {/* Venue name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                          <Building2 size={15} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {venue.name}
                          </p>
                          {venue.alternateNames && (
                            <p className="text-xs text-gray-400">
                              {venue.alternateNames}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-4">
                      <Badge variant="neutral" size="sm">
                        {VENUE_TYPES[venue.venueType] || venue.venueType}
                      </Badge>
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin
                          size={13}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <span className="truncate max-w-[180px]">
                          {[venue.area?.name, venue.city?.name]
                            .filter(Boolean)
                            .join(", ") ||
                            venue.address ||
                            "—"}
                        </span>
                      </div>
                    </td>

                    {/* Verification status */}
                    <td className="px-5 py-4">
                      <VerificationBadge
                        status={venue.verificationStatus}
                        size="sm"
                      />
                    </td>
                    {/* Admin assignment */}
                    <td className="px-5 py-4">
                      {assignedVenueIds.has(venue.id) ? (
                        <Badge variant="success" size="sm" dot>
                          Assigned
                        </Badge>
                      ) : (
                        <Badge variant="danger" size="sm" dot>
                          Unassigned
                        </Badge>
                      )}
                    </td>

                    {/* Public */}
                    <td className="px-5 py-4">
                      <Badge
                        variant={venue.isPublic ? "success" : "neutral"}
                        size="sm"
                        dot
                      >
                        {venue.isPublic ? "Public" : "Hidden"}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/venues/${venue.id}`}>
                          <button className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                            <Eye size={15} />
                          </button>
                        </Link>
                        {venue.googleMapsLink && (
                          <a
                            href={venue.googleMapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <button className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                              <ExternalLink size={15} />
                            </button>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Add Venue Modal ─────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Venue"
        subtitle="Fill in the mosque or prayer venue details."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleSubmit}>
              Save Venue
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

          {/* Section — Basic Info */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Basic Information
            </p>
            <div className="flex flex-col gap-3">
              <Input
                label="Venue Name"
                name="name"
                placeholder="e.g. Masjid Al-Noor"
                required
                value={form.name}
                onChange={handleFormChange}
              />
              <Input
                label="Alternate Name"
                name="alternateNames"
                placeholder="e.g. Al Noor Mosque"
                value={form.alternateNames}
                onChange={handleFormChange}
                hint="Optional"
              />
              <Select
                label="Venue Type"
                name="venueType"
                required
                options={venueTypeOptions}
                value={form.venueType}
                onChange={handleFormChange}
              />
            </div>
          </div>

          {/* Section — Location */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Location
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Country"
                name="countryId"
                required
                placeholder="Select country"
                options={countries.map((c) => ({ value: c.id, label: c.name }))}
                value={form.countryId}
                onChange={handleFormChange}
              />
              <Select
                label="State"
                name="stateId"
                required
                placeholder="Select state"
                options={states.map((s) => ({ value: s.id, label: s.name }))}
                value={form.stateId}
                onChange={handleFormChange}
                disabled={!form.countryId}
              />
              <Select
                label="City"
                name="cityId"
                required
                placeholder="Select city"
                options={cities.map((c) => ({ value: c.id, label: c.name }))}
                value={form.cityId}
                onChange={handleFormChange}
                disabled={!form.stateId}
              />
              <Select
                label="Area"
                name="areaId"
                placeholder="Select area"
                options={areas.map((a) => ({ value: a.id, label: a.name }))}
                value={form.areaId}
                onChange={handleFormChange}
                disabled={!form.cityId}
              />
            </div>
            <div className="mt-3 flex flex-col gap-3">
              <Input
                label="Address"
                name="address"
                placeholder="Full street address"
                required
                value={form.address}
                onChange={handleFormChange}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Pincode"
                  name="pincode"
                  placeholder="e.g. 560076"
                  value={form.pincode}
                  onChange={handleFormChange}
                />
                <Input
                  label="Timezone"
                  name="timezone"
                  placeholder="e.g. Asia/Kolkata"
                  value={form.timezone}
                  onChange={handleFormChange}
                />
              </div>
              <LocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={(updates) =>
                  setForm((prev) => ({
                    ...prev,
                    ...updates,
                  }))
                }
              />
              {/* <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Latitude"
                  name="latitude"
                  placeholder="e.g. 12.9165"
                  value={form.latitude}
                  onChange={handleFormChange}
                />
                <Input
                  label="Longitude"
                  name="longitude"
                  placeholder="e.g. 77.6101"
                  value={form.longitude}
                  onChange={handleFormChange}
                />
              </div> */}
              <Input
                label="Google Maps Link"
                name="googleMapsLink"
                placeholder="https://maps.google.com/..."
                value={form.googleMapsLink}
                onChange={handleFormChange}
              />
            </div>
          </div>

          {/* Section — Facilities */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Facilities
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Women's Prayer Space"
                name="womenPrayerSpace"
                options={womenSpaceOptions}
                value={form.womenPrayerSpace}
                onChange={handleFormChange}
              />
              <Select
                label="Wudu Facility"
                name="wuduFacility"
                options={facilityOptions}
                value={form.wuduFacility}
                onChange={handleFormChange}
              />
              <Select
                label="Parking"
                name="parking"
                options={facilityOptions}
                value={form.parking}
                onChange={handleFormChange}
              />
              <Input
                label="Default Khutbah Language"
                name="defaultKhutbahLanguage"
                placeholder="e.g. Urdu, English"
                value={form.defaultKhutbahLanguage}
                onChange={handleFormChange}
              />
            </div>
            <div className="mt-3 flex flex-col gap-3">
              <Input
                label="Phone"
                name="phone"
                placeholder="Contact number"
                value={form.phone}
                onChange={handleFormChange}
              />
              <Textarea
                label="Facility Notes"
                name="facilityNotes"
                placeholder="Any important notes about facilities..."
                value={form.facilityNotes}
                onChange={handleFormChange}
                rows={2}
              />
              <Textarea
                label="Important Notice"
                name="importantNotice"
                placeholder="Urgent notice for users..."
                value={form.importantNotice}
                onChange={handleFormChange}
                rows={2}
              />
            </div>
          </div>

          {/* Section — Visibility */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Visibility & Verification
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Verification Status"
                name="verificationStatus"
                options={verificationOptions}
                value={form.verificationStatus}
                onChange={handleFormChange}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Visibility
                </label>
                <label className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={form.isPublic}
                    onChange={handleFormChange}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <span className="text-sm text-gray-700">
                    Make venue public
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
