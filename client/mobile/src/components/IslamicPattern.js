import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, G, Defs, Pattern, Rect } from "react-native-svg";

export default function IslamicPattern({
  width = 400,
  height = 300,
  color = "rgba(255,255,255,0.06)",
  backgroundColor = "transparent",
}) {
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}>
      <Svg width={width} height={height}>
        <Defs>
          <Pattern
            id="islamicStar"
            x="0"
            y="0"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            {/* 8-pointed Islamic star */}
            <G fill={color} fillRule="evenodd">
              {/* Center star */}
              <Path d="M30 18 L33 27 L42 27 L35 33 L38 42 L30 36 L22 42 L25 33 L18 27 L27 27 Z" />
              {/* Corner quarter stars */}
              <Path d="M0 0 L3 6 L0 12 L6 9 L12 12 L9 6 L12 0 L6 3 Z" />
              <Path d="M60 0 L57 6 L60 12 L54 9 L48 12 L51 6 L48 0 L54 3 Z" />
              <Path d="M0 60 L3 54 L0 48 L6 51 L12 48 L9 54 L12 60 L6 57 Z" />
              <Path d="M60 60 L57 54 L60 48 L54 51 L48 48 L51 54 L48 60 L54 57 Z" />
              {/* Edge diamonds */}
              <Path d="M30 0 L32 4 L30 8 L28 4 Z" />
              <Path d="M30 52 L32 56 L30 60 L28 56 Z" />
              <Path d="M0 30 L4 32 L8 30 L4 28 Z" />
              <Path d="M52 30 L56 32 L60 30 L56 28 Z" />
            </G>
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill="url(#islamicStar)" />
      </Svg>
    </View>
  );
}