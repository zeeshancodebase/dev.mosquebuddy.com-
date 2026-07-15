// src/components/TimePicker.js
//
// Custom drum-roll time picker. Three scrollable columns: Hour (1-12),
// Minute (00, 05...55), Period (AM/PM). Presented in a bottom-sheet
// modal. onChange fires with a "HH:mm" 24-hour string ready for the backend.
//
// No native modules, no extra packages — works in the current dev client
// without any rebuild.

import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { COLORS } from "../constants";

const ITEM_HEIGHT = 52;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ── Data ─────────────────────────────────────────────────────
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0")
);
const PERIODS = ["AM", "PM"];

// ── Helpers ───────────────────────────────────────────────────
function to24Hour(hour12, minute, period) {
  let h = parseInt(hour12, 10);
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

function from24Hour(hhmm) {
  if (!hhmm) return { hour: "5", minute: "00", period: "AM" };
  const [hStr, mStr] = hhmm.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  if (h > 12) h -= 12;
  // Snap minute to nearest 5
  const rawMin = parseInt(mStr, 10);
  const snappedMin = Math.round(rawMin / 5) * 5;
  const minute = String(snappedMin % 60).padStart(2, "0");
  return { hour: String(h), minute, period };
}

// ── Single drum-roll column ────────────────────────────────────
function DrumColumn({ items, selectedIndex, onSelect }) {
  const scrollRef = useRef(null);

  // Scroll to selected item on mount and when selectedIndex changes externally
  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
    }, 50);
    return () => clearTimeout(timeout);
  }, []);

 function handleScrollEnd(e) {
  const y = e.nativeEvent.contentOffset.y;
  const index = Math.round(y / ITEM_HEIGHT);
  const clamped = Math.max(0, Math.min(index, items.length - 1));

  if (clamped !== selectedIndex) {
    onSelect(clamped);
  }
}

  return (
    <View style={styles.columnWrapper}>
      <ScrollView
        ref={scrollRef}
        style={styles.column}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScroll={(e) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, items.length - 1));

    if (clamped !== selectedIndex) {
      onSelect(clamped);
    }
  }}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={styles.columnContent}
        scrollEventThrottle={16}
        nestedScrollEnabled
      >
        {/* Top padding so first item centers */}
        <View style={{ height: ITEM_HEIGHT * 2 }} />

        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <TouchableOpacity
              key={item}
              style={styles.columnItem}
              onPress={() => {
                onSelect(index);
                scrollRef.current?.scrollTo({
                  y: index * ITEM_HEIGHT,
                  animated: true,
                });
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.columnItemText,
                  isSelected && styles.columnItemTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Bottom padding so last item centers */}
        <View style={{ height: ITEM_HEIGHT * 2 }} />
      </ScrollView>
    </View>
  );
}

// ── Bottom sheet modal wrapper ─────────────────────────────────
export default function TimePicker({
  visible,
  value,          // "HH:mm" 24h string, or null
  label = "Select Time",
  onConfirm,      // (hhmm: string) => void
  onCancel,
}) {
  const initial = from24Hour(value);
  const [hourIdx, setHourIdx] = useState(
    HOURS.indexOf(initial.hour) >= 0 ? HOURS.indexOf(initial.hour) : 4 // default 5
  );
  const [minuteIdx, setMinuteIdx] = useState(
    MINUTES.indexOf(initial.minute) >= 0 ? MINUTES.indexOf(initial.minute) : 0
  );
  const [periodIdx, setPeriodIdx] = useState(
    initial.period === "PM" ? 1 : 0
  );

  // Reset to value whenever picker opens
  useEffect(() => {
    if (visible) {
      const parsed = from24Hour(value);
      const hIdx = HOURS.indexOf(parsed.hour);
      const mIdx = MINUTES.indexOf(parsed.minute);
      setHourIdx(hIdx >= 0 ? hIdx : 4);
      setMinuteIdx(mIdx >= 0 ? mIdx : 0);
      setPeriodIdx(parsed.period === "PM" ? 1 : 0);
    }
  }, [visible, value]);

  // Sheet slide animation
  const translateY = useSharedValue(300);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 40,
        stiffness: 300,
        mass: 1,
      });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(300, {
        duration: 220,
        easing: Easing.in(Easing.ease),
      });
      backdropOpacity.value = withTiming(0, { duration: 220 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  function handleConfirm() {
    const hhmm = to24Hour(HOURS[hourIdx], MINUTES[minuteIdx], PERIODS[periodIdx]);
    onConfirm(hhmm);
  }

  const previewTime = `${HOURS[hourIdx]}:${MINUTES[minuteIdx]} ${PERIODS[periodIdx]}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onCancel} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, sheetStyle]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <TouchableOpacity onPress={onCancel} activeOpacity={0.7} style={styles.headerAction}>
            <Text style={styles.headerCancel}>Cancel</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.sheetLabel}>{label}</Text>
            <Text style={styles.sheetPreview}>{previewTime}</Text>
          </View>

          <TouchableOpacity onPress={handleConfirm} activeOpacity={0.7} style={styles.headerAction}>
            <Text style={styles.headerConfirm}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Drum columns */}
        <View style={styles.drumContainer}>
          {/* Selection highlight band — sits behind columns */}
          <View pointerEvents="none" style={styles.selectionBand} />

          {/* Top fade overlay */}
          <View pointerEvents="none" style={styles.fadeTop} />
          {/* Bottom fade overlay */}
          <View pointerEvents="none" style={styles.fadeBottom} />

          {/* Hour */}
          <DrumColumn
            items={HOURS}
            selectedIndex={hourIdx}
            onSelect={setHourIdx}
          />

          {/* Separator */}
          <Text style={styles.separator}>:</Text>

          {/* Minute */}
          <DrumColumn
            items={MINUTES}
            selectedIndex={minuteIdx}
            onSelect={setMinuteIdx}
          />

          {/* Period */}
          <DrumColumn
            items={PERIODS}
            selectedIndex={periodIdx}
            onSelect={setPeriodIdx}
          />
        </View>

        {/* Bottom safe area padding */}
        <View style={{ height: Platform.OS === "ios" ? 28 : 16 }} />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // ── Modal ──
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },

  // ── Header ──
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerAction: { minWidth: 60 },
  headerCenter: { alignItems: "center", flex: 1 },
  sheetLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sheetPreview: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  headerCancel: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  headerConfirm: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: "700",
    textAlign: "right",
  },

  // ── Drum ──
  drumContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: PICKER_HEIGHT,
    paddingHorizontal: 16,
    overflow: "hidden",
  },

  // Center highlight band
  selectionBand: {
    position: "absolute",
    top: ITEM_HEIGHT * 2,          // center of 5 visible items (0-indexed: item 2)
    left: 16,
    right: 16,
    height: ITEM_HEIGHT,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary + "40", // emerald at 25% opacity
  },

  // Fade overlays — stacked semi-transparent strips that simulate a gradient
  // without needing expo-linear-gradient.
  fadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    backgroundColor: COLORS.card,
    opacity: 0.72,
    zIndex: 2,
    // Pointer events are "none" (set on View props above) so taps pass through
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 2,
    backgroundColor: COLORS.card,
    opacity: 0.72,
    zIndex: 2,
  },

  // ── Columns ──
  columnWrapper: {
    flex: 1,
    height: PICKER_HEIGHT,
    overflow: "hidden",
  },
  column: {
    flex: 1,
  },
  columnContent: {
    alignItems: "center",
  },
  columnItem: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  columnItemText: {
    fontSize: 20,
    fontWeight: "500",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  columnItemTextSelected: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  // ── Separator ──
  separator: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.textPrimary,
    paddingHorizontal: 4,
    marginBottom: 4,
    zIndex: 3,
  },
});