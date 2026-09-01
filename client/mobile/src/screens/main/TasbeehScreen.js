// src/screens/main/TasbeehScreen.js
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { COLORS } from "../../constants";
import IslamicPattern from "../../components/IslamicPattern";
import { DHIKR_PRESETS } from "../../constants/dhikr";
import {
  getTodayData,
  getStreak,
  getAllTime,
  incrementCount,
  resetToday,
} from "../../lib/tasbeehStorage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const RING_SIZE = Math.min(SCREEN_WIDTH - 80, 280);
const RING_RADIUS = RING_SIZE / 2 - 14;
const BEAD_COUNT = 33;

function Bead({ index, filled, isCurrent }) {
  const angle = (index / BEAD_COUNT) * 2 * Math.PI - Math.PI / 2;
  const x = RING_RADIUS * Math.cos(angle);
  const y = RING_RADIUS * Math.sin(angle);

  const scale = useSharedValue(1);
  useEffect(() => {
    if (isCurrent) {
      scale.value = withSequence(withTiming(1.6, { duration: 120 }), withSpring(1, { damping: 8 }));
    }
  }, [isCurrent]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        styles.bead,
        {
          left: RING_SIZE / 2 + x - 7,
          top: RING_SIZE / 2 + y - 7,
          backgroundColor: filled ? "#D4A843" : COLORS.borderLight,
        },
        animStyle,
      ]}
    />
  );
}

export default function TasbeehScreen({ navigation }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [todayData, setTodayData] = useState({ total: 0, byPhrase: {} });
  const [streak, setStreak] = useState(0);
  const [allTime, setAllTime] = useState(0);

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-10);
  const ringOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.92);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 450 });
    headerTranslateY.value = withSpring(0, { damping: 16, stiffness: 100 });
    ringOpacity.value = withDelay(150, withTiming(1, { duration: 500 }));
    ringScale.value = withDelay(150, withSpring(1, { damping: 15, stiffness: 90 }));
  }, []);

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));
  const ringAnimStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const phrase = DHIKR_PRESETS[phraseIndex];
  const phraseCount = todayData.byPhrase[phrase.id] || 0;
  const filledBeads = phraseCount % BEAD_COUNT;
  const round = Math.floor(phraseCount / BEAD_COUNT) + 1;

  const pulseScale = useSharedValue(1);
  const centerPulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  const refresh = useCallback(async () => {
    setTodayData(await getTodayData());
    setStreak((await getStreak()).count);
    setAllTime(await getAllTime());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleTap() {
    pulseScale.value = withSequence(withTiming(0.92, { duration: 80 }), withSpring(1, { damping: 10 }));

    const willComplete = (phraseCount + 1) % BEAD_COUNT === 0;
    if (willComplete) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const { today, streak: s, allTime: a } = await incrementCount(phrase.id, 1);
    setTodayData(today);
    setStreak(s.count);
    setAllTime(a);
  }

  async function handleUndo() {
    if (phraseCount === 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { today, allTime: a } = await incrementCount(phrase.id, -1);
    setTodayData(today);
    setAllTime(a);
  }

  function handleResetToday() {
    Alert.alert("Reset today's count?", "This clears all dhikr counted today. Your streak stays intact.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          await resetToday();
          refresh();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <View style={styles.header}>
        <IslamicPattern width={SCREEN_WIDTH} height={220} color="rgba(255,255,255,0.03)" />

        <SafeAreaView edges={["top"]}>
          <Animated.View style={headerAnimStyle}>
            <View style={styles.headerRow}>
              <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
                <Text style={styles.backArrow}>‹</Text>
              </Pressable>
              <Text style={styles.headerTitle}>Tasbeeh</Text>
              <Pressable onPress={handleResetToday} hitSlop={12}>
                <Text style={styles.resetText}>Reset</Text>
              </Pressable>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <View style={styles.statChipDot} />
                <View>
                  <Text style={styles.statValue}>{streak}</Text>
                  <Text style={styles.statLabel}>day streak</Text>
                </View>
              </View>
              <View style={styles.statChip}>
                <View style={[styles.statChipDot, { backgroundColor: COLORS.primary }]} />
                <View>
                  <Text style={styles.statValue}>{todayData.total}</Text>
                  <Text style={styles.statLabel}>today</Text>
                </View>
              </View>
              <View style={styles.statChip}>
                <View style={[styles.statChipDot, { backgroundColor: "rgba(255,255,255,0.4)" }]} />
                <View>
                  <Text style={styles.statValue}>{allTime}</Text>
                  <Text style={styles.statLabel}>all time</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>

      {/* Phrase selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.phraseScroll}
        contentContainerStyle={styles.phraseRow}
      >
        {DHIKR_PRESETS.map((p, i) => (
          <Pressable
            key={p.id}
            style={[styles.phraseChip, i === phraseIndex && styles.phraseChipActive]}
            onPress={() => setPhraseIndex(i)}
          >
            <Text style={[styles.phraseChipText, i === phraseIndex && styles.phraseChipTextActive]}>
              {p.translit}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Bead ring + tap zone */}
      <View style={styles.ringWrap}>
        <View style={{ width: RING_SIZE, height: RING_SIZE }}>
          {Array.from({ length: BEAD_COUNT }).map((_, i) => (
            <Bead key={i} index={i} filled={i < filledBeads} isCurrent={i === filledBeads - 1} />
          ))}

          <Pressable style={styles.centerTap} onPress={handleTap} onLongPress={handleUndo}>
            <Animated.View style={[styles.centerContent, centerPulseStyle]}>
              <Text style={styles.arabicText}>{phrase.arabic}</Text>
              <Text style={styles.countText}>{filledBeads === 0 ? BEAD_COUNT : filledBeads}</Text>
              <Text style={styles.roundText}>Round {round}</Text>
            </Animated.View>
          </Pressable>
        </View>
      </View>

      <Text style={styles.meaningText}>{phrase.meaning}</Text>
      <Text style={styles.hintText}>Tap the circle to count · long-press to undo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.dark, paddingBottom: 20, overflow: "hidden" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backArrow: { fontSize: 30, color: COLORS.white, fontWeight: "300" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: COLORS.white },
  resetText: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.6)" },

  statsRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 20, paddingHorizontal: 16 },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
  },
  statChipDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#D4A843" },
  statValue: { fontSize: 15, fontWeight: "800", color: COLORS.white },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 1, fontWeight: "500" },

  phraseScroll: {
    // flexGrow: 0,
    maxHeight: 200
  },

  phraseRow: { paddingHorizontal: 16, paddingVertical: 18, gap: 8 },
  phraseChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  phraseChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  phraseChipText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  phraseChipTextActive: { color: COLORS.white },

  ringWrap: { alignItems: "center", justifyContent: "center", marginTop: 12 },
  bead: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  centerTap: {
    position: "absolute",
    top: RING_SIZE / 2 - 80,
    left: RING_SIZE / 2 - 80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    elevation: 3,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  centerContent: { alignItems: "center" },
  arabicText: { fontSize: 15, color: COLORS.textMuted, marginBottom: 4 },
  countText: { fontSize: 42, fontWeight: "800", color: COLORS.textPrimary },
  roundText: { fontSize: 11, fontWeight: "600", color: COLORS.primary, marginTop: 2 },

  meaningText: {
    textAlign: "center",
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 28,
    paddingHorizontal: 40,
  },
  hintText: {
    textAlign: "center",
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 10,
  },
});