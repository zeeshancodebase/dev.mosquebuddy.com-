import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { COLORS, VENUE_TYPES, VERIFICATION_STATUS, PRAYER_NAMES } from "../constants";

export default function EnhancedVenueCard({ venue, onPress }) {
  const verificationConfig =
    VERIFICATION_STATUS[venue.verificationStatus] ||
    VERIFICATION_STATUS.pending_review;
  const venueTypeLabel = VENUE_TYPES[venue.venueType] || venue.venueType;

  return (
    <TouchableOpacity
      style={styles.venueCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Left accent border */}
      <View
        style={[
          styles.venueAccent,
          { backgroundColor: verificationConfig.color },
        ]}
      />

      <View style={styles.venueContent}>
        {/* Top row */}
        <View style={styles.venueTopRow}>
          <View style={styles.venueNameContainer}>
            <Text style={styles.venueName} numberOfLines={1}>
              {venue.name}
            </Text>
            <Text style={styles.venueMeta} numberOfLines={1}>
              {venueTypeLabel}
              {venue.area?.name ? ` · ${venue.area.name}` : ""}
              {venue.distance ? ` · ${venue.distance}` : ""}
            </Text>
          </View>
          <Text style={styles.venueChevron}>›</Text>
        </View>

        {/* Divider */}
        <View style={styles.venueDivider} />

        {/* Bottom row */}
        <View style={styles.venueBottomRow}>
          <View>
            <Text style={styles.nextJamaahLabel}>
              Next Jamā'ah ·{" "}
              {PRAYER_NAMES[venue.nextPrayer?.prayerName] ||
                venue.nextPrayer?.prayerName}
            </Text>
            <View style={styles.timeRow}>
              <Text style={styles.jamaahTime}>
                {venue.nextPrayer?.jamaahTime || "—"}
              </Text>
              {venue.nextPrayer?.countdown && (
                <View style={styles.countdownPill}>
                  <Text style={styles.countdownPillText}>
                    {venue.nextPrayer.countdown}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.venueBadges}>
            {venue.womenPrayerSpace === "available" && (
              <View style={styles.womenBadge}>
                <Text style={styles.womenBadgeText}>🧕 Women</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  venueCard: {
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
  venueAccent: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  venueContent: {
    flex: 1,
    padding: 14,
  },
  venueTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  venueNameContainer: {
    flex: 1,
    marginRight: 8,
  },
  venueName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  venueMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  venueChevron: {
    fontSize: 20,
    color: COLORS.textMuted,
    fontWeight: "300",
  },
  venueDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginBottom: 10,
  },
  venueBottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  nextJamaahLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "500",
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  jamaahTime: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  countdownPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  countdownPillText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
  },
  venueBadges: {
    alignItems: "flex-end",
  },
  womenBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  womenBadgeText: {
    fontSize: 11,
    color: "#92400E",
    fontWeight: "600",
  },
});