// src/screens/main/NearbyScreen.js
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
import { COLORS, VENUE_TYPES } from "../../constants";
import EnhancedVenueCard from "../../components/EnhancedVenueCard";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import IslamicPattern from "../../components/IslamicPattern";
import NearbyMapModal from "../../components/NearbyMapModal";
import { fetchPublicVenues } from "../../lib/endpoints";
import { adaptVenueList } from "../../lib/adapters";
import { useLocation } from "../../context/LocationContext";
import ExpandingFAB from "../../components/ExpandingFAB";
import { Map, MapPinned } from "lucide-react-native";


const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FILTERS = [
  { key: "all", label: "All" },
  { key: "masjid", label: "Masjid" },
  { key: "musalla", label: "Musalla" },
  { key: "islamic_center", label: "Islamic Center" },
  { key: "prayer_room", label: "Prayer Room" },
  { key: "hall_community_venue", label: "Hall / Venue" },
];

// ─── Animated Card ────────────────────────────────────────────
function AnimatedCard({ children, index }) {
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      index * 80,
      withSpring(0, { damping: 18, stiffness: 90 })
    );
    opacity.value = withDelay(index * 80, withTiming(1, { duration: 400 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

// ─── Main Screen ──────────────────────────────────────────────
export default function NearbyScreen({ navigation }) {
  const { locationContext } = useLocation();

  const [activeFilter, setActiveFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapVisible, setMapVisible] = useState(false);

  // Header animations
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

  async function loadVenues(filterKey = activeFilter) {
    setErrorMessage(null);
    try {

      const params = { limit: 50 };
      if (filterKey !== "all") params.venueType = filterKey;

      if (locationContext?.type === "gps") {
        params.latitude = locationContext.latitude;
        params.longitude = locationContext.longitude;
        params.radiusKm = 25;
      } else if (locationContext?.type === "manual") {
        params.cityId = locationContext.cityId;
      }

      const res = await fetchPublicVenues(params);
      setVenues(adaptVenueList(res.data || []));
    } catch (error) {
      console.log("Nearby load error:", error);
      setErrorMessage(
        error.message || "Couldn't load mosques. Pull down to retry."
      );
      setVenues([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadVenues();
    }, [activeFilter, locationContext])
  );

  function handleFilterChange(key) {
    setActiveFilter(key);
    setLoading(true);
    loadVenues(key);
  }

  function onRefresh() {
    setRefreshing(true);
    loadVenues();
  }

  // Server already applies venueType filtering via query param.
  const filteredVenues = venues;

  function renderVenue({ item, index }) {
    return (
      <AnimatedCard index={index}>
        <EnhancedVenueCard
          venue={item}
          onPress={() =>
            navigation.navigate("VenueDetail", { venueId: item.id })
          }
        />
      </AnimatedCard>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Dark Header ── */}
      <View style={styles.header}>
        <IslamicPattern
          width={SCREEN_WIDTH}
          height={160}
          color="rgba(255,255,255,0.035)"
        />
        <SafeAreaView edges={["top"]}>
          <Animated.View style={[styles.headerContent, headerAnimStyle]}>
            <View style={styles.headerTitleRow}>
              <View>
                <Text style={styles.headerTitle}>Nearby Mosques</Text>
                <Text style={styles.headerSubtitle}>
                  {userLocation
                    ? "Sorted by distance from you"
                    : "Sorted by trust · enable location for distance"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.mapToggleButton}
                onPress={() => setMapVisible(true)}
                activeOpacity={0.85}
              >
                {/* <Text style={styles.mapToggleIcon}>
                  🗺 </Text>*/}
                <Map size={15} color={COLORS.white} strokeWidth={2.4} />
                <Text style={styles.mapToggleText}>Map</Text>
              </TouchableOpacity>
            </View>

            {/* Filter chips */}
            <View style={styles.filterScroll}>
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterChip,
                    activeFilter === filter.key && styles.filterChipActive,
                  ]}
                  onPress={() => handleFilterChange(filter.key)}
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
          {loading
            ? "Searching..."
            : `${filteredVenues.length} mosque${filteredVenues.length !== 1 ? "s" : ""
            } found`}
        </Text>
      </View>

      {/* ── Venue List ── */}
      {loading ? (
        <Loader message="Finding mosques near you..." />
      ) : errorMessage ? (
        <EmptyState
          icon="⚠️"
          title="Couldn't load mosques"
          subtitle={errorMessage}
          actionLabel="Retry"
          onAction={() => loadVenues()}
        />
      ) : filteredVenues.length === 0 ? (
        <EmptyState
          icon="🕌"
          title="No mosques found"
          subtitle="Try selecting a different filter or search for a specific area"
          actionLabel="Clear filter"
          onAction={() => handleFilterChange("all")}
        />
      ) : (
        <FlatList
          data={filteredVenues}
          keyExtractor={(item) => item.id}
          renderItem={renderVenue}
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

      <ExpandingFAB
        icon={MapPinned}
        label="View map"
        onPress={() => setMapVisible(true)}
      />

      <NearbyMapModal
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        venues={filteredVenues}
        userLocation={userLocation}
        onSelectVenue={(venue) =>
          navigation.navigate("VenueDetail", { venueId: venue.id })
        }
      />
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
  headerTitleRow: {
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
  mapToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginTop: 2,
  },
  // mapToggleIcon: { fontSize: 14 },
  mapToggleText: { fontSize: 13, fontWeight: "700", color: COLORS.white },

  // ── Filter chips ──
  filterScroll: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
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
});