import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { COLORS } from "../constants";
import { useActionFlowState } from "../lib/actionFlow";

export default function ActionFlowModal() {
  const state = useActionFlowState();
  if (!state.visible) return null;
  const { phase, title, message } = state;

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {phase === "confirm" && (
            <>
              <Text style={styles.title}>{title}</Text>
              {!!message && <Text style={styles.message}>{message}</Text>}
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={state.onCancel} activeOpacity={0.85}>
                  <Text style={styles.cancelText}>{state.cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, state.destructive && styles.destructiveBtn]}
                  onPress={state.onConfirmPress}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmText}>{state.confirmText}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {phase === "loading" && (
            <View style={styles.centerBlock}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>{title}</Text>
            </View>
          )}

          {phase === "success" && (
            <View style={styles.centerBlock}>
              <View style={styles.successCircle}>
                <Text style={styles.successCheck}>✓</Text>
              </View>
              <Text style={styles.title}>{title}</Text>
              {!!message && <Text style={styles.message}>{message}</Text>}
            </View>
          )}

          {phase === "error" && (
            <View style={styles.centerBlock}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.title}>{title}</Text>
              {!!message && <Text style={styles.message}>{message}</Text>}
              <TouchableOpacity style={styles.confirmBtn} onPress={state.onDismiss} activeOpacity={0.85}>
                <Text style={styles.confirmText}>OK</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", paddingHorizontal: 28 },
  card: { width: "100%", backgroundColor: "#fff", borderRadius: 16, padding: 22 },
  title: { fontSize: 17, fontWeight: "700", color: "#111827", textAlign: "center" },
  message: { fontSize: 14, color: "#6B7280", textAlign: "center", marginTop: 6, lineHeight: 20 },
  actionsRow: { flexDirection: "row", marginTop: 18 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "#F3F4F6", alignItems: "center", marginRight: 10 },
  cancelText: { color: "#374151", fontWeight: "600" },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: "center" },
  destructiveBtn: { backgroundColor: "#DC2626" },
  confirmText: { color: "#fff", fontWeight: "700" },
  centerBlock: { alignItems: "center", paddingVertical: 8 },
  loadingText: { marginTop: 14, fontSize: 14, color: "#374151" },
  successCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  successCheck: { fontSize: 28, color: "#059669", fontWeight: "700" },
  errorIcon: { fontSize: 40, marginBottom: 8 },
});