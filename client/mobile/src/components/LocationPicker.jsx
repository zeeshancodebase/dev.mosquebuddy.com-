import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { resolveMapsLink } from "../lib/endpoints";
import {
  LocateFixed,
  Link2,
  MapPinned,
  RotateCw,
  MapPinCheck,
  Check,
} from "lucide-react-native";
import { COLORS, DEFAULT_REGION } from "../constants";

export default function LocationPicker({ onLocationSelected, initialCoords }) {
  const [mode, setMode] = useState(null); // 'gps' | 'link' | 'pin' | null
  const [loading, setLoading] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [pinCoords, setPinCoords] = useState(
    initialCoords || {
      latitude: DEFAULT_REGION.latitude,
      longitude: DEFAULT_REGION.longitude,
    },
  );
  const [confirmedCoords, setConfirmedCoords] = useState(initialCoords || null);

  const handleUseGPS = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location permission needed",
          "Please allow location access to use this option.",
        );
        setLoading(false);
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setConfirmedCoords(coords);
      onLocationSelected(coords, "gps");
    } catch (err) {
      Alert.alert(
        "Couldn't get location",
        "Please try again or use another method.",
      );
    } finally {
      setLoading(false);
    }
  };

  // This extracts coordinates fron link but for now directly link is being used with below func. handle use link
  //   const handleResolveLink = async () => {
  //     if (!linkInput.trim()) return;
  //     setLoading(true);
  //     try {
  //       const res = await resolveMapsLink(linkInput.trim());
  //       const coords = res.data.data;
  //       setConfirmedCoords(coords);
  //       onLocationSelected(coords, "link", linkInput.trim());
  //     } catch (err) {
  //       Alert.alert(
  //         "Couldn't read that link",
  //         err?.response?.data?.message ||
  //           "Try copying the link again, or drop a pin instead.",
  //       );
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  const handleUseLink = () => {
    if (!linkInput.trim()) return;

    onLocationSelected(null, "link", linkInput.trim());
  };

  const handleConfirmPin = () => {
    setConfirmedCoords(pinCoords);
    onLocationSelected(pinCoords, "pin");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Mosque Location</Text>

      {confirmedCoords && (
        <View style={styles.confirmedBanner}>
          <Text style={styles.confirmedText}>
            ✓ Location set ({confirmedCoords.latitude.toFixed(5)},{" "}
            {confirmedCoords.longitude.toFixed(5)})
          </Text>
        </View>
      )}

      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={[styles.optionCard, mode === "gps" && styles.optionCardActive]}
          onPress={() => setMode("gps")}
          activeOpacity={0.8}
        >
          <LocateFixed
            size={20}
            color={mode === "gps" ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.optionCardText,
              mode === "gps" && styles.optionCardTextActive,
            ]}
          >
            I'm at the mosque
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionCard,
            mode === "link" && styles.optionCardActive,
          ]}
          onPress={() => setMode("link")}
          activeOpacity={0.8}
        >
          <Link2
            size={20}
            color={mode === "link" ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.optionCardText,
              mode === "link" && styles.optionCardTextActive,
            ]}
          >
            Paste Maps link
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, mode === "pin" && styles.optionCardActive]}
          onPress={() => setMode("pin")}
          activeOpacity={0.8}
        >
          <MapPinned
            size={20}
            color={mode === "pin" ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.optionCardText,
              mode === "pin" && styles.optionCardTextActive,
            ]}
          >
            Drop a pin
          </Text>
        </TouchableOpacity>
      </View>

      {/* 
      this code only takes only coordinates but new version shows on map
      {mode === "gps" && (
        <View style={styles.modeContent}>
          <Text style={styles.hint}>
            Best used when you're physically standing at the mosque.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleUseGPS}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                Use My Current Location
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )} */}

      {mode === "gps" && (
        <View style={styles.modeContent}>
          <Text style={styles.hint}>
            Best used when you're physically standing at the mosque.
          </Text>

          {confirmedCoords && (
            <MapView
              style={styles.map}
              region={{
                latitude: confirmedCoords.latitude,
                longitude: confirmedCoords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker coordinate={confirmedCoords} />
            </MapView>
          )}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleUseGPS}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonContent}>
                {confirmedCoords ? (
                  <RotateCw size={16} color="#fff" />
                ) : (
                  <LocateFixed size={16} color="#fff" />
                )}
                <Text style={styles.primaryButtonText}>
                  {confirmedCoords
                    ? "Refresh My Location"
                    : "Use My Current Location"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {mode === "link" && (
        <View style={styles.modeContent}>
          <Text style={styles.hint}>
            Open the mosque on Google Maps, tap Share, then paste the link here.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="https://maps.app.goo.gl/..."
            value={linkInput}
            onChangeText={setLinkInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {/* <TouchableOpacity
            style={styles.primaryButton}
            // onPress={handleResolveLink}
            onPress={handleUseLink}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonContent}>
                <MapPinCheck size={16} color="#fff" />
                <Text style={styles.primaryButtonText}>Extract Location</Text>
                <Link2 size={16} color="#fff" />
                <Text style={styles.primaryButtonText}>Use This Link</Text>
              </View>
            )}
          </TouchableOpacity> */}
        </View>
      )}

      {mode === "pin" && (
        <View style={styles.modeContent}>
          <Text style={styles.hint}>Drag the pin to the exact spot.</Text>
          <MapView
            style={styles.map}
            initialRegion={{
              ...pinCoords,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={pinCoords}
              draggable
              onDragEnd={(e) => setPinCoords(e.nativeEvent.coordinate)}
            />
          </MapView>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleConfirmPin}
          >
            <View style={styles.buttonContent}>
              <Check size={16} color="#fff" />
              <Text style={styles.primaryButtonText}>Confirm This Spot</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 12 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  confirmedBanner: {
    backgroundColor: "#E8F5EE",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  confirmedText: { color: COLORS.primary, fontSize: 13, fontWeight: "500" },
  optionsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  optionCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#D9E0DC",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    backgroundColor: "#FFFFFF",
    gap: 6,
  },
  optionCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#E8F5EE",
  },
  optionCardText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 14,
  },
  optionCardTextActive: {
    color: COLORS.primary,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: "#D9E0DC",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  optionButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#E8F5EE",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  optionText: { fontSize: 13, color: COLORS.textSecondary },
  modeContent: { marginTop: 4 },
  hint: { fontSize: 12, color: "#5A6B63", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#D9E0DC",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  map: { width: "100%", height: 220, borderRadius: 8, marginBottom: 10 },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
