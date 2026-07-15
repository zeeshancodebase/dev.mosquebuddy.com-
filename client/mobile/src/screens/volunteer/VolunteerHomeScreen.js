// src/screens/volunteer/VolunteerHomeScreen.js
import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, VENUE_TYPES } from "../../constants";
import IslamicPattern from "../../components/IslamicPattern";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import VerificationBadge from "../../components/VerificationBadge";
import {
  fetchVolunteerAssignments,
  fetchVolunteerVenues,
  fetchVolunteerReports,
  fetchVolunteerSuggestions,
} from "../../lib/endpoints";
import { formatRelativeDate } from "../../lib/dateUtils";
import { Landmark, MapPin, Building2 } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function StatCard({ count, label, color = COLORS.primary }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={[styles.statCount, { color }]}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function VenueItem({ venue, navigation, permissions }) {
  return (
    <TouchableOpacity
      style={styles.venueItem}
      onPress={() => navigation.navigate("VolunteerVenueDetail", { venue, permissions })}
      activeOpacity={0.8}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.venueItemName}>{venue.name}</Text>
        <Text style={styles.venueItemMeta}>
          {VENUE_TYPES[venue.venueType] || venue.venueType}
          {venue.area?.name ? ` · ${venue.area.name}` : ""}
        </Text>
        <Text style={styles.venueItemDate}>Last updated: {formatRelativeDate(venue.updatedAt)}</Text>
      </View>
      <VerificationBadge status={venue.verificationStatus} size="sm" />
    </TouchableOpacity>
  );
}

function ReportItem({ report }) {
  return (
    <View style={styles.reportItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.reportItemMosque}>{report.venue?.name}</Text>
        <Text style={styles.reportItemIssue}>
          {report.issueType?.replace(/_/g, " ")} · {formatRelativeDate(report.createdAt)}
        </Text>
        {report.userNote && (
          <Text style={styles.reportItemNote} numberOfLines={2}>"{report.userNote}"</Text>
        )}
      </View>
      <View style={styles.pendingBadge}>
        <Text style={styles.pendingBadgeText}>Pending</Text>
      </View>
    </View>
  );
}

function getEffectivePermissionsForVenue(assignmentList, venue) {
  const relevant = assignmentList.filter(
    (a) =>
      a.venueId === venue.id ||
      (a.areaId && venue.area?.id === a.areaId) ||
      (a.cityId && venue.city?.id === a.cityId)
  );

  return {
    canVerifyTimings: relevant.some((a) => a.canVerifyTimings),
    canUpdateTimings: relevant.some((a) => a.canUpdateTimings),
    canReviewReports: relevant.some((a) => a.canReviewReports),
    canReviewSuggestions: relevant.some((a) => a.canReviewSuggestions),
  };
}

function SectionHeaderRow({ title, actionLabel, onPress }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onPress && (
        <TouchableOpacity onPress={onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.sectionAction}>{actionLabel} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function VolunteerHomeScreen({ navigation }) {
  const [assignmentList, setAssignmentList] = useState([]);
  const [venues, setVenues] = useState([]);
  const [reports, setReports] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function loadAll() {
    setError(null);
    try {
      const [assignRes, venueRes, reportRes, suggRes] = await Promise.all([
        fetchVolunteerAssignments(),
        fetchVolunteerVenues({ limit: 10 }),
        fetchVolunteerReports({ status: "pending", limit: 5 }),
        fetchVolunteerSuggestions({ status: "pending", limit: 5 }),
      ]);
          console.log("RAW suggestions response:", JSON.stringify(suggRes, null, 2));

      setAssignmentList(assignRes.data || []);
      console.log(
        "Assignments:\n",
        JSON.stringify(assignmentList, null, 2)
      );

      setVenues(venueRes.data || []);
      setReports(reportRes.data || []);
      setSuggestions(suggRes.data || []);
    } catch (e) {
      setError(e.message || "Couldn't load volunteer data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { loadAll(); }, []));

  const anyCanReviewReports = assignmentList.some((a) => a.canReviewReports);
  const anyCanReviewSuggestions = assignmentList.some((a) => a.canReviewSuggestions);
  const anyCanUpdateTimings = assignmentList.some((a) => a.canUpdateTimings);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IslamicPattern width={SCREEN_WIDTH} height={150} color="rgba(255,255,255,0.035)" />
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Volunteer Dashboard</Text>
            <Text style={styles.headerSub}>Your assigned area and pending tasks</Text>
          </View>
        </SafeAreaView>
      </View>

      {loading ? (
        <Loader message="Loading your assignments..." />
      ) : error ? (
        <EmptyState icon="⚠️" title="Couldn't load" subtitle={error} actionLabel="Retry" onAction={loadAll} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        >
          {/* Assignment scope
const assignmentLists = {
  venues: [
    {
      id: "1",
      name: "Masjid Abu Bakr Siddique",
    },
    {
      id: "2",
      name: "Madeena Masjid",
    },
  ],

  areas: [
    {
      id: "1",
      name: "BTM Layout",
    },
  ],

  cities: [
    {
      id: "1",
      name: "Bengaluru",
    },
  ],

  permissions: {
    canVerifyTimings: true,
    canUpdateTimings: true,
    canReviewReports: true,
    canReviewSuggestions: false,
  },
};
          
          {assignmentLists && (
            <View style={styles.scopeCard}>
              <Text style={styles.scopeTitle}>Your Assigned Scope</Text>
              {assignmentLists.venues?.length > 0 && (
                <Text style={styles.scopeItem}>🕌 {assignmentLists.venues.length} mosque{assignmentLists.venues.length > 1 ? "s" : ""}</Text>
              )}
              {assignmentLists.areas?.length > 0 && (
                <Text style={styles.scopeItem}>📍 {assignmentLists.areas.map((a) => a.name).join(", ")}</Text>
              )}
              {assignmentLists.cities?.length > 0 && (
                <Text style={styles.scopeItem}>🏙 {assignmentLists.cities.map((c) => c.name).join(", ")}</Text>
              )}
              {assignmentLists.permissions && (
                <View style={styles.permissionsRow}>
                  {assignmentLists.permissions.canVerifyTimings && <View style={styles.permChip}><Text style={styles.permChipText}>Can Verify</Text></View>}
                  {assignmentLists.permissions.canUpdateTimings && <View style={styles.permChip}><Text style={styles.permChipText}>Can Update</Text></View>}
                  {assignmentLists.permissions.canReviewReports && <View style={styles.permChip}><Text style={styles.permChipText}>Reviews Reports</Text></View>}
                </View>
              )}
            </View>
          )} */}
          {assignmentList.length > 0 && (() => {
            const scopeAreas = assignmentList.filter((a) => a.area).map((a) => a.area);
            const scopeCities = assignmentList.filter((a) => a.city).map((a) => a.city);
            const scopeVenueCount = assignmentList.filter((a) => a.venue).length;
            const totalScopeCount = assignmentList.length;

            const verifyCount = assignmentList.filter((a) => a.canVerifyTimings).length;
            const updateCount = assignmentList.filter((a) => a.canUpdateTimings).length;
            const reportsCount = assignmentList.filter((a) => a.canReviewReports).length;
            const suggestionsCount = assignmentList.filter((a) => a.canReviewSuggestions).length;

            function permLabel(count, label) {
              if (count === 0) return null;
              return count === totalScopeCount ? label : `${label} (${count}/${totalScopeCount})`;
            }

            return (
              <View style={styles.scopeCard}>
                <Text style={styles.scopeTitle}>Your Assigned Scope</Text>
                {scopeVenueCount > 0 && (
                  <View style={styles.scopeItemRow}>
                    <Landmark size={14} color={COLORS.white} />
                    <Text style={styles.scopeItem}>{scopeVenueCount} mosque{scopeVenueCount > 1 ? "s" : ""}</Text>
                  </View>
                )}
                {scopeAreas.length > 0 && (
                  <View style={styles.scopeItemRow}>
                    <MapPin size={14} color={COLORS.white} />
                    <Text style={styles.scopeItem}>{scopeAreas.map((a) => a.name).join(", ")}</Text>
                  </View>
                )}
                {scopeCities.length > 0 && (
                  <View style={styles.scopeItemRow}>
                    <Building2 size={14} color={COLORS.white} />
                    <Text style={styles.scopeItem}>{scopeCities.map((c) => c.name).join(", ")}</Text>
                  </View>
                )}
                <View style={styles.permissionsRow}>
                  {verifyCount > 0 && <View style={styles.permChip}><Text style={styles.permChipText}>{permLabel(verifyCount, "Can Verify")}</Text></View>}
                  {updateCount > 0 && <View style={styles.permChip}><Text style={styles.permChipText}>{permLabel(updateCount, "Can Update")}</Text></View>}
                  {reportsCount > 0 && <View style={styles.permChip}><Text style={styles.permChipText}>{permLabel(reportsCount, "Reviews Reports")}</Text></View>}
                  {suggestionsCount > 0 && <View style={styles.permChip}><Text style={styles.permChipText}>{permLabel(suggestionsCount, "Reviews Suggestions")}</Text></View>}
                </View>
              </View>
            );
          })()}

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard count={venues.length} label="Mosques" />
            <StatCard count={reports.length} label="Pending Reports" color="#D97706" />
            <StatCard count={suggestions.length} label="Suggestions" color="#7C3AED" />
          </View>

          {/* Assigned venues */}
          {venues.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>ASSIGNED MOSQUES</Text>
              <View style={styles.card}>
                {venues.map((v) => (
                  <VenueItem
                    key={v.id}
                    venue={v}
                    navigation={navigation}
                    permissions={getEffectivePermissionsForVenue(assignmentList, v)}
                  />
                ))}
              </View>
            </>
          )}

          {/* Pending reports */}
          {reports.length > 0 && (
            <>
              <SectionHeaderRow
                title="PENDING REPORTS TO REVIEW"
                actionLabel="Review"
                onPress={() => navigation.navigate("VolunteerReports", { canReview: anyCanReviewReports, canUpdateTimings: anyCanUpdateTimings })}
              />
              <View style={styles.card}>
                {reports.map((r) => (
                  <ReportItem key={r.id} report={r} />
                ))}
              </View>
            </>
          )}

          {/* Suggestions queue */}
          {suggestions.length > 0 && (
            <>
              <SectionHeaderRow
                title="MOSQUE SUGGESTIONS TO CHECK"
                actionLabel="Review"
                onPress={() => navigation.navigate("VolunteerSuggestions", { canReview: anyCanReviewSuggestions })}
              />
              <View style={styles.card}>
                {suggestions.map((s) => (
                  <View key={s.id} style={styles.suggestionItem}>
                    <Text style={styles.suggestionName}>{s.suggestedName}</Text>
                    <Text style={styles.suggestionMeta}>
                      {s.areaText || s.cityText} · {formatRelativeDate(s.createdAt)}
                    </Text>
                    {s.userNote && (
                      <Text style={styles.suggestionNote} numberOfLines={2}>"{s.userNote}"</Text>
                    )}
                  </View>
                ))}
              </View>
            </>
          )}

          {venues.length === 0 && reports.length === 0 && suggestions.length === 0 && (
            <EmptyState icon="✅" title="All clear" subtitle="No pending tasks in your assigned area right now." />
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.dark, paddingBottom: 20 },
  headerContent: { paddingHorizontal: 20, paddingTop: 8 },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, marginBottom: 14,
  },
  backButtonText: { fontSize: 14, color: COLORS.white, fontWeight: "600" },
  headerTitle: { fontSize: 26, fontWeight: "800", color: COLORS.white, marginBottom: 4 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.55)" },

  scrollContent: { padding: 16 },

  scopeCard: {
    backgroundColor: COLORS.dark,
    borderRadius: 16, padding: 16, marginBottom: 16,
  },
  scopeTitle: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.5)", letterSpacing: 1, marginBottom: 10 },
  scopeItem: { fontSize: 14, color: COLORS.white, fontWeight: "500", marginBottom: 6 },
  scopeItemRow: { flexDirection: "row", alignItems: "center", gap: 6},
  permissionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  permChip: {
    backgroundColor: "rgba(5,150,105,0.2)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  permChipText: { fontSize: 11, color: COLORS.primary, fontWeight: "600" },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: COLORS.card,
    borderRadius: 14, padding: 14,
    alignItems: "center",
    borderTopWidth: 3,
    elevation: 2,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6,
  },
  statCount: { fontSize: 28, fontWeight: "800", marginBottom: 4 },
  statLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600", textAlign: "center" },

  sectionTitle: {
    fontSize: 11, fontWeight: "700", color: COLORS.textMuted,
    letterSpacing: 1.2, marginBottom: 8, marginTop: 4,
  },

  card: {
    backgroundColor: COLORS.card, borderRadius: 16,
    marginBottom: 16, overflow: "hidden",
    elevation: 2,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6,
  },

  venueItem: {
    flexDirection: "row", alignItems: "center",
    padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  venueItemName: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary, marginBottom: 2 },
  venueItemMeta: { fontSize: 12, color: COLORS.textMuted, marginBottom: 2 },
  venueItemDate: { fontSize: 11, color: COLORS.textMuted },

  reportItem: {
    flexDirection: "row", alignItems: "flex-start",
    padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
    gap: 10,
  },
  reportItemMosque: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 3 },
  reportItemIssue: { fontSize: 12, color: COLORS.textMuted, textTransform: "capitalize", marginBottom: 4 },
  reportItemNote: { fontSize: 12, color: COLORS.textMuted, fontStyle: "italic" },
  pendingBadge: { backgroundColor: "#FFFBEB", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pendingBadgeText: { fontSize: 11, fontWeight: "700", color: "#92400E" },

  suggestionItem: {
    padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  suggestionName: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 3 },
  suggestionMeta: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  suggestionNote: { fontSize: 12, color: COLORS.textMuted, fontStyle: "italic" },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, marginTop: 4 },
  sectionAction: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
});