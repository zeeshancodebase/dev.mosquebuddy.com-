// src/components/VenueMapMarker.js
//
// Custom-built mosque map marker — not a generic teardrop with an emoji.
// The silhouette is a pointed arch (nod to mihrab/iwan archways) so the
// shape itself reads as "mosque" before the glyph even registers. Trust
// state is communicated two ways, not just color, for accessibility:
//   - verified / community_updated / needs_update → solid fill, gradient
//   - pending_review                              → hollow outline only
// A hand-drawn crescent glyph sits in a recessed disc near the crown.
// Selected state gets a soft breathing halo + scale, not just a resize.

import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { COLORS } from "../constants";

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const TRUST = {
  verified: { base: COLORS.primary, light: "#34D399" },
  community_updated: { base: "#B8892F", light: "#E3B85C" },
  needs_update: { base: "#B45309", light: "#DB8A3F" },
  pending_review: { base: "#8B95A1", light: "#8B95A1" },
};

const W = 36;
const H = 46;

// Pointed-arch pin silhouette: a mihrab-style arch that tapers to a
// single anchor point at the bottom, drawn as one closed bezier path.
const PIN_PATH = `
  M 18 0
  C 8.5 0 1.5 7.2 1.5 16.5
  C 1.5 22 4.3 26.6 8.6 31.6
  C 11.9 35.4 15.3 39.3 18 46
  C 20.7 39.3 24.1 35.4 27.4 31.6
  C 31.7 26.6 34.5 22 34.5 16.5
  C 34.5 7.2 27.5 0 18 0
  Z
`;

export default function VenueMapMarker({ verificationStatus, selected = false }) {
  const trust = TRUST[verificationStatus] || TRUST.pending_review;
  const isHollow = verificationStatus === "pending_review";

  const scale = useSharedValue(1);
  const breathe = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.18 : 1, { damping: 11, stiffness: 140 });
    if (selected) {
      breathe.value = withRepeat(
        withSequence(
          withTiming(1.35, { duration: 900 }),
          withTiming(1.05, { duration: 900 })
        ),
        -1,
        true
      );
    } else {
      breathe.value = withTiming(1, { duration: 200 });
    }
  }, [selected]);

  const pinAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const haloAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
    opacity: selected ? 0.28 : 0,
  }));

  const gradId = `grad-${verificationStatus || "default"}`;

  return (
    <View style={styles.wrapper}>
      {selected && (
        <Animated.View
          style={[
            styles.halo,
            { backgroundColor: trust.base, borderRadius: W },
            haloAnimStyle,
          ]}
        />
      )}

      <Animated.View style={pinAnimStyle}>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={trust.light} />
              <Stop offset="1" stopColor={trust.base} />
            </LinearGradient>
          </Defs>

          {/* Arch body */}
          <Path
            d={PIN_PATH}
            fill={isHollow ? COLORS.white : `url(#${gradId})`}
            stroke={trust.base}
            strokeWidth={isHollow ? 2.25 : 1.5}
            strokeOpacity={isHollow ? 1 : 0.4}
          />

          {/* Recessed disc for the glyph */}
          <Circle
            cx={18}
            cy={15.5}
            r={9}
            fill={isHollow ? "transparent" : "rgba(255,255,255,0.94)"}
          />

          {/* Hand-drawn crescent glyph — two overlapping arcs, not a font glyph */}
          <Path
            d="
              M 21.5 9.2
              A 7 7 0 1 0 21.5 21.8
              A 5.6 5.6 0 1 1 21.5 9.2
              Z
            "
            fill={isHollow ? trust.base : trust.base}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: W,
    height: H,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  halo: {
    position: "absolute",
    width: W * 1.3,
    height: W * 1.3,
    top: 6,
  },
});

// // src/components/VenueMapMarker.js
// //
// // Custom map pin for a mosque venue. A small minaret-silhouette badge
// // rather than the default red teardrop pin — keeps the map on-brand.
// // Color reflects verification trust, same logic as VerificationBadge,
// // so a glance at the map already tells the user which pins to trust.

// import React from "react";
// import { View, Text, StyleSheet } from "react-native";
// import { COLORS } from "../constants";

// const TRUST_COLORS = {
//   verified: COLORS.primary,        // emerald
//   community_updated: "#D4A843",    // gold
//   needs_update: "#B45309",         // amber/warning
//   pending_review: COLORS.textMuted,
// };

// export default function VenueMapMarker({ verificationStatus, selected = false }) {
//   const color = TRUST_COLORS[verificationStatus] || COLORS.textMuted;

//   return (
//     <View style={styles.wrapper}>
//       <View
//         style={[
//           styles.pin,
//           { backgroundColor: color },
//           selected && styles.pinSelected,
//         ]}
//       >
//         <Text style={styles.pinIcon}>🕌</Text>
//       </View>
//       <View style={[styles.pinTail, { borderTopColor: color }]} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   wrapper: { alignItems: "center" },
//   pin: {
//     width: 34,
//     height: 34,
//     borderRadius: 17,
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 2,
//     borderColor: COLORS.white,
//     elevation: 4,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3,
//   },
//   pinSelected: {
//     width: 42,
//     height: 42,
//     borderRadius: 21,
//     borderWidth: 3,
//   },
//   pinIcon: { fontSize: 15 },
//   pinTail: {
//     width: 0,
//     height: 0,
//     borderLeftWidth: 5,
//     borderRightWidth: 5,
//     borderTopWidth: 7,
//     borderLeftColor: "transparent",
//     borderRightColor: "transparent",
//     marginTop: -2,
//   },
// });