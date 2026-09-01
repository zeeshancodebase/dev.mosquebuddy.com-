// src/screens/mosqueAdmin/MosqueAdminHomeScreen.js
import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { APP_CONFIG, COLORS, PRAYER_NAMES, VENUE_TYPES } from "../../constants";
import IslamicPattern from "../../components/IslamicPattern";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import VerificationBadge from "../../components/VerificationBadge";
import { fetchMyVenues } from "../../lib/endpoints";
import { formatRelativeDate, formatTime12h } from "../../lib/dateUtils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PRAYER_ORDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

function TimingRow({ timing }) {
  return (
    <View style={styles.timingRow}>
      <Text style={styles.timingPrayer}>{PRAYER_NAMES[timing.prayerName]}</Text>
      <Text style={styles.timingAzaan}>
        {formatTime12h(timing.azaanTime) || "—"}
      </Text>
      <Text style={styles.timingJamaah}>
        {timing.timingType === "relative"
          ? timing.relativeTimeText
          : formatTime12h(timing.jamaahTime) || "—"}
      </Text>
      <View style={[
        styles.timingStatus,
        timing.verificationStatus === "verified" && styles.timingStatusVerified,
        timing.verificationStatus === "needs_update" && styles.timingStatusNeeds,
      ]}>
        <Text style={styles.timingStatusDot}>●</Text>
      </View>
    </View>
  );
}

function VenueCard({ venue, onManage, isSelectMode }) {
  const sortedTimings = [...(venue.dailyPrayerTimings || [])].sort(
    (a, b) => PRAYER_ORDER.indexOf(a.prayerName) - PRAYER_ORDER.indexOf(b.prayerName)
  );
  const needsUpdateCount = sortedTimings.filter(
    (t) => t.verificationStatus === "needs_update"
  ).length;

  return (
    <View style={styles.venueCard}>
      <View style={styles.venueCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.venueName}>{venue.name}</Text>
          <Text style={styles.venueMeta}>
            {VENUE_TYPES[venue.venueType] || venue.venueType}
            {venue.area?.name ? ` · ${venue.area.name}` : ""}
          </Text>
        </View>
        <VerificationBadge status={venue.verificationStatus} size="sm" />
      </View>

      {needsUpdateCount > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>
            ⚠ {needsUpdateCount} timing{needsUpdateCount > 1 ? "s" : ""} need updating
          </Text>
        </View>
      )}

      {/* Timings table */}
      <View style={styles.timingsHeader}>
        <Text style={[styles.timingHeaderText, { flex: 1.2 }]}>PRAYER</Text>
        <Text style={styles.timingHeaderText}>AZAAN</Text>
        <Text style={styles.timingHeaderText}>JAMĀ'AH</Text>
        <Text style={[styles.timingHeaderText, { width: 20 }]}></Text>
      </View>

      {sortedTimings.length === 0 ? (
        <Text style={styles.noTimingsText}>No timings added yet</Text>
      ) : (
        sortedTimings.map((t) => <TimingRow key={t.id} timing={t} />)
      )}

      <View style={styles.venueCardFooter}>
        <Text style={styles.lastUpdated}>
          Last verified: {formatRelativeDate(venue.lastVerifiedAt)}
        </Text>
        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => onManage(venue)}
          activeOpacity={0.85}
        >
          <Text style={styles.manageButtonText}>
            {isSelectMode ? "Update Timings →" : "Manage →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MosqueAdminHomeScreen({ navigation, route }) {
  const { mode = "manage" } = route.params || {};
  const isSelectMode = mode === "select_for_update";
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function loadVenues() {
    setError(null);
    try {
      const res = await fetchMyVenues();
      const data = res.data || [];

      // Single mosque: skip the list, go straight to the destination
      if (data.length === 1) {
        const item = data[0];
        if (isSelectMode) {
          navigation.replace("MosqueAdminEditTimings", {
            venue: item.venue,
            permissions: item.permissions,
          });
        } else {
          navigation.replace("MosqueAdminDetails", { assignment: item });
        }
        return; // don't setVenues/setLoading(false) — we're navigating away
      }

      setVenues(data);
      // console.log("Fetched my venues:", res.data);
    } catch (e) {
      setError(e.message || "Couldn't load your mosque.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { loadVenues(); }, []));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IslamicPattern width={SCREEN_WIDTH} height={150} color="rgba(255,255,255,0.035)" />
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            {/* <Text style={styles.headerTitle}>My Mosque</Text>
            <Text style={styles.headerSub}>Manage your mosque's timings and info</Text> */}
            <Text style={styles.headerTitle}>
              {isSelectMode ? "Select Mosque" : "My Mosque"}
            </Text>

            <Text style={styles.headerSub}>
              {isSelectMode
                ? "Choose a mosque to update timings"
                : "Manage your mosque's timings and info"}
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {loading ? (
        <Loader message="Loading your mosque..." />
      ) : error ? (
        <EmptyState icon="⚠️" title="Couldn't load" subtitle={error} actionLabel="Retry" onAction={loadVenues} />
      ) : venues.length === 0 ? (
        <EmptyState icon="🕌" title="No mosque assigned" subtitle={`Contact your ${APP_CONFIG.name} admin to get assigned to a mosque.`} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadVenues(); }} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        >
          {venues.map((item) => (
            <VenueCard
              key={item.venue.id}
              venue={item.venue}
              isSelectMode={isSelectMode}
              onManage={() => {
                if (isSelectMode) {
                  navigation.navigate("MosqueAdminEditTimings", { venue: item.venue, permissions: item.permissions });
                } else {
                  navigation.navigate("MosqueAdminDetails", { assignment: item });
                }
              }}
            />
          ))}

          <TouchableOpacity
            style={styles.reportsLink}
            onPress={() => navigation.navigate("MosqueAdminReports")}
            activeOpacity={0.8}
          >
            <Text style={styles.reportsLinkText}>🚩 View Reports Submitted for My Mosque</Text>
          </TouchableOpacity>

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

  venueCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  venueCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  venueName: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 3 },
  venueMeta: { fontSize: 13, color: COLORS.textMuted },

  alertBanner: {
    backgroundColor: "#FFFBEB",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#D97706",
  },
  alertText: { fontSize: 13, color: "#92400E", fontWeight: "600" },

  timingsHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: 2,
  },
  timingHeaderText: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },

  timingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  timingPrayer: { flex: 1.2, fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  timingAzaan: { flex: 1, fontSize: 13, color: COLORS.textMuted },
  timingJamaah: { flex: 1, fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  timingStatus: { width: 20, alignItems: "center" },
  timingStatusDot: { fontSize: 10, color: COLORS.textMuted },
  timingStatusVerified: {},
  timingStatusNeeds: {},

  noTimingsText: { fontSize: 13, color: COLORS.textMuted, paddingVertical: 12 },

  venueCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  lastUpdated: { fontSize: 12, color: COLORS.textMuted },
  manageButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  manageButtonText: { fontSize: 13, fontWeight: "700", color: COLORS.white },

  reportsLink: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    marginTop: 4,
  },
  reportsLinkText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
});