// src/screens/main/HomeScreen.js
import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Dimensions,
  Pressable,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { COLORS, APP_CONFIG, PRAYER_NAMES } from "../../constants";
import EmptyState from "../../components/EmptyState";
import IslamicPattern from "../../components/IslamicPattern";
import { fetchNextJamaah } from "../../lib/endpoints";
import { adaptNextJamaahCards } from "../../lib/adapters";
import { formatTodayDateString, getCurrentTimeHHmm, isTodayFriday } from "../../lib/dateUtils";
import { getUserLocation } from "../../lib/location";
import LocationBottomSheet from "../../components/LocationBottomSheet";
import BrandMoment from "../../components/BrandMoment";
import JumuahCard from "../../components/JumuahCard";
import { getUpcomingJumuahSlots } from "../../lib/jumuahService";
import { useLocation } from "../../context/LocationContext";
import { MapPin, MapPinned } from "lucide-react-native";
import LongPressHint from "../../components/LongPressHint";
import AnnouncementsSection from "../../components/AnnouncementsSection";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PRAYER_ARABIC = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

const PRAYER_ICON = {
  fajr: "🌙",
  dhuhr: "☀️",
  asr: "🌤",
  maghrib: "🌅",
  isha: "🌃",
};

// ─── Urgency colour logic ──────────────────────────────────────
// countdown is a string like "12 min" or "1h 4m"
function getUrgencyColor(countdownStr) {
  if (!countdownStr) return COLORS.primary;
  const lower = countdownStr.toLowerCase();
  if (lower.includes("h")) return COLORS.primary; // >60 min → calm green
  const match = lower.match(/\d+/);
  const mins = match ? Number(match[0]) : NaN;
  if (isNaN(mins)) return COLORS.primary;
  if (mins <= 10) return "#EF4444"; // red — very urgent
  if (mins <= 20) return "#F59E0B"; // amber — urgent
  return COLORS.primary;             // green — comfortable
}

// ─── Pulse dot for urgency ────────────────────────────────────
function PulseDot({ color }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 800, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.in(Easing.ease) })
      ),
      -1
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 800 }),
        withTiming(0.9, { duration: 800 })
      ),
      -1
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.pulseDotWrap}>
      <Animated.View style={[styles.pulseDotRing, { borderColor: color }, animStyle]} />
      <View style={[styles.pulseDot, { backgroundColor: color }]} />
    </View>
  );
}

// ─── Catchable mosque card ────────────────────────────────────
function JamaahCard({ venue, index, onPress }) {
  const translateX = useSharedValue(-20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(
      index * 90,
      withSpring(0, { damping: 18, stiffness: 100 })
    );
    opacity.value = withDelay(index * 90, withTiming(1, { duration: 400 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const prayer = venue.nextPrayer || {};
  const urgencyColor = getUrgencyColor(prayer.countdown);
  const countdown = prayer.countdown || null;
  const jamaahTime = prayer.jamaahTime || null;
  const distanceText = venue.distance ? `${venue.distance}` : null;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        style={({ pressed }) => [styles.jamaahCard, pressed && styles.jamaahCardPressed]}
        onPress={onPress}
        android_ripple={{ color: "rgba(5,150,105,0.08)", borderless: false }}
      >
        {/* Left — urgency indicator */}
        <View style={[styles.jamaahCardAccent, { backgroundColor: urgencyColor }]} />

        {/* Centre — mosque info */}
        <View style={styles.jamaahCardBody}>
          <Text style={styles.jamaahCardName} numberOfLines={1}>{venue.name}</Text>
          {distanceText && (
            <Text style={styles.jamaahCardDistance}>📍 {distanceText} away</Text>
          )}
          {jamaahTime && (
            <Text style={styles.jamaahCardTime}>
              Jamā'ah at{" "}
              <Text style={[styles.jamaahCardTimeBold, { color: urgencyColor }]}>
                {jamaahTime}
              </Text>
            </Text>
          )}
        </View>

        {/* Right — countdown badge */}
        {countdown && (
          <View style={[styles.countdownBadge, { backgroundColor: urgencyColor + "18" }]}>
            <PulseDot color={urgencyColor} />
            <Text style={[styles.countdownBadgeText, { color: urgencyColor }]}>
              {countdown}
            </Text>
          </View>
        )}

        {/* Arrow */}
        <Text style={styles.jamaahCardArrow}>›</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Quick action tile ─────────────────────────────────────────
function ActionTile({ icon, title, subtitle, onPress, accent, ...rest },
  ref) {
  return (
    <TouchableOpacity
      style={styles.actionTile}
      onPress={onPress}
      activeOpacity={0.82}
      {...rest}
    >
      <View style={[styles.actionTileIcon, { backgroundColor: accent + "18" }]}>
        <Text style={styles.actionTileIconText}>{icon}</Text>
      </View>
      <Text style={styles.actionTileTitle}>{title}</Text>
      <Text style={styles.actionTileSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

function getLiveCountdown(targetTime, dayLabel = "today") {
  if (!targetTime) return null;

  const now = new Date();

  const [time, period] = targetTime.split(" ");
  let [hour, minute] = time.split(":").map(Number);

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  if (dayLabel === "tomorrow") {
    target.setDate(target.getDate() + 1);
  }

  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return "Now";

  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }

  if (mins === 0) {
    return `${secs}s`;
  }

  return `${mins}m ${secs}s`;
}

function JumuahBanner({
  isFriday,
  onPress,
  style,
}) {
  return (
    <TouchableOpacity
      style={[style, styles.jumuahBanner, isFriday && styles.jumuahBannerFriday]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.jumuahBannerLeft}>
        <Text style={styles.jumuahBannerEyebrow}>
          {isFriday ? "TODAY IS FRIDAY" : "EVERY FRIDAY"}
        </Text>
        <Text style={styles.jumuahBannerTitle}>Jumu'ah Timings</Text>
        <Text style={styles.jumuahBannerSub}>
          {isFriday
            ? "Find slots near you — sorted by time"
            : "See which mosques are near you"}
        </Text>
      </View>
      <View style={styles.jumuahBannerRight}>
        <Text style={styles.jumuahBannerArabic}>الجمعة</Text>
        <View style={styles.jumuahBannerCTA}>
          <Text style={styles.jumuahBannerCTAText}>View →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}


// ─── Main Screen ──────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const {
    locationContext,
    locationLabel,
    locationSheetVisible,
    selectLocation,
    openLocationSheet,
    closeLocationSheet,
  } = useLocation();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState([]);
  const [targetPrayerName, setTargetPrayerName] = useState(null);
  const [dayLabel, setDayLabel] = useState("today");
  const [errorMessage, setErrorMessage] = useState(null);


  const isFriday = isTodayFriday();
  const [jumuahSlots, setJumuahSlots] = useState([]);
  const [jumuahLoading, setJumuahLoading] = useState(true);
  const [jumuahError, setJumuahError] = useState(null);

  const firstName = user?.name?.split(" ")[0] || null;

  const [liveHeroCountdown, setLiveHeroCountdown] = useState(null);

  // ── Entrance animations ──
  const heroOpacity = useSharedValue(0);
  const heroScale = useSharedValue(0.96);
  const listOpacity = useSharedValue(0);
  const listTranslateY = useSharedValue(24);
  const greetingOpacity = useSharedValue(0);

  useEffect(() => {
    greetingOpacity.value = withTiming(1, { duration: 500 });
    heroOpacity.value = withDelay(150, withTiming(1, { duration: 600 }));
    heroScale.value = withDelay(150, withSpring(1, { damping: 16, stiffness: 90 }));
    listOpacity.value = withDelay(350, withTiming(1, { duration: 500 }));
    listTranslateY.value = withDelay(350, withSpring(0, { damping: 18, stiffness: 100 }));
  }, []);

  const heroAnimStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ scale: heroScale.value }],
  }));
  const listAnimStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
    transform: [{ translateY: listTranslateY.value }],
  }));
  const greetingAnimStyle = useAnimatedStyle(() => ({
    opacity: greetingOpacity.value,
  }));


  // const isJumuahWindow = isFriday && targetPrayerName === "dhuhr";

  const isJumuahWindow =
    isFriday &&
    targetPrayerName === "dhuhr" &&
    (jumuahLoading || jumuahSlots.length > 0);


  const loadJumuahData = useCallback(async () => {
    if (!isJumuahWindow) return;
    setJumuahLoading(true);
    setJumuahError(null);
    try {
      const slots = await getUpcomingJumuahSlots(locationContext, 5);
      setJumuahSlots(slots);
    } catch (error) {
      setJumuahError(error.message || "Couldn't load Jumu'ah slots. Pull to retry.");
      setJumuahSlots([]);
    } finally {
      setJumuahLoading(false);
    }
  }, [isJumuahWindow, locationContext]);

  useEffect(() => {
    loadJumuahData();
  }, [loadJumuahData]);




  const loadHomeData = useCallback(async () => {
    setErrorMessage(null);
    try {

      const params = {
        currentTime: getCurrentTimeHHmm(),
        // limit: 8,
        limit: 5,
      };

      if (locationContext?.type === "gps") {
        params.latitude = locationContext.latitude;
        params.longitude = locationContext.longitude;
        params.radiusKm = 15;
      } else if (locationContext?.type === "manual") {
        params.cityId = locationContext.cityId;
        if (locationContext.areaId) {
          params.areaId = locationContext.areaId;
        }
      } else {
        // No location set yet — still call API, will return unfiltered or empty
      }

      const res = await fetchNextJamaah(params);
      const adapted = adaptNextJamaahCards(res.data || []);

      setVenues(adapted);
      setTargetPrayerName(res.meta?.targetPrayerName ?? null);
      setDayLabel(res.meta?.dayLabel || "today");
    } catch (error) {
      setErrorMessage(error.message || "Couldn't load. Pull to retry.");
      setVenues([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locationContext]);

  // Reload whenever locationContext changes
  useEffect(() => {
    if (locationContext !== null) {
      setLoading(true);
      loadHomeData();
    }
  }, [locationContext]);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );

  function onRefresh() {
    setRefreshing(true);
    loadHomeData();
    if (isJumuahWindow) loadJumuahData();
  }


  // ── Derived hero values ──
  // const heroPrayer = venues[0]?.nextPrayer || null;
  const heroPrayer = isJumuahWindow
    ? (jumuahSlots[0] ? { jamaahTime: jumuahSlots[0].jamaahTime, countdown: null } : null)
    : (venues[0]?.nextPrayer || null);
  const heroCountdown = heroPrayer?.countdown || null;
  const heroJamaahTime = heroPrayer?.jamaahTime || null;
  // const prayerLabel = targetPrayerName ? PRAYER_NAMES[targetPrayerName] : null;
  // const prayerArabic = targetPrayerName ? PRAYER_ARABIC[targetPrayerName] : null;
  // const prayerIcon = targetPrayerName ? PRAYER_ICON[targetPrayerName] : "🕌";

  const prayerLabel = isJumuahWindow ? "Jumu'ah" : targetPrayerName ? PRAYER_NAMES[targetPrayerName] : null;
  const prayerArabic = isJumuahWindow ? "الجمعة" : targetPrayerName ? PRAYER_ARABIC[targetPrayerName] : null;
  const prayerIcon = isJumuahWindow ? "🕌" : targetPrayerName ? PRAYER_ICON[targetPrayerName] : "🕌";

  const urgencyColor = getUrgencyColor(heroCountdown);
  const isTomorrow = dayLabel === "tomorrow";

  useEffect(() => {
    if (!heroPrayer?.jamaahTime) {
      setLiveHeroCountdown(null);
      return;
    }

    const update = () => {
      setLiveHeroCountdown(
        getLiveCountdown(heroPrayer.jamaahTime, dayLabel)
      );
    };

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);

  }, [heroPrayer?.jamaahTime, dayLabel]);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Assalāmu alaykum" : hour < 17 ? "Assalāmu alaykum" : "Assalāmu alaykum";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* ══ DARK HEADER ══════════════════════════════════════════ */}
      <View style={styles.header}>
        <IslamicPattern
          width={SCREEN_WIDTH}
          height={320}
          color="rgba(255,255,255,0.03)"
        />

        <SafeAreaView edges={["top"]}>
          {/* ── Top bar: greeting + location ── */}
          <Animated.View style={[styles.topBar, greetingAnimStyle]}>
            <View style={styles.topBarLeft}>
              <Text style={styles.greetingText}>
                {greeting}{firstName ? `, ${firstName}` : ""}
              </Text>
              {/* <Text style={styles.appBrand}>
                {APP_CONFIG.name}{"\n"}
                <Text style={styles.appBrandArabic}>  {APP_CONFIG.nameArabic}</Text>
              </Text> */}
                <Text style={styles.appBrand}>
                {APP_CONFIG.name}
                <Text style={styles.appBrandArabic}> </Text>
              </Text>
            </View>

            {/* Location pill — opens bottom sheet */}
            <LongPressHint text="Tap to set your city or area — mosques nearby will update">
              <TouchableOpacity
                style={[
                  styles.locationPill,
                  !locationContext && styles.locationPillUnset,
                ]}
                activeOpacity={0.8}
                onPress={openLocationSheet}
              >
                <Text style={styles.locationIcon}>
                  {locationContext?.type === "gps" ? (
                    <MapPin size={13} color={COLORS.white} strokeWidth={2.4} />
                  ) : (
                    <MapPinned size={13} color={COLORS.white} strokeWidth={2.4} />
                  )}
                </Text>
                <Text style={styles.locationText} numberOfLines={1}>
                  {locationLabel}
                </Text>
                <Text style={styles.locationChevron}>›</Text>
              </TouchableOpacity></LongPressHint>
          </Animated.View>

          {/* ── Hero prayer card ── */}
          <Animated.View style={[styles.heroCard, heroAnimStyle]}>

            {/* Arabic calligraphic watermark behind content */}
            {prayerArabic && (
              <Text style={styles.heroArabicWatermark} numberOfLines={1}>
                {prayerArabic}
              </Text>
            )}
            <View style={styles.heroCardInner}>
              <View style={styles.heroCardLeft}>
                <View style={styles.heroBadge}>
                  <View style={[styles.heroBadgeDot, { backgroundColor: urgencyColor }]} />
                  <Text style={styles.heroBadgeText}>
                    {isTomorrow ? "NEXT · TOMORROW" : "NEXT JAMĀ'AH"}
                  </Text>
                </View>
                {/* Prayer name */}
                <View style={styles.heroPrayerRow}>
                  <Text style={styles.heroPrayerIcon}>{prayerIcon}</Text>
                  {loading ? (
                    <>
                      <Text style={styles.heroPrayerName}>Loading...</Text>
                      {/* <Text style={styles.heroPrayerArabic}>...</Text> */}
                    </>
                  ) : (
                    <>
                      <Text style={styles.heroPrayerName}>{prayerLabel || "—"}</Text>
                      {/* <Text style={styles.heroPrayerArabic}>{prayerArabic || "—"}</Text> */}
                    </>
                  )}
                </View>

                {/* Error / no data state inside hero */}
                {!loading && !prayerLabel && (
                  <TouchableOpacity
                    onPress={openLocationSheet}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.heroNoData}>
                      {locationContext
                        ? "No mosques found in this area — try a different city"
                        : "Tap 🏙 above to set your location and see Jamā'ah times"}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Earliest jamaah time */}
                {heroJamaahTime && (
                  <Text style={styles.heroJamaahRow}>
                    <Text style={styles.heroJamaahLabel}>Earliest Jamā'ah at{" "}</Text>
                    <Text style={styles.heroJamaahTime}>{heroPrayer.jamaahTime}</Text>
                  </Text>
                )}

              </View>

              {heroJamaahTime && (
                <View style={styles.heroPrayerRight}>
                  {/* <Text style={styles.heroCountdownTime}>{heroPrayer.countdown}</Text> */}
                  <Text style={styles.heroCountdownTime}>
                    {liveHeroCountdown || heroPrayer.countdown}
                  </Text>
                  <Text style={styles.heroCountdownLabel}>remaining</Text>
                </View>
              )}

            </View>
          </Animated.View>
        </SafeAreaView>
      </View>

      {/* ══ SCROLLABLE BODY ══════════════════════════════════════ */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >

        <Animated.View style={listAnimStyle}>

          {/* ── Friday Jumu'ah banner — always visible, elevated on Fridays ── */}
          {isFriday && (
            <JumuahBanner
              isFriday
              style={{ marginBottom: 20, marginTop: -5 }}
              onPress={() => navigation.navigate("Jumuah")}
            />)}

          {/* ── Catchable mosques section ──  all this is with out friday condition*/}
          {/* <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {isTomorrow ? "Tomorrow's Fajr" : "Catch it in time"}
              </Text>
              <Text style={styles.sectionSub}>
                {prayerLabel
                  ? `Mosques with upcoming ${prayerLabel} Jamā'ah · sorted by time`
                  : "Mosques sorted by next Jamā'ah time"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => navigation.navigate("Nearby")}
              activeOpacity={0.8}
            >
              <Text style={styles.seeAllText}>All mosques</Text>
            </TouchableOpacity>
          </View> */}

          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {isJumuahWindow
                  ? "Upcoming Jumu'ah"
                  : isTomorrow
                    ? "Tomorrow's Fajr"
                    : "Catch it in time"}
              </Text>

              <Text style={styles.sectionSub}>
                {isJumuahWindow
                  ? "Nearby Jumu'ah slots · Sorted by time"
                  : prayerLabel
                    ? `Mosques with upcoming ${prayerLabel} Jamā'ah · sorted by time`
                    : "Mosques sorted by next Jamā'ah time"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() =>
                navigation.navigate(isJumuahWindow ? "Jumuah" : "Nearby")
              }
            >
              <Text style={styles.seeAllText}>
                {isJumuahWindow ? "View all" : "All mosques"}
              </Text>
            </TouchableOpacity>
          </View>

          {isJumuahWindow ? (
            jumuahLoading ? (
              <View style={styles.loadingBlock}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={styles.skeletonCard} />
                ))}
              </View>
            ) : jumuahError ? (
              <EmptyState
                icon="⚠️"
                title="Couldn't load Jumu'ah"
                subtitle={jumuahError}
                actionLabel="Retry"
                onAction={loadJumuahData}
              />
            ) : jumuahSlots.length === 0 ? (
              <EmptyState
                icon="🕌"
                title="No upcoming Jumu'ah slots"
                subtitle="No Jumu'ah prayers found nearby."
              />
            ) : (
              <>
                {jumuahSlots.map((slot, index) => (
                  <JumuahCard
                    key={slot.id}
                    slot={slot}
                    index={index}
                    onPress={() =>
                      navigation.navigate("VenueDetail", {
                        venueId: slot.venueId,
                        source: "jumuah",
                      })
                    }
                  />
                ))}
              </>
            )
          ) : (loading ? (
            <View style={styles.loadingBlock}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={styles.skeletonCard} />
              ))}
            </View>
          ) : errorMessage ? (
            <EmptyState
              icon="⚠️"
              title="Couldn't load"
              subtitle={errorMessage}
              actionLabel="Retry"
              onAction={loadHomeData}
            />
          ) : venues.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyIcon}>🕌</Text>
              <Text style={styles.emptyTitle}>No mosques found nearby</Text>
              <Text style={styles.emptySub}>
                Try setting your location or search for your area
              </Text>
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => navigation.navigate("Search")}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyActionText}>Search mosques</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {venues.map((venue, index) => (
                <JamaahCard
                  key={venue.id}
                  venue={venue}
                  index={index}
                  onPress={() =>
                    navigation.navigate("VenueDetail", { venueId: venue.id })
                  }
                />
              ))}
            </>)
          )}
          
          {/* ── Divider ── */}
          <View style={styles.divider} />

          {/* ── Announcements — mosque/area/city/state, mock data for now ── */}
          <AnnouncementsSection />

          {/* ── Divider ── */}
          <View style={styles.divider} />

          {/* ── Quick actions ── */}
          <Text style={styles.actionsLabel}>QUICK ACTIONS</Text>
          <View style={styles.actionsRow}>
            {/* <ActionTile
              icon="🕌"
              title="Jumu'ah"
              subtitle="Find Friday slots"
              accent="#D4A843"
              onPress={() => navigation.navigate("Jumuah")}
            /> */}
            <ActionTile
              icon="🔍"
              title="Search"
              subtitle="By name or area"
              accent={COLORS.primary}
              onPress={() => navigation.navigate("Search")}
            />
            <ActionTile
              icon="➕"
              title="Add Mosque"
              subtitle="Missing from Sabeel?"
              accent="#8B5CF6"
              onPress={() => navigation.navigate("SuggestMosque")}
            />
            <LongPressHint text="Find the direction to pray toward">
              <ActionTile
                icon="🧭"
                title="Qibla"
                subtitle="Find direction"
                accent="#059669"
                onPress={() => navigation.navigate("Qibla")}
              /></LongPressHint>
          </View>

          {/* ── Friday Jumu'ah banner — always visible, elevated on Fridays ── */}
          {!isFriday && (
            <JumuahBanner
              isFriday={false}
              onPress={() => navigation.navigate("Jumuah")}
            />)}

          <View style={styles.bottomPad} />
          {!loading && <BrandMoment />}
        </Animated.View>
      </ScrollView>

      {/* ══ LOCATION BOTTOM SHEET ════════════════════════════════ */}
      <LocationBottomSheet
        visible={locationSheetVisible}
        onClose={closeLocationSheet}
        onLocationSelect={selectLocation}
      />

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ══ HEADER ══
  header: {
    backgroundColor: COLORS.dark,
    paddingBottom: 28,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  topBarLeft: { flex: 1, paddingRight: 12 },
  greetingText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  appBrand: {
    fontSize: 26,
    fontWeight: "800",
    color: "#D4A843",
    letterSpacing: 0.5,
  },
  appBrandArabic: {
    fontSize: 16,
    color: "rgba(212,168,67,0.65)",
    fontWeight: "400",
  },

  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    maxWidth: 160,
    gap: 4,
    marginTop: 4,
  },
  locationPillUnset: {
    borderColor: "#D4A843" + "60",
    backgroundColor: "rgba(212,168,67,0.08)",
  },
  locationIcon: { fontSize: 12 },
  locationText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "600",
    flexShrink: 1,
  },
  locationChevron: { fontSize: 16, color: "rgba(255,255,255,0.5)" },

  // ── Hero card ──
  heroCard: {
    marginHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  heroArabicWatermark: {
    position: "absolute",
    right: 2,
    top: -12,
    fontSize: 90,
    color: "rgba(255,255,255,0.04)",
    fontWeight: "900",
    lineHeight: 120,
    // letterSpacing: -2,
  },
  heroCardInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  heroCardLeft: { flex: 1, gap: 6 },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  heroBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  heroBadgeText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  heroPrayerRight: { alignItems: "flex-end", marginTop: 30 },
  heroCountdownTime: { fontSize: 26, fontWeight: "800", color: "#D4A843", letterSpacing: -0.5 },
  heroCountdownLabel: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2, fontWeight: "500" },


  heroPrayerRow: {
    flexDirection: "row",
    alignItems: "center", gap: 10, marginBottom: 8
  },
  heroPrayerIcon: { fontSize: 28 },
  heroPrayerName: {
    fontSize: 38,
    fontWeight: "800",
    color: COLORS.white,
  },
  heroPrayerArabic: { fontSize: 18, color: "rgba(255,255,255,0.5)", fontWeight: "400" },

  heroJamaahRow: {
    fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "500"
  },
  heroJamaahLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
  heroJamaahTime: {
    color: "#D4A843", fontWeight: "700"
  },

  heroNoData: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    lineHeight: 19,
    marginTop: 6,
  },

  // ══ SCROLL BODY ══
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 24, paddingHorizontal: 16 },

  // ── Section header ──
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  sectionSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
    maxWidth: 220,
  },
  seeAllButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary + "40",
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },

  // ── Skeleton loader ──
  loadingBlock: { gap: 10, marginBottom: 10 },
  skeletonCard: {
    height: 80,
    borderRadius: 16,
    backgroundColor: COLORS.borderLight,
    opacity: 0.6,
  },

  // Location prompt card
  locationPromptCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#D4A843" + "40",
    borderStyle: "dashed",
    gap: 14,
    marginBottom: 10,
  },
  locationPromptIcon: { fontSize: 32 },
  locationPromptText: { flex: 1 },
  locationPromptTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  locationPromptSub: { fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  locationPromptArrow: { fontSize: 22, color: COLORS.textMuted },


  // ── Empty state ──
  emptyBlock: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyAction: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },

  // ── Jamaah cards ──
  jamaahCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    elevation: 2,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  jamaahCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  jamaahCardAccent: {
    width: 4,
    alignSelf: "stretch",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  jamaahCardBody: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  jamaahCardName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  jamaahCardDistance: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  jamaahCardTime: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  jamaahCardTimeBold: {
    fontWeight: "800",
    fontSize: 14,
  },

  // ── Countdown badge ──
  countdownBadge: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 6,
    gap: 4,
    minWidth: 68,
  },
  pulseDotWrap: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: "absolute",
  },
  pulseDotRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    position: "absolute",
  },
  countdownBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  jamaahCardArrow: {
    fontSize: 20,
    color: COLORS.textMuted,
    paddingRight: 14,
    paddingLeft: 4,
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 24,
  },

  // ── Quick actions ──
  actionsLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  actionTile: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: "flex-start",
    elevation: 1,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionTileIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  actionTileIconText: { fontSize: 20 },
  actionTileTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  actionTileSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 15,
  },

  // ── Jumu'ah banner ──
  jumuahBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.dark,
    borderRadius: 18,
    padding: 20,
    overflow: "hidden",
  },
  jumuahBannerFriday: {
    backgroundColor: "#0A1F14",
    borderWidth: 1,
    borderColor: "#D4A843" + "40",
  },
  jumuahBannerLeft: { flex: 1, paddingRight: 12 },
  jumuahBannerEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D4A843",
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  jumuahBannerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 4,
  },
  jumuahBannerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 17,
  },
  jumuahBannerRight: {
    alignItems: "flex-end",
    gap: 10,
  },
  jumuahBannerArabic: {
    fontSize: 28,
    color: "rgba(212,168,67,0.5)",
    fontWeight: "400",
  },
  jumuahBannerCTA: {
    backgroundColor: "#D4A843",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  jumuahBannerCTAText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.dark,
  },

  bottomPad: { height: 100 },
});