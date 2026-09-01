// src/screens/volunteer/VolunteerSuggestionsScreen.js
import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { APP_CONFIG, COLORS, VENUE_TYPES } from "../../constants";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import { fetchVolunteerSuggestions, updateVolunteerSuggestionStatus } from "../../lib/endpoints";
import { formatRelativeDate } from "../../lib/dateUtils";
import { ActionFlow } from "../../lib/actionFlow";
import { Info } from "lucide-react-native";

function SuggestionCard({ suggestion, canReview, onDuplicate, onReject, onNeedsInfo }) {
  const location = [suggestion.areaText, suggestion.cityText, suggestion.stateText, suggestion.countryText]
    .filter(Boolean)
    .join(", ");

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{suggestion.suggestedName}</Text>
      <Text style={styles.meta}>
        {VENUE_TYPES[suggestion.venueType] || suggestion.venueType || "Type not specified"}
        {location ? ` · ${location}` : ""}
      </Text>

      {suggestion.address ? <Text style={styles.detailLine}>📍 {suggestion.address}</Text> : null}
      {suggestion.pincode ? <Text style={styles.detailLine}>PIN: {suggestion.pincode}</Text> : null}
      {suggestion.phone ? <Text style={styles.detailLine}>📞 {suggestion.phone}</Text> : null}
      {suggestion.optionalTimingNote ? (
        <Text style={styles.detailLine}>🕐 {suggestion.optionalTimingNote}</Text>
      ) : null}

      {suggestion.userNote && (
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>"{suggestion.userNote}"</Text>
        </View>
      )}

      <Text style={styles.date}>Submitted {formatRelativeDate(suggestion.createdAt)}</Text>

      {suggestion.status === "pending" && canReview && (
        <>
          <View style={styles.manualNote}>
            <Info size={12} color="#2563EB" />
            <Text style={styles.manualNoteText}>
              Final approval into a live mosque listing is a Super Admin action on the web panel. Use these actions to clear out duplicates and invalid entries.
            </Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.infoButton} onPress={() => onNeedsInfo(suggestion)} activeOpacity={0.85}>
              <Text style={styles.infoButtonText}>? Info</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.duplicateButton} onPress={() => onDuplicate(suggestion)} activeOpacity={0.85}>
              <Text style={styles.duplicateButtonText}>⧉ Duplicate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectButton} onPress={() => onReject(suggestion)} activeOpacity={0.85}>
              <Text style={styles.rejectButtonText}>✕ Reject</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

export default function VolunteerSuggestionsScreen({ navigation, route }) {
  const canReview = route.params?.canReview !== false;

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function loadSuggestions() {
    setError(null);
    try {
      const res = await fetchVolunteerSuggestions({ status: "pending" });
      setSuggestions(res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { loadSuggestions(); }, []));

  async function handleReject(suggestion) {
    const { confirmed, error } = await ActionFlow.confirm({
      title: "Reject Suggestion",
      message: "Mark this suggestion as invalid?",
      confirmText: "Reject",
      destructive: true,
      loadingMessage: "Rejecting...",
      successTitle: "Rejected",
      onConfirm: () => updateVolunteerSuggestionStatus(suggestion.id, { status: "rejected" }),
    });
    if (confirmed && !error) loadSuggestions();
  }

  async function handleDuplicate(suggestion) {
    const { confirmed, error } = await ActionFlow.confirm({
      title: "Mark as Duplicate",
      message: `This mosque already exists in ${APP_CONFIG.name}?`,
      confirmText: "Mark Duplicate",
      loadingMessage: "Updating...",
      successTitle: "Marked",
      onConfirm: () => updateVolunteerSuggestionStatus(suggestion.id, { status: "duplicate" }),
    });
    if (confirmed && !error) loadSuggestions();
  }

  async function handleNeedsInfo(suggestion) {
    const { confirmed, error } = await ActionFlow.confirm({
      title: "Request More Info",
      message: "Mark this suggestion as needing more information from the person who submitted it?",
      confirmText: "Mark Needs Info",
      loadingMessage: "Updating...",
      successTitle: "Marked",
      onConfirm: () => updateVolunteerSuggestionStatus(suggestion.id, { status: "needs_more_info" }),
    });
    if (confirmed && !error) loadSuggestions();
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mosque Suggestions</Text>
          <Text style={styles.headerSub}>Missing mosques reported by users</Text>
        </View>
      </SafeAreaView>

      {!canReview && (
        <View style={styles.readOnlyBanner}>
          <Text style={styles.readOnlyText}>You have view-only access to suggestions right now.</Text>
        </View>
      )}

      {loading ? (
        <Loader message="Loading suggestions..." />
      ) : error ? (
        <EmptyState icon="⚠️" title="Couldn't load" subtitle={error} actionLabel="Retry" onAction={loadSuggestions} />
      ) : suggestions.length === 0 ? (
        <EmptyState icon="✅" title="No pending suggestions" subtitle="No mosque suggestions to check in your scope right now." />
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadSuggestions(); }} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
          renderItem={({ item }) => (
            <SuggestionCard
              suggestion={item}
              canReview={canReview}
              onDuplicate={handleDuplicate}
              onReject={handleReject}
              onNeedsInfo={handleNeedsInfo}
            />
          )}
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
  headerTitle: { fontSize: 24, fontWeight: "800", color: COLORS.white, marginBottom: 4 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.55)" },
  readOnlyBanner: { backgroundColor: "#EFF6FF", padding: 12, borderLeftWidth: 3, borderLeftColor: "#2563EB" },
  readOnlyText: { fontSize: 13, color: "#1D4ED8", fontWeight: "600" },
  listContent: { padding: 16 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: COLORS.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  name: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 3 },
  meta: { fontSize: 12, color: COLORS.textMuted, marginBottom: 8 },
  detailLine: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  noteCard: { backgroundColor: COLORS.surface, borderLeftWidth: 3, borderLeftColor: COLORS.borderLight, borderRadius: 8, padding: 10, marginTop: 6, marginBottom: 6 },
  noteText: { fontSize: 13, color: COLORS.textSecondary, fontStyle: "italic", lineHeight: 18 },
  date: { fontSize: 11, color: COLORS.textMuted, marginTop: 6, marginBottom: 12 },
  manualNote: { backgroundColor: "#F0F9FF", borderRadius: 8, padding: 8, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: "#2563EB", flexDirection: "row", alignItems: "center", gap: 6 },
  manualNoteText: { flex: 1, fontSize: 10, color: "#1D4ED8", lineHeight: 15 },
  actions: { flexDirection: "row", gap: 8 },
  infoButton: { flex: 1, backgroundColor: "#EDE9FE", borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  infoButtonText: { fontSize: 12, fontWeight: "700", color: "#5B21B6" },
  duplicateButton: { flex: 1, backgroundColor: "#FEF3C7", borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  duplicateButtonText: { fontSize: 12, fontWeight: "700", color: "#92400E" },
  rejectButton: { flex: 1, backgroundColor: COLORS.card, borderRadius: 10, paddingVertical: 11, alignItems: "center", borderWidth: 1.5, borderColor: "#FCA5A5" },
  rejectButtonText: { fontSize: 12, fontWeight: "700", color: COLORS.error },
});