// src/screens/main/ReportTimingScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { APP_CONFIG, COLORS, PRAYER_NAMES } from "../../constants";
import { submitTimingReport } from "../../lib/endpoints";
import TimePicker from "../../components/TimePicker";

// ── Issue types ───────────────────────────────────────────────
const ISSUE_TYPES = [
  { key: "both_times_wrong", label: "Both azaan & jamā'ah time are wrong" },
  { key: "jamaah_time_wrong", label: "Jamā'ah time is wrong" },
  { key: "azaan_time_wrong", label: "Azaan time is wrong" },
  { key: "jumuah_time_wrong", label: "Jumu'ah time is wrong" },
  { key: "women_prayer_info_wrong", label: "Women's prayer info is wrong" },
  { key: "facility_info_wrong", label: "Facility info is wrong" },
  { key: "location_wrong", label: "Location / address is wrong" },
  { key: "venue_closed_or_inactive", label: "This place is closed / inactive" },
  { key: "other", label: "Something else" },
];

const PRAYER_OPTIONS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

// Converts "HH:mm" → "5:30 PM" for display on the picker trigger button.
function formatDisplay(hhmm) {
  if (!hhmm) return null;
  const [hStr, mStr] = hhmm.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  if (h > 12) h -= 12;
  return `${h}:${mStr} ${period}`;
}

// ── Issue chip ────────────────────────────────────────────────
function IssueChip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.issueChip, selected && styles.issueChipSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.issueChipText, selected && styles.issueChipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Time picker trigger button ────────────────────────────────
function TimePickerButton({ label, value, onPress }) {
  const display = formatDisplay(value);
  return (
    <TouchableOpacity
      style={styles.timeButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.timeButtonInner}>
        <Text style={styles.timeButtonLabel}>{label}</Text>
        <Text style={[styles.timeButtonValue, !display && styles.timeButtonPlaceholder]}>
          {display || "Tap to set"}
        </Text>
      </View>
      {display && (
        <View style={styles.timeButtonBadge}>
          <Text style={styles.timeButtonBadgeText}>✓</Text>
        </View>
      )}
      {!display && (
        <Text style={styles.timeButtonChevron}>›</Text>
      )}
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────
export default function ReportTimingScreen({ navigation, route }) {
  const { venue } = route.params || {};

  const [issueType, setIssueType] = useState(null);
  const [selectedPrayer, setSelectedPrayer] = useState(null);

  // Time values stored as "HH:mm" 24h strings
  const [suggestedJamaah, setSuggestedJamaah] = useState(null);
  const [suggestedAzaan, setSuggestedAzaan] = useState(null);
  const [selectedJumuahSlotId, setSelectedJumuahSlotId] = useState(null);
  const [suggestedKhutbah, setSuggestedKhutbah] = useState(null);

  // Which picker is open: "jamaah" | "azaan" | null
  const [activePicker, setActivePicker] = useState(null);

  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contributionMessage, setContributionMessage] = useState(null);

  const successScale = useSharedValue(0.8);
  const successOpacity = useSharedValue(0);
  const successAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
  }));

  const requiresPrayer = ["both_times_wrong", "jamaah_time_wrong", "azaan_time_wrong"].includes(issueType);
  const requiresTimes = ["both_times_wrong", "jamaah_time_wrong", "azaan_time_wrong"].includes(issueType);

  const isJumuahIssue = issueType === "jumuah_time_wrong";
  const jumuahSlots = (venue?.jumuahTimings || [])
    .slice()
    .sort((a, b) => (a.slotNumber || 0) - (b.slotNumber || 0));
  const requiresJumuahSlot = isJumuahIssue && jumuahSlots.length > 0;
  const showJumuahTimeFields = isJumuahIssue && (jumuahSlots.length === 0 || !!selectedJumuahSlotId);

  async function handleSubmit() {
    if (!issueType) {
      Alert.alert("Select an issue", "Please select what is wrong.");
      return;
    }
    if (requiresPrayer && !selectedPrayer) {
      Alert.alert("Select a prayer", "Please select which prayer has the wrong time.");
      return;
    }
    if (requiresJumuahSlot && !selectedJumuahSlotId) {
      Alert.alert("Select a slot", "Which Jumu'ah slot needs correcting?");
      return;
    }
    const hasContent = suggestedJamaah || suggestedAzaan || suggestedKhutbah || note.trim();
    if (!hasContent) {
      Alert.alert(
        "Add details",
        "Please set the correct time or add a note so we can review your report."
      );
      return;
    }

    setSubmitting(true);
    try {
      let dailyTimingId = null;
      if (selectedPrayer && venue?.dailyPrayerTimings) {
        const match = venue.dailyPrayerTimings.find(
          (t) => t.prayerName === selectedPrayer && !t.effectiveTo
        );
        dailyTimingId = match?.id || null;
      }

      const jumuahTimingId = isJumuahIssue ? selectedJumuahSlotId : null;

      const body = {
        venueId: venue.id,
        issueType,
        ...(selectedPrayer && !isJumuahIssue && { prayerName: selectedPrayer }),
        ...(dailyTimingId && { dailyTimingId }),
        ...(jumuahTimingId && { jumuahTimingId }),
        ...(suggestedJamaah && { suggestedJamaahTime: suggestedJamaah }),
        ...(suggestedAzaan && { suggestedAzaanTime: suggestedAzaan }),
        ...(suggestedKhutbah && { suggestedKhutbahTime: suggestedKhutbah }),
        ...(note.trim() && { userNote: note.trim() }),
      };

      const res = await submitTimingReport(body);
      setContributionMessage(
        res.contribution?.message ||
        "JazakAllahu khair. Your report has been submitted."
      );
      setSubmitted(true);
      successScale.value = withSpring(1, { damping: 14, stiffness: 120 });
      successOpacity.value = withTiming(1, { duration: 400 });
    } catch (error) {
      Alert.alert(
        "Submission failed",
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ────────────────────────────────────────
  if (submitted) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.successHeader} />
        <View style={styles.successContainer}>
          <Animated.View style={[styles.successCard, successAnimStyle]}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Report Submitted</Text>
            <Text style={styles.successMessage}>{contributionMessage}</Text>
            <Text style={styles.successSub}>
              Our team will review this and update the timing if confirmed.
              Timings are not changed automatically — your report helps us
              verify the data.
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
            >
              <Text style={styles.successButtonText}>Back to Mosque</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  // ── Form ─────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Report Wrong Info</Text>
            <Text style={styles.headerVenue} numberOfLines={1}>
              {venue?.name}
            </Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Issue type */}
        <Text style={styles.sectionLabel}>WHAT IS WRONG?</Text>
        <View style={styles.issueGrid}>
          {ISSUE_TYPES.map((type) => (
            <IssueChip
              key={type.key}
              label={type.label}
              selected={issueType === type.key}
              onPress={() => {
                setIssueType(type.key);
                setSelectedPrayer(null);
                setSelectedJumuahSlotId(null);
                setSuggestedJamaah(null);
                setSuggestedAzaan(null);
                setSuggestedKhutbah(null);
              }}
            />
          ))}
        </View>

        {/* Prayer selector */}
        {requiresPrayer && (
          <>
            <Text style={styles.sectionLabel}>WHICH PRAYER?</Text>
            <View style={styles.prayerRow}>
              {PRAYER_OPTIONS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.prayerChip,
                    selectedPrayer === p && styles.prayerChipSelected,
                  ]}
                  onPress={() => setSelectedPrayer(p)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.prayerChipText,
                      selectedPrayer === p && styles.prayerChipTextSelected,
                    ]}
                  >
                    {PRAYER_NAMES[p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        {isJumuahIssue && (
          <>
            <Text style={styles.sectionLabel}>WHICH JUMU'AH SLOT?</Text>
            {jumuahSlots.length > 0 ? (
              <View style={styles.prayerRow}>
                {jumuahSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.prayerChip,
                      selectedJumuahSlotId === slot.id && styles.prayerChipSelected,
                    ]}
                    onPress={() => setSelectedJumuahSlotId(slot.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.prayerChipText,
                        selectedJumuahSlotId === slot.id && styles.prayerChipTextSelected,
                      ]}
                    >
                      Slot {slot.slotNumber} · {slot.jamaahTime || "No time set"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  🕌 We don't have a Jumu'ah timing on record for this mosque yet.
                  Share what you know below and our team will add it after review.
                </Text>
              </View>
            )}
          </>
        )}

        {/* Time pickers */}
        {requiresTimes && (
          <>
            <Text style={styles.sectionLabel}>CORRECT TIME</Text>
            <Text style={styles.sectionHint}>
              Tap to set the correct time. At least one is required.
            </Text>
            {["both_times_wrong", "jamaah_time_wrong"].includes(issueType) && (
              <TimePickerButton
                label="Jamā'ah / Iqāmah Time"
                value={suggestedJamaah}
                onPress={() => setActivePicker("jamaah")}
              />
            )}
            {["both_times_wrong", "azaan_time_wrong"].includes(issueType) && (
              <TimePickerButton
                label="Azaan Time"
                value={suggestedAzaan}
                onPress={() => setActivePicker("azaan")}
              />
            )}
          </>
        )}

        {showJumuahTimeFields && (
          <>
            <Text style={styles.sectionLabel}>
              {jumuahSlots.length > 0 ? "CORRECT TIME FOR THIS SLOT" : "SUGGESTED JUMU'AH TIMING"}
            </Text>
            <Text style={styles.sectionHint}>
              Tap to set the correct time. At least one is required.
            </Text><TimePickerButton
              label="Azaan Time"
              value={suggestedAzaan}
              onPress={() => setActivePicker("azaan")}
            />
            <TimePickerButton
              label="Khutbah Time"
              value={suggestedKhutbah}
              onPress={() => setActivePicker("khutbah")}
            />

            <TimePickerButton
              label="Jamā'ah / Iqāmah Time"
              value={suggestedJamaah}
              onPress={() => setActivePicker("jamaah")}
            />
          </>
        )}

        {/* Note */}
        <Text style={styles.sectionLabel}>ADD A NOTE (OPTIONAL)</Text>
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder={
            'Describe what\'s wrong or how you know the correct time.\ne.g. "I prayed here today, Asr was at 4:45 PM."'
          }
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.charCount}>{note.length}/500</Text>

        {/* Trust info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🔒 Your report goes to our review team. Timings are not changed
            automatically — a verified person reviews each report before any
            update is made. This keeps ${APP_CONFIG.name} trustworthy.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (submitting || !issueType) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting || !issueType}
          activeOpacity={0.85}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? "Submitting..." : "Submit Report"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Time pickers — rendered outside ScrollView so they overlay everything */}
      <TimePicker
        visible={activePicker === "jamaah"}
        value={suggestedJamaah}
        label="Jamā'ah / Iqāmah Time"
        onConfirm={(hhmm) => {
          setSuggestedJamaah(hhmm);
          setActivePicker(null);
        }}
        onCancel={() => setActivePicker(null)}
      />
      <TimePicker
        visible={activePicker === "azaan"}
        value={suggestedAzaan}
        label="Azaan Time"
        onConfirm={(hhmm) => {
          setSuggestedAzaan(hhmm);
          setActivePicker(null);
        }}
        onCancel={() => setActivePicker(null)}
      />
      <TimePicker
        visible={activePicker === "khutbah"}
        value={suggestedKhutbah}
        label="Khutbah Time"
        onConfirm={(hhmm) => {
          setSuggestedKhutbah(hhmm);
          setActivePicker(null);
        }}
        onCancel={() => setActivePicker(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ── Header ──
  header: { backgroundColor: COLORS.dark, paddingBottom: 20 },
  headerContent: { paddingHorizontal: 20, paddingTop: 8 },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 14,
  },
  backButtonText: { fontSize: 14, color: COLORS.white, fontWeight: "600" },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 4,
  },
  headerVenue: { fontSize: 14, color: "rgba(255,255,255,0.55)" },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  // ── Section labels ──
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
    marginTop: -6,
  },

  // ── Issue chips ──
  issueGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  issueChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  issueChipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  issueChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },
  issueChipTextSelected: { color: COLORS.primary, fontWeight: "700" },

  // ── Prayer chips ──
  prayerRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  prayerChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  prayerChipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  prayerChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "600" },
  prayerChipTextSelected: { color: COLORS.primary, fontWeight: "700" },

  // ── Time picker trigger button ──
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  timeButtonInner: { flex: 1 },
  timeButtonLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  timeButtonValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  timeButtonPlaceholder: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textMuted,
  },
  timeButtonBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  timeButtonBadgeText: { fontSize: 13, color: COLORS.white, fontWeight: "700" },
  timeButtonChevron: { fontSize: 22, color: COLORS.textMuted, fontWeight: "300" },

  // ── Note ──
  noteInput: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    minHeight: 100,
    lineHeight: 20,
  },
  charCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "right",
    marginTop: 4,
  },

  // ── Info box ──
  infoBox: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  infoText: { fontSize: 12, color: "#0369A1", lineHeight: 18 },

  // ── Submit ──
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 20,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.borderLight,
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.3,
  },

  // ── Success ──
  successHeader: { backgroundColor: COLORS.dark },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: COLORS.background,
  },
  successCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    width: "100%",
    elevation: 4,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 22,
  },
  successSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: COLORS.dark,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  successButtonText: { fontSize: 15, fontWeight: "700", color: COLORS.white },
});