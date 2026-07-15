import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants";

export default function ScreenHeader({
  title,
  subtitle = null,
  onBack = null,
  rightAction = null,
  dark = false,
  style = {},
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        dark ? styles.containerDark : styles.containerLight,
        { paddingTop: insets.top + 12 },
        style,
      ]}
    >
      <View style={styles.row}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.backIcon,
                dark ? styles.backIconDark : styles.backIconLight,
              ]}
            >
              ←
            </Text>
          </TouchableOpacity>
        )}

        <View style={[styles.titleContainer, !onBack && styles.titleNoBack]}>
          <Text
            style={[
              styles.title,
              dark ? styles.titleDark : styles.titleLight,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                dark ? styles.subtitleDark : styles.subtitleLight,
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {rightAction && (
          <View style={styles.rightAction}>{rightAction}</View>
        )}

        {!rightAction && onBack && <View style={styles.rightPlaceholder} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  containerLight: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  containerDark: {
    backgroundColor: COLORS.dark,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 20,
    fontWeight: "600",
  },
  backIconLight: {
    color: COLORS.textPrimary,
  },
  backIconDark: {
    color: COLORS.white,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  titleNoBack: {
    marginLeft: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  titleLight: {
    color: COLORS.textPrimary,
  },
  titleDark: {
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  subtitleLight: {
    color: COLORS.textMuted,
  },
  subtitleDark: {
    color: COLORS.primaryMid,
  },
  rightAction: {
    alignItems: "flex-end",
  },
  rightPlaceholder: {
    width: 38,
  },
});