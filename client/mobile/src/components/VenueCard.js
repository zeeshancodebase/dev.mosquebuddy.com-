import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { COLORS, VENUE_TYPES, PRAYER_NAMES } from "../constants";
import VerificationBadge from "./VerificationBadge";

export default function VenueCard({ venue, onPress, style = {} }) {
  const nextPrayer = venue.nextPrayer || null;
  const venueTypeLabel = VENUE_TYPES[venue.venueType] || venue.venueType;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🕌</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {venue.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {venueTypeLabel}
            {venue.area?.name ? ` · ${venue.area.name}` : ""}
            {venue.city?.name ? ` · ${venue.city.name}` : ""}
          </Text>
        </View>

        {venue.distance && (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{venue.distance}</Text>
          </View>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Next prayer */}
      {nextPrayer ? (
        <View style={styles.prayerRow}>
          <View style={styles.prayerInfo}>
            <Text style={styles.prayerLabel}>
              {PRAYER_NAMES[nextPrayer.prayerName] || nextPrayer.prayerName}
            </Text>
            <Text style={styles.prayerTime}>{nextPrayer.jamaahTime}</Text>
          </View>

          <View style={styles.prayerRight}>
            <VerificationBadge
              status={nextPrayer.verificationStatus || venue.verificationStatus}
              size="sm"
            />
          </View>
        </View>
      ) : (
        <View style={styles.prayerRow}>
          <Text style={styles.noTimingText}>No timing available</Text>
          <VerificationBadge status={venue.verificationStatus} size="sm" />
        </View>
      )}

      {/* Women prayer space indicator */}
      {venue.womenPrayerSpace && venue.womenPrayerSpace !== "unknown" && (
        <View style={styles.facilityRow}>
          <Text style={styles.facilityText}>
            {venue.womenPrayerSpace === "available"
              ? "✓ Women's prayer space available"
              : venue.womenPrayerSpace === "not_available"
              ? "✗ No women's prayer space"
              : `Women's space: ${venue.womenPrayerSpace.replace(/_/g, " ")}`}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  meta: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  distanceBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 12,
  },
  prayerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  prayerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  prayerLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginRight: 8,
    fontWeight: "500",
  },
  prayerTime: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  prayerRight: {
    alignItems: "flex-end",
  },
  noTimingText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
  facilityRow: {
    marginTop: 10,
  },
  facilityText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});