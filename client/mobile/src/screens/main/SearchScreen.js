import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Keyboard,
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
import { COLORS, VENUE_TYPES } from "../../constants";
import EnhancedVenueCard from "../../components/EnhancedVenueCard";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import { fetchPublicVenues } from "../../lib/endpoints";
import { adaptVenueList } from "../../lib/adapters";
import { getUserLocation } from "../../lib/location";
import { getRecentSearches, addRecentSearch, clearRecentSearches } from "../../lib/recentSearches";
import { ChevronRight, History, Search, SearchX, TriangleAlert, X } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");


const VENUE_TYPE_FILTERS = [
  { key: "all", label: "All Types" },
  { key: "masjid", label: "Masjid" },
  { key: "musalla", label: "Musalla" },
  { key: "islamic_center", label: "Islamic Center" },
  { key: "prayer_room", label: "Prayer Room" },
];

// ─── Animated Card ────────────────────────────────────────────
function AnimatedCard({ children, index }) {
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      index * 60,
      withSpring(0, { damping: 18, stiffness: 100 })
    );
    opacity.value = withDelay(
      index * 60,
      withTiming(1, { duration: 350 })
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
}

// ─── Main Screen ──────────────────────────────────────────────
// ─── Main Screen ──────────────────────────────────────────────
export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [activeTypeFilter, setActiveTypeFilter] = useState("all");
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const searchSeqRef = useRef(0);

  // Animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  useEffect(() => {
    headerOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
    headerTranslateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });

    getRecentSearches().then(setRecentSearches);

    // Auto focus search on mount
    setTimeout(() => inputRef.current?.focus(), 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  async function runSearch(text, typeFilter) {
    const trimmed = text.trim();

    if (trimmed.length === 0) {
      searchSeqRef.current += 1;
      setHasSearched(false);
      setResults([]);
      setSearching(false);
      return;
    }

    const mySeq = ++searchSeqRef.current;

    setHasSearched(true);
    setSearching(true);
    setErrorMessage(null);

    try {
      const location = await getUserLocation();

      const params = { search: trimmed, limit: 30 };

      if (typeFilter !== "all") {
        params.venueType = typeFilter;
      }

      if (location) {
        params.latitude = location.latitude;
        params.longitude = location.longitude;
      }

      const res = await fetchPublicVenues(params);

      // Ignore stale responses if the user kept typing
      if (mySeq !== searchSeqRef.current) return;

      setResults(adaptVenueList(res.data || []));
      setHasSearched(true);

      addRecentSearch(trimmed).then(setRecentSearches);
    } catch (error) {
      if (mySeq !== searchSeqRef.current) return;

      console.log("Search error:", error);
      setErrorMessage(error.message || "Search failed. Please try again.");
      setResults([]);
      setHasSearched(true);
    } finally {
      if (mySeq === searchSeqRef.current) {
        setSearching(false);
      }
    }
  }

  function handleSearch(text) {
    setQuery(text);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.trim().length === 0) {
      searchSeqRef.current += 1;
      setHasSearched(false);
      setResults([]);
      setSearching(false);
      return;
    }

    // Show loader immediately while debounce/API is pending
    searchSeqRef.current += 1;
    setHasSearched(true);
    setSearching(true);
    setErrorMessage(null);

    debounceRef.current = setTimeout(() => {
      runSearch(text, activeTypeFilter);
    }, 400);
  }

  function handleTypeFilter(key) {
    setActiveTypeFilter(key);
    if (query.trim().length > 0) {
      runSearch(query, key);
    }
  }

  async function handleRecentSearch(term) {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    Keyboard.dismiss();
    inputRef.current?.blur();

    setQuery(term);
    setHasSearched(true);
    setSearching(true);
    setErrorMessage(null);

    await runSearch(term, activeTypeFilter);
  }

  function clearSearch() {
    setQuery("");
    setHasSearched(false);
    setResults([]);
    setErrorMessage(null);
    inputRef.current?.focus();
  }

  async function handleClearRecents() {
    await clearRecentSearches();
    setRecentSearches([]);
  }

  function renderResult({ item, index }) {
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
      {/* ── Header ── */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <Animated.View style={[styles.headerContent, headerAnimStyle]}>
            <Text style={styles.headerTitle}>Search</Text>

            {/* Search input */}
            <View style={styles.searchContainer}>
              <Search size={18} color={COLORS.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder="Search mosques, areas, cities..."
                placeholderTextColor={COLORS.textMuted}
                value={query}
                onChangeText={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={clearSearch}
                  style={styles.clearButton}
                  activeOpacity={0.7}
                >
                  <X size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Type filters */}
            <View style={styles.filterRow}>
              {VENUE_TYPE_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterChip,
                    activeTypeFilter === filter.key &&
                    styles.filterChipActive,
                  ]}
                  onPress={() => handleTypeFilter(filter.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      activeTypeFilter === filter.key &&
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

      {/* ── Content ── */}
      {!hasSearched ? (
        // Recent searches
        <View style={styles.recentContainer}>
          {recentSearches.length > 0 && (
            <View style={styles.recentHeaderRow}>
              <Text style={styles.recentTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={handleClearRecents} activeOpacity={0.7}>
                <Text style={styles.recentClearText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
          {recentSearches.length === 0 ? (
            <Text style={styles.recentEmptyText}>
              Search for a mosque, area, or city to get started.
            </Text>
          ) : (
            recentSearches.map((term, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentItem}
                onPress={() => handleRecentSearch(term)}
                activeOpacity={0.7}
              >
                <History size={16} color={COLORS.textMuted} style={styles.recentIcon} />
                <Text style={styles.recentText}>{term}</Text>
                <ChevronRight size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>
      ) : searching ? (
        <Loader message="Searching..." />
      ) : errorMessage ? (
        <EmptyState
          icon={<TriangleAlert size={50} />}
          title="Search failed"
          subtitle={errorMessage}
          actionLabel="Try again"
          onAction={() => runSearch(query, activeTypeFilter)}
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<SearchX size={50} />}
          title="No results found"
          subtitle={`No mosques found for "${query}". Try a different name or area.`}
          actionLabel="Clear search"
          onAction={clearSearch}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderResult}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </Text>
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
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 16,
  },

  // ── Search Input ──
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    height: "100%",
  },


  // ── Filters ──
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: "700",
  },

  // ── Recent Searches ──
  recentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  recentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  recentClearText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  recentEmptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
    elevation: 1,
  },

  recentIcon: {
    marginRight: 8,
  },

  recentText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },

  // ── Results ──
  resultsCount: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: "500",
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
});