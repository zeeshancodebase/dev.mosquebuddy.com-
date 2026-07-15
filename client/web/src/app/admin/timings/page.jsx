  // src/app/admin/timings/page.jsx
  "use client";

  import { useState, useEffect, useCallback } from "react";
  import Link from "next/link";
  import { Clock, MapPin, Search, RefreshCw, ArrowRight, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
  import { api } from "@/lib/api";
  import PageHeader from "@/components/shared/PageHeader";
  import Input from "@/components/ui/Input";
  import Card from "@/components/ui/Card";
  import Badge, { VerificationBadge } from "@/components/ui/Badge";
  import EmptyState from "@/components/ui/EmptyState";
  import { PageLoader } from "@/components/ui/Spinner";
  import { PRAYER_NAMES, VENUE_TYPES } from "@/lib/constants";
  import Button from "@/components/ui/Button";

  const PRAYER_ORDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

  export default function TimingsPage() {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const fetchVenues = useCallback(async () => {
      setLoading(true);
      try {
        const res = await api.get("/venues?limit=100");
        const venueList = res.data || [];

        // Fetch daily timings for each venue
        const withTimings = await Promise.all(
          venueList.map(async (venue) => {
            try {
              const t = await api.get(`/venues/${venue.id}/daily-timings`);
              return { ...venue, dailyTimings: t.data || [] };
            } catch {
              return { ...venue, dailyTimings: [] };
            }
          })
        );
        setVenues(withTimings);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => { fetchVenues(); }, [fetchVenues]);

    const filtered = venues.filter((v) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        v.name?.toLowerCase().includes(q) ||
        v.city?.name?.toLowerCase().includes(q) ||
        v.area?.name?.toLowerCase().includes(q)
      );
    });

    // Calculate completeness
    function getCompleteness(venue) {
      const filled = PRAYER_ORDER.filter((p) =>
        venue.dailyTimings?.some((t) => t.prayerName === p)
      ).length;
      return { filled, total: 5, percent: Math.round((filled / 5) * 100) };
    }

    function getStatusVariant(percent) {
      if (percent === 100) return "success";
      if (percent >= 60) return "warning";
      return "danger";
    }

    // Summary counts
    const complete = filtered.filter((v) => getCompleteness(v).percent === 100).length;
    const partial = filtered.filter((v) => {
      const p = getCompleteness(v).percent;
      return p > 0 && p < 100;
    }).length;
    const empty = filtered.filter((v) => getCompleteness(v).percent === 0).length;

    return (
      <div>
        <PageHeader
          title="Timings Overview"
          subtitle="See which venues have complete prayer timings and which need attention."
          breadcrumbs={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Timings" },
          ]}
        />

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Complete", value: complete, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Partial", value: partial, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Empty", value: empty, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="bg-white rounded-2xl p-5 flex items-center gap-4"
                style={{ border: "1px solid #E5E7EB", boxShadow: "0 1px 4px 0 rgba(0,0,0,0.05)" }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                  <Icon size={18} className={item.color} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label} timings</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search + refresh */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search venues..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={fetchVenues}
            className="p-2.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Table */}
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">All Venues</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {filtered.length} venues · Click any row to manage timings
            </p>
          </div>

          {loading ? (
            <PageLoader />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No venues found"
              description="Add venues first to manage their timings."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Venue", "Type", "Fajr", "Dhuhr", "Asr", "Maghrib", "Isha", "Status", ""].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((venue) => {
                    const { filled, percent } = getCompleteness(venue);

                    return (
                      <tr key={venue.id} className="hover:bg-gray-50 transition-colors group">
                        {/* Venue name */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                              <MapPin size={13} className="text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{venue.name}</p>
                              <p className="text-xs text-gray-400">
                                {venue.area?.name || venue.city?.name || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3.5">
                          <Badge variant="neutral" size="sm">
                            {VENUE_TYPES[venue.venueType] || venue.venueType}
                          </Badge>
                        </td>

                        {/* Prayer columns */}
                        {PRAYER_ORDER.map((prayer) => {
                          const timing = venue.dailyTimings?.find(
                            (t) => t.prayerName === prayer
                          );
                          return (
                            <td key={prayer} className="px-4 py-3.5">
                              {timing ? (
                                <div>
                                  <p className="text-xs font-mono font-semibold text-emerald-700">
                                    {timing.timingType === "relative"
                                      ? "Relative"
                                      : timing.jamaahTime || "—"}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {timing.azaanTime || ""}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-300">—</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Completeness */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={getStatusVariant(percent)}
                              size="sm"
                              dot
                            >
                              {filled}/5
                            </Badge>
                            <div className="w-16 h-1 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${percent}%`,
                                  background: percent === 100
                                    ? "#059669"
                                    : percent >= 60
                                    ? "#D97706"
                                    : "#DC2626",
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Go to venue */}
                        <td className="px-2 py-2">
                          <Link href={`/admin/venues/${venue.id}`}>
                            <Button
                            variant="success"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100"
                          > Manage
                              <ArrowRight size={12} />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }