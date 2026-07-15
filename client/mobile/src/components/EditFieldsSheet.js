// src/components/EditFieldsSheet.js
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { COLORS } from "../constants";

/**
 * fields: [
 *   { key: 'phone', label: 'Phone', type: 'text' },
 *   { key: 'address', label: 'Address', type: 'text', multiline: true },
 *   { key: 'womenPrayerSpace', label: "Women's Prayer Space", type: 'select',
 *     options: [{ value: 'available', label: 'Available' }, ...] },
 * ]
 */
export default function EditFieldsSheet({
  visible, title, fields, initialValues, saving, onClose, onSave,
}) {
  const [values, setValues] = useState(initialValues || {});

  useEffect(() => {
    if (visible) setValues(initialValues || {});
  }, [visible, initialValues]);

  function setField(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheet}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
            {fields.map((f) => (
              <View key={f.key} style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>{f.label}</Text>

                {f.type === "select" ? (
                  <View style={styles.chipRow}>
                    {f.options.map((opt) => {
                      const active = values[f.key] === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          onPress={() => setField(f.key, opt.value)}
                          style={[styles.chip, active && styles.chipActive]}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <TextInput
                    value={values[f.key] || ""}
                    onChangeText={(t) => setField(f.key, t)}
                    placeholder={f.placeholder || f.label}
                    placeholderTextColor={COLORS.textMuted}
                    multiline={!!f.multiline}
                    style={[styles.input, f.multiline && styles.inputMultiline]}
                  />
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              disabled={saving}
              onPress={() => onSave(values)}
            >
              <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(12,26,20,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.borderLight,
    alignSelf: "center", marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 16 },
  fieldBlock: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, marginBottom: 8, letterSpacing: 0.3 },
  input: {
    borderWidth: 1.5, borderColor: COLORS.borderLight, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: COLORS.textPrimary,
  },
  inputMultiline: { minHeight: 70, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: COLORS.borderLight, backgroundColor: COLORS.background,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
  actionsRow: { flexDirection: "row", gap: 12, marginTop: 6 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center",
    borderWidth: 1.5, borderColor: COLORS.borderLight,
  },
  cancelBtnText: { fontSize: 14, fontWeight: "700", color: COLORS.textSecondary },
  saveBtn: { flex: 1.4, paddingVertical: 14, borderRadius: 14, alignItems: "center", backgroundColor: COLORS.primary },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: COLORS.white },
});