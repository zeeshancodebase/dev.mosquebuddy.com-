import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, PRAYER_NAMES } from "../constants";

export default function PrayerTimingRow({
  prayer,
  isNext = false,
  style = {},
}) {
  const prayerLabel =
    PRAYER_NAMES[prayer.prayerName] || prayer.prayerName;

  return (
    <View
      style={[
        styles.row,
        isNext && styles.rowHighlighted,
        style,
      ]}
    >
      {/* Prayer name */}
      <View style={styles.nameContainer}>
        {isNext && <View style={styles.nextDot} />}
        <Text
          style={[styles.prayerName, isNext && styles.prayerNameNext]}
        >
          {prayerLabel}
        </Text>
      </View>

      {/* Times */}
      <View style={styles.timesContainer}>
        {prayer.azaanTime && (
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Azaan</Text>
            <Text style={[styles.timeValue, styles.azaanTime]}>
              {prayer.azaanTime}
            </Text>
          </View>
        )}

        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Jamā'ah</Text>
          <Text
            style={[
              styles.timeValue,
              isNext && styles.timeValueNext,
            ]}
          >
            {prayer.timingType === "relative"
              ? prayer.relativeTimeText
              : prayer.jamaahTime || "—"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  rowHighlighted: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    borderBottomWidth: 0,
    marginVertical: 4,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  nextDot: {
    width: 8,
    height: 8,
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
  timesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  timeBlock: {
    alignItems: "flex-end",
  },
  timeLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
    fontWeight: "500",
  },
  timeValue: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  azaanTime: {
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  timeValueNext: {
    color: COLORS.primary,
  },
});