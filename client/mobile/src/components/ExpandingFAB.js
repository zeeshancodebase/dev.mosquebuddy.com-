// src/components/ExpandingFAB.js
import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import React, { useEffect, useRef } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { COLORS } from "../constants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const HOLD_MS = 3500;
const ENTER_DELAY = 500;

const PILL_PADDING_LEFT = 18;   // space before the text
const PILL_PADDING_RIGHT = 15;  // space after the text, before it tucks under the circle
const TEXT_SAFETY_BUFFER = 6;   // absorbs measurement/rounding drift so ellipsis never triggers

export default function ExpandingFAB({
  icon: Icon,
  label,
  onPress,
  bottom = 24,
  right = 20,
  size = 56,
  backgroundColor = COLORS.dark,
  iconColor = COLORS.white,
}) {
  const measuredTextWidth = useRef(0);
  const overlap = size / 2; // how far the circle tucks into the pill's tail

  const scale = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const labelOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(ENTER_DELAY, withSpring(1, { damping: 14, stiffness: 120 }));
  }, []);

  function expandPill(width) {
    const fullWidth =
      PILL_PADDING_LEFT + width + TEXT_SAFETY_BUFFER + PILL_PADDING_RIGHT + overlap;
    const maxAllowed = SCREEN_WIDTH - right - size - 24;
    const targetWidth = Math.min(fullWidth, maxAllowed);

    pillWidth.value = withSequence(
      withTiming(targetWidth, { duration: 320, easing: Easing.out(Easing.ease) }),
      withDelay(HOLD_MS, withTiming(0, { duration: 240 }))
    );

    labelOpacity.value = withSequence(
      withTiming(1, { duration: 220 }),
      withDelay(HOLD_MS, withTiming(0, { duration: 160 }))
    );
  }

  function onLabelMeasured(e) {
    const textWidth = Math.ceil(e.nativeEvent.layout.width);
    if (measuredTextWidth.current) return;
    measuredTextWidth.current = textWidth;

    const openDelay = ENTER_DELAY + 200;
    pillWidth.value = withDelay(openDelay, withTiming(0)); // no-op start, real anim below
    // schedule the first auto-open
    setTimeout(() => expandPill(textWidth), openDelay);
  }

  function onLongPress() {
    if (!measuredTextWidth.current) return; // not measured yet, ignore
    expandPill(measuredTextWidth.current);
  }

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const pillAnimStyle = useAnimatedStyle(() => ({
    width: pillWidth.value,
    opacity: labelOpacity.value,
    marginRight: -overlap,
  }));

  return (
    <Animated.View style={[styles.wrapper, { bottom, right }, buttonAnimStyle]}>
      <Pressable onPress={onPress} style={styles.pressable} hitSlop={8} onLongPress={onLongPress}
        delayLongPress={350}>
        <Animated.View style={[styles.pill, pillAnimStyle]}>
          {/* flexShrink: 0 + no numberOfLines cap: once the pill is wide enough
              (guaranteed by the buffer above), nothing here is allowed to compress the text */}
          <Text style={styles.pillText} numberOfLines={1}>{label}</Text>
        </Animated.View>
        <View
          style={[
            styles.circle,
            { width: size, height: size, borderRadius: size / 2, backgroundColor },
          ]}
        >
          <Icon size={22} color={iconColor} strokeWidth={2.2} />
        </View>
      </Pressable>

      {/* invisible measuring copy — off-screen, never seen by user, no width constraint */}
      <Text style={[styles.pillText, styles.measure]} onLayout={onLabelMeasured}>
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    alignItems: "flex-end",
    zIndex: 20,
  },
  pressable: {
    flexDirection: "row",
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    backgroundColor: COLORS.dark,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    paddingLeft: PILL_PADDING_LEFT,
    paddingRight: PILL_PADDING_RIGHT,
    overflow: "hidden",
  },
  pillText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 0,      // never let Yoga compress this to fit — width is already guaranteed
    includeFontPadding: false, // Android: removes extra vertical font metrics that can skew measurement
  },
  circle: {
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  measure: {
    position: "absolute",
    opacity: 0,
    left: -9999,
  },
});