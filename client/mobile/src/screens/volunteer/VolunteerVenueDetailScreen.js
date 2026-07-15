// src/screens/volunteer/VolunteerVenueDetailScreen.js
import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, PRAYER_NAMES, VENUE_TYPES } from "../../constants";
import IslamicPattern from "../../components/IslamicPattern";
import Loader from "../../components/Loader";
import VerificationBadge from "../../components/VerificationBadge";
import {
  fetchVolunteerVenueById,
  verifyVolunteerDailyTiming,
  verifyVolunteerJumuahTiming,
} from "../../lib/endpoints";
import { formatTime12h } from "../../lib/dateUtils";
import { CalendarClock, Clock } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function NavCard({ icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity style={styles.navCard} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.navCardIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.navCardTitle}>{title}</Text>
        <Text style={styles.navCardSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.navCardArrow}>→</Text>
    </TouchableOpacity>
  );
}

function TimingVerifyRow({ label, timing, onVerify, verifying }) {
  const isVerified = timing.verificationStatus === "verified";
  return (
    <View style={styles.timingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.timingRowLabel}>{label}</Text>
        <Text style={styles.timingRowValue}>
          {timing.timingType === "relative"
            ? timing.relativeTimeText || "—"
            : formatTime12h(timing.jamaahTime) || "—"}
        </Text>
      </View>
      <VerificationBadge status={timing.verificationStatus} size="sm" />
      {!isVerified && onVerify && (
        <TouchableOpacity
          style={styles.verifyButton}
          onPress={() => onVerify(timing)}
          disabled={verifying === timing.id}
          activeOpacity={0.85}
        >
          <Text style={styles.verifyButtonText}>
            {verifying === timing.id ? "..." : "Verify"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function VolunteerVenueDetailScreen({ navigation, route }) {
  const venueId = route.params?.venue?.id;
  const permissions = route.params?.permissions || {};

  const [venue, setVenue] = useState(route.params?.venue || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(null);

  async function loadVenue() {
    setError(null);
    try {
      const res = await fetchVolunteerVenueById(venueId);
      setVenue(res.data);
    } catch (e) {
      setError(e.message || "Couldn't load mosque details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { loadVenue(); }, [venueId]));

  async function handleVerifyDaily(timing) {
    setVerifying(timing.id);
    try {
      await verifyVolunteerDailyTiming(timing.id);
      await loadVenue();
    } catch (e) {
      Alert.alert("Couldn't verify", e.message || "Please try again.");
    } finally {
      setVerifying(null);
    }
  }

  async function handleVerifyJumuah(timing) {
    setVerifying(timing.id);
    try {
      await verifyVolunteerJumuahTiming(timing.id);
      await loadVenue();
    } catch (e) {
      Alert.alert("Couldn't verify", e.message || "Please try again.");
    } finally {
      setVerifying(null);
    }
  }

  if (loading || !venue) {
    return <Loader message="Loading mosque details..." />;
  }

  const dailyTimings = venue.dailyPrayerTimings || [];
  const jumuahTimings = venue.jumuahTimings || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IslamicPattern width={SCREEN_WIDTH} height={150} color="rgba(255,255,255,0.035)" />
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{venue.name}</Text>
            <Text style={styles.headerSub}>
              {VENUE_TYPES[venue.venueType] || venue.venueType}
              {venue.area?.name ? ` · ${venue.area.name}` : ""}
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {error ? (
        <View style={styles.readOnlyBanner}>
          <Text style={styles.readOnlyText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadVenue(); }} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        >
          {!permissions.canUpdateTimings && !permissions.canVerifyTimings && (
            <View style={styles.readOnlyBanner}>
              <Text style={styles.readOnlyText}>
                You have view-only access to this mosque's timings.
              </Text>
            </View>
          )}

          {permissions.canUpdateTimings && (
            <>
              <NavCard
                // icon="🕌"
                icon={<Clock size={22} color={COLORS.primary} />}
                title="Edit Daily Timings"
                subtitle="Update Fajr, Dhuhr, Asr, Maghrib, Isha"
                onPress={() => navigation.navigate("VolunteerEditTimings", { venue, permissions })}
              />
              <NavCard
                // icon="🕋"
                 icon={<CalendarClock size={22} color={COLORS.primary} />}
                title="Edit Jumu'ah Timings"
                subtitle="Update Friday khutbah & jamā'ah slots"
                onPress={() => navigation.navigate("VolunteerEditJumuah", { venue, permissions })}
              />
            </>
          )}

          <Text style={styles.sectionTitle}>DAILY PRAYER TIMINGS</Text>
          <View style={styles.card}>
            {dailyTimings.length === 0 ? (
              <Text style={styles.emptyText}>No daily timings recorded yet.</Text>
            ) : (
              dailyTimings.map((t) => (
                <TimingVerifyRow
                  key={t.id}
                  label={PRAYER_NAMES[t.prayerName] || t.prayerName}
                  timing={t}
                  onVerify={permissions.canVerifyTimings ? handleVerifyDaily : undefined}
                  verifying={verifying}
                />
              ))
            )}
          </View>

          {jumuahTimings.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>JUMU'AH TIMINGS</Text>
              <View style={styles.card}>
                {jumuahTimings.map((t) => (
                  <TimingVerifyRow
                    key={t.id}
                    label={`Slot ${t.slotNumber}`}
                    timing={t}
                    onVerify={permissions.canVerifyTimings ? handleVerifyJumuah : undefined}
                    verifying={verifying}
                  />
                ))}
              </View>
            </>
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
  backButton: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginBottom: 14 },
  backButtonText: { fontSize: 14, color: COLORS.white, fontWeight: "600" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: COLORS.white, marginBottom: 4 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.6)" },

  scrollContent: { padding: 16 },

  readOnlyBanner: { backgroundColor: "#EFF6FF", padding: 12, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: "#2563EB", marginBottom: 16, marginHorizontal: 16, marginTop: 16 },
  readOnlyText: { fontSize: 13, color: "#1D4ED8", fontWeight: "600" },

  navCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: COLORS.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  navCardIcon: { fontSize: 24, marginRight: 12 },
  navCardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 2 },
  navCardSubtitle: { fontSize: 12, color: COLORS.textMuted },
  navCardArrow: { fontSize: 18, color: COLORS.textMuted },

  sectionTitle: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 1.2, marginBottom: 8, marginTop: 12 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, overflow: "hidden", elevation: 2, shadowColor: COLORS.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  emptyText: { padding: 16, fontSize: 13, color: COLORS.textMuted, textAlign: "center" },

  timingRow: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, gap: 10 },
  timingRowLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 2 },
  timingRowValue: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  verifyButton: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  verifyButtonText: { fontSize: 12, fontWeight: "700", color: COLORS.white },
});