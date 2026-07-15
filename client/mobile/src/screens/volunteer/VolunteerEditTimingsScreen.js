// src/screens/volunteer/VolunteerEditTimingsScreen.js
import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, PRAYER_NAMES } from "../../constants";
import IslamicPattern from "../../components/IslamicPattern";
import TimePicker from "../../components/TimePicker";
import { updateVolunteerDailyTiming, createVolunteerDailyTiming } from "../../lib/endpoints";
import { formatTime12h } from "../../lib/dateUtils";
import { Info } from "lucide-react-native";
import TimingTypeInfoSheet from "../../components/TimingTypeInfoSheet";
import DateTimePicker from "@react-native-community/datetimepicker";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PRAYER_ORDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const PRAYER_ARABIC = {
  fajr: "الفجر", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء",
};

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}
function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function buildTimingState(dailyTimings = []) {
  const state = {};
  PRAYER_ORDER.forEach((prayer) => {
    const existing = dailyTimings.find((t) => t.prayerName === prayer);
    state[prayer] = {
      id: existing?.id || null,
      azaanTime: existing?.azaanTime || null,
      jamaahTime: existing?.jamaahTime || null,
      timingType: existing?.timingType || "fixed",
      relativeTimeText: existing?.relativeTimeText || null,
      dirty: false,
    };
  });
  return state;
}

function PrayerEditRow({ prayer, data, onEditAzaan, onEditJamaahTime, onEditJamaahText, onToggleType, onRemove, saving }) {
  const hasJamaah = data.timingType === "relative" ? !!data.relativeTimeText : !!data.jamaahTime;
  const isRelative = data.timingType === "relative";

  return (
    <View style={[styles.prayerRow, data.dirty && styles.prayerRowDirty]}>
      <View style={styles.prayerLabel}>
        <Text style={styles.prayerName}>{PRAYER_NAMES[prayer]}</Text>
        <Text style={styles.prayerArabic}>{PRAYER_ARABIC[prayer]}</Text>
      </View>

      <TouchableOpacity
        style={[styles.timeCell, styles.timeCellSecondary]}
        onPress={() => onEditAzaan(prayer)}
        activeOpacity={0.75}
        disabled={saving}
      >
        <Text style={styles.timeCellLabel}>Azaan</Text>
        <Text style={[styles.timeCellValue, !data.azaanTime && styles.timeCellEmpty]}>
          {formatTime12h(data.azaanTime) || "—"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.typeToggle}
        onPress={() => onToggleType(prayer, isRelative ? "fixed" : "relative")}
        disabled={saving}
        activeOpacity={0.75}
      >
        <Text style={styles.typeToggleText}>{isRelative ? "REL" : "FIX"}</Text>
      </TouchableOpacity>

      {isRelative ? (
        <TextInput
          value={data.relativeTimeText || ""}
          onChangeText={(t) => onEditJamaahText(prayer, t)}
          placeholder="e.g. after sunset"
          placeholderTextColor={COLORS.textMuted}
          style={[styles.timeCell, styles.timeCellActive, styles.relativeCellInput, data.dirty && styles.timeCellDirty]}
          editable={!saving}
        />
      ) : (
        <TouchableOpacity
          style={[styles.timeCell, hasJamaah && styles.timeCellActive, data.dirty && styles.timeCellDirty]}
          onPress={() => onEditJamaahTime(prayer)}
          activeOpacity={0.75}
          disabled={saving}
        >
          <Text style={styles.timeCellLabel}>Jamā'ah</Text>
          <Text style={[styles.timeCellValue, !hasJamaah && styles.timeCellEmpty, hasJamaah && styles.timeCellValueActive]}>
            {formatTime12h(data.jamaahTime) || "Tap to set"}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.removeIcon}
        onPress={() => onRemove(prayer)}
        disabled={saving}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.removeIconText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function VolunteerEditTimingsScreen({ navigation, route }) {
  const { venue, permissions = {} } = route.params || {};
  const canMarkVerified = !!permissions.canVerifyTimings;

  const [timings, setTimings] = useState(buildTimingState(venue?.dailyPrayerTimings || []));
  const [includedPrayers, setIncludedPrayers] = useState([...PRAYER_ORDER]);
  const [activePicker, setActivePicker] = useState(null);
  const [saving, setSaving] = useState(false);

  const [effectiveMode, setEffectiveMode] = useState("today");
  const [customDate, setCustomDate] = useState(todayDateString());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sourceNote, setSourceNote] = useState("");
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [infoSheetVisible, setInfoSheetVisible] = useState(false);

  const excludedPrayers = PRAYER_ORDER.filter((p) => !includedPrayers.includes(p));
  const dirtyPrayers = includedPrayers.filter((p) => timings[p].dirty);
  const hasDirty = dirtyPrayers.length > 0;
  const dateValid = effectiveMode === "today" || !!customDate;

  function handleTimeConfirm(hhmm) {
    const { prayer, field } = activePicker;
    setTimings((prev) => ({
      ...prev,
      [prayer]: {
        ...prev[prayer],
        [field === "jamaah" ? "jamaahTime" : "azaanTime"]: hhmm,
        dirty: true,
      },
    }));
    setActivePicker(null);
  }

  function handleEditJamaahText(prayer, text) {
    setTimings((prev) => ({
      ...prev,
      [prayer]: { ...prev[prayer], relativeTimeText: text, dirty: true },
    }));
  }

  function handleToggleType(prayer, type) {
    setTimings((prev) => ({
      ...prev,
      [prayer]: { ...prev[prayer], timingType: type, dirty: true },
    }));
  }

  function handleRemove(prayer) {
    setIncludedPrayers((prev) => prev.filter((p) => p !== prayer));
  }

  function handleAddBack(prayer) {
    setIncludedPrayers((prev) => [...prev, prayer].sort((a, b) => PRAYER_ORDER.indexOf(a) - PRAYER_ORDER.indexOf(b)));
  }

  async function handleSave() {
    setAttemptedSave(true);
    if (!hasDirty || !dateValid) return;

    setSaving(true);
    const errors = [];
    let successCount = 0;
    const effectiveFromIso = new Date(
      effectiveMode === "today" ? todayDateString() : customDate
    ).toISOString();

    for (const prayer of dirtyPrayers) {
      const t = timings[prayer];
      const isRelative = t.timingType === "relative";

      if (isRelative ? !t.relativeTimeText : !t.jamaahTime) {
        errors.push(`${PRAYER_NAMES[prayer]}: Jamā'ah timing is required.`);
        continue;
      }

      try {
        const body = {
          prayerName: prayer,
          timingType: t.timingType,
          ...(t.azaanTime && { azaanTime: t.azaanTime }),
          ...(isRelative
            ? { relativeTimeText: t.relativeTimeText }
            : { jamaahTime: t.jamaahTime }),
          effectiveFrom: effectiveFromIso,
          ...(sourceNote.trim() && { sourceNote: sourceNote.trim() }),
        };

        if (t.id) {
          await updateVolunteerDailyTiming(t.id, body);
        } else {
          const res = await createVolunteerDailyTiming(venue.id, body);
          setTimings((prev) => ({ ...prev, [prayer]: { ...prev[prayer], id: res.data?.id } }));
        }
        successCount++;
        setTimings((prev) => ({ ...prev, [prayer]: { ...prev[prayer], dirty: false } }));
      } catch (e) {
        errors.push(`${PRAYER_NAMES[prayer]}: ${e.message}`);
      }
    }

    setSaving(false);

    if (errors.length > 0) {
      Alert.alert("Some timings couldn't save", errors.join("\n"));
    } else if (successCount > 0) {
      Alert.alert(
        "Timings Updated ✓",
        `${successCount} timing${successCount > 1 ? "s" : ""} saved${canMarkVerified ? " and marked as Verified." : " and marked as Community Updated."}`,
        [{ text: "Done", onPress: () => navigation.goBack() }]
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IslamicPattern width={SCREEN_WIDTH} height={150} color="rgba(255,255,255,0.035)" />
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Update Timings</Text>
            <Text style={styles.headerSub} numberOfLines={1}>{venue?.name}</Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.trustBanner, canMarkVerified ? styles.trustBannerVerified : styles.trustBannerCommunity]}>
          <Text style={styles.trustBannerText}>
            {canMarkVerified
              ? "✓ Your changes will be marked Verified — you're trusted to confirm timings directly."
              : "Your changes will be marked Community Updated, pending confirmation by Admin."}
          </Text>
        </View>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 1.1 }]}>PRAYER</Text>
          <View style={{ width: 20 }} />
          <Text style={styles.tableHeaderText}>AZAAN</Text>
          <View style={{ width: 12 }} />
          <TouchableOpacity
            onPress={() => setInfoSheetVisible(true)}
            style={styles.infoHeaderButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.infoHeaderIcon}><Info size={16} color={COLORS.textMuted} /></Text>
          </TouchableOpacity>
          <View style={{ width: 28 }} />
          <Text style={styles.tableHeaderText}>JAMĀ'AH</Text>
          <View style={{ width: 24 }} />
        </View>

        {includedPrayers.map((prayer) => (
          <PrayerEditRow
            key={prayer}
            prayer={prayer}
            data={timings[prayer]}
            onEditAzaan={(p) => setActivePicker({ prayer: p, field: "azaan" })}
            onEditJamaahTime={(p) => setActivePicker({ prayer: p, field: "jamaah" })}
            onEditJamaahText={handleEditJamaahText}
            onToggleType={handleToggleType}
            onRemove={handleRemove}
            saving={saving}
          />
        ))}

        {excludedPrayers.length > 0 && (
          <View style={styles.excludedTray}>
            <Text style={styles.excludedTrayLabel}>Not updating today:</Text>
            <View style={styles.excludedChipRow}>
              {excludedPrayers.map((prayer) => (
                <TouchableOpacity
                  key={prayer}
                  style={styles.excludedChip}
                  onPress={() => handleAddBack(prayer)}
                >
                  <Text style={styles.excludedChipText}>+ {PRAYER_NAMES[prayer]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.sharedCard}>
          <Text style={styles.sharedCardTitle}>Applies to this update</Text>

          <Text style={styles.sharedFieldLabel}>Effective From</Text>
          <View style={styles.effectiveRow}>
            <TouchableOpacity
              style={[styles.dateChip, effectiveMode === "today" && styles.dateChipActive]}
              onPress={() => setEffectiveMode("today")}
            >
              <Text style={[styles.dateChipText, effectiveMode === "today" && styles.dateChipTextActive]}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateChip, effectiveMode === "custom" && styles.dateChipActive]}
              onPress={() => setEffectiveMode("custom")}
            >
              <Text style={[styles.dateChipText, effectiveMode === "custom" && styles.dateChipTextActive]}>Custom Date</Text>
            </TouchableOpacity>
          </View>
          {effectiveMode === "custom" && (
            <>
              <TouchableOpacity
                style={[
                  styles.input,
                  { marginTop: 10, justifyContent: "center" },
                  attemptedSave && !dateValid && styles.inputError,
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: customDate ? COLORS.textPrimary : COLORS.textMuted, fontSize: 14 }}>
                  {customDate || "Select date"}
                </Text>
              </TouchableOpacity>
              {attemptedSave && !dateValid && (
                <Text style={styles.errorText}>Enter a valid date as YYYY-MM-DD.</Text>
              )}
            </>
          )}

          <Text style={[styles.sharedFieldLabel, { marginTop: 16 }]}>Note (optional)</Text>
          <TextInput
            value={sourceNote}
            onChangeText={setSourceNote}
            placeholder="e.g. Confirmed with imam this morning"
            placeholderTextColor={COLORS.textMuted}
            multiline
            style={[styles.input, styles.inputMultiline]}
          />
        </View>

        {hasDirty && (
          <View style={styles.unsavedBanner}>
            <Text style={styles.unsavedText}>
              {dirtyPrayers.length} unsaved change{dirtyPrayers.length > 1 ? "s" : ""} · tap Save to confirm
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, (!hasDirty || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasDirty || saving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : hasDirty ? `Save ${dirtyPrayers.length} Change${dirtyPrayers.length > 1 ? "s" : ""}` : "No Changes"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      <TimePicker
        visible={!!activePicker}
        value={activePicker ? timings[activePicker.prayer]?.[activePicker.field === "jamaah" ? "jamaahTime" : "azaanTime"] : null}
        label={activePicker ? `${PRAYER_NAMES[activePicker.prayer]} ${activePicker.field === "jamaah" ? "Jamā'ah" : "Azaan"} Time` : ""}
        onConfirm={handleTimeConfirm}
        onCancel={() => setActivePicker(null)}
      />
      <TimingTypeInfoSheet
        visible={infoSheetVisible}
        onClose={() => setInfoSheetVisible(false)}
      />
      {showDatePicker && (
        <DateTimePicker
          value={new Date(customDate)}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setCustomDate(formatDate(selectedDate));
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.dark, paddingBottom: 20 },
  headerContent: { paddingHorizontal: 20, paddingTop: 8 },
  backButton: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginBottom: 14 },
  backButtonText: { fontSize: 14, color: COLORS.white, fontWeight: "600" },
  headerTitle: { fontSize: 26, fontWeight: "800", color: COLORS.white, marginBottom: 4 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.55)" },
  scrollContent: { padding: 16 },
  trustBanner: { borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 3 },
  trustBannerVerified: { backgroundColor: "#ECFDF5", borderLeftColor: COLORS.primary },
  trustBannerCommunity: { backgroundColor: "#F0F9FF", borderLeftColor: "#2563EB" },
  trustBannerText: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 18, fontWeight: "600" },
  tableHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, marginBottom: 4, gap: 8 },
  tableHeaderText: { flex: 1, fontSize: 10, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.8 },
  prayerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, gap: 8 },
  prayerRowDirty: { backgroundColor: "#FFFBEB" },
  prayerLabel: { flex: 1.1 },
  prayerName: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary },
  prayerArabic: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  timeCell: { flex: 1, backgroundColor: COLORS.card, borderRadius: 10, padding: 8, borderWidth: 1.5, borderColor: COLORS.borderLight },
  timeCellSecondary: { backgroundColor: COLORS.surface },
  timeCellActive: { borderColor: COLORS.primary + "60" },
  timeCellDirty: { borderColor: "#D97706", backgroundColor: "#FFFBEB" },
  timeCellLabel: { fontSize: 9, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  timeCellValue: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  timeCellEmpty: { color: COLORS.textMuted, fontWeight: "400", fontSize: 12 },
  timeCellValueActive: { color: COLORS.primary },
  relativeCellInput: { fontSize: 12, fontWeight: "600", color: COLORS.textPrimary },
  typeToggle: { width: 40, alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.borderLight, backgroundColor: COLORS.background },
  typeToggleText: { fontSize: 10, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 0.3 },
  removeIcon: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background },
  removeIconText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  excludedTray: { marginTop: 12, marginBottom: 4 },
  excludedTrayLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600", marginBottom: 8 },
  excludedChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  excludedChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.borderLight, borderStyle: "dashed" },
  excludedChipText: { fontSize: 12, fontWeight: "600", color: COLORS.textMuted },
  sharedCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginTop: 12, marginBottom: 14 },
  sharedCardTitle: { fontSize: 13, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 14, textTransform: "uppercase" },
  sharedFieldLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, marginBottom: 8 },
  effectiveRow: { flexDirection: "row", gap: 10 },
  dateChip: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center", borderWidth: 1.5, borderColor: COLORS.borderLight },
  dateChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dateChipText: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary },
  dateChipTextActive: { color: COLORS.white },
  input: { borderWidth: 1.5, borderColor: COLORS.borderLight, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: COLORS.textPrimary },
  inputMultiline: { minHeight: 60, textAlignVertical: "top" },
  inputError: { borderColor: "#DC2626" },
  errorText: { fontSize: 11, color: "#DC2626", marginTop: 6, fontWeight: "600" },
  unsavedBanner: { backgroundColor: "#FFFBEB", borderRadius: 10, padding: 12, marginTop: 4, marginBottom: 4, borderWidth: 1, borderColor: "#FDE68A", alignItems: "center" },
  unsavedText: { fontSize: 13, color: "#92400E", fontWeight: "600" },
  saveButton: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 17, alignItems: "center", marginTop: 16, elevation: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  saveButtonDisabled: { backgroundColor: COLORS.borderLight, elevation: 0, shadowOpacity: 0 },
  saveButtonText: { fontSize: 16, fontWeight: "800", color: COLORS.white },
});