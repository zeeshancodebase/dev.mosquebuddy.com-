// src/components/TasbeehHomeCard.js
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../constants";
import { getTodayData, getStreak } from "../lib/tasbeehStorage";

export default function TasbeehHomeCard({ navigation }) {
  const [today, setToday] = useState(0);
  const [streak, setStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const data = await getTodayData();
        const s = await getStreak();
        setToday(data.total);
        setStreak(s.count);
      })();
    }, [])
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => navigation.navigate("Tasbeeh")}
      android_ripple={{ color: "rgba(212,168,67,0.12)" }}
    >
      <View style={styles.beadIcon}>
        <Text style={styles.beadIconText}>📿</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Tasbeeh Counter</Text>
        <Text style={styles.sub}>
          {today > 0 ? `${today} counted today` : "Start your daily dhikr"}
        </Text>
      </View>

      {streak > 0 && (
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 {streak}</Text>
        </View>
      )}
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    // marginBottom: 14,
    gap: 12,
  },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  beadIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#D4A84318",
    alignItems: "center",
    justifyContent: "center",
  },
  beadIconText: { fontSize: 22 },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 2 },
  sub: { fontSize: 12, color: COLORS.textMuted },
  streakBadge: {
    backgroundColor: "#F59E0B18",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 6,
  },
  streakText: { fontSize: 12, fontWeight: "800", color: "#F59E0B" },
  arrow: { fontSize: 20, color: COLORS.textMuted },
});