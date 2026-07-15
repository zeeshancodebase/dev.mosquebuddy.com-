// src/screens/mosqueAdmin/MosqueAdminDetailsScreen.js
import React, { useCallback, useState } from "react";
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, Dimensions, Linking, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, PRAYER_NAMES, VENUE_TYPES } from "../../constants";
import IslamicPattern from "../../components/IslamicPattern";
import Loader from "../../components/Loader";
import VerificationBadge from "../../components/VerificationBadge";
import EditFieldsSheet from "../../components/EditFieldsSheet";
import { fetchMyVenueById, updateMyVenueProfile } from "../../lib/endpoints";
import { formatRelativeDate, formatTime12h } from "../../lib/dateUtils";
import { CalendarClock, ClipboardList, Clock, Clock3, SquarePen, TriangleAlert } from "lucide-react-native";
import Button from "../../components/Button";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PRAYER_ORDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const WOMEN_SPACE_OPTIONS = [
    { value: "available", label: "Available" },
    { value: "not_available", label: "Not Available" },
    { value: "jumuah_only", label: "Jumu'ah Only" },
    { value: "ramadan_eid_only", label: "Ramadan/Eid Only" },
    { value: "unknown", label: "Unknown" },
];
const FACILITY_OPTIONS = [
    { value: "available", label: "Available" },
    { value: "not_available", label: "Not Available" },
    { value: "limited", label: "Limited" },
    { value: "unknown", label: "Unknown" },
];

function labelFor(options, value) {
    return options.find((o) => o.value === value)?.label;
}

function InfoRow({ label, value }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue} numberOfLines={2}>{value || "—"}</Text>
        </View>
    );
}

function SectionCard({ title, children }) {
    return (
        <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );
}

function NavCard({ icon, title, subtitle, onPress, locked }) {
    return (
        <TouchableOpacity
            style={[styles.navCard, locked && styles.navCardLocked]}
            onPress={locked ? undefined : onPress}
            activeOpacity={locked ? 1 : 0.85}
        >
            <Text style={styles.navCardIcon}>{icon}</Text>
            <View style={{ flex: 1 }}>
                <Text style={styles.navCardTitle}>{title}</Text>
                <Text style={styles.navCardSubtitle}>
                    {locked ? "Not permitted for your role on this mosque" : subtitle}
                </Text>
            </View>
            {!locked && <Text style={styles.navCardArrow}>→</Text>}
        </TouchableOpacity>
    );
}

export default function MosqueAdminDetailsScreen({ navigation, route }) {
    const initialAssignment = route.params?.assignment;
    const venueId = initialAssignment?.venue?.id;

    const [venue, setVenue] = useState(initialAssignment?.venue || null);
    const [permissions, setPermissions] = useState(initialAssignment?.permissions || {});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [editSheetVisible, setEditSheetVisible] = useState(false);
    const [saving, setSaving] = useState(false);

    async function loadDetail() {
        setError(null);
        try {
            const res = await fetchMyVenueById(venueId);
            // GET shape: { assignmentId, permissions, assignedAt, venue }
            setVenue(res.data.venue);
            setPermissions(res.data.permissions || {});
        } catch (e) {
            setError(e.message || "Couldn't load mosque details.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useFocusEffect(useCallback(() => { loadDetail(); }, [venueId]));

    async function handleSaveProfile(values) {
        setSaving(true);
        try {
            const res = await updateMyVenueProfile(venueId, values);
            // PATCH shape: bare updated venue object, no wrapper
            setVenue(res.data);
            setEditSheetVisible(false);
        } catch (e) {
            Alert.alert("Couldn't save", e.message || "Please try again.");
        } finally {
            setSaving(false);
        }
    }

    if (loading || !venue) {
        return <Loader message="Loading mosque details..." />;
    }

    const sortedTimings = [...(venue.dailyPrayerTimings || [])].sort(
        (a, b) => PRAYER_ORDER.indexOf(a.prayerName) - PRAYER_ORDER.indexOf(b.prayerName)
    );
    const jumuahSlots = venue.jumuahTimings || [];
    const needsUpdateCount = sortedTimings.filter((t) => t.verificationStatus === "needs_update").length;
    const locationLine = [venue.area?.name, venue.city?.name, venue.state?.name].filter(Boolean).join(", ");

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <IslamicPattern width={SCREEN_WIDTH} height={170} color="rgba(255,255,255,0.035)" />
                <SafeAreaView edges={["top"]}>
                    <View style={styles.headerContent}>
                        <View style={styles.headerTopRow}>
                            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                                <Text style={styles.backButtonText}>← Back</Text>
                            </TouchableOpacity>

                            {permissions.canEditVenueProfile && (
                                <TouchableOpacity
                                    style={styles.editIconButton}
                                    onPress={() => setEditSheetVisible(true)}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.editIconText}><SquarePen size={15} color={COLORS.white} /> Edit</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <Text style={styles.venueName}>{venue.name}</Text>
                        <Text style={styles.venueMeta}>
                            {VENUE_TYPES[venue.venueType] || venue.venueType}
                            {locationLine ? ` · ${locationLine}` : ""}
                        </Text>
                        <View style={{ marginTop: 10, alignSelf: "flex-start" }}>
                            <VerificationBadge status={venue.verificationStatus} size="sm" />
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDetail(); }} tintColor={COLORS.primary} colors={[COLORS.primary]} />
                }
            >
                {error && (
                    <View style={styles.alertBanner}>
                        {/* <Text style={styles.alertText}>⚠ {error}</Text> */}
                        <Text style={styles.alertText}><TriangleAlert size={18} color="#D97706" />  {error}</Text>
                    </View>
                )}

                {needsUpdateCount > 0 && (
                    <View style={styles.alertBanner}>
                        <Text style={styles.alertText}>
                            ⚠ {needsUpdateCount} daily timing{needsUpdateCount > 1 ? "s" : ""} need updating
                        </Text>
                    </View>
                )}

                <NavCard
                    // icon="🕌"
                    icon={<Clock size={22} color={COLORS.primary} />}
                    title="Daily Prayer Timings"
                    subtitle={`${sortedTimings.length} of 5 prayers configured`}
                    locked={!permissions.canEditDailyTimings}
                    onPress={() => navigation.navigate("MosqueAdminEditTimings", { venue, permissions })}
                />
                <NavCard
                    // icon="🕋"
                    icon={<CalendarClock size={22} color={COLORS.primary} />}
                    title="Jumu'ah Timings"
                    subtitle={`${jumuahSlots.length} slot${jumuahSlots.length === 1 ? "" : "s"} configured`}
                    locked={!permissions.canEditJumuahTimings}
                    onPress={() => navigation.navigate("MosqueAdminEditJumuah", { venue })}
                />
                <NavCard
                    // icon="🚩"
                    icon={<ClipboardList size={22} color={COLORS.primary} />}
                    title="Timing Reports"
                    subtitle="Review reports submitted for this mosque"
                    locked={!permissions.canReviewReports}
                    onPress={() => navigation.navigate("MosqueAdminReports", { venueId })}
                />

                <SectionCard title="Contact & Location">
                    <InfoRow label="Address" value={venue.address} />
                    <InfoRow label="Area" value={locationLine} />
                    <InfoRow label="Phone" value={venue.phone} />
                    {venue.googleMapsLink && (
                        <TouchableOpacity onPress={() => Linking.openURL(venue.googleMapsLink)} style={{ marginTop: 4 }}>
                            <Text style={styles.linkText}>Open in Google Maps ↗</Text>
                        </TouchableOpacity>
                    )}
                </SectionCard>

                <SectionCard title="Facilities">
                    <InfoRow label="Women's Prayer Space" value={labelFor(WOMEN_SPACE_OPTIONS, venue.womenPrayerSpace)} />
                    <InfoRow label="Wudu Facility" value={labelFor(FACILITY_OPTIONS, venue.wuduFacility)} />
                    <InfoRow label="Parking" value={labelFor(FACILITY_OPTIONS, venue.parking)} />
                    <InfoRow label="Khutbah Language" value={venue.defaultKhutbahLanguage} />
                </SectionCard>

                {venue.importantNotice && (
                    <View style={styles.noticeBanner}>
                        <Text style={styles.noticeText}>📌 {venue.importantNotice}</Text>
                        {/* <Text style={styles.noticeText}><Pin size={16} color="#7A5A1E" /> {venue.importantNotice}</Text> */}
                    </View>
                )}

                <SectionCard title="Today's Daily Timings">
                    <View style={styles.timingsHeader}>
                        <Text style={[styles.timingHeaderText, { flex: 1.2 }]}>PRAYER</Text>
                        <Text style={styles.timingHeaderText}>AZAAN</Text>
                        <Text style={styles.timingHeaderText}>JAMĀ'AH</Text>
                    </View>
                    {sortedTimings.length === 0 ? (
                        <Text style={styles.noTimingsText}>No timings added yet</Text>
                    ) : (
                        sortedTimings.map((t) => (
                            <View key={t.id} style={styles.timingRow}>
                                <Text style={styles.timingPrayer}>{PRAYER_NAMES[t.prayerName]}</Text>
                                <Text style={styles.timingAzaan}>{formatTime12h(t.azaanTime) || "—"}</Text>
                                <Text style={styles.timingJamaah}>
                                    {t.timingType === "relative" ? t.relativeTimeText : formatTime12h(t.jamaahTime) || "—"}
                                </Text>
                            </View>
                        ))
                    )}
                    {permissions.canEditDailyTimings && (
                        <Button
                            title="Update Timings"
                            variant="primary"
                            size="sm"
                            style={{ marginTop: 12 }}
                            leftIcon={<Clock3 size={18} color={COLORS.white} />}
                            onPress={() => navigation.navigate("MosqueAdminEditTimings", { venue, permissions })}
                        />
                    )}
                </SectionCard>

                <View style={styles.footerMeta}>
                    <Text style={styles.footerMetaText}>
                        Last verified: {formatRelativeDate(venue.lastVerifiedAt)}
                    </Text>
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>

            <EditFieldsSheet
                visible={editSheetVisible}
                title="Edit Mosque Details"
                saving={saving}
                onClose={() => setEditSheetVisible(false)}
                onSave={handleSaveProfile}
                initialValues={{
                    phone: venue.phone || "",
                    googleMapsLink: venue.googleMapsLink || "",
                    womenPrayerSpace: venue.womenPrayerSpace || "unknown",
                    wuduFacility: venue.wuduFacility || "unknown",
                    parking: venue.parking || "unknown",
                    defaultKhutbahLanguage: venue.defaultKhutbahLanguage || "",
                    facilityNotes: venue.facilityNotes || "",
                    importantNotice: venue.importantNotice || "",
                }}
                fields={[
                    { key: "phone", label: "Phone", type: "text" },
                    { key: "googleMapsLink", label: "Google Maps Link", type: "text" },
                    { key: "womenPrayerSpace", label: "Women's Prayer Space", type: "select", options: WOMEN_SPACE_OPTIONS },
                    { key: "wuduFacility", label: "Wudu Facility", type: "select", options: FACILITY_OPTIONS },
                    { key: "parking", label: "Parking", type: "select", options: FACILITY_OPTIONS },
                    { key: "defaultKhutbahLanguage", label: "Khutbah Language", type: "text" },
                    { key: "facilityNotes", label: "Facility Notes", type: "text", multiline: true },
                    { key: "importantNotice", label: "Important Notice", type: "text", multiline: true },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { backgroundColor: COLORS.dark, paddingBottom: 20 },
    headerContent: { paddingHorizontal: 20, paddingTop: 8 },
    headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
    backButton: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    backButtonText: { fontSize: 14, color: COLORS.white, fontWeight: "600" },
    editIconButton: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    editIconText: { fontSize: 13, color: COLORS.white, fontWeight: "700" },
    venueName: { fontSize: 24, fontWeight: "800", color: COLORS.white, marginBottom: 4 },
    venueMeta: { fontSize: 13, color: "rgba(255,255,255,0.6)" },

    scrollContent: { padding: 16 },

    alertBanner: {
        backgroundColor: "#FFFBEB", borderRadius: 10, padding: 12, marginBottom: 14,
        borderLeftWidth: 3, borderLeftColor: "#D97706",
    },
    alertText: { fontSize: 13, color: "#92400E", fontWeight: "600" },

    navCard: {
        flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card,
        borderRadius: 16, padding: 14, marginBottom: 10,
        elevation: 2, shadowColor: COLORS.dark, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6,
    },
    navCardLocked: { opacity: 0.5 },
    navCardIcon: { marginRight: 12, },
    navCardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
    navCardSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    navCardArrow: { fontSize: 16, color: COLORS.primary, fontWeight: "700" },

    sectionCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginTop: 8, marginBottom: 10 },
    sectionTitle: { fontSize: 13, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 10, textTransform: "uppercase" },

    infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7 },
    infoLabel: { fontSize: 13, color: COLORS.textMuted, flex: 1 },
    infoValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "600", flex: 1.4, textAlign: "right" },
    linkText: { fontSize: 13, color: COLORS.primary, fontWeight: "700" },

    noticeBanner: {
        backgroundColor: "#FEF3E2", borderRadius: 10, padding: 12, marginBottom: 10,
        borderLeftWidth: 3, borderLeftColor: "#D4A843",
    },
    noticeText: { fontSize: 13, color: "#7A5A1E", fontWeight: "600" },

    timingsHeader: { flexDirection: "row", paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
    timingHeaderText: { flex: 1, fontSize: 10, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.8 },
    timingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
    timingPrayer: { flex: 1.2, fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
    timingAzaan: { flex: 1, fontSize: 13, color: COLORS.textMuted },
    timingJamaah: { flex: 1, fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
    noTimingsText: { fontSize: 13, color: COLORS.textMuted, paddingVertical: 12 },

    footerMeta: { alignItems: "center", marginTop: 8 },
    footerMetaText: { fontSize: 12, color: COLORS.textMuted },
});