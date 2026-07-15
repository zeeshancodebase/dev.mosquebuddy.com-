// client\mobile\src\components\JumuahCard.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import { COLORS, VERIFICATION_STATUS } from "../constants";
import VerificationBadge from "./VerificationBadge";

export default function JumuahCard({ slot, index, onPress }) {
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      index * 90,
      withSpring(0, { damping: 18, stiffness: 90 })
    );
    opacity.value = withDelay(
      index * 90,
      withTiming(1, { duration: 400 })
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const verificationConfig =
    VERIFICATION_STATUS[slot.verificationStatus] ||
    VERIFICATION_STATUS.pending_review;

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={styles.slotCard}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {/* Left accent */}
        <View
          style={[
            styles.slotAccent,
            { backgroundColor: verificationConfig.color },
          ]}
        />

        <View style={styles.slotContent}>
          {/* Top row */}
          <View style={styles.slotTopRow}>
            <View style={styles.slotNameContainer}>
              <Text style={styles.slotVenueName} numberOfLines={1}>
                {slot.venueName}
              </Text>
              <Text style={styles.slotMeta}>
                {slot.area}
                {slot.distance ? ` · ${slot.distance}` : ""}
              </Text>
            </View>
            <VerificationBadge status={slot.verificationStatus} size="sm" />
          </View>

          {/* Divider */}
          <View style={styles.slotDivider} />

          {/* Times row */}
          <View style={styles.timesRow}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeBlockLabel}>Khutbah</Text>
              <Text style={styles.timeBlockValue}>{slot.khutbahTime}</Text>
            </View>

            <View style={styles.timeBlockDivider} />

            <View style={styles.timeBlock}>
              <Text style={styles.timeBlockLabel}>Jamā'ah</Text>
              <Text style={[styles.timeBlockValue, styles.jamaahTime]}>
                {slot.jamaahTime}
              </Text>
            </View>

            <View style={styles.timeBlockDivider} />

            <View style={styles.timeBlock}>
              <Text style={styles.timeBlockLabel}>Language</Text>
              <Text style={styles.timeBlockValue}>{slot.khutbahLanguage}</Text>
            </View>
          </View>

          {/* Bottom row — badges + directions */}
          <View style={styles.slotBottomRow}>
            <View style={styles.slotBadges}>
              {slot.womenPrayerSpace === "available" && (
                <View style={styles.womenBadge}>
                  <Text style={styles.womenBadgeText}>🧕 Women</Text>
                </View>
              )}
              {slot.importantNotice && (
                <View style={styles.noticeBadge}>
                  <Text style={styles.noticeBadgeText}>⚠ Notice</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.directionsLink}
              activeOpacity={0.7}
              onPress={onPress}
            >
              <Text style={styles.directionsLinkText}>Directions →</Text>
            </TouchableOpacity>
          </View>

          {/* Important notice */}
          {slot.importantNotice && (
            <View style={styles.noticeRow}>
              <Text style={styles.noticeText}>⚠ {slot.importantNotice}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}


const styles = StyleSheet.create({



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

  // ── Bottom Row ──
  slotBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slotBadges: {
    flexDirection: "row",
    alignItems: "center",
  },
  womenBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 6,
  },
  womenBadgeText: {
    fontSize: 11,
    color: "#92400E",
    fontWeight: "600",
  },
  noticeBadge: {
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  noticeBadgeText: {
    fontSize: 11,
    color: "#D97706",
    fontWeight: "600",
  },
  directionsLink: {
    paddingVertical: 4,
  },
  directionsLinkText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "700",
  },

  // ── Notice ──
  noticeRow: {
    marginTop: 10,
    backgroundColor: "#FFFBEB",
    borderRadius: 8,
    padding: 8,
  },
  noticeText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "500",
  },
});