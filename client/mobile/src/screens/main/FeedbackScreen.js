// src/screens/main/FeedbackScreen.js
import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform,
} from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { APP_CONFIG, COLORS } from "../../constants";
import { submitFeedback } from "../../lib/endpoints";

const FEEDBACK_TYPES = [
  { key: "general", label: "General", icon: "💬" },
  { key: "bug", label: "Bug Report", icon: "🐛" },
  { key: "feature_request", label: "Feature Request", icon: "✨" },
  { key: "data_quality", label: "Wrong Data", icon: "🕌" },
  { key: "other", label: "Other", icon: "📝" },
];

const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Great",
  5: "Excellent",
};

function StarRating({ value, onChange }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onChange(star === value ? null : star)}
          activeOpacity={0.7}
          style={styles.starButton}
        >
          <Text style={[styles.star, star <= (value || 0) && styles.starFilled]}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
      {value && (
        <Text style={styles.ratingLabel}>{RATING_LABELS[value]}</Text>
      )}
    </View>
  );
}

export default function FeedbackScreen({ navigation }) {
  const [type, setType] = useState("general");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const successScale = useSharedValue(0.85);
  const successOpacity = useSharedValue(0);
  const successAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
  }));

  const canSubmit = message.trim().length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await submitFeedback({
        type,
        message: message.trim(),
        ...(rating && { rating }),
      });
      setSubmitted(true);
      successScale.value = withSpring(1, { damping: 14, stiffness: 120 });
      successOpacity.value = withTiming(1, { duration: 400 });
    } catch (e) {
      // Even on error show success — feedback is best-effort, don't penalise users
      setSubmitted(true);
      successScale.value = withSpring(1, { damping: 14, stiffness: 120 });
      successOpacity.value = withTiming(1, { duration: 400 });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.successHeader} />
        <View style={styles.successContainer}>
          <Animated.View style={[styles.successCard, successAnimStyle]}>
            <Text style={styles.successIcon}>🌟</Text>
            <Text style={styles.successTitle}>JazakAllahu Khair</Text>
            <Text style={styles.successMessage}>
              Your feedback helps us make {APP_CONFIG.name} better for every Muslim.
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
            >
              <Text style={styles.successButtonText}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Send Feedback</Text>
            <Text style={styles.headerSub}>
              Help us improve {APP_CONFIG.name} — every message is read.
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
        {/* Type */}
        <Text style={styles.sectionLabel}>WHAT IS THIS ABOUT?</Text>
        <View style={styles.typeGrid}>
          {FEEDBACK_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.typeChip, type === t.key && styles.typeChipSelected]}
              onPress={() => setType(t.key)}
              activeOpacity={0.8}
            >
              <Text style={styles.typeChipIcon}>{t.icon}</Text>
              <Text style={[styles.typeChipText, type === t.key && styles.typeChipTextSelected]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rating */}
        <Text style={styles.sectionLabel}>RATE YOUR EXPERIENCE (OPTIONAL)</Text>
        <View style={styles.ratingCard}>
          <StarRating value={rating} onChange={setRating} />
        </View>

        {/* Message */}
        <Text style={styles.sectionLabel}>YOUR MESSAGE</Text>
        <TextInput
          style={styles.messageInput}
          value={message}
          onChangeText={setMessage}
          placeholder={
            type === "bug"
              ? "Describe what happened and what you expected instead..."
              : type === "feature_request"
              ? `What would make ${APP_CONFIG.name} more useful for you?`
              : type === "data_quality"
              ? "Tell us which mosque or timing has wrong information..."
              : "Share anything — what you love, what could be better, or ideas..."
          }
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={1000}
          autoFocus={false}
        />
        <Text style={styles.charCount}>{message.length}/1000</Text>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? "Sending..." : "Send Feedback"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Feedback is reviewed by the {APP_CONFIG.name} team. For urgent issues with mosque
          timings, use "Report Wrong Timing" on the mosque page.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: { backgroundColor: COLORS.dark, paddingBottom: 20 },
  headerContent: { paddingHorizontal: 20, paddingTop: 8 },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, marginBottom: 14,
  },
  backButtonText: { fontSize: 14, color: COLORS.white, fontWeight: "600" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: COLORS.white, marginBottom: 4 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 18 },

  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  sectionLabel: {
    fontSize: 11, fontWeight: "700",
    color: COLORS.textMuted, letterSpacing: 1.2,
    marginTop: 20, marginBottom: 10,
  },

  // ── Type chips ──
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1.5, borderColor: COLORS.borderLight,
  },
  typeChipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  typeChipIcon: { fontSize: 14 },
  typeChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },
  typeChipTextSelected: { color: COLORS.primary, fontWeight: "700" },

  // ── Rating ──
  ratingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: COLORS.borderLight,
  },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  starButton: { padding: 4 },
  star: { fontSize: 32, color: COLORS.borderLight },
  starFilled: { color: "#D4A843" },
  ratingLabel: {
    fontSize: 14, fontWeight: "600",
    color: COLORS.textSecondary, marginLeft: 8,
  },

  // ── Message ──
  messageInput: {
    backgroundColor: COLORS.card,
    borderRadius: 14, padding: 14,
    fontSize: 14, color: COLORS.textPrimary,
    borderWidth: 1.5, borderColor: COLORS.borderLight,
    minHeight: 140, lineHeight: 21,
  },
  charCount: {
    fontSize: 11, color: COLORS.textMuted,
    textAlign: "right", marginTop: 4,
  },

  // ── Submit ──
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16, paddingVertical: 17,
    alignItems: "center", marginTop: 20,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.borderLight,
    elevation: 0, shadowOpacity: 0,
  },
  submitButtonText: { fontSize: 16, fontWeight: "800", color: COLORS.white },

  disclaimer: {
    fontSize: 12, color: COLORS.textMuted,
    textAlign: "center", lineHeight: 17,
    marginTop: 16, paddingHorizontal: 8,
  },

  // ── Success ──
  successHeader: { backgroundColor: COLORS.dark },
  successContainer: {
    flex: 1, alignItems: "center", justifyContent: "center", padding: 28,
  },
  successCard: {
    backgroundColor: COLORS.card, borderRadius: 24,
    padding: 32, alignItems: "center", width: "100%",
    elevation: 4, shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12,
  },
  successIcon: { fontSize: 52, marginBottom: 16 },
  successTitle: {
    fontSize: 24, fontWeight: "800",
    color: COLORS.textPrimary, marginBottom: 12,
  },
  successMessage: {
    fontSize: 15, color: COLORS.textMuted,
    textAlign: "center", lineHeight: 22, marginBottom: 28,
  },
  successButton: {
    backgroundColor: COLORS.dark,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 36,
  },
  successButtonText: { fontSize: 15, fontWeight: "700", color: COLORS.white },
});