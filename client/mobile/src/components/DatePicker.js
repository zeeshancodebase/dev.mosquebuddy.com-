// src/components/DatePicker.js
//
// Custom drum-roll date picker, styled to match TimePicker.js exactly.
// Three columns: Day (1-31), Month (Jan-Dec), Year (current-1 to current+1).
// No native modules — no dev client rebuild required.

import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform,
} from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing,
} from "react-native-reanimated";
import { COLORS } from "../constants";

const ITEM_HEIGHT = 52;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(String);

function toDateString(day, monthIdx, year) {
  const mm = String(monthIdx + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function fromDateString(dateStr) {
  if (!dateStr) {
    const now = new Date();
    return { day: String(now.getDate()), monthIdx: now.getMonth(), year: String(now.getFullYear()) };
  }
  const [y, m, d] = dateStr.split("-");
  return { day: String(parseInt(d, 10)), monthIdx: parseInt(m, 10) - 1, year: y };
}

function DrumColumn({ items, selectedIndex, onSelect }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    }, 50);
    return () => clearTimeout(timeout);
  }, []);

  function handleScrollEnd(e) {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    if (clamped !== selectedIndex) onSelect(clamped);
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
          if (clamped !== selectedIndex) onSelect(clamped);
        }}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={styles.columnContent}
        scrollEventThrottle={16}
        nestedScrollEnabled
      >
        <View style={{ height: ITEM_HEIGHT * 2 }} />
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <TouchableOpacity
              key={item}
              style={styles.columnItem}
              onPress={() => {
                onSelect(index);
                scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.columnItemText, isSelected && styles.columnItemTextSelected]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: ITEM_HEIGHT * 2 }} />
      </ScrollView>
    </View>
  );
}

export default function DatePicker({
  visible, value, label = "Select Date", onConfirm, onCancel,
}) {
  const initial = fromDateString(value);
  const [dayIdx, setDayIdx] = useState(DAYS.indexOf(initial.day) >= 0 ? DAYS.indexOf(initial.day) : 0);
  const [monthIdx, setMonthIdx] = useState(initial.monthIdx);
  const [yearIdx, setYearIdx] = useState(YEARS.indexOf(initial.year) >= 0 ? YEARS.indexOf(initial.year) : 1);

  useEffect(() => {
    if (visible) {
      const parsed = fromDateString(value);
      setDayIdx(DAYS.indexOf(parsed.day) >= 0 ? DAYS.indexOf(parsed.day) : 0);
      setMonthIdx(parsed.monthIdx);
      setYearIdx(YEARS.indexOf(parsed.year) >= 0 ? YEARS.indexOf(parsed.year) : 1);
    }
  }, [visible, value]);

  const translateY = useSharedValue(300);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 40, stiffness: 300, mass: 1 });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(300, { duration: 220, easing: Easing.in(Easing.ease) });
      backdropOpacity.value = withTiming(0, { duration: 220 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  function handleConfirm() {
    onConfirm(toDateString(parseInt(DAYS[dayIdx], 10), monthIdx, YEARS[yearIdx]));
  }

  const previewText = `${DAYS[dayIdx]} ${MONTH_LABELS[monthIdx]} ${YEARS[yearIdx]}`;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onCancel} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <TouchableOpacity onPress={onCancel} activeOpacity={0.7} style={styles.headerAction}>
            <Text style={styles.headerCancel}>Cancel</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.sheetLabel}>{label}</Text>
            <Text style={styles.sheetPreview}>{previewText}</Text>
          </View>
          <TouchableOpacity onPress={handleConfirm} activeOpacity={0.7} style={styles.headerAction}>
            <Text style={styles.headerConfirm}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.drumContainer}>
          <View pointerEvents="none" style={styles.selectionBand} />
          <View pointerEvents="none" style={styles.fadeTop} />
          <View pointerEvents="none" style={styles.fadeBottom} />

          <DrumColumn items={DAYS} selectedIndex={dayIdx} onSelect={setDayIdx} />
          <DrumColumn items={MONTH_LABELS} selectedIndex={monthIdx} onSelect={setMonthIdx} />
          <DrumColumn items={YEARS} selectedIndex={yearIdx} onSelect={setYearIdx} />
        </View>

        <View style={{ height: Platform.OS === "ios" ? 28 : 16 }} />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    elevation: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.borderLight, alignSelf: "center", marginTop: 10, marginBottom: 4 },

  sheetHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  headerAction: { minWidth: 60 },
  headerCenter: { alignItems: "center", flex: 1 },
  sheetLabel: { fontSize: 12, fontWeight: "600", color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  sheetPreview: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary },
  headerCancel: { fontSize: 15, color: COLORS.textMuted, fontWeight: "500" },
  headerConfirm: { fontSize: 15, color: COLORS.primary, fontWeight: "700", textAlign: "right" },

  drumContainer: { flexDirection: "row", alignItems: "center", height: PICKER_HEIGHT, paddingHorizontal: 16, overflow: "hidden" },
  selectionBand: {
    position: "absolute", top: ITEM_HEIGHT * 2, left: 16, right: 16, height: ITEM_HEIGHT,
    backgroundColor: COLORS.primaryLight, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.primary + "40",
  },
  fadeTop: { position: "absolute", top: 0, left: 0, right: 0, height: ITEM_HEIGHT * 2, backgroundColor: COLORS.card, opacity: 0.72, zIndex: 2 },
  fadeBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: ITEM_HEIGHT * 2, backgroundColor: COLORS.card, opacity: 0.72, zIndex: 2 },

  columnWrapper: { flex: 1, height: PICKER_HEIGHT, overflow: "hidden" },
  column: { flex: 1 },
  columnContent: { alignItems: "center" },
  columnItem: { height: ITEM_HEIGHT, alignItems: "center", justifyContent: "center", width: "100%" },
  columnItemText: { fontSize: 20, fontWeight: "500", color: COLORS.textMuted, letterSpacing: 0.5 },
  columnItemTextSelected: { fontSize: 24, fontWeight: "700", color: COLORS.textPrimary },
});