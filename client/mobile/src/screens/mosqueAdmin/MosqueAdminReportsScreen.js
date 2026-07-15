// src/screens/mosqueAdmin/MosqueAdminReportsScreen.js
import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { APP_CONFIG, COLORS, PRAYER_NAMES } from "../../constants";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import { fetchMyMosqueReports, updateMosqueReportStatus } from "../../lib/endpoints";
import { formatRelativeDate, formatTime12h } from "../../lib/dateUtils";
import { ActionFlow } from "../../lib/actionFlow";
import { Info } from "lucide-react-native";

const STATUS_COLORS = {
  pending: { bg: "#FFFBEB", text: "#92400E", label: "Pending" },
  approved: { bg: COLORS.verifiedBg || "#ECFDF5", text: "#065F46", label: "Approved" },
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

const TIMING_ISSUE_TYPES = ["both_times_wrong", "azaan_time_wrong", "jamaah_time_wrong", "jumuah_time_wrong"];

function TimingComparisonRow({ label, current, suggested, isFirst }) {
  return (
    <View style={[styles.comparisonRow, isFirst && styles.comparisonRowFirst]}>
      <Text style={styles.comparisonField}>{label}</Text>
      <Text style={styles.comparisonCurrent}>{current ? formatTime12h(current) : "—"}</Text>
      <Text style={styles.comparisonSuggested}>{suggested ? formatTime12h(suggested) : "—"}</Text>
    </View>
  );
}

function ReportCard({ report, onApprove, onReject }) {
  const s = STATUS_COLORS[report.status] || STATUS_COLORS.pending;
  const isJumuahReport = !!report.jumuahTimingId || report.issueType === "jumuah_time_wrong";
  const submitterName = report.submittedBy?.name || report.user?.name || report.submitter?.name;

  const hasTimingComparison =
    report.suggestedAzaanTime || report.suggestedJamaahTime || report.suggestedKhutbahTime ||
    report.currentAzaanTime || report.currentJamaahTime;

  const isTimingIssue = TIMING_ISSUE_TYPES.includes(report.issueType);

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
            <TimingComparisonRow
              label="Azaan"
              current={report.currentAzaanTime}
              suggested={report.suggestedAzaanTime}
              isFirst
            />
            {isJumuahReport && (
              <TimingComparisonRow
                label="Khutbah"
                current={report.currentKhutbahTime}
                suggested={report.suggestedKhutbahTime}
              />
            )}
            <TimingComparisonRow
              label="Jamā'ah"
              current={report.currentJamaahTime}
              suggested={report.suggestedJamaahTime}
            />
          </View>
        </View>
      )}

      {report.userNote && (
        <View style={styles.noteCard}>
          <Text style={styles.noteQuoteMark}>"</Text>
          <Text style={styles.noteText}>{report.userNote}</Text>
        </View>
      )}

      <Text style={styles.reportDate}>{submitterName ? `Submitted by ${submitterName} · ` : "Submitted "}
        {formatRelativeDate(report.createdAt)}</Text>

      {report.status === "pending" && (
        <>
          {!isTimingIssue && (
            <View style={styles.manualNote}>
                <Info size={12} color="#2563EB" />
              <Text style={styles.manualNoteText}>
                This isn't a timing correction --- please update the relevant mosque details yourself, then close this report.
              </Text>
            </View>
          )}
          <View style={styles.reportActions}>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => onApprove(report)}
              activeOpacity={0.85}
            >
              <Text style={styles.approveButtonText}>
                {isTimingIssue ? "✓ Approve & Update" : "✓ Mark Resolved"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => onReject(report)}
              activeOpacity={0.85}
            >
              <Text style={styles.rejectButtonText}>✕ Reject</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

export default function MosqueAdminReportsScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function loadReports() {
    setError(null);
    try {
      const res = await fetchMyMosqueReports({ status: "pending" });
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
    const { confirmed, error } = await ActionFlow.confirm({
      title: "Approve Report",
      message: `This will update the timing in ${APP_CONFIG.name} to the suggested value. Are you sure?`,
      confirmText: "Approve",
      loadingMessage: "Updating timing...",
      successTitle: "Approved",
      successMessage: "The timing has been updated.",
      onConfirm: () => updateMosqueReportStatus(report.id, { status: "approved" }),
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
      onConfirm: () => updateMosqueReportStatus(report.id, { status: "rejected" }),
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
          <Text style={styles.headerSub}>Reports submitted by users for your mosque</Text>
        </View>
      </SafeAreaView>

      {loading ? (
        <Loader message="Loading reports..." />
      ) : error ? (
        <EmptyState icon="⚠️" title="Couldn't load" subtitle={error} actionLabel="Retry" onAction={loadReports} />
      ) : reports.length === 0 ? (
        <EmptyState icon="✅" title="No pending reports" subtitle="No unreviewed reports for your mosque right now." />
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
            <ReportCard report={item} onApprove={handleApprove} onReject={handleReject} />
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
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, marginBottom: 14,
  },
  backButtonText: { fontSize: 14, color: COLORS.white, fontWeight: "600" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: COLORS.white, marginBottom: 4 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.55)" },

  listContent: { padding: 16 },

  reportCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16, padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6,
  },
  reportHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  reportMosque: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 3 },
  reportPrayer: { fontSize: 12, color: COLORS.textMuted, textTransform: "capitalize" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700" },



  comparisonWrap: { marginBottom: 10 },
  comparisonTitle: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.6, marginBottom: 6 },
  comparisonTable: { borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: 10, overflow: "hidden" },
  comparisonHeaderRow: {
    flexDirection: "row", backgroundColor: COLORS.surface,
    paddingVertical: 7, paddingHorizontal: 10,
  },
  comparisonHeaderField: { flex: 1, fontSize: 10, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.3 },
  comparisonHeaderCell: { flex: 1, fontSize: 10, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.3, textAlign: "center" },
  comparisonRow: {
    flexDirection: "row", paddingVertical: 9, paddingHorizontal: 10,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
  },
  comparisonRowFirst: { borderTopWidth: 0 },
  comparisonField: { flex: 1, fontSize: 13, color: COLORS.textMuted },
  comparisonCurrent: { flex: 1, fontSize: 13, color: COLORS.textSecondary, textAlign: "center" },
  comparisonSuggested: { flex: 1, fontSize: 13, fontWeight: "700", color: COLORS.primary, textAlign: "center" },

  noteCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderLeftWidth: 3, borderLeftColor: COLORS.borderLight,
    borderRadius: 8, padding: 10, marginBottom: 8,
  },
  noteQuoteMark: { fontSize: 22, color: COLORS.textMuted, fontWeight: "800", marginRight: 4, lineHeight: 22 },
  noteText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, fontStyle: "italic", lineHeight: 18, marginTop: 2 },

  userNote: {
    fontSize: 13, color: COLORS.textMuted,
    fontStyle: "italic", marginBottom: 8, lineHeight: 18,
  },
  reportDate: { fontSize: 11, color: COLORS.textMuted, marginBottom: 12 },

  reportActions: { flexDirection: "row", gap: 10 },
  approveButton: {
    flex: 1, backgroundColor: COLORS.primary,
    borderRadius: 10, paddingVertical: 11, alignItems: "center",
  },
  approveButtonText: { fontSize: 13, fontWeight: "700", color: COLORS.white },
  rejectButton: {
    flex: 1, backgroundColor: COLORS.card,
    borderRadius: 10, paddingVertical: 11, alignItems: "center",
    borderWidth: 1.5, borderColor: "#FCA5A5",
  },
  rejectButtonText: { fontSize: 13, fontWeight: "700", color: COLORS.error },
  manualNote: {
    backgroundColor: "#F0F9FF",
    borderRadius: 8, padding: 8, marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: "#2563EB",
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  manualNoteText: { fontSize: 10, color: "#1D4ED8", lineHeight: 17 },
});