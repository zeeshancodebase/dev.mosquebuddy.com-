// src/screens/mosqueAdmin/MosqueAdminEditJumuahScreen.js
import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../../constants";
import IslamicPattern from "../../components/IslamicPattern";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import VerificationBadge from "../../components/VerificationBadge";
import JumuahSlotFormSheet from "../../components/JumuahSlotFormSheet";
import {
  fetchMyVenueById,
  createMyJumuahTiming,
  updateMyJumuahTiming,
} from "../../lib/endpoints";
import { formatTime12h, formatRelativeDate } from "../../lib/dateUtils";
import { Languages } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const WOMEN_SPACE_LABELS = {
  available: "Available",
  not_available: "Not Available",
  jumuah_only: "Jumu'ah Only",
  ramadan_eid_only: "Ramadan/Eid Only",
  unknown: "Unknown",
};

function SlotCard({ slot, onEdit, editable }) {
  return (
    <View style={styles.slotCard}>
      <View style={styles.slotHeader}>
        <View style={styles.slotBadge}>
          <Text style={styles.slotBadgeText}>Slot {slot.slotNumber}</Text>
        </View>
        <VerificationBadge status={slot.verificationStatus} size="sm" />
      </View>

      <View style={styles.timeGrid}>
        <View style={styles.timeCell}>
          <Text style={styles.timeCellLabel}>Khutbah</Text>
          <Text style={styles.timeCellValue}>{formatTime12h(slot.khutbahTime) || "—"}</Text>
        </View>
        <View style={styles.timeCell}>
          <Text style={styles.timeCellLabel}>Jamā'ah</Text>
          <Text style={[styles.timeCellValue, styles.timeCellValuePrimary]}>
            {formatTime12h(slot.jamaahTime) || "—"}
          </Text>
        </View>
        <View style={styles.timeCell}>
          <Text style={styles.timeCellLabel}>Azaan</Text>
          <Text style={styles.timeCellValue}>{formatTime12h(slot.azaanTime) || "—"}</Text>
        </View>
      </View>

      {/* <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {slot.khutbahLanguage || "Language not set"}
          {"  ·  "}
          {WOMEN_SPACE_LABELS[slot.womenPrayerSpace] || "Women's space unknown"}
        </Text>
      </View> */}
      <View style={styles.venueBadges}>
        <Text style={styles.languageBadge}>
          <Languages size={11} color="#92400E" />{" "}
          {slot.khutbahLanguage || "Language not set"}</Text>
        {slot.womenPrayerSpace === "available" && (
          <View style={styles.womenBadge}>
            <Text style={styles.womenBadgeText}>🧕 Women</Text>
          </View>
        )}
      </View>

      {slot.importantNotice ? (
        <Text style={styles.noticeText}>📌 {slot.importantNotice}</Text>
      ) : null}

      <View style={styles.slotFooter}>
        <Text style={styles.lastUpdated}>Updated {formatRelativeDate(slot.updatedAt)}</Text>
        {editable && (
          <TouchableOpacity style={styles.editButton} onPress={() => onEdit(slot)} activeOpacity={0.85}>
            <Text style={styles.editButtonText}>Edit →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function MosqueAdminEditJumuahScreen({ navigation, route }) {
  const venueParam = route.params?.venue;
  const venueId = venueParam?.id;

  const [venue, setVenue] = useState(venueParam || null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [saving, setSaving] = useState(false);

  async function loadDetail() {
    setError(null);
    try {
      const res = await fetchMyVenueById(venueId);
      setVenue(res.data.venue);
      setPermissions(res.data.permissions || {});
    } catch (e) {
      setError(e.message || "Couldn't load Jumu'ah timings.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { loadDetail(); }, [venueId]));

  const slots = [...(venue?.jumuahTimings || [])].sort((a, b) => a.slotNumber - b.slotNumber);
  const nextSlotNumber = slots.length > 0 ? Math.max(...slots.map((s) => s.slotNumber)) + 1 : 1;

  function openAddSlot() {
    setEditingSlot(null);
    setSheetVisible(true);
  }

  function openEditSlot(slot) {
    setEditingSlot(slot);
    setSheetVisible(true);
  }

  async function handleSave(values) {
    setSaving(true);
    try {
      const payload = {
        slotNumber: values.slotNumber,
        jamaahTime: values.jamaahTime,
        azaanTime: values.azaanTime || undefined,
        khutbahTime: values.khutbahTime || undefined,
        khutbahLanguage: values.khutbahLanguage || undefined,
        womenPrayerSpace: values.womenPrayerSpace || undefined,
        importantNotice: values.importantNotice || undefined,
      };

      if (editingSlot?.id) {
        await updateMyJumuahTiming(editingSlot.id, payload);
      } else {
        await createMyJumuahTiming(venueId, payload);
      }

      setSheetVisible(false);
      await loadDetail();
    } catch (e) {
      Alert.alert("Couldn't save slot", e.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !venue) {
    return <Loader message="Loading Jumu'ah timings..." />;
  }

  const canEdit = !!permissions.canEditJumuahTimings;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IslamicPattern width={SCREEN_WIDTH} height={140} color="rgba(255,255,255,0.035)" />
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Jumu'ah Timings</Text>
            <Text style={styles.headerSub}>{venue.name}</Text>
          </View>
        </SafeAreaView>
      </View>

      {!canEdit && (
        <View style={styles.readOnlyBanner}>
          <Text style={styles.readOnlyText}>
            You have view-only access to Jumu'ah timings for this mosque.
          </Text>
        </View>
      )}

      {error ? (
        <EmptyState icon="⚠️" title="Couldn't load" subtitle={error} actionLabel="Retry" onAction={loadDetail} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDetail(); }} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        >
          {slots.length === 0 ? (
            <EmptyState
              icon="🕋"
              title="No Jumu'ah slots yet"
              subtitle="Add your mosque's Friday prayer slot so nearby Muslims can find it."
            />
          ) : (
            slots.map((slot) => (
              <SlotCard key={slot.id} slot={slot} editable={canEdit} onEdit={openEditSlot} />
            ))
          )}

          {canEdit && (
            <TouchableOpacity style={styles.addSlotCard} onPress={openAddSlot} activeOpacity={0.85}>
              <Text style={styles.addSlotIcon}>+</Text>
              <Text style={styles.addSlotText}>Add Jumu'ah Slot</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      <JumuahSlotFormSheet
        visible={sheetVisible}
        saving={saving}
        onClose={() => setSheetVisible(false)}
        onSave={handleSave}
        initialValues={
          editingSlot
            ? { ...editingSlot }
            : {
              slotNumber: nextSlotNumber,
              azaanTime: "",
              khutbahTime: "",
              jamaahTime: "",
              khutbahLanguage: "",
              womenPrayerSpace: "unknown",
              importantNotice: "",
            }
        }
      />
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
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.6)" },

  readOnlyBanner: { backgroundColor: "#EFF6FF", padding: 12, borderLeftWidth: 3, borderLeftColor: "#2563EB" },
  readOnlyText: { fontSize: 13, color: "#1D4ED8", fontWeight: "600" },

  scrollContent: { padding: 16 },

  slotCard: { backgroundColor: COLORS.card, borderRadius: 18, padding: 16, marginBottom: 14, elevation: 3, shadowColor: COLORS.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  slotHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  slotBadge: { backgroundColor: COLORS.background, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  slotBadgeText: { fontSize: 12, fontWeight: "800", color: COLORS.textPrimary },

  timeGrid: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.borderLight, paddingVertical: 12, marginBottom: 10 },
  timeCell: { flex: 1, alignItems: "center" },
  timeCellLabel: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  timeCellValue: { fontSize: 15, fontWeight: "700", color: COLORS.textSecondary },
  timeCellValuePrimary: { color: COLORS.primary, fontSize: 17, fontWeight: "800" },

  metaRow: { marginBottom: 6 },
  metaText: { fontSize: 12, color: COLORS.textMuted },
  noticeText: { fontSize: 12, color: "#7A5A1E", backgroundColor: "#FEF3E2", padding: 8, borderRadius: 8, marginTop: 6 },

  slotFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  lastUpdated: { fontSize: 11, color: COLORS.textMuted },
  editButton: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  editButtonText: { fontSize: 12, fontWeight: "700", color: COLORS.white },

  addSlotCard: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: "dashed", borderRadius: 16, paddingVertical: 18, marginTop: 4 },
  addSlotIcon: { fontSize: 18, color: COLORS.primary, fontWeight: "800", marginRight: 8 },
  addSlotText: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
  venueBadges: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
  },

  languageBadge: {
    fontSize: 12, color: "#92400E", backgroundColor: "#FEF3C7",
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  womenBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  womenBadgeText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
  },
});