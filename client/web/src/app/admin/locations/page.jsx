// src/app/admin/locations/page.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, MapPin, Globe, Building, Map, Trash2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import PageHeader from "@/components/shared/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardHeader } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import Badge from "@/components/ui/Badge";

// ── Tab config ────────────────────────────────────────────
const tabs = [
  { key: "countries", label: "Countries", icon: Globe },
  { key: "states", label: "States", icon: Map },
  { key: "cities", label: "Cities", icon: Building },
  { key: "areas", label: "Areas", icon: MapPin },
];

// ── Empty form states ─────────────────────────────────────
const emptyForms = {
  countries: { name: "", countryCode: "" },
  states: { name: "", countryId: "" },
  cities: { name: "", stateId: "", timezone: "" },
  areas: { name: "", cityId: "" },
};

export default function LocationsPage() {
  const [activeTab, setActiveTab] = useState("countries");
  const [data, setData] = useState({
    countries: [], states: [], cities: [], areas: [],
  });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForms.countries);

  // For dependent dropdowns
  const [filterCountryId, setFilterCountryId] = useState("");
  const [filterStateId, setFilterStateId] = useState("");
  const [filterCityId, setFilterCityId] = useState("");

  // ── Fetch data ──────────────────────────────────────────
  const fetchData = useCallback(async (tab) => {
    setLoading(true);
    try {
      let url = "";
      if (tab === "countries") url = "/locations/countries";
      if (tab === "states") url = `/locations/states${filterCountryId ? `?countryId=${filterCountryId}` : ""}`;
      if (tab === "cities") url = `/locations/cities${filterStateId ? `?stateId=${filterStateId}` : ""}`;
      if (tab === "areas") url = `/locations/areas${filterCityId ? `?cityId=${filterCityId}` : ""}`;

      const res = await api.get(url);
      setData((prev) => ({ ...prev, [tab]: res.data || [] }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterCountryId, filterStateId, filterCityId]);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  // Also fetch countries/states/cities for dropdowns
  useEffect(() => {
    api.get("/locations/countries").then((r) => setData((p) => ({ ...p, countries: r.data || [] })));
  }, []);

  useEffect(() => {
    if (filterCountryId) {
      api.get(`/locations/states?countryId=${filterCountryId}`)
        .then((r) => setData((p) => ({ ...p, states: r.data || [] })));
    }
  }, [filterCountryId]);

  useEffect(() => {
    if (filterStateId) {
      api.get(`/locations/cities?stateId=${filterStateId}`)
        .then((r) => setData((p) => ({ ...p, cities: r.data || [] })));
    }
  }, [filterStateId]);

  // ── Handle tab change ───────────────────────────────────
  function handleTabChange(tab) {
    setActiveTab(tab);
    setForm(emptyForms[tab]);
    setError("");
  }

  // ── Handle form change ──────────────────────────────────
  function handleFormChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  // ── Open modal ──────────────────────────────────────────
  function openModal() {
    setForm(emptyForms[activeTab]);
    setError("");
    setModalOpen(true);
  }

  // ── Submit ──────────────────────────────────────────────
  async function handleSubmit() {
    setError("");

    // Validation
    if (!form.name?.trim()) {
      setError("Name is required.");
      return;
    }
    if (activeTab === "countries" && !form.countryCode?.trim()) {
      setError("Country code is required.");
      return;
    }
    if (activeTab === "states" && !form.countryId) {
      setError("Please select a country.");
      return;
    }
    if (activeTab === "cities" && !form.stateId) {
      setError("Please select a state.");
      return;
    }
    if (activeTab === "areas" && !form.cityId) {
      setError("Please select a city.");
      return;
    }

    setSaving(true);
    try {
      const endpoints = {
        countries: "/locations/countries",
        states: "/locations/states",
        cities: "/locations/cities",
        areas: "/locations/areas",
      };
      await api.post(endpoints[activeTab], form);
      setModalOpen(false);
      fetchData(activeTab);
    } catch (err) {
      setError(err.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Current tab data ────────────────────────────────────
  const currentData = data[activeTab] || [];

  // ── Column config per tab ───────────────────────────────
  const columns = {
    countries: [
      { label: "Country Name", render: (r) => r.name },
      { label: "Code", render: (r) => <Badge variant="neutral" size="sm">{r.countryCode}</Badge> },
      { label: "States", render: (r) => <span className="text-gray-500 text-sm">{r._count?.states ?? "—"}</span> },
    ],
    states: [
      { label: "State Name", render: (r) => r.name },
      { label: "Country", render: (r) => <span className="text-gray-500 text-sm">{r.country?.name || "—"}</span> },
      { label: "Cities", render: (r) => <span className="text-gray-500 text-sm">{r._count?.cities ?? "—"}</span> },
    ],
    cities: [
      { label: "City Name", render: (r) => r.name },
      { label: "State", render: (r) => <span className="text-gray-500 text-sm">{r.state?.name || "—"}</span> },
      { label: "Timezone", render: (r) => <Badge variant="info" size="sm">{r.timezone || "—"}</Badge> },
    ],
    areas: [
      { label: "Area Name", render: (r) => r.name },
      { label: "City", render: (r) => <span className="text-gray-500 text-sm">{r.city?.name || "—"}</span> },
    ],
  };

  // ── Modal form per tab ───────────────────────────────────
  function renderForm() {
    const countryOptions = data.countries.map((c) => ({ value: c.id, label: c.name }));
    const stateOptions = data.states.map((s) => ({ value: s.id, label: s.name }));
    const cityOptions = data.cities.map((c) => ({ value: c.id, label: c.name }));

    return (
      <div className="flex flex-col gap-4">
        {error && (
          <div className="px-3.5 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">
            ⚠ {error}
          </div>
        )}

        {activeTab === "countries" && (
          <>
            <Input label="Country Name" name="name" placeholder="e.g. India" required value={form.name} onChange={handleFormChange} />
            <Input label="Country Code" name="countryCode" placeholder="e.g. IN" required value={form.countryCode} onChange={handleFormChange} hint="2-letter ISO country code" />
          </>
        )}

        {activeTab === "states" && (
          <>
            <Select
              label="Country" name="countryId" required
              placeholder="Select country"
              options={countryOptions}
              value={form.countryId}
              onChange={handleFormChange}
            />
            <Input label="State Name" name="name" placeholder="e.g. Karnataka" required value={form.name} onChange={handleFormChange} />
          </>
        )}

        {activeTab === "cities" && (
          <>
            <Select
              label="Country" name="countryId"
              placeholder="Select country first"
              options={countryOptions}
              value={form.countryId || ""}
              onChange={(e) => {
                setFilterCountryId(e.target.value);
                setForm((p) => ({ ...p, countryId: e.target.value, stateId: "" }));
              }}
            />
            <Select
              label="State" name="stateId" required
              placeholder="Select state"
              options={stateOptions}
              value={form.stateId}
              onChange={handleFormChange}
            />
            <Input label="City Name" name="name" placeholder="e.g. Bengaluru" required value={form.name} onChange={handleFormChange} />
            <Input label="Timezone" name="timezone" placeholder="e.g. Asia/Kolkata" value={form.timezone} onChange={handleFormChange} hint="Optional but recommended" />
          </>
        )}

        {activeTab === "areas" && (
          <>
            <Select
              label="Country" name="countryId"
              placeholder="Select country first"
              options={countryOptions}
              value={form.countryId || ""}
              onChange={(e) => {
                setFilterCountryId(e.target.value);
                setForm((p) => ({ ...p, countryId: e.target.value, stateId: "", cityId: "" }));
              }}
            />
            <Select
              label="State" name="stateId"
              placeholder="Select state"
              options={stateOptions}
              value={form.stateId || ""}
              onChange={(e) => {
                setFilterStateId(e.target.value);
                setForm((p) => ({ ...p, stateId: e.target.value, cityId: "" }));
              }}
            />
            <Select
              label="City" name="cityId" required
              placeholder="Select city"
              options={cityOptions}
              value={form.cityId}
              onChange={handleFormChange}
            />
            <Input label="Area Name" name="name" placeholder="e.g. BTM Layout" required value={form.name} onChange={handleFormChange} />
          </>
        )}
      </div>
    );
  }

  const activeTabConfig = tabs.find((t) => t.key === activeTab);

  return (
    <div>
      <PageHeader
        title="Location Management"
        subtitle="Manage the location hierarchy used across all mosque and venue records."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Locations" },
        ]}
        actions={
          <Button icon={Plus} onClick={openModal}>
            Add {activeTabConfig?.label.slice(0, -1)}
          </Button>
        }
      />

      {/* ── Tabs ───────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-xl p-1.5 border border-gray-200 w-fit shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              <Icon size={15} />
              {tab.label}
              {data[tab.key]?.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${isActive ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {data[tab.key].length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Table ──────────────────────────────────────── */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {activeTabConfig?.label}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {currentData.length} {currentData.length === 1 ? "record" : "records"} found
            </p>
          </div>
          <button
            onClick={() => fetchData(activeTab)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {loading ? (
          <PageLoader />
        ) : currentData.length === 0 ? (
          <EmptyState
            icon={activeTabConfig?.icon}
            title={`No ${activeTabConfig?.label.toLowerCase()} yet`}
            description={`Add your first ${activeTabConfig?.label.slice(0, -1).toLowerCase()} to get started.`}
            action={openModal}
            actionLabel={`Add ${activeTabConfig?.label.slice(0, -1)}`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {columns[activeTab].map((col) => (
                    <th
                      key={col.label}
                      className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentData.map((row, i) => (
                  <tr key={row.id || i} className="hover:bg-gray-50 transition-colors">
                    {columns[activeTab].map((col) => (
                      <td key={col.label} className="px-5 py-3.5 text-sm text-gray-900">
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Modal ──────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Add ${activeTabConfig?.label.slice(0, -1)}`}
        subtitle={`Fill in the details to add a new ${activeTabConfig?.label.slice(0, -1).toLowerCase()}.`}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleSubmit}>
              Save
            </Button>
          </div>
        }
      >
        {renderForm()}
      </Modal>
    </div>
  );
}