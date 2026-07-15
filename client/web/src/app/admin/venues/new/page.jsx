// src/app/admin/venues/new/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronLeft, Info, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { VENUE_TYPES } from "@/lib/constants";
import PageHeader from "@/components/shared/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import TimeInput from "@/components/ui/TimeInput";
import { notify } from "@/lib/toast";
import Link from "next/link";
import Toggle from "@/components/ui/Toggle";
import SearchableSelect from "@/components/ui/SearchableSelect";

// ─── Constants ───────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];

const PRAYERS = [
  { name: "fajr", label: "Fajr", arabic: "الفجر" },
  { name: "dhuhr", label: "Dhuhr", arabic: "الظهر" },
  { name: "asr", label: "Asr", arabic: "العصر" },
  { name: "maghrib", label: "Maghrib", arabic: "المغرب" },
  { name: "isha", label: "Isha", arabic: "العشاء" },
];

const VENUE_TYPE_OPTIONS = Object.entries(VENUE_TYPES).map(
  ([value, label]) => ({ value, label }),
);

const VERIFICATION_OPTIONS = [
  { value: "verified", label: "Verified" },
  { value: "community_updated", label: "Community Updated" },
  { value: "needs_update", label: "Needs Update" },
  { value: "pending_review", label: "Pending Review" },
];

const WOMEN_SPACE_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "not_available", label: "Not Available" },
  { value: "jumuah_only", label: "Jumu'ah Only" },
  { value: "ramadan_eid_only", label: "Ramadan / Eid Only" },
  { value: "unknown", label: "Unknown" },
];

const FACILITY_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "not_available", label: "Not Available" },
  { value: "limited", label: "Limited" },
  { value: "unknown", label: "Unknown" },
];

// ─── Default prayer timing row ────────────────────────────────────────────────

function emptyPrayerRow(prayerName) {
  return {
    enabled: false,
    prayerName,
    azaanTime: "",
    jamaahTime: "",
    timingType: "fixed",
    relativeTimeText: "",
    verificationStatus: "verified",
    sourceNote: "",
    effectiveFrom: TODAY,
  };
}

function emptyJumuahSlot(slotNumber) {
  return {
    slotNumber,
    azaanTime: "",
    khutbahTime: "",
    jamaahTime: "",
    khutbahLanguage: "",
    womenPrayerSpace: "unknown",
    importantNotice: "",
    verificationStatus: "verified",
    sourceNote: "",
    effectiveFrom: TODAY,
  };
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function FormSection({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Prayer timing row ────────────────────────────────────────────────────────

function PrayerRow({ prayer, data, onChange }) {
  function handleChange(field, value) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        data.enabled
          ? "border-gray-200 bg-white"
          : "border-gray-100 bg-gray-50 opacity-50"
      }`}
    >
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <Toggle
          checked={data.enabled}
          onChange={(val) => handleChange("enabled", val)}
        />
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-semibold text-gray-900">
            {prayer.label}
          </span>
          <span className="text-xs text-gray-400 font-arabic">
            {prayer.arabic}
          </span>
        </div>
        {!data.enabled && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            Not offered
          </span>
        )}
      </div>

      {/* Row fields — only shown when enabled */}
      {data.enabled && (
        <div className="px-4 py-4 flex flex-col gap-3">
          {/* Azaan + Jamaah times */}
          <div className="grid grid-cols-2 gap-3">
            <TimeInput
              label="Azaan Time"
              name="azaanTime"
              value={data.azaanTime}
              onChange={(e) => handleChange("azaanTime", e.target.value)}
              hint="Optional"
            />
            {data.timingType === "fixed" ? (
              <TimeInput
                label="Jamā'ah Time"
                name="jamaahTime"
                value={data.jamaahTime}
                onChange={(e) => handleChange("jamaahTime", e.target.value)}
                required
              />
            ) : (
              <Input
                label="Relative Description"
                placeholder="e.g. 5 mins after sunset"
                value={data.relativeTimeText}
                onChange={(e) =>
                  handleChange("relativeTimeText", e.target.value)
                }
                required
              />
            )}
          </div>

          {/* Type toggle — only show for Maghrib typically, but available for all */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`timingType_${prayer.name}`}
                value="fixed"
                checked={data.timingType === "fixed"}
                onChange={() => handleChange("timingType", "fixed")}
                className="accent-emerald-600 w-3.5 h-3.5"
              />
              <span className="text-xs text-gray-600">Fixed time</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`timingType_${prayer.name}`}
                value="relative"
                checked={data.timingType === "relative"}
                onChange={() => handleChange("timingType", "relative")}
                className="accent-emerald-600 w-3.5 h-3.5"
              />
              <span className="text-xs text-gray-600">
                Relative (e.g. after sunset)
              </span>
            </label>
          </div>

          {/* Source note — collapsed by default, light field */}
          <Input
            label="Source Note"
            placeholder="e.g. Confirmed from timing board"
            value={data.sourceNote}
            onChange={(e) => handleChange("sourceNote", e.target.value)}
            hint="Optional"
          />
        </div>
      )}
    </div>
  );
}

// ─── Jumu'ah slot card ────────────────────────────────────────────────────────

function JumuahSlotCard({ slot, index, onChange, onRemove, canRemove }) {
  function handleChange(field, value) {
    onChange(index, { ...slot, [field]: value });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Slot {slot.slotNumber}
          </span>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3">
          <TimeInput
            label="Azaan Time"
            value={slot.azaanTime}
            onChange={(e) => handleChange("azaanTime", e.target.value)}
            hint="Optional"
          />
          <TimeInput
            label="Khutbah Time"
            value={slot.khutbahTime}
            onChange={(e) => handleChange("khutbahTime", e.target.value)}
            hint="Optional"
          />
          <TimeInput
            label="Jamā'ah Time"
            value={slot.jamaahTime}
            onChange={(e) => handleChange("jamaahTime", e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Khutbah Language"
            placeholder="e.g. Urdu, English"
            value={slot.khutbahLanguage}
            onChange={(e) => handleChange("khutbahLanguage", e.target.value)}
          />
          <Select
            label="Women's Prayer Space"
            options={WOMEN_SPACE_OPTIONS}
            value={slot.womenPrayerSpace}
            onChange={(e) => handleChange("womenPrayerSpace", e.target.value)}
          />
        </div>
        <Textarea
          label="Important Notice"
          placeholder="e.g. Arrive early due to crowding."
          value={slot.importantNotice}
          onChange={(e) => handleChange("importantNotice", e.target.value)}
          rows={2}
          hint="Optional"
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewVenuePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Venue fields
  const [venue, setVenue] = useState({
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
  });

  // Prayer timings — all 5 pre-loaded, each togglable
  const [prayers, setPrayers] = useState(
    PRAYERS.map((p) => emptyPrayerRow(p.name)),
  );

  // Jumu'ah slots — start with one, can add more
  const [jumuahSlots, setJumuahSlots] = useState([emptyJumuahSlot(1)]);
  const [hasJumuah, setHasJumuah] = useState(true);

  // Location cascades
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    api.get("/locations/countries").then((r) => setCountries(r.data || []));
  }, []);

  useEffect(() => {
    if (venue.countryId) {
      api
        .get(`/locations/states?countryId=${venue.countryId}`)
        .then((r) => setStates(r.data || []));
      setVenue((p) => ({ ...p, stateId: "", cityId: "", areaId: "" }));
      setCities([]);
      setAreas([]);
    }
  }, [venue.countryId]);

  useEffect(() => {
    if (venue.stateId) {
      api
        .get(`/locations/cities?stateId=${venue.stateId}`)
        .then((r) => setCities(r.data || []));
      setVenue((p) => ({ ...p, cityId: "", areaId: "" }));
      setAreas([]);
    }
  }, [venue.stateId]);

  useEffect(() => {
    if (venue.cityId) {
      api
        .get(`/locations/areas?cityId=${venue.cityId}`)
        .then((r) => setAreas(r.data || []));
      setVenue((p) => ({ ...p, areaId: "" }));
    }
  }, [venue.cityId]);

  function handleVenueChange(e) {
    const { name, value, type, checked } = e.target;
    setVenue((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  function handlePrayerChange(index, updated) {
    setPrayers((prev) => prev.map((p, i) => (i === index ? updated : p)));
  }

  function handleJumuahChange(index, updated) {
    setJumuahSlots((prev) => prev.map((s, i) => (i === index ? updated : s)));
  }

  function addJumuahSlot() {
    setJumuahSlots((prev) => [...prev, emptyJumuahSlot(prev.length + 1)]);
  }

  function removeJumuahSlot(index) {
    setJumuahSlots((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, slotNumber: i + 1 })),
    );
  }

  // ── Validation ────────────────────────────────────────────────────────────

  function validate() {
    const errs = {};
    if (!venue.name.trim()) errs.name = "Venue name is required.";
    if (!venue.countryId) errs.countryId = "Country is required.";
    if (!venue.stateId) errs.stateId = "State is required.";
    if (!venue.cityId) errs.cityId = "City is required.";
    if (!venue.address.trim()) errs.address = "Address is required.";

    // Each enabled prayer must have a jamaah time (if fixed) or relativeTimeText (if relative)
    prayers.forEach((p, i) => {
      if (!p.enabled) return;
      if (p.timingType === "fixed" && !p.jamaahTime) {
        errs[`prayer_jamaah_${i}`] =
          `${PRAYERS[i].label} Jamā'ah time is required.`;
      }
      if (p.timingType === "relative" && !p.relativeTimeText.trim()) {
        errs[`prayer_relative_${i}`] =
          `${PRAYERS[i].label} relative description is required.`;
      }
    });

    // Each Jumu'ah slot must have a jamaah time
    if (hasJumuah) {
      jumuahSlots.forEach((s, i) => {
        if (!s.jamaahTime) {
          errs[`jumuah_jamaah_${i}`] =
            `Slot ${s.slotNumber} Jamā'ah time is required.`;
        }
      });
    }

    return errs;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Surface a single toast summarising what's wrong
      const first = Object.values(errs)[0];
      notify.error(first);
      return;
    }

    setSaving(true);
    try {
      // 1. Create venue
      const venuePayload = {
        ...venue,
        latitude: venue.latitude ? parseFloat(venue.latitude) : undefined,
        longitude: venue.longitude ? parseFloat(venue.longitude) : undefined,
        areaId: venue.areaId || undefined,
        alternateNames: venue.alternateNames
          ? venue.alternateNames
              .split(",")
              .map((n) => n.trim())
              .filter(Boolean)
          : [],
        phone: venue.phone || undefined,
        googleMapsLink: venue.googleMapsLink || undefined,
        facilityNotes: venue.facilityNotes || undefined,
        importantNotice: venue.importantNotice || undefined,
        defaultKhutbahLanguage: venue.defaultKhutbahLanguage || undefined,
      };

      const venueRes = await api.post("/venues", venuePayload);
      const venueId = venueRes.data.id;

      // 2. Create daily timings for each enabled prayer (sequential to avoid race)
      const enabledPrayers = prayers.filter((p) => p.enabled);
      for (const p of enabledPrayers) {
        const timingPayload = {
          prayerName: p.prayerName,
          azaanTime: p.azaanTime || undefined,
          jamaahTime: p.timingType === "fixed" ? p.jamaahTime : undefined,
          timingType: p.timingType,
          relativeTimeText:
            p.timingType === "relative" ? p.relativeTimeText : undefined,
          effectiveFrom: new Date(p.effectiveFrom).toISOString(),
          verificationStatus: p.verificationStatus,
          sourceNote: p.sourceNote || undefined,
        };
        await api.post(`/venues/${venueId}/daily-timings`, timingPayload);
      }

      // 3. Create Jumu'ah slots if enabled
      if (hasJumuah) {
        for (const s of jumuahSlots) {
          const jumuahPayload = {
            slotNumber: s.slotNumber,
            azaanTime: s.azaanTime || undefined,
            khutbahTime: s.khutbahTime || undefined,
            jamaahTime: s.jamaahTime,
            khutbahLanguage: s.khutbahLanguage || undefined,
            womenPrayerSpace: s.womenPrayerSpace,
            importantNotice: s.importantNotice || undefined,
            effectiveFrom: new Date(s.effectiveFrom).toISOString(),
            verificationStatus: s.verificationStatus,
            sourceNote: s.sourceNote || undefined,
          };
          await api.post(`/venues/${venueId}/jumuah-timings`, jumuahPayload);
        }
      }

      notify.success("Mosque added successfully");
      router.push(`/admin/venues/${venueId}`);
    } catch (err) {
      notify.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Derived state for summary pill ────────────────────────────────────────

  const enabledCount = prayers.filter((p) => p.enabled).length;
  const filledCount = prayers.filter(
    (p) =>
      p.enabled &&
      (p.timingType === "fixed" ? p.jamaahTime : p.relativeTimeText),
  ).length;

  return (
    <div>
      <PageHeader
        title="Add New Mosque"
        subtitle="Enter venue details and prayer timings in one step."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Venues", href: "/admin/venues" },
          { label: "Add New" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/venues">
              <Button variant="secondary" icon={ChevronLeft}>
                Cancel
              </Button>
            </Link>
            <Button loading={saving} onClick={handleSave} icon={CheckCircle2}>
              {saving ? "Saving..." : "Save Venue"}
            </Button>
          </div>
        }
      />

      {/* ── Validation error summary ─────────────────────────────────────── */}
      {Object.keys(errors).length > 0 && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
          <span className="text-red-500 mt-0.5 flex-shrink-0">⚠</span>
          <div>
            <p className="text-sm font-semibold text-red-700">
              Please fix the following:
            </p>
            <ul className="mt-1 space-y-0.5">
              {Object.values(errors).map((msg, i) => (
                <li key={i} className="text-xs text-red-600">
                  {msg}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_520px] gap-6 items-start">
        {/* ── LEFT COLUMN — Venue info ──────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {/* Basic info */}
          <FormSection
            title="Basic Information"
            subtitle="Name, type, and identity of the mosque or prayer venue."
          >
            <div className="flex flex-col gap-3">
              <Input
                label="Mosque Name"
                name="name"
                placeholder="e.g. Masjid Al-Noor"
                required
                value={venue.name}
                onChange={handleVenueChange}
                error={errors.name}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Alternate Name"
                  name="alternateNames"
                  placeholder="e.g. Al Noor Mosque"
                  value={venue.alternateNames}
                  onChange={handleVenueChange}
                  hint="Optional · separate multiple with comma"
                />
                <Select
                  label="Venue Type"
                  name="venueType"
                  required
                  options={VENUE_TYPE_OPTIONS}
                  value={venue.venueType}
                  onChange={handleVenueChange}
                />
              </div>
            </div>
          </FormSection>

          {/* Location */}
          <FormSection
            title="Location"
            subtitle="Where this mosque is situated."
          >
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <SearchableSelect
                  label="Country"
                  required
                  placeholder="Select country"
                  searchPlaceholder="Search countries..."
                  options={countries.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                  value={venue.countryId}
                  onChange={(val) => {
                    setVenue((p) => ({
                      ...p,
                      countryId: val,
                      stateId: "",
                      cityId: "",
                      areaId: "",
                    }));
                  }}
                  error={errors.countryId}
                />
                <SearchableSelect
                  label="State"
                  required
                  placeholder="Select state"
                  searchPlaceholder="Search states..."
                  options={states.map((s) => ({ value: s.id, label: s.name }))}
                  value={venue.stateId}
                  onChange={(val) => {
                    setVenue((p) => ({
                      ...p,
                      stateId: val,
                      cityId: "",
                      areaId: "",
                    }));
                  }}
                  disabled={!venue.countryId}
                  error={errors.stateId}
                />
                <SearchableSelect
                  label="City"
                  required
                  placeholder="Select city"
                  searchPlaceholder="Search cities..."
                  options={cities.map((c) => ({ value: c.id, label: c.name }))}
                  value={venue.cityId}
                  onChange={(val) => {
                    setVenue((p) => ({ ...p, cityId: val, areaId: "" }));
                  }}
                  disabled={!venue.stateId}
                  error={errors.cityId}
                />
                <SearchableSelect
                  label="Area"
                  placeholder="Select area"
                  searchPlaceholder="Search areas..."
                  options={areas.map((a) => ({ value: a.id, label: a.name }))}
                  value={venue.areaId}
                  onChange={(val) => setVenue((p) => ({ ...p, areaId: val }))}
                  disabled={!venue.cityId}
                />
              </div>
              <Input
                label="Address"
                name="address"
                placeholder="Full street address"
                required
                value={venue.address}
                onChange={handleVenueChange}
                error={errors.address}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Pincode"
                  name="pincode"
                  placeholder="e.g. 560076"
                  value={venue.pincode}
                  onChange={handleVenueChange}
                />
                <Input
                  label="Phone"
                  name="phone"
                  placeholder="Contact number"
                  value={venue.phone}
                  onChange={handleVenueChange}
                  hint="Optional"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Latitude"
                  name="latitude"
                  placeholder="e.g. 12.9165"
                  value={venue.latitude}
                  onChange={handleVenueChange}
                />
                <Input
                  label="Longitude"
                  name="longitude"
                  placeholder="e.g. 77.6101"
                  value={venue.longitude}
                  onChange={handleVenueChange}
                />
              </div>
              <Input
                label="Google Maps Link"
                name="googleMapsLink"
                placeholder="https://maps.google.com/..."
                value={venue.googleMapsLink}
                onChange={handleVenueChange}
                hint="Optional"
              />
            </div>
          </FormSection>

          {/* Facilities */}
          <FormSection
            title="Facilities"
            subtitle="Help users understand what's available at this mosque."
          >
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Women's Prayer Space"
                  name="womenPrayerSpace"
                  options={WOMEN_SPACE_OPTIONS}
                  value={venue.womenPrayerSpace}
                  onChange={handleVenueChange}
                />
                <Select
                  label="Wudu Facility"
                  name="wuduFacility"
                  options={FACILITY_OPTIONS}
                  value={venue.wuduFacility}
                  onChange={handleVenueChange}
                />
                <Select
                  label="Parking"
                  name="parking"
                  options={FACILITY_OPTIONS}
                  value={venue.parking}
                  onChange={handleVenueChange}
                />
                <Input
                  label="Khutbah Language"
                  name="defaultKhutbahLanguage"
                  placeholder="e.g. Urdu, English"
                  value={venue.defaultKhutbahLanguage}
                  onChange={handleVenueChange}
                  hint="Optional"
                />
              </div>
              <Textarea
                label="Facility Notes"
                name="facilityNotes"
                placeholder="Any other facility information worth noting..."
                value={venue.facilityNotes}
                onChange={handleVenueChange}
                rows={2}
                hint="Optional — visible to app users"
              />
              <Textarea
                label="Important Notice"
                name="importantNotice"
                placeholder="e.g. Closed for renovation until further notice."
                value={venue.importantNotice}
                onChange={handleVenueChange}
                rows={2}
                hint="Optional — shown prominently to app users"
              />
            </div>
          </FormSection>

          {/* Visibility */}
          <FormSection
            title="Visibility & Verification"
            subtitle="Control whether this venue appears publicly in the app."
          >
            <div className="flex flex-col gap-3">
              <Select
                label="Verification Status"
                name="verificationStatus"
                options={VERIFICATION_OPTIONS}
                value={venue.verificationStatus}
                onChange={handleVenueChange}
              />
              <div className="px-4 py-3 rounded-lg border border-gray-200">
                <Toggle
                  checked={venue.isPublic}
                  onChange={(val) => setVenue((p) => ({ ...p, isPublic: val }))}
                  label="Make venue public"
                  description="When enabled, this mosque will appear in search and discovery for all users."
                />
              </div>
            </div>
          </FormSection>
        </div>

        {/* ── RIGHT COLUMN — Timings ────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {/* Daily prayers */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Daily Prayer Timings
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Toggle off prayers this mosque does not offer.
                </p>
              </div>
              {/* Quick status pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    filledCount === enabledCount && enabledCount > 0
                      ? "bg-emerald-500"
                      : "bg-amber-400"
                  }`}
                />
                <span className="text-xs font-medium text-gray-600">
                  {filledCount}/{enabledCount} filled
                </span>
              </div>
            </div>

            <div className="px-4 py-4 flex flex-col gap-3">
              {PRAYERS.map((prayer, index) => (
                <PrayerRow
                  key={prayer.name}
                  prayer={prayer}
                  data={prayers[index]}
                  onChange={(updated) => handlePrayerChange(index, updated)}
                />
              ))}
            </div>

            {/* Global timing settings */}
            <div className="px-4 pb-4">
              <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 flex flex-col gap-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Timing settings (applies to all)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Verification Status"
                    options={VERIFICATION_OPTIONS}
                    value={prayers[0].verificationStatus}
                    onChange={(e) =>
                      setPrayers((prev) =>
                        prev.map((p) => ({
                          ...p,
                          verificationStatus: e.target.value,
                        })),
                      )
                    }
                  />
                  <Input
                    label="Effective From"
                    type="date"
                    value={prayers[0].effectiveFrom}
                    onChange={(e) =>
                      setPrayers((prev) =>
                        prev.map((p) => ({
                          ...p,
                          effectiveFrom: e.target.value,
                        })),
                      )
                    }
                  />
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Info size={12} />
                  Change verification and effective date per-prayer above if
                  needed.
                </p>
              </div>
            </div>
          </div>

          {/* Jumu'ah section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Jumu'ah Timings
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Friday prayer slots. Add multiple if the mosque runs more than
                  one.
                </p>
              </div>
              <Toggle checked={hasJumuah} onChange={setHasJumuah} />
            </div>

            {hasJumuah ? (
              <div className="px-4 py-4 flex flex-col gap-3">
                {jumuahSlots.map((slot, index) => (
                  <JumuahSlotCard
                    key={index}
                    slot={slot}
                    index={index}
                    onChange={handleJumuahChange}
                    onRemove={removeJumuahSlot}
                    canRemove={jumuahSlots.length > 1}
                  />
                ))}
                <button
                  type="button"
                  onClick={addJumuahSlot}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                >
                  <Plus size={15} />
                  Add another Jumu'ah slot
                </button>
              </div>
            ) : (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-400">
                  Jumu'ah timings are disabled for this mosque.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Toggle above to enable.
                </p>
              </div>
            )}
          </div>

          {/* Save CTA — repeated at bottom of right column for convenience */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Link href="/admin/venues">
              <Button variant="secondary">Cancel</Button>
            </Link>
            <Button loading={saving} onClick={handleSave} icon={CheckCircle2}>
              {saving ? "Saving..." : "Save Venue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
