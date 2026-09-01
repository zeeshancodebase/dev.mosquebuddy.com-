// src/components/AnnouncementsSection.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
  Pressable,
} from "react-native";
import { COLORS } from "../constants";
import { useLocation } from "../context/LocationContext";
import { fetchPublicAnnouncements } from "../lib/endpoints";
import Loader from "./Loader";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.78;

const SCOPE_META = {
  venue: { label: "This Mosque", color: COLORS.primary, icon: "🕌" },
  area: { label: "Area-wide", color: "#F59E0B", icon: "📍" },
  city: { label: "City-wide", color: "#D4A843", icon: "🏙" },
  state: { label: "State/National", color: "#DC2626", icon: "🌍" },
};

const CATEGORY_ICON = {
  event: "🎉",
  eid: "☪️",
  urgent: "⚠️",
  class: "📖",
  general: "📢",
};

function formatEventMeta(item) {
  const datePart = item.eventDate
    ? new Date(item.eventDate).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    })
    : null;
  return [datePart, item.eventTimeText].filter(Boolean).join(" · ") || null;
}

function AnnouncementCard({ item, onPress }) {
  const scopeMeta = SCOPE_META[item.scope] || SCOPE_META.venue;
  const scopeLabel =
    item.venue?.name || item.area?.name || item.city?.name || item.state?.name || scopeMeta.label;
  const meta = formatEventMeta(item);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        item.isPinned && styles.cardPinned,
      ]}
      onPress={onPress}
    >
      <View style={styles.cardTopRow}>
        <View style={[styles.scopeBadge, { backgroundColor: scopeMeta.color + "18" }]}>
          <Text style={styles.scopeBadgeIcon}>{scopeMeta.icon}</Text>
          <Text style={[styles.scopeBadgeText, { color: scopeMeta.color }]}>
            {scopeMeta.label}
          </Text>
        </View>
        <Text style={styles.categoryIcon}>{CATEGORY_ICON[item.category] || "📢"}</Text>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.cardScopeLabel} numberOfLines={1}>
        {scopeLabel}
      </Text>

      {meta && (
        <View style={styles.cardFooter}>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {meta}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function NoAnnouncementsCard() {
  return (
    <View style={styles.emptySection}>
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconWrap}>
          <Text style={styles.emptyIcon}>📢</Text>
        </View>

        <View style={styles.emptyTextWrap}>
          <View style={styles.emptyBadge}>
            <Text style={styles.emptyBadgeText}>NO ANNOUNCEMENTS</Text>
          </View>

          <Text style={styles.emptyTitle}>You're all caught up</Text>

          <Text style={styles.emptySub}>
            There are currently no announcements from nearby mosques. Check back
            later for events, classes and important notices.
          </Text>
        </View>
      </View>
    </View>
  );
}


export default function AnnouncementsSection(props) {
  const venueId = props?.venueId || null;
  const venueIds = Array.isArray(props?.venueIds) ? props.venueIds : [];
  const areaIdProp = props?.areaId || null;
  const cityIdProp = props?.cityId || null;
  const stateIdProp = props?.stateId || null;
  const hideIfEmpty = !!props?.hideIfEmpty;

  const { locationContext } = useLocation();
  const [selected, setSelected] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | loaded | error


  const areaId = areaIdProp || locationContext?.areaId || null;
  const cityId = cityIdProp || locationContext?.cityId || null;
  const stateId = stateIdProp || locationContext?.stateId || null;
  const hasScope = !!(venueId || venueIds.length > 0 || areaId || cityId || stateId);


  const venueIdsKey = venueIds.join(",");

  // useEffect(() => {
  //   if (__DEV__) {
  //     console.log("[Announcements] props received:", { venueId, venueIds, areaId, cityId, stateId, hasScope });
  //   }
  // }, [venueId, venueIdsKey, areaId, cityId, stateId, hasScope]);

  const load = useCallback(async () => {
    if (!hasScope) return;
    setStatus("loading");
    try {
      const res = await fetchPublicAnnouncements({
        venueId,
        venueIds: venueIds.length > 0 ? venueIds.join(",") : undefined,
        areaId,
        cityId,
        stateId,
        limit: 10,
      });
      // if (__DEV__) {
      //   console.log("[Announcements] fetch result:", res?.data?.length, res?.data);
      // }
      setAnnouncements(res?.data || []);
      setStatus("loaded");
    } catch (err) {
      console.warn("Failed to load announcements:", err?.message);
      setStatus("error");
    }
  }, [venueId, venueIdsKey, areaId, cityId, stateId, hasScope]);

  useEffect(() => {
    load();
  }, [load]);


  if (!hasScope) return null;
  if (status === "error") return null;
  if (status === "loaded" && announcements.length === 0) {
    return hideIfEmpty ? null : <NoAnnouncementsCard />;
  }

  if (status === "loading" || status === "idle") {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📢 Announcements</Text>
          <Text style={styles.sectionSub}>Near you and beyond</Text>
        </View>
        <Loader fullScreen={false} />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📢 Announcements</Text>
        <Text style={styles.sectionSub}>Near you and beyond</Text>
      </View>

      <FlatList
        data={announcements}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <AnnouncementCard item={item} onPress={() => setSelected(item)} />
        )}
      />

      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelected(null)}>
          <Pressable style={styles.modalCard} onPress={() => { }}>
            {selected && (
              <>
                <View style={styles.modalTopRow}>
                  <View
                    style={[
                      styles.scopeBadge,
                      { backgroundColor: (SCOPE_META[selected.scope]?.color || COLORS.primary) + "18" },
                    ]}
                  >
                    <Text style={styles.scopeBadgeIcon}>{SCOPE_META[selected.scope]?.icon}</Text>
                    <Text
                      style={[styles.scopeBadgeText, { color: SCOPE_META[selected.scope]?.color }]}
                    >
                      {SCOPE_META[selected.scope]?.label}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelected(null)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalTitle}>{selected.title}</Text>
                <Text style={styles.modalScopeLabel}>
                  {selected.venue?.name ||
                    selected.area?.name ||
                    selected.city?.name ||
                    selected.state?.name}
                </Text>
                {formatEventMeta(selected) && (
                  <Text style={styles.modalMeta}>{formatEventMeta(selected)}</Text>
                )}
                <Text style={styles.modalBody}>{selected.body}</Text>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 0, marginBottom: 4 },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: COLORS.dark },
  sectionSub: { fontSize: 12.5, color: "#6B7280", marginTop: 2 },
  listContent: { paddingHorizontal: 5},
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#EEF1F0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardPressed: { opacity: 0.85 },
  cardPinned: { borderColor: "#DC262640", borderWidth: 1.3 },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  scopeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  scopeBadgeIcon: { fontSize: 11, marginRight: 4 },
  scopeBadgeText: { fontSize: 11, fontWeight: "700" },
  categoryIcon: { fontSize: 16 },
  cardTitle: { fontSize: 14.5, fontWeight: "700", color: COLORS.dark, marginBottom: 3 },
  cardScopeLabel: { fontSize: 12, color: "#6B7280", marginBottom: 8 },
  cardFooter: { borderTopWidth: 1, borderTopColor: "#F0F2F1", paddingTop: 8 },
  cardMeta: { fontSize: 11.5, color: COLORS.primary, fontWeight: "600" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(12,26,20,0.55)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 22,
    paddingBottom: 34,
  },
  modalTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalClose: { fontSize: 18, color: "#6B7280", padding: 4 },
  modalTitle: { fontSize: 19, fontWeight: "700", color: COLORS.dark, marginBottom: 4 },
  modalScopeLabel: { fontSize: 13, color: "#6B7280", marginBottom: 2 },
  modalMeta: { fontSize: 12.5, color: COLORS.primary, fontWeight: "600", marginBottom: 14 },
  modalBody: { fontSize: 14.5, color: "#374151", lineHeight: 22 },


  emptySection: {
    paddingHorizontal: 5,
  },

  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF1F0",
    borderStyle: "dashed",
  },

  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary + "14",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  emptyIcon: {
    fontSize: 20,
  },

  emptyTextWrap: {
    flex: 1,
  },

  emptyBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#D4A84320",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    marginBottom: 5,
  },

  emptyBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#B8862F",
    letterSpacing: 0.4,
  },

  emptyTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 3,
  },

  emptySub: {
    fontSize: 12.5,
    color: "#6B7280",
    lineHeight: 17,
  },
});

// with mock data
// // src/components/AnnouncementsSection.js
// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   Modal,
//   Dimensions,
//   Pressable,
// } from "react-native";
// import { COLORS } from "../constants";

// const { width: SCREEN_WIDTH } = Dimensions.get("window");
// const CARD_WIDTH = SCREEN_WIDTH * 0.78;

// // src/data/mockAnnouncements.js
// // TODO (Phase 2): Replace this mock array with a real API call, e.g.
// // fetchAnnouncements({ latitude, longitude, cityId, areaId }) once the
// // backend Announcement model + /api/public/announcements route are built.
// // Keep the same shape below so AnnouncementsSection needs no changes.

// export const MOCK_ANNOUNCEMENTS = [
//   {
//     id: "ann_1",
//     scope: "venue",
//     scopeLabel: "Masjid Al-Noor, BTM Layout",
//     category: "class",
//     title: "Weekly Tafseer Class",
//     body:
//       "Join us every Sunday after Isha for a Tafseer class covering Surah Al-Kahf, led by Imam Abdul Rahman. Open to all, brothers and sisters welcome.",
//     dateText: "Every Sunday",
//     timeText: "After Isha",
//     isPinned: false,
//   },
//   {
//     id: "ann_2",
//     scope: "area",
//     scopeLabel: "BTM Layout Mosques",
//     category: "event",
//     title: "Community Iftar Gathering",
//     body:
//       "All mosques in BTM Layout are jointly hosting a community Iftar this Friday. Families welcome. Please bring a dish to share if you can.",
//     dateText: "Fri, 17 Jul",
//     timeText: "6:30 PM onwards",
//     isPinned: false,
//   },
//   {
//     id: "ann_3",
//     scope: "city",
//     scopeLabel: "Bengaluru",
//     category: "eid",
//     title: "Eid al-Adha — City-wide Prayer Slots",
//     body:
//       "Eid al-Adha prayer slots have been announced across Bengaluru mosques and Eidgahs. Multiple time slots available — check individual mosque pages for exact timings.",
//     dateText: "Sat, 18 Jul",
//     timeText: "Multiple slots from 6:00 AM",
//     isPinned: true,
//   },
//   {
//     id: "ann_4",
//     scope: "venue",
//     scopeLabel: "Jamia Masjid, Shivaji Nagar",
//     category: "general",
//     title: "Wudu Area Under Maintenance",
//     body:
//       "The ground floor wudu area is under maintenance this week. Please use the first floor facility until further notice.",
//     dateText: "Until 20 Jul",
//     timeText: null,
//     isPinned: false,
//   },
//   {
//     id: "ann_5",
//     scope: "state",
//     scopeLabel: "Karnataka",
//     category: "urgent",
//     title: "Moon Sighting Announcement",
//     body:
//       "The Karnataka State Moon Sighting Committee has confirmed the sighting. Eid will be observed tomorrow across the state.",
//     dateText: "Today",
//     timeText: null,
//     isPinned: true,
//   },
// ];

// // ── MODE SWITCH ─────────────────────────────────────────────
// // "comingSoon" → shows the placeholder card (use this for Play Store deployment)
// // "mockData"   → shows the full mock carousel (use this for your own dev/testing)
// const ANNOUNCEMENTS_MODE = "comingSoon";
// // ─────────────────────────────────────────────────────────────
// // ── Coming Soon placeholder ─────────────────────────────────
// function ComingSoonCard() {
//   return (
//     <View style={styles.comingSoonSection}>
//       <View style={styles.comingSoonCard}>
//         <View style={styles.comingSoonIconWrap}>
//           <Text style={styles.comingSoonIcon}>📢</Text>
//         </View>
//         <View style={styles.comingSoonTextWrap}>
//           <View style={styles.comingSoonBadge}>
//             <Text style={styles.comingSoonBadgeText}>COMING SOON</Text>
//           </View>
//           <Text style={styles.comingSoonTitle}>Mosque Announcements</Text>
//           <Text style={styles.comingSoonSub}>
//             Events, Jumu'ah gatherings, and important notices from mosques
//             near you — arriving in a future update, in shā' Allāh.
//           </Text>
//         </View>
//       </View>
//     </View>
//   );
// }

// const SCOPE_META = {
//   venue: { label: "This Mosque", color: COLORS.primary, icon: "🕌" },
//   area: { label: "Area-wide", color: "#F59E0B", icon: "📍" },
//   city: { label: "City-wide", color: "#D4A843", icon: "🏙" },
//   state: { label: "State/National", color: "#DC2626", icon: "🌍" },
// };

// const CATEGORY_ICON = {
//   event: "🎉",
//   eid: "☪️",
//   urgent: "⚠️",
//   class: "📖",
//   general: "📢",
// };

// function AnnouncementCard({ item, onPress }) {
//   const scopeMeta = SCOPE_META[item.scope] || SCOPE_META.venue;

//   return (
//     <Pressable
//       style={({ pressed }) => [
//         styles.card,
//         pressed && styles.cardPressed,
//         item.isPinned && styles.cardPinned,
//       ]}
//       onPress={onPress}
//     >
//       <View style={styles.cardTopRow}>
//         <View style={[styles.scopeBadge, { backgroundColor: scopeMeta.color + "18" }]}>
//           <Text style={styles.scopeBadgeIcon}>{scopeMeta.icon}</Text>
//           <Text style={[styles.scopeBadgeText, { color: scopeMeta.color }]}>
//             {scopeMeta.label}
//           </Text>
//         </View>
//         <Text style={styles.categoryIcon}>{CATEGORY_ICON[item.category] || "📢"}</Text>
//       </View>

//       <Text style={styles.cardTitle} numberOfLines={2}>
//         {item.title}
//       </Text>
//       <Text style={styles.cardScopeLabel} numberOfLines={1}>
//         {item.scopeLabel}
//       </Text>

//       <View style={styles.cardFooter}>
//         <Text style={styles.cardMeta} numberOfLines={1}>
//           {item.dateText}{item.timeText ? ` · ${item.timeText}` : ""}
//         </Text>
//       </View>
//     </Pressable>
//   );
// }

// export default function AnnouncementsSection() {
//   const [selected, setSelected] = useState(null);

//   // this condition should be removed if actual data comes
//   if (ANNOUNCEMENTS_MODE === "comingSoon") {
//     return <ComingSoonCard />;
//   }

//   // TODO (Phase 2): swap MOCK_ANNOUNCEMENTS for a real fetch, e.g.
//   // const [announcements, setAnnouncements] = useState([]);
//   // useEffect(() => { fetchAnnouncements(params).then(setAnnouncements) }, [locationContext]);
//   const announcements = MOCK_ANNOUNCEMENTS;

//   if (!announcements || announcements.length === 0) return null;

//   return (
//     <View style={styles.section}>
//       <View style={styles.sectionHeader}>
//         <Text style={styles.sectionTitle}>📢 Announcements</Text>
//         <Text style={styles.sectionSub}>Near you and beyond</Text>
//       </View>

//       <FlatList
//         data={announcements}
//         horizontal
//         keyExtractor={(item) => item.id}
//         showsHorizontalScrollIndicator={false}
//         snapToInterval={CARD_WIDTH + 12}
//         decelerationRate="fast"
//         contentContainerStyle={styles.listContent}
//         renderItem={({ item }) => (
//           <AnnouncementCard item={item} onPress={() => setSelected(item)} />
//         )}
//       />

//       <Modal
//         visible={!!selected}
//         transparent
//         animationType="fade"
//         onRequestClose={() => setSelected(null)}
//       >
//         <Pressable style={styles.modalBackdrop} onPress={() => setSelected(null)}>
//           <Pressable style={styles.modalCard} onPress={() => { }}>
//             {selected && (
//               <>
//                 <View style={styles.modalTopRow}>
//                   <View
//                     style={[
//                       styles.scopeBadge,
//                       { backgroundColor: (SCOPE_META[selected.scope]?.color || COLORS.primary) + "18" },
//                     ]}
//                   >
//                     <Text style={styles.scopeBadgeIcon}>
//                       {SCOPE_META[selected.scope]?.icon}
//                     </Text>
//                     <Text
//                       style={[
//                         styles.scopeBadgeText,
//                         { color: SCOPE_META[selected.scope]?.color },
//                       ]}
//                     >
//                       {SCOPE_META[selected.scope]?.label}
//                     </Text>
//                   </View>
//                   <TouchableOpacity onPress={() => setSelected(null)}>
//                     <Text style={styles.modalClose}>✕</Text>
//                   </TouchableOpacity>
//                 </View>

//                 <Text style={styles.modalTitle}>{selected.title}</Text>
//                 <Text style={styles.modalScopeLabel}>{selected.scopeLabel}</Text>
//                 <Text style={styles.modalMeta}>
//                   {selected.dateText}{selected.timeText ? ` · ${selected.timeText}` : ""}
//                 </Text>
//                 <Text style={styles.modalBody}>{selected.body}</Text>
//               </>
//             )}
//           </Pressable>
//         </Pressable>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   section: { marginTop: 0, marginBottom: 4 },
//   sectionHeader: { paddingHorizontal: 20, marginBottom: 12 },
//   sectionTitle: { fontSize: 17, fontWeight: "700", color: COLORS.dark },
//   sectionSub: { fontSize: 12.5, color: "#6B7280", marginTop: 2 },
//   listContent: { paddingHorizontal: 20, paddingRight: 8 },
//   card: {
//     width: CARD_WIDTH,
//     backgroundColor: COLORS.white,
//     borderRadius: 16,
//     padding: 14,
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: "#EEF1F0",
//     shadowColor: "#000",
//     shadowOpacity: 0.04,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 2 },
//     elevation: 1,
//   },
//   cardPressed: { opacity: 0.85 },
//   cardPinned: { borderColor: "#DC262640", borderWidth: 1.3 },
//   cardTopRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: 8,
//   },
//   scopeBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 20,
//   },
//   scopeBadgeIcon: { fontSize: 11, marginRight: 4 },
//   scopeBadgeText: { fontSize: 11, fontWeight: "700" },
//   categoryIcon: { fontSize: 16 },
//   cardTitle: { fontSize: 14.5, fontWeight: "700", color: COLORS.dark, marginBottom: 3 },
//   cardScopeLabel: { fontSize: 12, color: "#6B7280", marginBottom: 8 },
//   cardFooter: { borderTopWidth: 1, borderTopColor: "#F0F2F1", paddingTop: 8 },
//   cardMeta: { fontSize: 11.5, color: COLORS.primary, fontWeight: "600" },
//   modalBackdrop: { flex: 1, backgroundColor: "rgba(12,26,20,0.55)", justifyContent: "flex-end" },
//   modalCard: {
//     backgroundColor: COLORS.white,
//     borderTopLeftRadius: 22,
//     borderTopRightRadius: 22,
//     padding: 22,
//     paddingBottom: 34,
//   },
//   modalTopRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: 14,
//   },
//   modalClose: { fontSize: 18, color: "#6B7280", padding: 4 },
//   modalTitle: { fontSize: 19, fontWeight: "700", color: COLORS.dark, marginBottom: 4 },
//   modalScopeLabel: { fontSize: 13, color: "#6B7280", marginBottom: 2 },
//   modalMeta: { fontSize: 12.5, color: COLORS.primary, fontWeight: "600", marginBottom: 14 },
//   modalBody: { fontSize: 14.5, color: "#374151", lineHeight: 22 },


//   // below is the styling for place holders should be deleted if actual data comes
//   comingSoonSection: {  paddingHorizontal: 5 },
//   comingSoonCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: COLORS.white,
//     borderRadius: 16,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: "#EEF1F0",
//     borderStyle: "dashed",
//   },
//   comingSoonIconWrap: {
//     width: 44,
//     height: 44,
//     borderRadius: 12,
//     backgroundColor: COLORS.primary + "14",
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 14,
//   },
//   comingSoonIcon: { fontSize: 20 },
//   comingSoonTextWrap: { flex: 1 },
//   comingSoonBadge: {
//     alignSelf: "flex-start",
//     backgroundColor: "#D4A84320",
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 20,
//     marginBottom: 5,
//   },
//   comingSoonBadgeText: { fontSize: 10, fontWeight: "800", color: "#B8862F", letterSpacing: 0.4 },
//   comingSoonTitle: { fontSize: 14.5, fontWeight: "700", color: COLORS.dark, marginBottom: 3 },
//   comingSoonSub: { fontSize: 12.5, color: "#6B7280", lineHeight: 17 },
// });