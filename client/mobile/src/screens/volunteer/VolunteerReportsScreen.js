// src/screens/volunteer/VolunteerReportsScreen.js
import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, PRAYER_NAMES } from "../../constants";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import { fetchVolunteerReports, updateVolunteerReportStatus } from "../../lib/endpoints";
import { formatRelativeDate, formatTime12h } from "../../lib/dateUtils";
import { ActionFlow } from "../../lib/actionFlow";
import { Info } from "lucide-react-native";

const STATUS_COLORS = {
  pending: { bg: "#FFFBEB", text: "#92400E", label: "Pending" },
  approved: { bg: "#ECFDF5", text: "#065F46", label: "Approved" },
  rejected: { bg: "#FEF2F2", text: "#991B1B", label: "Rejected" },
  needs_more_info: { bg: "#EDE9FE", text: "#5B21B6", label: "Needs Info" },
};

const ISSUE_TYPE_LABELS = {
  azaan_time_wrong: "Azaan time wrong",
  jamaah_time_wrong: "Jamā'ah time wrong",
  jumuah_time_wrong: "Jumu'ah time wrong",
  location_wrong: "Location wrong",
  women_prayer_info_wrong: "Women's prayer info wrong",
  facility_info_wrong: "Facility info wrong",
  venue_closed_or_inactive: "Venue closed/inactive",
  other: "Other",
};

function TimingComparisonRow({ label, current, suggested, isFirst }) {
  return (
    <View style={[styles.comparisonRow, isFirst && styles.comparisonRowFirst]}>
      <Text style={styles.comparisonField}>{label}</Text>
      <Text style={styles.comparisonCurrent}>{current ? formatTime12h(current) : "—"}</Text>
      <Text style={styles.comparisonSuggested}>{suggested ? formatTime12h(suggested) : "—"}</Text>
    </View>
  );
}

function ReportCard({ report, canReview, canUpdateTimings, onApprove, onReject, onNeedsInfo }) {
  const s = STATUS_COLORS[report.status] || STATUS_COLORS.pending;
  const isJumuahReport = !!report.jumuahTimingId || report.issueType === "jumuah_time_wrong";
  const hasTimingComparison =
    report.suggestedAzaanTime || report.suggestedJamaahTime || report.suggestedKhutbahTime ||
    report.currentAzaanTime || report.currentJamaahTime;

  return (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.reportMosque}>{report.venue?.name}</Text>
          <Text style={styles.reportPrayer}>
            {report.prayerName
              ? PRAYER_NAMES[report.prayerName]
              : report.jumuahTiming?.slotNumber
                ? `Jumu'ah · Slot ${report.jumuahTiming.slotNumber}`
                : "Jumu'ah"} ·{" "}
            {ISSUE_TYPE_LABELS[report.issueType] || report.issueType?.replace(/_/g, " ")}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
          <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
        </View>
      </View>

      {hasTimingComparison && (
        <View style={styles.comparisonWrap}>
          <Text style={styles.comparisonTitle}>TIMING COMPARISON</Text>
          <View style={styles.comparisonTable}>
            <View style={styles.comparisonHeaderRow}>
              <Text style={styles.comparisonHeaderField}>Field</Text>
              <Text style={styles.comparisonHeaderCell}>Current</Text>
              <Text style={styles.comparisonHeaderCell}>Suggested</Text>
            </View>
            <TimingComparisonRow label="Azaan" current={report.currentAzaanTime} suggested={report.suggestedAzaanTime} isFirst />
            {isJumuahReport && (
              <TimingComparisonRow label="Khutbah" current={report.currentKhutbahTime} suggested={report.suggestedKhutbahTime} />
            )}
            <TimingComparisonRow label="Jamā'ah" current={report.currentJamaahTime} suggested={report.suggestedJamaahTime} />
          </View>
        </View>
      )}

      {report.userNote && (
        <View style={styles.noteCard}>
          <Text style={styles.noteQuoteMark}>"</Text>
          <Text style={styles.noteText}>{report.userNote}</Text>
        </View>
      )}

      <Text style={styles.reportDate}>Submitted {formatRelativeDate(report.createdAt)}</Text>

      {report.status === "pending" && canReview && (
        <>
          <View style={styles.manualNote}>
            <Info size={12} color="#2563EB" />
            <Text style={styles.manualNoteText}>
              {canUpdateTimings
                ? "Approving will update the live timing for this mosque automatically."
                : "Approving closes this report only — it doesn't change the live timing. Someone with update permission for this mosque will need to apply it."}
            </Text>
          </View>
          <View style={styles.reportActions}>
            <TouchableOpacity style={styles.approveButton} onPress={() => onApprove(report)} activeOpacity={0.85}>
              <Text style={styles.approveButtonText}>✓ Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoButton} onPress={() => onNeedsInfo(report)} activeOpacity={0.85}>
              <Text style={styles.infoButtonText}>? Info</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectButton} onPress={() => onReject(report)} activeOpacity={0.85}>
              <Text style={styles.rejectButtonText}>✕ Reject</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

export default function VolunteerReportsScreen({ navigation, route }) {
  const canReview = route.params?.canReview !== false;
  const canUpdateTimings = !!route.params?.canUpdateTimings;

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function loadReports() {
    setError(null);
    try {
      const res = await fetchVolunteerReports({ status: "pending" });
      setReports(res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { loadReports(); }, []));

  async function handleApprove(report) {
   const { confirmed, error, result } = await ActionFlow.confirm({
      title: "Approve Report",
      message: "This closes the report as resolved and, if you're trusted to update this mosque's timings, applies the correction automatically.",
      confirmText: "Approve",
      loadingMessage: "Updating...",
      successTitle: "Approved",
      onConfirm: () => updateVolunteerReportStatus(report.id, { status: "approved" }),
    });
    if (confirmed && !error) loadReports();
  }

  async function handleReject(report) {
    const { confirmed, error } = await ActionFlow.confirm({
      title: "Reject Report",
      message: "Mark this report as incorrect?",
      confirmText: "Reject",
      destructive: true,
      loadingMessage: "Rejecting...",
      successTitle: "Rejected",
      onConfirm: () => updateVolunteerReportStatus(report.id, { status: "rejected" }),
    });
    if (confirmed && !error) loadReports();
  }

  async function handleNeedsInfo(report) {
    const { confirmed, error } = await ActionFlow.confirm({
      title: "Request More Info",
      message: "Mark this report as needing more information from the person who submitted it?",
      confirmText: "Mark Needs Info",
      loadingMessage: "Updating...",
      successTitle: "Marked",
      onConfirm: () => updateVolunteerReportStatus(report.id, { status: "needs_more_info" }),
    });
    if (confirmed && !error) loadReports();
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Timing Reports</Text>
          <Text style={styles.headerSub}>Reports in your assigned scope</Text>
        </View>
      </SafeAreaView>

      {!canReview && (
        <View style={styles.readOnlyBanner}>
          <Text style={styles.readOnlyText}>You have view-only access to reports right now.</Text>
        </View>
      )}

      {loading ? (
        <Loader message="Loading reports..." />
      ) : error ? (
        <EmptyState icon="⚠️" title="Couldn't load" subtitle={error} actionLabel="Retry" onAction={loadReports} />
      ) : reports.length === 0 ? (
        <EmptyState icon="✅" title="No pending reports" subtitle="No unreviewed reports in your scope right now." />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadReports(); }} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
          renderItem={({ item }) => (
            <ReportCard report={item} canReview={canReview} canUpdateTimings={canUpdateTimings} onApprove={handleApprove} onReject={handleReject} onNeedsInfo={handleNeedsInfo} />
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
  reportCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: COLORS.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  reportHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  reportMosque: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 3 },
  reportPrayer: { fontSize: 12, color: COLORS.textMuted, textTransform: "capitalize" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700" },
  comparisonWrap: { marginBottom: 10 },
  comparisonTitle: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.6, marginBottom: 6 },
  comparisonTable: { borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: 10, overflow: "hidden" },
  comparisonHeaderRow: { flexDirection: "row", backgroundColor: COLORS.surface, paddingVertical: 7, paddingHorizontal: 10 },
  comparisonHeaderField: { flex: 1, fontSize: 10, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.3 },
  comparisonHeaderCell: { flex: 1, fontSize: 10, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.3, textAlign: "center" },
  comparisonRow: { flexDirection: "row", paddingVertical: 9, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  comparisonRowFirst: { borderTopWidth: 0 },
  comparisonField: { flex: 1, fontSize: 13, color: COLORS.textMuted },
  comparisonCurrent: { flex: 1, fontSize: 13, color: COLORS.textSecondary, textAlign: "center" },
  comparisonSuggested: { flex: 1, fontSize: 13, fontWeight: "700", color: COLORS.primary, textAlign: "center" },
  noteCard: { flexDirection: "row", backgroundColor: COLORS.surface, borderLeftWidth: 3, borderLeftColor: COLORS.borderLight, borderRadius: 8, padding: 10, marginBottom: 8 },
  noteQuoteMark: { fontSize: 22, color: COLORS.textMuted, fontWeight: "800", marginRight: 4, lineHeight: 22 },
  noteText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, fontStyle: "italic", lineHeight: 18, marginTop: 2 },
  reportDate: { fontSize: 11, color: COLORS.textMuted, marginBottom: 12 },
  manualNote: { backgroundColor: "#F0F9FF", borderRadius: 8, padding: 8, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: "#2563EB", flexDirection: "row", alignItems: "center", gap: 6 },
  manualNoteText: { flex: 1, fontSize: 10, color: "#1D4ED8", lineHeight: 15 },
  reportActions: { flexDirection: "row", gap: 8 },
  approveButton: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  approveButtonText: { fontSize: 12, fontWeight: "700", color: COLORS.white },
  infoButton: { flex: 1, backgroundColor: "#EDE9FE", borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  infoButtonText: { fontSize: 12, fontWeight: "700", color: "#5B21B6" },
  rejectButton: { flex: 1, backgroundColor: COLORS.card, borderRadius: 10, paddingVertical: 11, alignItems: "center", borderWidth: 1.5, borderColor: "#FCA5A5" },
  rejectButtonText: { fontSize: 12, fontWeight: "700", color: COLORS.error },
});