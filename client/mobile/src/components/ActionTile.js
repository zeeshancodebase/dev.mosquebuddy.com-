import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS } from "../constants";

export default function ActionTile({ icon, title, subtitle, onPress, accent, badge, ...rest }) {
  return (
    <TouchableOpacity
      style={styles.tile}
      onPress={onPress}
      activeOpacity={0.82}
      {...rest}
    >
      <View style={[styles.iconWrap, { backgroundColor: accent + "18" }]}>
        <Text style={styles.iconText}>{icon}</Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: "31%",
    flexGrow: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    elevation: 1,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconText: { fontSize: 21 },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
 badge: {
  position: "absolute",
  top: -6,
  right: -12,
  backgroundColor: "#F59E0B",
  borderRadius: 9,
  paddingHorizontal: 6,
  paddingVertical: 2,
  minWidth: 24, 
  alignItems: "center",
},
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.white,
  },
});