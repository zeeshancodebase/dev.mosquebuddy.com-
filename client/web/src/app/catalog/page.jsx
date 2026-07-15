// src/app/catalog/page.jsx
// Component Catalog — visual reference for all Sabeel UI components
"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Download,
  Upload,
  Mosque,
  MapPin,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Badge, { VerificationBadge, RoleBadge } from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Card, { CardHeader, CardDivider } from "@/components/ui/Card";
import Spinner, { PageLoader } from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import Tooltip from "@/components/ui/Tooltip";
import Pagination from "@/components/ui/Pagination";
import SearchableSelect from "@/components/ui/SearchableSelect";
import Toggle from "@/components/ui/Toggle";

// ─── Section wrapper ────────────────────────────────────────────────────────
function Section({ title, description, children }) {
  return (
    <section className="mb-12">
      <div className="mb-4 pb-3 border-b border-gray-200">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}

// ─── Preview box ────────────────────────────────────────────────────────────
function Preview({ label, children, bg = "white" }) {
  const bgMap = {
    white: "bg-white",
    surface: "bg-gray-50",
    dark: "bg-gray-900",
  };
  return (
    <div className="mb-4">
      {label && (
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {label}
        </p>
      )}
      <div
        className={`rounded-xl border border-gray-200 p-6 ${bgMap[bg]} flex flex-wrap gap-3 items-center`}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Main catalog ────────────────────────────────────────────────────────────
export default function CatalogPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [selectVal, setSelectVal] = useState("");
  const [textareaVal, setTextareaVal] = useState("");
  const [searchSelectCity, setSearchSelectCity] = useState("");
  const [searchSelectLang, setSearchSelectLang] = useState("");
  const [searchSelectArea, setSearchSelectArea] = useState("");

  const [toggle1, setToggle1] = useState(false);
  const [toggle2, setToggle2] = useState(true);
  const [toggle3, setToggle3] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = 245;
  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Sabeel · Component Catalog
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Visual reference for all UI components used in the admin panel
            </p>
          </div>
          <Badge variant="info" dot>
            Admin Panel
          </Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* ── PAGE HEADER ─────────────────────────────────────── */}
        <Section
          title="PageHeader"
          description="Used at the top of every admin page. Supports title, subtitle, breadcrumbs, and action slot."
        >
          <Preview label="With breadcrumbs + actions" bg="surface">
            <div className="w-full">
              <PageHeader
                title="Mosque Management"
                subtitle="Add, edit, and manage all mosque and prayer venue records."
                breadcrumbs={[
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Venues", href: "/venues" },
                  { label: "Manage" },
                ]}
                actions={
                  <>
                    <Button variant="secondary" size="sm" icon={Download}>
                      Export
                    </Button>
                    <Button size="sm" icon={Plus}>
                      Add Mosque
                    </Button>
                  </>
                }
              />
            </div>
          </Preview>
        </Section>

        {/* ── BUTTONS ─────────────────────────────────────────── */}
        <Section
          title="Button"
          description="Five variants, three sizes, icon support (left/right), loading state, full-width."
        >
          <Preview label="Variants">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="success">Success</Button>
          </Preview>

          <Preview label="Sizes">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </Preview>

          <Preview label="With icons">
            <Button icon={Plus}>Add Mosque</Button>
            <Button icon={Search} variant="secondary">
              Search
            </Button>
            <Button icon={Download} variant="secondary" iconPosition="right">
              Export
            </Button>
            <Button icon={Trash2} variant="danger">
              Delete
            </Button>
          </Preview>

          <Preview label="States">
            <Button loading>Saving...</Button>
            <Button disabled>Disabled</Button>
          </Preview>

          <Preview label="Full width" bg="surface">
            <div className="w-full max-w-sm">
              <Button fullWidth icon={CheckCircle}>
                Save Changes
              </Button>
            </div>
          </Preview>
        </Section>

        {/* ── TOOLTIP ─────────────────────────────────────────── */}
        <Section
          title="Tooltip"
          description="Displays additional contextual information on hover or keyboard focus."
        >
          <Preview label="Wrapped badge">
            <Tooltip content="This timing was confirmed by the mosque admin directly.">
              <VerificationBadge status="verified" />
            </Tooltip>

            <Tooltip content="This mosque needs fresh prayer timings.">
              <VerificationBadge status="needs_update" />
            </Tooltip>

            <Tooltip content="Awaiting review by a super admin.">
              <VerificationBadge status="pending_review" />
            </Tooltip>
          </Preview>

          <Preview label="Different positions">
            <Tooltip content="Appears above the element." position="top">
              <Button variant="secondary">Top</Button>
            </Tooltip>

            <Tooltip content="Appears below the element." position="bottom">
              <Button variant="secondary">Bottom</Button>
            </Tooltip>

            <Tooltip content="Appears on the left." position="left">
              <Button variant="secondary">Left</Button>
            </Tooltip>

            <Tooltip content="Appears on the right." position="right">
              <Button variant="secondary">Right</Button>
            </Tooltip>
          </Preview>

          <Preview label="Info icon">
            <Tooltip
              position="right"
              content="Users with this role can edit timings for assigned mosques."
            >
              <Info
                size={18}
                className="text-gray-400 hover:text-gray-600 cursor-help"
              />
            </Tooltip>
          </Preview>

          <Preview label="Long description">
            <Tooltip content="Enabling this allows the mosque admin to mark timings as Verified without super admin review.">
              <span className="text-xs text-gray-500 underline decoration-dashed cursor-help">
                canMarkVerified
              </span>
            </Tooltip>
          </Preview>

          <Preview label="Inside text">
            <p className="text-sm text-gray-600">
              Prayer timings can be marked{" "}
              <Tooltip content="Verified timings have been confirmed by the mosque administration.">
                <span className="font-medium text-emerald-600 underline decoration-dashed cursor-help">
                  Verified
                </span>
              </Tooltip>{" "}
              after review.
            </p>
          </Preview>

          <Preview label="Delay example">
            <Tooltip
              delay={800}
              content="This tooltip appears after an 800ms delay."
            >
              <Button>Hover me</Button>
            </Tooltip>
          </Preview>
        </Section>

        {/* ── BADGES ──────────────────────────────────────────── */}
        <Section
          title="Badge"
          description="General badges, verification status badges, and role badges."
        >
          <Preview label="General variants">
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="neutral">Neutral</Badge>
          </Preview>

          <Preview label="With dot indicator">
            <Badge variant="success" dot>
              Active
            </Badge>
            <Badge variant="danger" dot>
              Inactive
            </Badge>
            <Badge variant="warning" dot>
              Review
            </Badge>
            <Badge variant="pending" dot>
              Pending
            </Badge>
          </Preview>

          <Preview label="Verification status badges">
            <VerificationBadge status="verified" />
            <VerificationBadge status="community_updated" />
            <VerificationBadge status="needs_update" />
            <VerificationBadge status="pending_review" />
          </Preview>

          <Preview label="Role badges">
            <RoleBadge role="super_admin" />
            <RoleBadge role="mosque_admin" />
            <RoleBadge role="trusted_volunteer" />
            <RoleBadge role="registered_user" />
          </Preview>

          <Preview label="Sizes">
            <Badge size="sm" variant="success" dot>
              Small
            </Badge>
            <Badge size="md" variant="info" dot>
              Medium
            </Badge>
            <Badge size="lg" variant="warning" dot>
              Large
            </Badge>
          </Preview>
        </Section>

        <Section
          title="Toggle"
          description="On/off switch for boolean settings. Two sizes, label and description support, disabled state."
        >
          <Preview label="Standalone (no label)">
            <Toggle checked={toggle1} onChange={setToggle1} />
            <Toggle checked={true} onChange={() => {}} />
            <Toggle checked={false} onChange={() => {}} />
          </Preview>

          <Preview label="With label">
            <Toggle
              checked={toggle2}
              onChange={setToggle2}
              label="Make venue public"
            />
          </Preview>

          <Preview label="With label and description" bg="surface">
            <div className="w-full max-w-sm">
              <Toggle
                checked={toggle3}
                onChange={setToggle3}
                label="Enable Jumu'ah timings"
                description="Show Friday prayer slots for this mosque in the app."
              />
            </div>
          </Preview>

          <Preview label="Sizes">
            <Toggle
              checked={true}
              onChange={() => {}}
              size="sm"
              label="Small"
            />
            <Toggle
              checked={true}
              onChange={() => {}}
              size="md"
              label="Medium"
            />
          </Preview>

          <Preview label="Disabled">
            <Toggle
              checked={false}
              onChange={() => {}}
              disabled
              label="Disabled off"
            />
            <Toggle
              checked={true}
              onChange={() => {}}
              disabled
              label="Disabled on"
            />
          </Preview>

          <Preview
            label="Inside a bordered container (e.g. settings row)"
            bg="surface"
          >
            <div className="w-full max-w-md px-4 py-3 rounded-lg border border-gray-200 bg-white">
              <Toggle
                checked={toggle1}
                onChange={setToggle1}
                label="Make venue public"
                description="When enabled, this mosque appears in search and discovery for all users."
              />
            </div>
          </Preview>
        </Section>

        {/* ── PAGINATION ─────────────────────────────────────────── */}
        <Section
          title="Pagination"
          description="Controls for navigating large datasets with page numbers, next/prev, and summary."
        >
          <Preview label="Default usage">
            <div className="w-full bg-white p-4 rounded-xl border border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={PAGE_SIZE}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </Preview>

          <Preview label="First/Last disabled">
            <div className="w-full bg-white p-4 rounded-xl border border-gray-200">
              <Pagination
                currentPage={3}
                totalPages={10}
                totalItems={200}
                pageSize={20}
                onPageChange={() => {}}
                showFirstLast={false}
              />
            </div>
          </Preview>

          <Preview label="Without summary">
            <div className="w-full bg-white p-4 rounded-xl border border-gray-200">
              <Pagination
                currentPage={5}
                totalPages={12}
                totalItems={240}
                pageSize={20}
                onPageChange={() => {}}
                showSummary={false}
              />
            </div>
          </Preview>

          <Preview label="Single page (hidden)">
            <div className="w-full bg-white p-4 rounded-xl border border-gray-200">
              <Pagination
                currentPage={1}
                totalPages={1}
                totalItems={10}
                pageSize={20}
                onPageChange={() => {}}
              />
              <p className="text-xs text-gray-400 mt-2">
                Hidden automatically when only 1 page exists
              </p>
            </div>
          </Preview>
        </Section>

        {/* ── INPUTS ──────────────────────────────────────────── */}
        <Section
          title="Input"
          description="Text input with label, hint, error, icon support."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Mosque Name"
              placeholder="e.g. Masjid Al-Noor"
              required
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <Input
              label="Search"
              placeholder="Search venues..."
              icon={Search}
            />
            <Input
              label="With hint"
              placeholder="Enter pincode"
              hint="6-digit area pincode"
            />
            <Input
              label="With error"
              placeholder="Enter address"
              error="Address is required"
            />
            <Input
              label="Disabled"
              placeholder="Cannot edit"
              disabled
              value="Bengaluru, Karnataka"
            />
            <Input
              label="Icon right"
              placeholder="Search location..."
              icon={MapPin}
              iconPosition="right"
            />
          </div>
        </Section>

        {/* ── SELECT ──────────────────────────────────────────── */}
        <Section
          title="Select"
          description="Dropdown with label, placeholder, hint, and error."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Venue Type"
              placeholder="Select venue type"
              required
              value={selectVal}
              onChange={(e) => setSelectVal(e.target.value)}
              options={[
                { value: "masjid", label: "Masjid" },
                { value: "musalla", label: "Musalla" },
                { value: "islamic_center", label: "Islamic Center" },
                { value: "prayer_room", label: "Prayer Room" },
              ]}
            />
            <Select
              label="Verification Status"
              placeholder="Select status"
              options={[
                { value: "verified", label: "Verified" },
                { value: "community_updated", label: "Community Updated" },
                { value: "needs_update", label: "Needs Update" },
                { value: "pending_review", label: "Pending Review" },
              ]}
            />
            <Select
              label="With error"
              placeholder="Select country"
              error="Country is required"
              options={[{ value: "in", label: "India" }]}
            />
            <Select
              label="Disabled"
              disabled
              value="in"
              options={[{ value: "in", label: "India" }]}
            />
          </div>
        </Section>

        {/* ── SEARCHABLE SELECT ───────────────────────────────── */}
        <Section
          title="SearchableSelect"
          description="Use instead of Select whenever the option list exceeds ~8 items. Supports search filtering, clear button, keyboard navigation, and empty state."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mosque city picker — long list use case */}
            <SearchableSelect
              label="City"
              placeholder="Select city"
              required
              searchPlaceholder="Search cities..."
              options={[
                { value: "bengaluru", label: "Bengaluru" },
                { value: "mumbai", label: "Mumbai" },
                { value: "delhi", label: "Delhi" },
                { value: "hyderabad", label: "Hyderabad" },
                { value: "chennai", label: "Chennai" },
                { value: "pune", label: "Pune" },
                { value: "kolkata", label: "Kolkata" },
                { value: "ahmedabad", label: "Ahmedabad" },
                { value: "jaipur", label: "Jaipur" },
                { value: "lucknow", label: "Lucknow" },
                { value: "surat", label: "Surat" },
                { value: "nagpur", label: "Nagpur" },
                { value: "bhopal", label: "Bhopal" },
                { value: "patna", label: "Patna" },
                { value: "kochi", label: "Kochi" },
              ]}
              value={searchSelectCity}
              onChange={setSearchSelectCity}
              hint="Select the city where the venue is located."
            />

            {/* Khutbah language picker */}
            <SearchableSelect
              label="Khutbah Language"
              placeholder="Select language"
              searchPlaceholder="Search languages..."
              options={[
                { value: "arabic", label: "Arabic" },
                { value: "urdu", label: "Urdu" },
                { value: "english", label: "English" },
                { value: "hindi", label: "Hindi" },
                { value: "kannada", label: "Kannada" },
                { value: "tamil", label: "Tamil" },
                { value: "malayalam", label: "Malayalam" },
                { value: "telugu", label: "Telugu" },
                { value: "bengali", label: "Bengali" },
                { value: "marathi", label: "Marathi" },
                { value: "gujarati", label: "Gujarati" },
              ]}
              value={searchSelectLang}
              onChange={setSearchSelectLang}
            />

            {/* With error state */}
            <SearchableSelect
              label="State"
              placeholder="Select state"
              required
              error="State is required"
              options={[
                { value: "ka", label: "Karnataka" },
                { value: "mh", label: "Maharashtra" },
                { value: "tn", label: "Tamil Nadu" },
              ]}
              value=""
              onChange={() => {}}
            />

            {/* Disabled */}
            <SearchableSelect
              label="Country (locked for MVP)"
              disabled
              options={[{ value: "in", label: "India" }]}
              value="in"
              onChange={() => {}}
              hint="Multi-country expansion planned post-MVP."
            />
          </div>

          {/* Long list to demonstrate search utility */}
          <div className="mt-4 max-w-sm">
            <SearchableSelect
              label="Area / Locality"
              placeholder="Select area"
              searchPlaceholder="Type to filter areas..."
              emptyMessage="No areas match your search. Try a shorter term."
              options={[
                { value: "btm", label: "BTM Layout" },
                { value: "hsr", label: "HSR Layout" },
                { value: "koramangala", label: "Koramangala" },
                { value: "indiranagar", label: "Indiranagar" },
                { value: "jayanagar", label: "Jayanagar" },
                { value: "jp_nagar", label: "JP Nagar" },
                { value: "banashankari", label: "Banashankari" },
                { value: "electronic_city", label: "Electronic City" },
                { value: "whitefield", label: "Whitefield" },
                { value: "marathahalli", label: "Marathahalli" },
                { value: "hebbal", label: "Hebbal" },
                { value: "yelahanka", label: "Yelahanka" },
                { value: "rajajinagar", label: "Rajajinagar" },
                { value: "malleshwaram", label: "Malleshwaram" },
                { value: "shivajinagar", label: "Shivajinagar" },
                { value: "frazer_town", label: "Frazer Town" },
                { value: "cox_town", label: "Cox Town" },
                { value: "benson_town", label: "Benson Town" },
                { value: "shantinagar", label: "Shantinagar" },
                { value: "basavanagudi", label: "Basavanagudi" },
              ]}
              value={searchSelectArea}
              onChange={setSearchSelectArea}
              hint="Try typing 'layout' or 'nagar' to see search in action."
            />
          </div>
        </Section>

        {/* ── TEXTAREA ────────────────────────────────────────── */}
        <Section
          title="Textarea"
          description="Multi-line input for notes and longer content."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="Facility Notes"
              placeholder="Any important notes about this venue..."
              hint="Visible to all users on the mosque detail page."
              value={textareaVal}
              onChange={(e) => setTextareaVal(e.target.value)}
            />
            <Textarea
              label="With error"
              placeholder="Enter address"
              error="Address cannot be empty"
              rows={3}
            />
          </div>
        </Section>

        {/* ── CARDS ───────────────────────────────────────────── */}
        <Section
          title="Card"
          description="Content container with optional header, divider, and hover state."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader
                title="Masjid Al-Noor"
                subtitle="BTM Layout · Bengaluru"
                action={<VerificationBadge status="verified" />}
              />
              <CardDivider />
              <p className="text-sm text-gray-500">
                Daily and Jumu&apos;ah timings are up to date.
              </p>
            </Card>

            <Card hover>
              <CardHeader
                title="Hoverable Card"
                subtitle="Click or hover to see shadow effect"
              />
              <p className="text-sm text-gray-500">
                Used for list items and clickable records.
              </p>
            </Card>
          </div>
        </Section>

        {/* ── STAT CARDS ──────────────────────────────────────── */}
        <Section
          title="StatCard"
          description="Dashboard overview numbers with icon, trend, and loading state."
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Venues"
              value="124"
              subtitle="Across 3 cities"
              icon={MapPin}
              iconColor="emerald"
              trend={12}
              trendLabel="this month"
            />
            <StatCard
              title="Pending Reports"
              value="8"
              subtitle="Awaiting review"
              icon={AlertTriangle}
              iconColor="orange"
            />
            <StatCard
              title="Needs Update"
              value="23"
              subtitle="Timings outdated"
              icon={Clock}
              iconColor="red"
            />
            <StatCard
              title="Total Users"
              value="—"
              subtitle="Loading..."
              icon={Users}
              iconColor="blue"
              loading
            />
          </div>
        </Section>

        {/* ── SPINNERS ────────────────────────────────────────── */}
        <Section
          title="Spinner / Loader"
          description="Loading indicators for buttons, inline content, and full page."
        >
          <Preview label="Sizes">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
            <Spinner size="xl" />
          </Preview>

          <Preview label="Page loader" bg="surface">
            <div className="w-full">
              <PageLoader />
            </div>
          </Preview>
        </Section>

        {/* ── EMPTY STATE ─────────────────────────────────────── */}
        <Section
          title="EmptyState"
          description="Shown when a list or page has no data."
        >
          <Card padding={false}>
            <EmptyState
              icon={MapPin}
              title="No mosques found"
              description="No mosque or prayer venue records match your current filters. Try adjusting your search or add a new venue."
              action={() => {}}
              actionLabel="Add Mosque"
            />
          </Card>
        </Section>

        {/* ── MODAL ───────────────────────────────────────────── */}
        <Section
          title="Modal"
          description="Dialog overlay for forms and confirmations. Closes on Escape or backdrop click."
        >
          <Preview label="Trigger">
            <Button onClick={() => setModalOpen(true)} icon={Edit}>
              Open Modal
            </Button>
          </Preview>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Edit Mosque Details"
            subtitle="Update the venue profile information below."
            footer={
              <div className="flex items-center justify-end gap-2">
                <Button variant="secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setModalOpen(false)}>
                  Save Changes
                </Button>
              </div>
            }
          >
            <div className="flex flex-col gap-4">
              <Input
                label="Mosque Name"
                placeholder="e.g. Masjid Al-Noor"
                required
              />
              <Select
                label="Venue Type"
                placeholder="Select type"
                options={[
                  { value: "masjid", label: "Masjid" },
                  { value: "musalla", label: "Musalla" },
                ]}
              />
              <Textarea
                label="Facility Notes"
                placeholder="Any important notes..."
                rows={3}
              />
            </div>
          </Modal>
        </Section>

        {/* ── FOOTER ──────────────────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            Sabeel Admin · Component Catalog · All components are
            production-ready
          </p>
        </div>
      </div>
    </div>
  );
}
