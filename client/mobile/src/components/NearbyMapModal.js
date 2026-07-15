// src/components/NearbyMapModal.js
//
// Full-screen map overlay launched from Nearby's map toggle. Secondary
// to the list view by design (see product reasoning: list is faster
// for the urgency+distance decision; map serves the newcomer who
// needs spatial orientation). Kept as a self-contained modal so
// NearbyScreen's list logic stays simple and this can be reused
// elsewhere later (e.g. VenueDetail "view on map").

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, VENUE_TYPES } from "../constants";
import VenueMapMarker from "./VenueMapMarker";
import VerificationBadge from "./VerificationBadge";
import Button from "./Button";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function NearbyMapModal({
  visible,
  onClose,
  venues = [],
  userLocation = null,
  onSelectVenue,
}) {
  const mapRef = useRef(null);
  const [selectedVenue, setSelectedVenue] = useState(null);

  const venuesWithCoords = venues.filter(
    (v) => v.latitude != null && v.longitude != null
  );

  const initialRegion = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      }
    : venuesWithCoords[0]
    ? {
        latitude: venuesWithCoords[0].latitude,
        longitude: venuesWithCoords[0].longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }
    : {
        latitude: 12.9716,
        longitude: 77.5946,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  function handleMarkerPress(venue) {
    setSelectedVenue(venue);
    mapRef.current?.animateToRegion(
      {
        latitude: venue.latitude,
        longitude: venue.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      350
    );
  }

  function handleViewDetails() {
    if (selectedVenue) {
      onSelectVenue(selectedVenue);
      onClose();
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          initialRegion={initialRegion}
          showsUserLocation={!!userLocation}
          showsMyLocationButton={false}
          onPress={() => setSelectedVenue(null)}
        >
          {venuesWithCoords.map((venue) => (
            <Marker
              key={venue.id}
              coordinate={{ latitude: venue.latitude, longitude: venue.longitude }}
              onPress={(e) => {
                e.stopPropagation();
                handleMarkerPress(venue);
              }}
              anchor={{ x: 0.5, y: 1 }}
            >
              <VenueMapMarker
                verificationStatus={venue.verificationStatus}
                selected={selectedVenue?.id === venue.id}
              />
            </Marker>
          ))}
        </MapView>

        {/* ── Top bar ── */}
        <SafeAreaView edges={["top"]} style={styles.topBar}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>
              {venuesWithCoords.length} mosque{venuesWithCoords.length !== 1 ? "s" : ""} on map
            </Text>
          </View>
        </SafeAreaView>

        {/* ── Selected venue callout card ── */}
        {selectedVenue && (
          <SafeAreaView edges={["bottom"]} style={styles.calloutWrapper}>
            <View style={styles.calloutCard}>
              <View style={styles.calloutHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.calloutName} numberOfLines={1}>
                    {selectedVenue.name}
                  </Text>
                  <Text style={styles.calloutMeta}>
                    {VENUE_TYPES[selectedVenue.venueType] || selectedVenue.venueType}
                    {selectedVenue.area?.name ? ` · ${selectedVenue.area.name}` : ""}
                    {selectedVenue.distance ? ` · ${selectedVenue.distance}` : ""}
                  </Text>
                </View>
                <VerificationBadge status={selectedVenue.verificationStatus} size="sm" />
              </View>

              {selectedVenue.nextPrayer && (
                <Text style={styles.calloutPrayer}>
                  Next: {selectedVenue.nextPrayer.prayerName} Jamā'ah at{" "}
                  <Text style={styles.calloutPrayerTime}>
                    {selectedVenue.nextPrayer.jamaahTime}
                  </Text>
                </Text>
              )}

              <Button
                title="View Details"
                onPress={handleViewDetails}
                size="sm"
                style={{ marginTop: 10 }}
              />
            </View>
          </SafeAreaView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  map: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  closeButtonText: { fontSize: 16, fontWeight: "700", color: COLORS.dark },
  countPill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  countPillText: { fontSize: 12, fontWeight: "700", color: COLORS.dark },
  calloutWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  calloutCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    padding: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  calloutHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  calloutName: { fontSize: 16, fontWeight: "800", color: COLORS.dark },
  calloutMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  calloutPrayer: { fontSize: 13, color: COLORS.text, marginTop: 10 },
  calloutPrayerTime: { fontWeight: "700", color: COLORS.primary },
});