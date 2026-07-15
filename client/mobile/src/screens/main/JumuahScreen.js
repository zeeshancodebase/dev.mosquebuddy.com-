import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
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
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, VERIFICATION_STATUS } from "../../constants";
import IslamicPattern from "../../components/IslamicPattern";
import EmptyState from "../../components/EmptyState";
import VerificationBadge from "../../components/VerificationBadge";
import { fetchPublicJumuah } from "../../lib/endpoints";
import { adaptJumuahSlots } from "../../lib/adapters";
import { getCurrentTimeHHmm, isTodayFriday } from "../../lib/dateUtils";
import Loader from "../../components/Loader";
import { getUpcomingJumuahSlots } from "../../lib/jumuahService";
import JumuahCard from "../../components/JumuahCard";
import { useLocation } from "../../context/LocationContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");


const LANGUAGE_FILTERS = [
  { key: "all", label: "All" },
  { key: "Urdu", label: "Urdu" },
  { key: "Arabic", label: "Arabic" },
  { key: "Kannada", label: "Kannada" },
  { key: "English", label: "English" },
];



// ─── Main Screen ──────────────────────────────────────────────
export default function JumuahScreen({ navigation }) {
  const { locationContext } = useLocation();
  const [activeFilter, setActiveFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  const now = new Date();
  const isFriday = isTodayFriday();

  // Animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  useEffect(() => {
    headerOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
    headerTranslateY.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  async function loadJumuahSlots() {
    setErrorMessage(null);
    try {
      const slots = await getUpcomingJumuahSlots(locationContext);
      setSlots(slots);
    } catch (error) {
      console.log("Jumu'ah load error:", error);
      setErrorMessage(error.message || "Couldn't load Jumu'ah slots. Pull down to retry.");
      setSlots([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadJumuahSlots();
    }, [locationContext])
  );

  const filteredSlots =
    activeFilter === "all"
      ? slots
      : slots.filter((s) => s.khutbahLanguage === activeFilter);

  function onRefresh() {
    setRefreshing(true);
    loadJumuahSlots();
  }

  function renderSlot({ item, index }) {
    return (
      // ─── Animated Slot Card ───────────────────────────────────────
      <JumuahCard
        slot={item}
        index={index}
        onPress={() =>
          navigation.navigate("VenueDetail", { venueId: item.venueId, source: "jumuah" })
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Dark Header ── */}
      <View style={styles.header}>
        <IslamicPattern
          width={SCREEN_WIDTH}
          height={200}
          color="rgba(255,255,255,0.035)"
        />
        <SafeAreaView edges={["top"]}>
          <Animated.View style={[styles.headerContent, headerAnimStyle]}>

            {/* Title */}
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.headerTitle}>Friday Jumu'ah</Text>
                <Text style={styles.headerSubtitle}>
                  Nearby slots · Sorted by time
                </Text>
              </View>
              {isFriday && (
                <View style={styles.fridayBadge}>
                  <Text style={styles.fridayBadgeText}>Today</Text>
                </View>
              )}
            </View>

            {/* Language filter chips */}
            <View style={styles.filterRow}>
              {LANGUAGE_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterChip,
                    activeFilter === filter.key && styles.filterChipActive,
                  ]}
                  onPress={() => setActiveFilter(filter.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      activeFilter === filter.key &&
                      styles.filterChipTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>

      {/* ── Results count ── */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {filteredSlots.length} Jumu'ah slot
          {filteredSlots.length !== 1 ? "s" : ""} found near you
        </Text>
      </View>

      {/* ── Slots List ── */}
      {loading ? (
        <Loader message="Finding Jumu'ah slots near you..." />
      ) : errorMessage ? (
        <EmptyState
          icon="⚠️"
          title="Couldn't load Jumu'ah slots"
          subtitle={errorMessage}
          actionLabel="Retry"
          onAction={loadJumuahSlots}
        />
      ) : filteredSlots.length === 0 ? (
        <EmptyState
          icon="🌙"
          title="No Jumu'ah slots found"
          subtitle={
            activeFilter === "all"
              ? "No upcoming Jumu'ah slots found near you right now."
              : "Try selecting a different language filter"
          }
          actionLabel="Show all"
          onAction={() => setActiveFilter("all")}
        />
      ) : (
        <FlatList
          data={filteredSlots}
          keyExtractor={(item) => item.id}
          renderItem={renderSlot}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Header ──
  header: {
    backgroundColor: COLORS.dark,
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },
  fridayBadge: {
    backgroundColor: "#D4A843",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  fridayBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.dark,
  },

  // ── Filter chips ──
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: "700",
  },

  // ── Results ──
  resultsRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  resultsText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: "500",
  },

  // ── List ──
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },

  // ── Slot Card ──
  slotCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    elevation: 2,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: "hidden",
  },
  slotAccent: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  slotContent: {
    flex: 1,
    padding: 14,
  },
  slotTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  slotNameContainer: {
    flex: 1,
    marginRight: 10,
  },
  slotVenueName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  slotMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  slotDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginBottom: 12,
  },

  // ── Times Row ──
  timesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  timeBlock: {
    flex: 1,
  },
  timeBlockDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: 12,
  },
  timeBlockLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  timeBlockValue: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  jamaahTime: {
    color: COLORS.primary,
    fontSize: 16,
  },
});