import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import ActionTile from "./ActionTile";
import { getStreak } from "../lib/tasbeehStorage";

export default function TasbeehActionTile({ navigation }) {
  const [streak, setStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const s = await getStreak();
        setStreak(s.count);
      })();
    }, [])
  );

  return (
    <ActionTile
      icon="📿"
      title="Tasbeeh"
      accent="#D4A843"
      badge={streak > 0 ? `🔥 ${streak}` : null}
      onPress={() => navigation.navigate("Tasbeeh")}
    />
  );
}