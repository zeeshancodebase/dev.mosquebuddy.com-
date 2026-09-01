// src/screens/main/QiblaScreen.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics"; // npx expo install expo-haptics (if not already present)
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { APP_CONFIG, COLORS } from "../../constants";
import EmptyState from "../../components/EmptyState";
import { getUserLocation } from "../../lib/location";
import {
  getQiblaBearing,
  getDistanceToKaabaKm,
  getCardinalLabel,
  formatCoordinates,
  getHeadingAccuracyLevel,
  angleDiff,
  smoothAngle,
} from "../../lib/qiblaUtils";
import { MapPin } from "lucide-react-native";
import { useLocation } from "../../context/LocationContext";

const ACCURACY_META = {
  high: { label: "High accuracy", color: "#10B981" },
  medium: { label: "Medium accuracy", color: "#D4A843" },
  low: { label: "Low accuracy — calibrate", color: "#EF4444" },
  unreliable: { label: "Calibration needed", color: "#EF4444" },
  unknown: { label: "Checking accuracy…", color: "rgba(255,255,255,0.35)" },
};

const ALIGN_TOLERANCE = 6; // degrees — counts as "facing Qibla"
const DIAL_SIZE = 288;
const DIAL_RADIUS = DIAL_SIZE / 2;
const MARKER_RADIUS = DIAL_RADIUS - 34; // how far out the Kaaba marker sits
const TICK_RADIUS = DIAL_RADIUS - 14;

export default function QiblaScreen({ navigation }) {
  const { locationLabel } = useLocation();
  const [permissionState, setPermissionState] = useState("checking"); // checking | denied | ready
  const [coords, setCoords] = useState(null); // { latitude, longitude }
  const [qiblaBearing, setQiblaBearing] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [heading, setHeading] = useState(0);
  const [aligned, setAligned] = useState(false);
  const [accuracyLevel, setAccuracyLevel] = useState("unknown");

  const dialRotation = useSharedValue(0);
  const glow = useSharedValue(0);
  const headingSubRef = useRef(null);
  const smoothedHeadingRef = useRef(0);
  const wasAlignedRef = useRef(false);

  // ── Get location once, compute Qibla bearing ──
  const loadLocation = useCallback(async () => {
    setPermissionState("checking");
    const location = await getUserLocation();
    if (!location) {
      setPermissionState("denied");
      return;
    }
    setCoords({ latitude: location.latitude, longitude: location.longitude });
    const bearing = getQiblaBearing(location.latitude, location.longitude);
    setQiblaBearing(bearing);
    setDistanceKm(getDistanceToKaabaKm(location.latitude, location.longitude));
    setPermissionState("ready");
  }, []);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  // ── Subscribe to device heading (with real accuracy reporting) ──
  useEffect(() => {
    if (permissionState !== "ready") return;
    let cancelled = false;

    (async () => {
      const sub = await Location.watchHeadingAsync((data) => {
        const rawHeading =
          data.trueHeading >= 0 ? data.trueHeading : data.magHeading;
        const next = smoothAngle(smoothedHeadingRef.current, rawHeading, 0.18);
        smoothedHeadingRef.current = next;
        setHeading(next);
        setAccuracyLevel(getHeadingAccuracyLevel(data.accuracy));
      });
      if (cancelled) {
        sub.remove();
      } else {
        headingSubRef.current = sub;
      }
    })();

    return () => {
      cancelled = true;
      headingSubRef.current && headingSubRef.current.remove();
      headingSubRef.current = null;
    };
  }, [permissionState]);

  // ── Rotate the dial so North stays true, and check alignment ──
  useEffect(() => {
    if (qiblaBearing === null) return;

    // Dial (compass rose) rotates opposite the device heading.
    const targetRotation = (360 - heading) % 360;
    const current = dialRotation.value % 360;
    let diff = targetRotation - current;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    dialRotation.value = withTiming(current + diff, {
      duration: 140,
      easing: Easing.out(Easing.quad),
    });

    const offset = angleDiff(heading, qiblaBearing); // -180..180, + = rotate right
    const isAligned = Math.abs(offset) <= ALIGN_TOLERANCE;
    setAligned(isAligned);

    if (isAligned && !wasAlignedRef.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
      glow.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.4, { duration: 700 })), -1, true);
    } else if (!isAligned && wasAlignedRef.current) {
      glow.value = withTiming(0, { duration: 250 });
    }
    wasAlignedRef.current = isAligned;
  }, [heading, qiblaBearing]);

  const dialAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${dialRotation.value}deg` }],
  }));

  const kaabaCounterStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-dialRotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  if (permissionState === "checking") {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centerFill}>
          <View style={styles.loadingDial} />
          <Text style={styles.loadingText}>Finding your location…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (permissionState === "denied") {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Qibla Direction</Text>
          <View style={{ width: 24 }} />
        </View>
        <EmptyState
          icon="📍"
          title="Location needed"
          subtitle={`${APP_CONFIG.name} needs your location to calculate the Qibla direction accurately. Please enable location access and try again.`}
          actionLabel="Try Again"
          onAction={loadLocation}
        />
      </SafeAreaView>
    );
  }

  const offset = angleDiff(heading, qiblaBearing);
  const guidance = aligned
    ? "Facing the Qibla"
    : `Rotate ${offset > 0 ? "right" : "left"} ${Math.round(Math.abs(offset))}°`;
  const accuracyMeta = ACCURACY_META[accuracyLevel];
  const needsCalibration = accuracyLevel === "low" || accuracyLevel === "unreliable";

  // Position of the Kaaba marker on the (unrotated) dial, in local coordinates.
  const bearingRad = (qiblaBearing * Math.PI) / 180;
  const markerX = MARKER_RADIUS * Math.sin(bearingRad);
  const markerY = -MARKER_RADIUS * Math.cos(bearingRad);

  const ticks = Array.from({ length: 36 }, (_, i) => i * 10);
  const cardinalPositions = [
    { label: "N", angle: 0 },
    { label: "E", angle: 90 },
    { label: "S", angle: 180 },
    { label: "W", angle: 270 },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Qibla Direction</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        {/* ── Info card ── */}
        <View style={styles.infoRow}>
          <View style={styles.infoPill}>
            <Text style={styles.infoLabel}>QIBLA BEARING</Text>
            <Text style={styles.infoValue}>
              {Math.round(qiblaBearing)}° {getCardinalLabel(qiblaBearing)}
            </Text>
          </View>
          <View style={styles.infoPill}>
            <Text style={styles.infoLabel}>DISTANCE TO KAABA</Text>
            <Text style={styles.infoValue}>{distanceKm.toLocaleString()} km</Text>
            <Text style={styles.infoCaption}>straight-line, from you</Text>
          </View>
        </View>

        {/* ── Compass dial ── */}
        <View style={styles.compassWrap}>
          {/* soft glow behind the dial when aligned */}
          <Animated.View pointerEvents="none" style={[styles.glowRing, glowStyle]} />

          {/* fixed pointer showing where the phone is aimed */}
          <View style={styles.fixedPointer} pointerEvents="none">
            <View style={styles.fixedPointerTriangle} />
          </View>

          <View style={[styles.compassDial, aligned && styles.compassDialAligned]}>
            <Animated.View style={[styles.dialRose, dialAnimatedStyle]}>
              {/* tick marks */}
              {ticks.map((angle) => (
                <View
                  key={angle}
                  style={[
                    styles.tickWrap,
                    { transform: [{ rotate: `${angle}deg` }, { translateY: -TICK_RADIUS }] },
                  ]}
                >
                  <View style={[styles.tick, angle % 30 === 0 && styles.tickMajor]} />
                </View>
              ))}

              {/* cardinal letters */}
              {cardinalPositions.map(({ label, angle }) => (
                <View
                  key={label}
                  style={[
                    styles.cardinalWrap,
                    { transform: [{ rotate: `${angle}deg` }, { translateY: -TICK_RADIUS + 18 }] },
                  ]}
                >
                  <Text style={[styles.cardinal, label === "N" && styles.cardinalN]}>{label}</Text>
                </View>
              ))}

              {/* Kaaba marker, positioned by trig so we don't stack extra rotations */}
              <View
                style={[
                  styles.kaabaMarker,
                  { left: DIAL_RADIUS + markerX - 20, top: DIAL_RADIUS + markerY - 20 },
                ]}
              >
                <Animated.View style={kaabaCounterStyle}>
                  <Text style={styles.kaabaIcon}>🕋</Text>
                </Animated.View>
              </View>
            </Animated.View>

            {/* Center dot */}
            <View style={styles.centerDot} />
          </View>
        </View>

        {/* ── Status ── */}
        <View style={[styles.statusBadge, aligned && styles.statusBadgeAligned]}>
          {aligned && <Text style={styles.statusCheck}>✓</Text>}
          <Text style={[styles.statusText, aligned && styles.statusTextAligned]}>{guidance}</Text>
        </View>

        {/* ── Bottom detail cards: location + compass accuracy ── */}
        <View style={styles.bottomGroup}>
          <View style={styles.detailRow}>
            <MapPin size={16} color="rgba(255,255,255,0.6)" style={styles.detailIcon} />
            <View style={styles.detailTextWrap}>
              <Text style={styles.detailLabel}>Your location</Text>
              <Text style={styles.detailValue}>
                {locationLabel || (coords ? formatCoordinates(coords.latitude, coords.longitude) : "—")}
              </Text>
              {locationLabel && coords && (
                <Text style={styles.detailCaption}>
                  {formatCoordinates(coords.latitude, coords.longitude)}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={[styles.accuracyDot, { backgroundColor: accuracyMeta.color }]} />
            <View style={styles.detailTextWrap}>
              <Text style={styles.detailLabel}>Compass accuracy</Text>
              <Text style={[styles.detailValue, { color: accuracyMeta.color }]}>
                {accuracyMeta.label}
              </Text>
            </View>
          </View>

          {needsCalibration && (
            <View style={styles.calibrateBanner}>
              <Text style={styles.calibrateBannerText}>
                Your compass reading may be off. Move your phone in a figure-8 motion,
                away from magnets and metal, to recalibrate.
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },

  centerFill: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingDial: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "rgba(212,168,67,0.25)",
    borderTopColor: "#D4A843",
    marginBottom: 16,
  },
  loadingText: { color: "rgba(255,255,255,0.6)", fontSize: 14 },

  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backArrow: { fontSize: 30, color: COLORS.white, width: 24 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: COLORS.white },

  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },

  infoRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  infoPill: {
    flex: 1,
    maxWidth: 160,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  infoLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 3,
    textAlign: "center",
  },
  infoValue: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
  infoCaption: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    marginTop: 2,
  },

  compassWrap: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  glowRing: {
    position: "absolute",
    width: DIAL_SIZE + 32,
    height: DIAL_SIZE + 32,
    borderRadius: (DIAL_SIZE + 32) / 2,
    backgroundColor: "rgba(16,185,129,0.18)",
  },
  fixedPointer: {
    position: "absolute",
    top: -8,
    alignItems: "center",
    zIndex: 5,
  },
  fixedPointerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#D4A843",
  },

  compassDial: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_RADIUS,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  compassDialAligned: {
    borderColor: "#059669",
    backgroundColor: "rgba(5,150,105,0.08)",
  },

  dialRose: {
    position: "absolute",
    width: DIAL_SIZE,
    height: DIAL_SIZE,
  },

  tickWrap: {
    position: "absolute",
    left: DIAL_RADIUS - 1,
    top: DIAL_RADIUS,
    alignItems: "center",
  },
  tick: {
    width: 1.5,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  tickMajor: {
    width: 2,
    height: 10,
    backgroundColor: "rgba(255,255,255,0.4)",
  },

  cardinalWrap: {
    position: "absolute",
    left: DIAL_RADIUS - 8,
    top: DIAL_RADIUS,
    alignItems: "center",
  },
  cardinal: {
    color: "rgba(255,255,255,0.45)",
    fontWeight: "700",
    fontSize: 13,
  },
  cardinalN: { color: "#D4A843" },

  kaabaMarker: {
    position: "absolute",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  kaabaIcon: { fontSize: 28 },

  centerDot: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.white,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusBadgeAligned: {
    backgroundColor: "rgba(5,150,105,0.15)",
    borderColor: "#059669",
  },
  statusCheck: { color: "#10B981", fontWeight: "700", fontSize: 14 },
  statusText: { color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "600" },
  statusTextAligned: { color: "#10B981" },

  bottomGroup: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailIcon: { width: 16, marginTop: 1 },
  accuracyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  detailTextWrap: { flex: 1 },
  detailLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "600",
  },
  detailValue: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 1,
  },
  detailCaption: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    marginTop: 1,
  },
  calibrateBanner: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    borderRadius: 12,
    padding: 10,
  },
  calibrateBannerText: {
    color: "#FCA5A5",
    fontSize: 12,
    lineHeight: 17,
  },
});