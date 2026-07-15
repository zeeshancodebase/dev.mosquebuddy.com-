// src/components/TimingTypeInfoSheet.js
import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { COLORS } from "../constants";

export default function TimingTypeInfoSheet({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Fixed vs Relative Timing</Text>

          <View style={styles.row}>
            <Text style={styles.rowIcon}>🕐</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Fixed Time (FIX)</Text>
              <Text style={styles.rowDesc}>
                An exact clock time. Most prayers use this — e.g. Dhuhr Jamā'ah at 1:30 PM.
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowIcon}>🌇</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Relative Time (REL)</Text>
              <Text style={styles.rowDesc}>
                Described relative to sunset, since the exact clock time shifts daily. Commonly used for Maghrib — e.g. "5 minutes after azaan."
              </Text>
            </View>
          </View>

          <Text style={styles.hint}>
            Tap the Fix / Rel icon on any prayer's row to switch between the two.
          </Text>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.closeBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(12,26,20,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.borderLight, alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 18 },
  row: { flexDirection: "row", marginBottom: 18, alignItems: "flex-start" },
  rowIcon: { fontSize: 22, marginRight: 12, marginTop: 2 },
  rowLabel: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 3 },
  rowDesc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  hint: { fontSize: 12, color: COLORS.textMuted, fontStyle: "italic", marginBottom: 20 },
  closeBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  closeBtnText: { fontSize: 14, fontWeight: "700", color: COLORS.white },
});