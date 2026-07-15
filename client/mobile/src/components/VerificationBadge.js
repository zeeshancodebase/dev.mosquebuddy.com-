import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { VERIFICATION_STATUS } from "../constants";

export default function VerificationBadge({ status, showDot = true, size = "md" }) {
  const config = VERIFICATION_STATUS[status] || VERIFICATION_STATUS.pending_review;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        styles[`size_${size}`],
      ]}
    >
      {showDot && (
        <View
          style={[
            styles.dot,
            { backgroundColor: config.color },
            size === "sm" && styles.dotSm,
          ]}
        />
      )}
      <Text
        style={[
          styles.label,
          { color: config.color },
          size === "sm" && styles.labelSm,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  size_sm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  size_md: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  size_lg: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotSm: {
    width: 5,
    height: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  labelSm: {
    fontSize: 11,
  },
});