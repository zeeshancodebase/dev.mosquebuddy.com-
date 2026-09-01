// client\mobile\src\screens\main\PostAnnouncementScreen.js
// client\mobile\src\screens\main\PostAnnouncementScreen.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { ArrowLeft, X, Search } from "lucide-react-native";
import { COLORS } from "../../constants";
import Input from "../../components/Input";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import DatePicker from "../../components/DatePicker";
import { useAuth } from "../../context/AuthContext";
import {
  fetchMyVenues,
  postVenueAnnouncement,
  fetchVolunteerAssignments,
  postVolunteerAnnouncement,
  postAdminAnnouncement,
  fetchCountries,
  fetchStates,
  fetchCities,
  fetchAreas,
  searchAdminVenues,
} from "../../lib/endpoints";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES = [
  { value: "general", label: "General", icon: "📢" },
  { value: "event", label: "Event", icon: "🎉" },
  { value: "class", label: "Class", icon: "📖" },
  { value: "eid", label: "Eid", icon: "☪️" },
  { value: "urgent", label: "Urgent", icon: "⚠️" },
];

const SCOPE_TYPES = [
  { value: "venue", label: "Venue", icon: "🕌" },
  { value: "area", label: "Area", icon: "📍" },
  { value: "city", label: "City", icon: "🏙" },
  { value: "state", label: "State", icon: "🌍" },
];

function assignmentLabel(a) {
  if (a.venueId) return { icon: "🕌", text: a.venue?.name || "Assigned Venue" };
  if (a.areaId) return { icon: "📍", text: a.area?.name || "Assigned Area" };
  return { icon: "🏙", text: a.city?.name || "Assigned City" };
}

function assignmentScope(a) {
  if (a.venueId) return { scope: "venue", venueId: a.venueId };
  if (a.areaId) return { scope: "area", areaId: a.areaId };
  return { scope: "city", cityId: a.cityId };
}

export default function PostAnnouncementScreen({ navigation }) {
 const { isSuperAdmin, isMosqueAdmin, isVolunteer } = useAuth();

  const effectiveRole = useMemo(() => {
    if (isSuperAdmin()) return "super_admin";
    if (isVolunteer()) return "trusted_volunteer";
    if (isMosqueAdmin()) return "mosque_admin";
    return null;
  }, [isSuperAdmin, isMosqueAdmin, isVolunteer]);

  // ── shared form fields ──
  const [category, setCategory] = useState("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [eventDate, setEventDate] = useState(null);
  const [eventTimeText, setEventTimeText] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ── mosque admin state ──
  const [venues, setVenues] = useState([]);
  const [venuesStatus, setVenuesStatus] = useState("idle");
  const [venueId, setVenueId] = useState(null);

  // ── volunteer state ──
  const [assignments, setAssignments] = useState([]);
  const [assignmentsStatus, setAssignmentsStatus] = useState("idle");
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // ── super admin state ──
  const [scopeType, setScopeType] = useState(null); // venue | area | city | state
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedCountryId, setSelectedCountryId] = useState(null);
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  const [venueQuery, setVenueQuery] = useState("");
  const [venueResults, setVenueResults] = useState([]);
  const [venueSearchStatus, setVenueSearchStatus] = useState("idle");
  const [selectedVenue, setSelectedVenue] = useState(null);

  // ── load mosque admin venues ──
  const loadVenues = useCallback(async () => {
    setVenuesStatus("loading");
    try {
      const res = await fetchMyVenues();
      const list = res?.data || [];
      setVenues(list);
      if (list.length === 1) setVenueId(list[0].venue.id);
      setVenuesStatus("loaded");
    } catch (err) {
      console.warn("Failed to load venues:", err?.message);
      setVenuesStatus("error");
    }
  }, []);

  // ── load volunteer assignments ──
  const loadAssignments = useCallback(async () => {
    setAssignmentsStatus("loading");
    try {
      const res = await fetchMyVolunteerAssignments();
      const list = (res?.data || []).filter((a) => a.canUpdateTimings);
      setAssignments(list);
      if (list.length === 1) setSelectedAssignment(list[0]);
      setAssignmentsStatus("loaded");
    } catch (err) {
      console.warn("Failed to load assignments:", err?.message);
      setAssignmentsStatus("error");
    }
  }, []);

  useEffect(() => {
    if (effectiveRole === "mosque_admin") loadVenues();
    if (effectiveRole === "trusted_volunteer") loadAssignments();
    if (effectiveRole === "super_admin") {
      fetchCountries()
        .then((res) => setCountries(res?.data || []))
        .catch((err) => console.warn("Failed to load countries:", err?.message));
    }
  }, [effectiveRole, loadVenues, loadAssignments]);

  // ── super admin cascading loaders ──
  function pickCountry(id) {
    setSelectedCountryId(id);
    setSelectedStateId(null);
    setSelectedCityId(null);
    setSelectedAreaId(null);
    setStates([]);
    setCities([]);
    setAreas([]);
    setLocLoading(true);
    fetchStates(id)
      .then((res) => setStates(res?.data || []))
      .catch((err) => console.warn("Failed to load states:", err?.message))
      .finally(() => setLocLoading(false));
  }

  function pickState(id) {
    setSelectedStateId(id);
    setSelectedCityId(null);
    setSelectedAreaId(null);
    setCities([]);
    setAreas([]);
    if (scopeType === "state") return;
    setLocLoading(true);
    fetchCities(id)
      .then((res) => setCities(res?.data || []))
      .catch((err) => console.warn("Failed to load cities:", err?.message))
      .finally(() => setLocLoading(false));
  }

  function pickCity(id) {
    setSelectedCityId(id);
    setSelectedAreaId(null);
    setAreas([]);
    if (scopeType === "city") return;
    setLocLoading(true);
    fetchAreas(id)
      .then((res) => setAreas(res?.data || []))
      .catch((err) => console.warn("Failed to load areas:", err?.message))
      .finally(() => setLocLoading(false));
  }

  function resetSuperAdminScope() {
    setSelectedCountryId(null);
    setSelectedStateId(null);
    setSelectedCityId(null);
    setSelectedAreaId(null);
    setStates([]);
    setCities([]);
    setAreas([]);
    setVenueQuery("");
    setVenueResults([]);
    setSelectedVenue(null);
  }

  async function runVenueSearch() {
    if (!venueQuery.trim()) return;
    setVenueSearchStatus("loading");
    try {
      const res = await searchAdminVenues(venueQuery.trim());
      setVenueResults(res?.data?.items || res?.data || []);
      setVenueSearchStatus("loaded");
    } catch (err) {
      console.warn("Venue search failed:", err?.message);
      setVenueSearchStatus("error");
    }
  }

  // ── validation + submit ──
  function validateCommon() {
    const next = {};
    if (!title.trim()) next.title = "Title is required";
    if (title.trim().length > 120) next.title = "Keep title under 120 characters";
    if (!body.trim()) next.body = "Message is required";
    if (body.trim().length > 1000) next.body = "Keep message under 1000 characters";
    return next;
  }

  async function handleSubmit() {
    const next = validateCommon();

    if (effectiveRole === "mosque_admin" && !venueId) {
      next.venueId = "Select a mosque";
    }
    if (effectiveRole === "trusted_volunteer" && !selectedAssignment) {
      next.scope = "Select where you're posting this";
    }
    if (effectiveRole === "super_admin") {
      if (!scopeType) next.scope = "Choose a scope";
      else if (scopeType === "venue" && !selectedVenue) next.scope = "Select a venue";
      else if (scopeType === "state" && !selectedStateId) next.scope = "Select a state";
      else if (scopeType === "city" && !selectedCityId) next.scope = "Select a city";
      else if (scopeType === "area" && !selectedAreaId) next.scope = "Select an area";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payloadBase = {
      category,
      title: title.trim(),
      body: body.trim(),
      eventDate: eventDate || undefined,
      eventTimeText: eventTimeText.trim() || undefined,
      isPinned,
    };

    setSubmitting(true);
    try {
      if (effectiveRole === "mosque_admin") {
        await postVenueAnnouncement(venueId, payloadBase);
      } else if (effectiveRole === "trusted_volunteer") {
        const scopeFields = assignmentScope(selectedAssignment);
        await postVolunteerAnnouncement({ ...payloadBase, ...scopeFields });
      } else if (effectiveRole === "super_admin") {
        const scopeFields =
          scopeType === "venue"
            ? { scope: "venue", venueId: selectedVenue.id }
            : scopeType === "area"
            ? { scope: "area", areaId: selectedAreaId }
            : scopeType === "city"
            ? { scope: "city", cityId: selectedCityId }
            : { scope: "state", stateId: selectedStateId };
        await postAdminAnnouncement({ ...payloadBase, ...scopeFields });
      }

      Alert.alert("Posted", "Your announcement is now live.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Couldn't post announcement", err?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── no permission ──
  if (!effectiveRole) {
    return (
      <EmptyState
        icon="🚫"
        title="No permission to post"
        subtitle="Announcements can be posted by mosque admins, trusted volunteers, or super admins."
      />
    );
  }

  if (effectiveRole === "mosque_admin" && venuesStatus === "loading") {
    return <Loader message="Loading your mosques..." />;
  }
  if (effectiveRole === "mosque_admin" && venuesStatus === "error") {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load your mosques"
        subtitle="Check your connection and try again."
        actionLabel="Retry"
        onAction={loadVenues}
      />
    );
  }
  if (effectiveRole === "mosque_admin" && venues.length === 0) {
    return (
      <EmptyState
        icon="🕌"
        title="No mosque assigned"
        subtitle="You're not currently assigned as an admin for any mosque."
      />
    );
  }

  if (effectiveRole === "trusted_volunteer" && assignmentsStatus === "loading") {
    return <Loader message="Loading your assignments..." />;
  }
  if (effectiveRole === "trusted_volunteer" && assignmentsStatus === "error") {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load your assignments"
        subtitle="Check your connection and try again."
        actionLabel="Retry"
        onAction={loadAssignments}
      />
    );
  }
  if (effectiveRole === "trusted_volunteer" && assignments.length === 0) {
    return (
      <EmptyState
        icon="🤝"
        title="No posting rights yet"
        subtitle="You don't have an assignment with announcement permission."
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <ArrowLeft size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Announcement</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* ── MOSQUE ADMIN: venue picker ── */}
        {effectiveRole === "mosque_admin" && venues.length > 1 && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Mosque</Text>
            <View style={styles.chipRow}>
              {venues.map((item) => (
                <TouchableOpacity
                  key={item.assignmentId}
                  style={[styles.chip, venueId === item.venue.id && styles.chipActive]}
                  onPress={() => setVenueId(item.venue.id)}
                >
                  <Text style={[styles.chipText, venueId === item.venue.id && styles.chipTextActive]}>
                    {item.venue.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.venueId && <Text style={styles.errorText}>{errors.venueId}</Text>}
          </View>
        )}
        {effectiveRole === "mosque_admin" && venues.length === 1 && (
          <View style={styles.singleVenueBanner}>
            <Text style={styles.singleVenueText}>Posting for {venues[0].venue.name}</Text>
          </View>
        )}

        {/* ── VOLUNTEER: assignment scope picker ── */}
        {effectiveRole === "trusted_volunteer" && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Where are you posting this?</Text>
            <View style={styles.chipRow}>
              {assignments.map((a) => {
                const { icon, text } = assignmentLabel(a);
                const active = selectedAssignment?.id === a.id;
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSelectedAssignment(a)}
                  >
                    <Text style={styles.chipIcon}>{icon}</Text>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.scope && <Text style={styles.errorText}>{errors.scope}</Text>}
          </View>
        )}

        {/* ── SUPER ADMIN: full scope picker ── */}
        {effectiveRole === "super_admin" && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Scope</Text>
            <View style={styles.chipRow}>
              {SCOPE_TYPES.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[styles.chip, scopeType === s.value && styles.chipActive]}
                  onPress={() => {
                    setScopeType(s.value);
                    resetSuperAdminScope();
                  }}
                >
                  <Text style={styles.chipIcon}>{s.icon}</Text>
                  <Text style={[styles.chipText, scopeType === s.value && styles.chipTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.scope && <Text style={styles.errorText}>{errors.scope}</Text>}

            {/* venue scope: search */}
            {scopeType === "venue" && (
              <View style={styles.cascadeBlock}>
                <View style={styles.searchRow}>
                  <View style={styles.searchInputWrap}>
                    <Input
                      placeholder="Search venue by name..."
                      value={venueQuery}
                      onChangeText={setVenueQuery}
                    />
                  </View>
                  <TouchableOpacity style={styles.searchBtn} onPress={runVenueSearch}>
                    <Search size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
                {venueSearchStatus === "loading" && <Loader fullScreen={false} />}
                {venueResults.length > 0 && (
                  <View style={styles.chipRow}>
                    {venueResults.map((v) => (
                      <TouchableOpacity
                        key={v.id}
                        style={[styles.chip, selectedVenue?.id === v.id && styles.chipActive]}
                        onPress={() => setSelectedVenue(v)}
                      >
                        <Text
                          style={[styles.chipText, selectedVenue?.id === v.id && styles.chipTextActive]}
                        >
                          {v.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {selectedVenue && (
                  <View style={styles.selectedScopeBanner}>
                    <Text style={styles.selectedScopeText}>🕌 {selectedVenue.name}</Text>
                  </View>
                )}
              </View>
            )}

            {/* area/city/state scope: cascade */}
            {(scopeType === "area" || scopeType === "city" || scopeType === "state") && (
              <View style={styles.cascadeBlock}>
                <Text style={styles.cascadeStepLabel}>Country</Text>
                <View style={styles.chipRow}>
                  {countries.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.chip, selectedCountryId === c.id && styles.chipActive]}
                      onPress={() => pickCountry(c.id)}
                    >
                      <Text
                        style={[styles.chipText, selectedCountryId === c.id && styles.chipTextActive]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {selectedCountryId && (
                  <>
                    <Text style={styles.cascadeStepLabel}>State</Text>
                    {locLoading && states.length === 0 ? (
                      <Loader fullScreen={false} />
                    ) : (
                      <View style={styles.chipRow}>
                        {states.map((s) => (
                          <TouchableOpacity
                            key={s.id}
                            style={[styles.chip, selectedStateId === s.id && styles.chipActive]}
                            onPress={() => pickState(s.id)}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                selectedStateId === s.id && styles.chipTextActive,
                              ]}
                            >
                              {s.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </>
                )}

                {selectedStateId && (scopeType === "city" || scopeType === "area") && (
                  <>
                    <Text style={styles.cascadeStepLabel}>City</Text>
                    {locLoading && cities.length === 0 ? (
                      <Loader fullScreen={false} />
                    ) : (
                      <View style={styles.chipRow}>
                        {cities.map((c) => (
                          <TouchableOpacity
                            key={c.id}
                            style={[styles.chip, selectedCityId === c.id && styles.chipActive]}
                            onPress={() => pickCity(c.id)}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                selectedCityId === c.id && styles.chipTextActive,
                              ]}
                            >
                              {c.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </>
                )}

                {selectedCityId && scopeType === "area" && (
                  <>
                    <Text style={styles.cascadeStepLabel}>Area</Text>
                    {locLoading && areas.length === 0 ? (
                      <Loader fullScreen={false} />
                    ) : (
                      <View style={styles.chipRow}>
                        {areas.map((a) => (
                          <TouchableOpacity
                            key={a.id}
                            style={[styles.chip, selectedAreaId === a.id && styles.chipActive]}
                            onPress={() => setSelectedAreaId(a.id)}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                selectedAreaId === a.id && styles.chipTextActive,
                              ]}
                            >
                              {a.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[styles.chip, category === c.value && styles.chipActive]}
                onPress={() => setCategory(c.value)}
              >
                <Text style={styles.chipIcon}>{c.icon}</Text>
                <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Input
          label="Title"
          placeholder="e.g. Weekly Tafseer Class"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
          hint={!errors.title ? `${title.length}/120` : null}
        />

        <Input
          label="Message"
          placeholder="Share the details your community needs to know..."
          value={body}
          onChangeText={setBody}
          multiline
          numberOfLines={5}
          error={errors.body}
          hint={!errors.body ? `${body.length}/1000` : null}
        />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Date (optional)</Text>
          {eventDate ? (
            <View style={styles.dateRow}>
              <TouchableOpacity style={styles.dateChip} onPress={() => setDatePickerVisible(true)}>
                <Text style={styles.dateChipText}>{eventDate}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearDateBtn} onPress={() => setEventDate(null)}>
                <X size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addDateBtn} onPress={() => setDatePickerVisible(true)}>
              <Text style={styles.addDateBtnText}>+ Add a date</Text>
            </TouchableOpacity>
          )}
        </View>

        <Input
          label="Time note (optional)"
          placeholder="e.g. After Isha, or 6:30 PM onwards"
          value={eventTimeText}
          onChangeText={setEventTimeText}
        />

        <View style={styles.pinRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Pin this announcement</Text>
            <Text style={styles.pinHint}>Pinned announcements show first on the home screen</Text>
          </View>
          <Switch
            value={isPinned}
            onValueChange={setIsPinned}
            trackColor={{ false: COLORS.borderLight, true: COLORS.primary + "80" }}
            thumbColor={isPinned ? COLORS.primary : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>{submitting ? "Posting..." : "Post Announcement"}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <DatePicker
        visible={datePickerVisible}
        value={eventDate}
        label="Event Date"
        onConfirm={(d) => {
          setEventDate(d);
          setDatePickerVisible(false);
        }}
        onCancel={() => setDatePickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary },
  content: { padding: 20 },
  field: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.card,
  },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "12" },
  chipIcon: { fontSize: 13, marginRight: 5 },
  chipText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.primary },
  errorText: { fontSize: 12, color: COLORS.error, marginTop: 6 },
  singleVenueBanner: {
    backgroundColor: COLORS.primary + "10",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  singleVenueText: { fontSize: 13.5, fontWeight: "600", color: COLORS.primary },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  dateChipText: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  clearDateBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: COLORS.card,
  },
  addDateBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    borderStyle: "dashed",
    alignSelf: "flex-start",
  },
  addDateBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.primary },
  pinRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  pinHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 15.5, fontWeight: "700", color: COLORS.white },

  cascadeBlock: {
    marginTop: 12,
  },
  cascadeStepLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginTop: 12,
    marginBottom: 6,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInputWrap: {
    flex: 1,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  selectedScopeBanner: {
    marginTop: 10,
    backgroundColor: COLORS.primary + "12",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  selectedScopeText: {
    fontWeight: "600",
    color: COLORS.primary,
  },
});