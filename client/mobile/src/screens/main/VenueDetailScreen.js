// src/screens/main/VenueDetailScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions,
  Alert,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  COLORS,
  PRAYER_NAMES,
  VERIFICATION_STATUS,
  VENUE_TYPES,
} from "../../constants";
import VerificationBadge from "../../components/VerificationBadge";
import IslamicPattern from "../../components/IslamicPattern";
import { fetchPublicVenueById } from "../../lib/endpoints";
import { adaptVenueDetail } from "../../lib/adapters";
import { formatRelativeDate } from "../../lib/dateUtils";
import { getNextUpcomingPrayerName } from "../../lib/prayerTime";
import { useAuth } from "../../context/AuthContext";
import { Navigation, Phone, TriangleAlert } from "lucide-react-native";
import ExpandingFAB from "../../components/ExpandingFAB";
import AnnouncementsSection from "../../components/AnnouncementsSection";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PRAYER_ARABIC = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

const FACILITY_LABELS = {
  available: "Available",
  not_available: "Not Available",
  limited: "Limited",
  unknown: "Unknown",
};

const WOMEN_LABELS = {
  available: "Available",
  not_available: "Not Available",
  jumuah_only: "Jumu'ah Only",
  ramadan_eid_only: "Ramadan/Eid Only",
  unknown: "Unknown",
};

// ─── Section Card ─────────────────────────────────────────────
function SectionCard({ title, children, style = {} }) {
  return (
    <View style={[styles.sectionCard, style]}>
      <Text style={styles.sectionCardTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Prayer Row ───────────────────────────────────────────────
function PrayerRow({ timing, isNext = false }) {
  const prayerLabel = PRAYER_NAMES[timing.prayerName];
  const arabicLabel = PRAYER_ARABIC[timing.prayerName];
  const jamaahDisplay =
    timing.timingType === "relative"
      ? timing.relativeTimeText
      : timing.jamaahTime || "—";

  return (
    <View style={[styles.prayerRow, isNext && styles.prayerRowHighlighted]}>
      <View style={styles.prayerNameCol}>
        {isNext && <View style={styles.nextDot} />}
        <View>
          <Text style={[styles.prayerName, isNext && styles.prayerNameNext]}>
            {prayerLabel}
          </Text>
          <Text style={styles.prayerArabic}>{arabicLabel}</Text>
        </View>
      </View>
      <View style={styles.prayerTimeCol}>
        <Text style={styles.azaanTime}>{timing.azaanTime || "—"}</Text>
      </View>
      <View style={styles.prayerTimeCol}>
        <Text
          style={[
            styles.jamaahTime,
            isNext && styles.jamaahTimeNext,
            timing.timingType === "relative" && styles.relativeTime,
          ]}
        >
          {jamaahDisplay}
        </Text>
      </View>
    </View>
  );
}

// ─── Jumuah Slot Card ─────────────────────────────────────────
function JumuahSlotCard({ slot, index }) {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      index * 100,
      withSpring(0, { damping: 18, stiffness: 100 })
    );
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 400 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.jumuahSlotCard, animStyle]}>
      <View style={styles.jumuahSlotHeader}>
        <View style={styles.jumuahSlotBadge}>
          <Text style={styles.jumuahSlotBadgeText}>
            SLOT {slot.slotNumber}
          </Text>
        </View>
        {slot.khutbahLanguage && (
          <Text style={styles.jumuahLanguage}>{slot.khutbahLanguage}</Text>
        )}
        {slot.womenPrayerSpace === "available" && (
          <View style={styles.jumuahWomenBadge}>
            <Text style={styles.jumuahWomenText}>🧕 Women</Text>
          </View>
        )}
      </View>

      <View style={styles.jumuahTimesRow}>
        <View style={styles.jumuahTimeBlock}>
          <Text style={styles.jumuahTimeLabel}>Khutbah</Text>
          <Text style={styles.jumuahTimeValue}>
            {slot.khutbahTime || "—"}
          </Text>
        </View>
        <View style={styles.jumuahTimeDivider} />
        <View style={styles.jumuahTimeBlock}>
          <Text style={styles.jumuahTimeLabel}>Jamā'ah</Text>
          <Text style={[styles.jumuahTimeValue, styles.jumuahJamaahTime]}>
            {slot.jamaahTime}
          </Text>
        </View>
      </View>

      {slot.importantNotice && (
        <Text style={styles.jumuahNotice}>⚠ {slot.importantNotice}</Text>
      )}
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function VenueDetailScreen({ navigation, route }) {
  const { venueId, source } = route.params || {};
  const isFromJumuah = source === "jumuah";
  const { isLoggedIn } = useAuth();

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);
  const floatingOpacity = useSharedValue(0);
  const floatingTranslateY = useSharedValue(20);

  function playEntranceAnimations() {
    headerOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
    headerTranslateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    contentTranslateY.value = withDelay(
      200,
      withSpring(0, { damping: 18, stiffness: 100 })
    );
    floatingOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
    floatingTranslateY.value = withDelay(
      400,
      withSpring(0, { damping: 18, stiffness: 100 })
    );
  }

  async function loadVenue() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetchPublicVenueById(venueId);
      const adapted = adaptVenueDetail(res.data);
      setVenue(adapted);
      playEntranceAnimations();
    } catch (error) {
      console.log("Venue detail load error:", error);
      setLoadError(
        error.message || "Couldn't load this mosque. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (venueId) {
      loadVenue();
    } else {
      setLoadError("No mosque selected.");
      setLoading(false);
    }
  }, [venueId]);

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const floatingAnimStyle = useAnimatedStyle(() => ({
    opacity: floatingOpacity.value,
    transform: [{ translateY: floatingTranslateY.value }],
  }));

  function openDirections() {
    if (venue?.googleMapsLink) {
      Linking.openURL(venue.googleMapsLink);
    } else {
      Alert.alert(
        "No directions available",
        "Google Maps link not available for this mosque."
      );
    }
  }

  function openPhone() {
    if (venue?.phone) {
      Linking.openURL(`tel:${venue.phone}`);
    }
  }

  function formatLastVerified(dateStr) {
    return formatRelativeDate(dateStr);
  }

  function handleReportPress() {
    if (!isLoggedIn) {
      Alert.alert(
        "Login required",
        "Please log in to report a wrong timing. This helps us keep mosque data trustworthy.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log In", onPress: () => navigation.navigate("Login") },
        ]
      );
      return;
    }
    navigation.navigate("ReportTiming", { venue });
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingHeader}>
          <SafeAreaView edges={["top"]}>
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity></View>
          </SafeAreaView>
        </View>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (loadError || !venue) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingHeader}>
          <SafeAreaView edges={["top"]}>
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity></View>
          </SafeAreaView>
        </View>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>
            {loadError || "Mosque not found."}
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { marginTop: 16, alignSelf: "center" }]}
            onPress={loadVenue}
          >
            <Text style={styles.backButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const nextPrayerName = getNextUpcomingPrayerName(venue.dailyPrayerTimings);

  return (
    <View style={styles.container}>
      {/* ── Dark Header ── */}
      <View style={styles.header}>
        <IslamicPattern
          width={SCREEN_WIDTH}
          height={220}
          color="rgba(255,255,255,0.035)"
        />
        <SafeAreaView edges={["top"]}>
          <Animated.View style={[styles.headerContent, headerAnimStyle]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.venueName}>{venue.name}</Text>
            <Text style={styles.venueMeta}>
              {VENUE_TYPES[venue.venueType] || venue.venueType}
              {venue.area?.name ? ` · ${venue.area.name}` : ""}
              {venue.distance ? ` · ${venue.distance}` : ""}
            </Text>
            <View style={styles.badgeRow}>
              <VerificationBadge status={venue.verificationStatus} />
              <Text style={styles.lastVerified}>
                · {formatLastVerified(venue.lastVerifiedAt)}
              </Text>
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>

      {/* ── Scrollable Content ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={contentAnimStyle}>

          {/* Important Notice */}
          {venue.importantNotice && (
            <View style={styles.noticeBanner}>
              <Text style={styles.noticeIcon}>⚠️</Text>
              <Text style={styles.noticeText}>{venue.importantNotice}</Text>
            </View>
          )}

          {/* Priority order changes based on navigation source */}
          {isFromJumuah ? (
            <>
              {venue.jumuahTimings && venue.jumuahTimings.length > 0 && (
                <SectionCard title="FRIDAY JUMU'AH">
                  {venue.jumuahTimings.map((slot, index) => (
                    <JumuahSlotCard key={slot.id} slot={slot} index={index} />
                  ))}
                </SectionCard>
              )}

              <SectionCard title="DAILY TIMINGS">
                <View style={styles.timingTableHeader}>
                  <Text style={[styles.timingHeaderText, styles.prayerHeaderCol]}>
                    PRAYER
                  </Text>
                  <Text style={[styles.timingHeaderText, styles.timeHeaderCol]}>
                    AZAAN
                  </Text>
                  <Text style={[styles.timingHeaderText, styles.timeHeaderCol]}>
                    JAMĀ'AH
                  </Text>
                </View>
                {venue.dailyPrayerTimings.map((timing) => (
                  <PrayerRow
                    key={timing.id}
                    timing={timing}
                    isNext={timing.prayerName === nextPrayerName}
                  />
                ))}
              </SectionCard>
            </>
          ) : (
            <>
              <SectionCard title="DAILY TIMINGS">
                <View style={styles.timingTableHeader}>
                  <Text style={[styles.timingHeaderText, styles.prayerHeaderCol]}>
                    PRAYER
                  </Text>
                  <Text style={[styles.timingHeaderText, styles.timeHeaderCol]}>
                    AZAAN
                  </Text>
                  <Text style={[styles.timingHeaderText, styles.timeHeaderCol]}>
                    JAMĀ'AH
                  </Text>
                </View>
                {venue.dailyPrayerTimings.map((timing) => (
                  <PrayerRow
                    key={timing.id}
                    timing={timing}
                    isNext={timing.prayerName === nextPrayerName}
                  />
                ))}
              </SectionCard>

              {venue.jumuahTimings && venue.jumuahTimings.length > 0 && (
                <SectionCard title="FRIDAY JUMU'AH">
                  {venue.jumuahTimings.map((slot, index) => (
                    <JumuahSlotCard key={slot.id} slot={slot} index={index} />
                  ))}
                </SectionCard>
              )}
            </>
          )}

          {/* Announcements — venue-scoped only */}
          <AnnouncementsSection venueId={venue.id} hideIfEmpty  />
          <View style={{ height: 12 }} />

          {/* Facilities */}
          <SectionCard title="FACILITIES">
            <View style={styles.facilitiesRow}>
              {venue.womenPrayerSpace &&
                venue.womenPrayerSpace !== "unknown" && (
                  <View style={styles.facilityChip}>
                    <Text style={styles.facilityChipText}>
                      🧕 Women: {WOMEN_LABELS[venue.womenPrayerSpace]}
                    </Text>
                  </View>
                )}
              {venue.wuduFacility && venue.wuduFacility !== "unknown" && (
                <View style={styles.facilityChip}>
                  <Text style={styles.facilityChipText}>
                    🚿 Wudu: {FACILITY_LABELS[venue.wuduFacility]}
                  </Text>
                </View>
              )}
              {venue.parking && venue.parking !== "unknown" && (
                <View style={styles.facilityChip}>
                  <Text style={styles.facilityChipText}>
                    🚗 Parking: {FACILITY_LABELS[venue.parking]}
                  </Text>
                </View>
              )}
            </View>
            {venue.facilityNotes && (
              <Text style={styles.facilityNotes}>{venue.facilityNotes}</Text>
            )}
          </SectionCard>

          {/* Address */}
          {venue.address && (
            <SectionCard title="ADDRESS">
              <Text style={styles.addressText}>{venue.address}</Text>
            </SectionCard>
          )}

          {/* Report button */}
          <TouchableOpacity
            style={styles.reportButton}
            activeOpacity={0.8}
            onPress={handleReportPress}
          >

            <TriangleAlert
              size={16}
              color={COLORS.error}
              style={styles.reportButtonIcon}
            />
            <Text style={styles.reportButtonText}>
              {/* 🚩 Report Wrong Timing */}Report Wrong Timing
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </Animated.View>
      </ScrollView>

      {/* ── Floating Action Buttons ── */}
      <Animated.View style={[styles.floatingContainer, floatingAnimStyle]}>
        {/* <TouchableOpacity
          style={styles.floatingDirections}
          onPress={openDirections}
          activeOpacity={0.9}
        >
          <Text style={styles.floatingDirectionsText}>🗺 Directions</Text>
        </TouchableOpacity>

        {venue.phone && (
          <TouchableOpacity
            style={styles.floatingCall}
            onPress={openPhone}
            activeOpacity={0.9}
          >
            <Text style={styles.floatingCallText}>📞</Text>
          </TouchableOpacity>
        )} */}
        <ExpandingFAB icon={Navigation} label="Get directions" onPress={openDirections} />

        {venue.phone && (
          <ExpandingFAB
            icon={Phone}
            label="Call"
            onPress={openPhone}
            bottom={92}
            size={48}
            backgroundColor={COLORS.card}
            iconColor={COLORS.dark}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Loading ──
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingHeader: {
    backgroundColor: COLORS.dark,
    paddingBottom: 20,
  },
  loadingContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },

  // ── Header ──
  header: {
    backgroundColor: COLORS.dark,
    paddingBottom: 24,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "600",
  },
  venueName: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 6,
  },
  venueMeta: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastVerified: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginLeft: 6,
  },

  // ── Content ──
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ── Notice Banner ──
  noticeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#D97706",
  },
  noticeIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
    fontWeight: "500",
  },

  // ── Section Card ──
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  sectionCardTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 14,
  },

  // ── Timing Table ──
  timingTableHeader: {
    flexDirection: "row",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: 4,
  },
  timingHeaderText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  prayerHeaderCol: {
    flex: 1.2,
  },
  timeHeaderCol: {
    flex: 1,
    textAlign: "right",
  },

  // ── Prayer Row ──
  prayerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  prayerRowHighlighted: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    borderBottomWidth: 0,
    paddingHorizontal: 10,
    marginHorizontal: -10,
    marginVertical: 4,
  },
  prayerNameCol: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
  },
  nextDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  prayerName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  prayerNameNext: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  prayerArabic: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  prayerTimeCol: {
    flex: 1,
    alignItems: "flex-end",
  },
  azaanTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  jamaahTime: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  jamaahTimeNext: {
    color: COLORS.primary,
    fontSize: 16,
  },
  relativeTime: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.textMuted,
    textAlign: "right",
  },

  // ── Jumu'ah Slot ──
  jumuahSlotCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  jumuahSlotHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  jumuahSlotBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  jumuahSlotBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  jumuahLanguage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
    flex: 1,
  },
  jumuahWomenBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  jumuahWomenText: {
    fontSize: 11,
    color: "#92400E",
    fontWeight: "600",
  },
  jumuahTimesRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  jumuahTimeBlock: {
    flex: 1,
  },
  jumuahTimeDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: 16,
  },
  jumuahTimeLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "500",
    marginBottom: 4,
  },
  jumuahTimeValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  jumuahJamaahTime: {
    color: COLORS.primary,
  },
  jumuahNotice: {
    fontSize: 12,
    color: "#92400E",
    marginTop: 10,
    backgroundColor: "#FFFBEB",
    padding: 8,
    borderRadius: 8,
  },

  // ── Facilities ──
  facilitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  facilityChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  facilityChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  facilityNotes: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
    lineHeight: 18,
  },

  // ── Address ──
  addressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // ── Report Button ──
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.card,
  },
  reportButtonText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  reportButtonIcon: {
    marginRight: 8
  },

  // ── Floating Buttons ──
  floatingContainer: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  floatingDirections: {
    flex: 1,
    backgroundColor: COLORS.dark,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    elevation: 8,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  floatingDirectionsText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  floatingCall: {
    width: 54,
    height: 54,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    elevation: 4,
  },
  floatingCallText: {
    fontSize: 22,
  },

  // ── Bottom padding ──
  bottomPadding: {
    height: 100,
  },
});