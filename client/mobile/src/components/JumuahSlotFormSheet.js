// src/components/JumuahSlotFormSheet.js
import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { COLORS } from "../constants";
import { formatTime12h } from "../lib/dateUtils";
import TimePicker from "./TimePicker";
import { ChevronRight } from "lucide-react-native";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const LANGUAGE_CHIPS = ["Urdu", "English", "Arabic", "Tamil", "Kannada", "Malayalam", "Hindi"];

const WOMEN_SPACE_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "not_available", label: "Not Available" },
  { value: "jumuah_only", label: "Jumu'ah Only" },
  { value: "ramadan_eid_only", label: "Ramadan/Eid Only" },
  { value: "unknown", label: "Unknown" },
];

const TIME_FIELD_META = {
  jamaahTime: { label: "Jamā'ah Time", pickerLabel: "Set Jamā'ah Time" },
  khutbahTime: { label: "Khutbah Time", pickerLabel: "Set Khutbah Time" },
  azaanTime: { label: "Azaan Time", pickerLabel: "Set Azaan Time" },
};

function PrimaryTimeTile({ value, onPress }) {
  const filled = value && TIME_REGEX.test(value);
  return (
    <TouchableOpacity style={styles.primaryTile} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.primaryTileTextWrap}>
        <Text style={styles.primaryTileLabel}>JAMĀ'AH TIME *</Text>
        <Text style={[styles.primaryTileValue, !filled && styles.primaryTilePlaceholder]}>
          {filled ? formatTime12h(value) : "Tap to set time"}
        </Text>
      </View>
      <ChevronRight size={18} color={COLORS.textMuted}/>
    </TouchableOpacity>
  );
}

function SecondaryTimeTile({ label, value, onPress, onClear }) {
  const filled = value && TIME_REGEX.test(value);
  return (
    <TouchableOpacity style={styles.secondaryTile} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.secondaryTileLabel}>{label}</Text>
      <Text style={[styles.secondaryTileValue, !filled && styles.secondaryTilePlaceholder]}>
        {filled ? formatTime12h(value) : "Not set"}
      </Text>
      {filled && (
        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={(e) => { e.stopPropagation?.(); onClear(); }}
          style={styles.secondaryTileClear}
        >
          <Text style={styles.secondaryTileClearText}>✕</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function JumuahSlotFormSheet({
  visible, initialValues, saving, onClose, onSave,
}) {
  const [values, setValues] = useState(initialValues || {});
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState(null); // 'jamaahTime' | 'khutbahTime' | 'azaanTime' | null

  useEffect(() => {
    if (visible) {
      setValues(initialValues || {});
      setAttemptedSave(false);
      setActiveTimeField(null);
    }
  }, [visible, initialValues]);

  function setField(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  const jamaahValid = TIME_REGEX.test(values.jamaahTime || "");
  const azaanValid = !values.azaanTime || TIME_REGEX.test(values.azaanTime);
  const khutbahValid = !values.khutbahTime || TIME_REGEX.test(values.khutbahTime);
  const canSubmit = jamaahValid && azaanValid && khutbahValid;

  function handleSavePress() {
    setAttemptedSave(true);
    if (!canSubmit) return;
    onSave(values);
  }

  function handleTimeConfirm(hhmm) {
    if (activeTimeField) setField(activeTimeField, hhmm);
    setActiveTimeField(null);
  }

  const isEditing = !!initialValues?.id;
  const activeMeta = activeTimeField ? TIME_FIELD_META[activeTimeField] : null;

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>
            {isEditing ? `Edit Slot ${values.slotNumber || ""}` : "Add Jumu'ah Slot"}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Slot Number</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setField("slotNumber", Math.max(1, (values.slotNumber || 1) - 1))}
                >
                  <Text style={styles.stepperButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{values.slotNumber || 1}</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setField("slotNumber", (values.slotNumber || 1) + 1)}
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <PrimaryTimeTile
                value={values.jamaahTime}
                onPress={() => setActiveTimeField("jamaahTime")}
              />
              {attemptedSave && !jamaahValid && (
                <Text style={styles.errorText}>Jamā'ah time is required for a Jumu'ah slot.</Text>
              )}
            </View>

            <View style={[styles.fieldBlock, styles.secondaryTimeRow]}>
              <SecondaryTimeTile
                label="KHUTBAH"
                value={values.khutbahTime}
                onPress={() => setActiveTimeField("khutbahTime")}
                onClear={() => setField("khutbahTime", "")}
              />
              <View style={{ width: 10 }} />
              <SecondaryTimeTile
                label="AZAAN"
                value={values.azaanTime}
                onPress={() => setActiveTimeField("azaanTime")}
                onClear={() => setField("azaanTime", "")}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Khutbah Language</Text>
              <View style={styles.chipRow}>
                {LANGUAGE_CHIPS.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    onPress={() => setField("khutbahLanguage", lang)}
                    style={[styles.chip, values.khutbahLanguage === lang && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, values.khutbahLanguage === lang && styles.chipTextActive]}>
                      {lang}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                value={values.khutbahLanguage || ""}
                onChangeText={(t) => setField("khutbahLanguage", t)}
                placeholder="Or type a language"
                placeholderTextColor={COLORS.textMuted}
                style={[styles.input, { marginTop: 8 }]}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Women's Prayer Space (Jumu'ah)</Text>
              <View style={styles.chipRow}>
                {WOMEN_SPACE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setField("womenPrayerSpace", opt.value)}
                    style={[styles.chip, values.womenPrayerSpace === opt.value && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, values.womenPrayerSpace === opt.value && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Important Notice (optional)</Text>
              <TextInput
                value={values.importantNotice || ""}
                onChangeText={(t) => setField("importantNotice", t)}
                placeholder="e.g. Extra parking behind the mosque on Fridays"
                placeholderTextColor={COLORS.textMuted}
                multiline
                style={[styles.input, styles.inputMultiline]}
              />
            </View>
          </ScrollView>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              disabled={saving}
              onPress={handleSavePress}
            >
              <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Slot"}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>

      <TimePicker
        visible={!!activeTimeField}
        value={activeTimeField ? values[activeTimeField] : null}
        label={activeMeta?.pickerLabel || "Select Time"}
        onConfirm={handleTimeConfirm}
        onCancel={() => setActiveTimeField(null)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(12,26,20,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.borderLight, alignSelf: "center", marginBottom: 14 },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 16 },
  fieldBlock: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, marginBottom: 8, letterSpacing: 0.3 },
  input: { borderWidth: 1.5, borderColor: COLORS.borderLight, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: COLORS.textPrimary },
  inputMultiline: { minHeight: 70, textAlignVertical: "top" },
  errorText: { fontSize: 11, color: "#DC2626", marginTop: 6, fontWeight: "600" },

  stepperRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  stepperButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.background, borderWidth: 1.5, borderColor: COLORS.borderLight, alignItems: "center", justifyContent: "center" },
  stepperButtonText: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary },
  stepperValue: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary, minWidth: 20, textAlign: "center" },

  primaryTile: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: COLORS.primaryLight, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16, borderWidth: 1.5, borderColor: COLORS.borderLight,
  },
  primaryTileTextWrap: { flex: 1 },
  primaryTileLabel: { fontSize: 11, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 0.6, marginBottom: 4 },
  primaryTileValue: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary },
  primaryTilePlaceholder: { fontSize: 16, fontWeight: "600", color: COLORS.textMuted },

  secondaryTimeRow: { flexDirection: "row" },
  secondaryTile: {
    flex: 1, backgroundColor: COLORS.background, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.borderLight,
    paddingHorizontal: 14, paddingVertical: 12, position: "relative",
  },
  secondaryTileLabel: { fontSize: 10, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 0.6, marginBottom: 4 },
  secondaryTileValue: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  secondaryTilePlaceholder: { fontSize: 13, fontWeight: "500", color: COLORS.textMuted },
  secondaryTileClear: { position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.borderLight, alignItems: "center", justifyContent: "center" },
  secondaryTileClearText: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.borderLight, backgroundColor: COLORS.background },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
  actionsRow: { flexDirection: "row", gap: 12, marginTop: 6 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", borderWidth: 1.5, borderColor: COLORS.borderLight },
  cancelBtnText: { fontSize: 14, fontWeight: "700", color: COLORS.textSecondary },
  saveBtn: { flex: 1.4, paddingVertical: 14, borderRadius: 14, alignItems: "center", backgroundColor: COLORS.primary },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: COLORS.white },
});