import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { COLORS, APP_CONFIG } from "../constants";

function CrescentStarMark({ size = 38, color = "#D4A843" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M27 8C19.8 9.6 14.5 16 14.5 23.6c0 8.9 7.2 16.1 16.1 16.1 3.5 0 6.7-1.1 9.4-3-3.4 4.4-8.7 7.3-14.7 7.3C14.6 44 6 35.4 6 24.7 6 15 13 6.9 22.2 5.2c1.7-.3 3.4-.4 5-.3-.1 1-.2 2.1-.2 3.1Z"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Path
        d="M38 6l1.3 3.9L43 11l-3.7 1.1L38 16l-1.3-3.9L33 11l3.7-1.1L38 6Z"
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const TAGLINES = [
  "Every step toward the masjid is a step worth taking.",
  "Wherever you are, may Jamā'ah find you on time.",
  "Small steps to the masjid — counted, every time.",
];

export default function BrandMoment({ tagline, style }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(150, withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) }));
    translateY.value = withDelay(150, withTiming(0, { duration: 700, easing: Easing.out(Easing.ease) }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const line = tagline || TAGLINES[new Date().getDate() % TAGLINES.length];

  return (
    <Animated.View style={[styles.wrap, animStyle, style]}>
      <View style={styles.iconWrap}>
        <CrescentStarMark />
      </View>
      <Text style={styles.tagline}>{line}</Text>
      <View style={styles.signatureRow}>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureText}>
          {APP_CONFIG.name}{"\n"}
          {APP_CONFIG.nameArabic ? `  ${APP_CONFIG.nameArabic}` : ""}
        </Text>
        <View style={styles.signatureLine} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    // paddingVertical: 36,
    paddingHorizontal: 25,
    paddingBottom:80,
  },
  iconWrap: {
    marginBottom: 14,
    opacity: 0.85,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
    maxWidth: 260,
    marginBottom: 16,
  },
  signatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  signatureLine: {
    width: 25,
    height: 2,
    backgroundColor: COLORS.borderLight,
  },
  signatureText: {
    fontSize: 25,
    fontWeight: "700",
    // color: COLORS.textMuted,
    color: "#d4a843ab",
    letterSpacing: 1.2,
  },
});