// src/components/LocationBottomSheet.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants";
import { fetchPublicStates, fetchPublicCities, fetchPublicAreas } from "../lib/endpoints";
import { getUserLocation } from "../lib/location";
import { LocateFixed, MapPinned } from "lucide-react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.72;

// India's countryId — hardcoded for MVP. When multi-country is needed,
// expose a country selector here and remove this constant.
const INDIA_COUNTRY_ID = "99381d5d-5d44-4a15-9f2a-fa2cb1bed686";
// NOTE: Replace INDIA_COUNTRY_ID with the actual UUID from your DB.
// Run: SELECT id FROM countries WHERE country_code = 'IN'; in Supabase.

export default function LocationBottomSheet({ visible, onClose, onLocationSelect }) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [step, setStep] = useState("state"); // "state" | "city" | "area"
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Open / close animation ──
  useEffect(() => {
    if (visible) {
      setStep("state");
      setSelectedState(null);
      setSelectedCity(null);
      setCities([]);
      setAreas([]);
      setError(null);
      loadStates();
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 120,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  async function loadStates() {
    setLoadingStates(true);
    setError(null);
    try {
      const res = await fetchPublicStates(INDIA_COUNTRY_ID);
      setStates(res.data || []);
    } catch (e) {
      setError("Couldn't load states. Tap to retry.");
    } finally {
      setLoadingStates(false);
    }
  }

  async function handleStateSelect(state) {
    setSelectedState(state);
    setStep("city");
    setLoadingCities(true);
    setError(null);
    try {
      const res = await fetchPublicCities(state.id);
      setCities(res.data || []);
    } catch (e) {
      setError("Couldn't load cities. Tap to retry.");
    } finally {
      setLoadingCities(false);
    }
  }

  async function handleCitySelect(city) {
    setSelectedCity(city);
    setStep("area");
    setLoadingAreas(true);
    setError(null);
    try {
      const res = await fetchPublicAreas(city.id);
      setAreas(res.data || []);
    } catch (e) {
      setError("Couldn't load areas. Tap to retry.");
    } finally {
      setLoadingAreas(false);
    }
  }

  function handleConfirmCityOnly() {
    if (!selectedCity) return;
    onLocationSelect({
      type: "manual",
      cityId: selectedCity.id,
      label: selectedCity.name,
      stateName: selectedState?.name || "",
      areaId: null,
      areaName: null,
    });
    onClose();
  }

  // --- It shows cityname, areaname on the location pill on home screen.------

  // function handleAreaSelect(area) {
  //   onLocationSelect({
  //     type: "manual",
  //     cityId: selectedCity.id,
  //     label: `${area.name}, ${selectedCity.name}`,
  //     stateName: selectedState?.name || "",
  //     areaId: area.id,
  //     areaName: area.name,
  //   });
  //   onClose();
  // }

  function handleAreaSelect(area) {
    onLocationSelect({
      type: "manual",
      cityId: selectedCity.id,
      label: area.name,
      stateName: selectedState?.name || "",
      areaId: area.id,
      areaName: area.name,
    });
    onClose();
  }

  async function handleUseMyLocation() {
    setLocationLoading(true);
    setError(null);
    try {
      const location = await getUserLocation();
      if (location) {
        onLocationSelect({
          type: "gps",
          latitude: location.latitude,
          longitude: location.longitude,
          label: location.label || "Near you",
        });
        onClose();
      } else {
        setError("Location permission denied. Please select your city manually.");
      }
    } catch (e) {
      setError("Couldn't get your location. Select your city manually.");
    } finally {
      setLocationLoading(false);
    }
  }

  function handleBackToState() {
    setStep("state");
    setSelectedState(null);
    setSelectedCity(null);
    setCities([]);
    setAreas([]);
    setError(null);
  }

  function handleBackToCity() {
    setStep("city");
    setSelectedCity(null);
    setAreas([]);
    setError(null);
  }

  function handleBack() {
    if (step === "area") handleBackToCity();
    else if (step === "city") handleBackToState();
  }

  const isStateStep = step === "state";
  const isCityStep = step === "city";
  const isAreaStep = step === "area";
  const listData = isStateStep ? states : isCityStep ? cities : areas;
  const isLoading = isStateStep ? loadingStates : isCityStep ? loadingCities : loadingAreas;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropAnim }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        {/* Handle bar */}
        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          {!isStateStep && (
            <TouchableOpacity
              style={styles.backChevron}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Text style={styles.backChevronText}>‹</Text>
            </TouchableOpacity>
          )}
          <View style={styles.sheetHeaderText}>
            <Text style={styles.sheetTitle}>
              {isStateStep
                ? "Select your location"
                : isCityStep
                  ? selectedState?.name || "Select city"
                  : selectedCity?.name || "Select area"}
            </Text>
            <Text style={styles.sheetSub}>
              {isStateStep
                ? "Choose a state to see cities"
                : isCityStep
                  ? "Which city are you in?"
                  : "Narrow down to your area (optional)"}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Use my location — always shown at top */}
        {isStateStep && (
          <TouchableOpacity
            style={styles.gpsRow}
            onPress={handleUseMyLocation}
            activeOpacity={0.82}
            disabled={locationLoading}
          >
            <View style={styles.gpsIconWrap}>
              {locationLoading
                ? <ActivityIndicator size="small" color={COLORS.primary} />
                : <LocateFixed size={18} color={COLORS.primary} />
                // <LocateFixed size={18} color={"red"} />
              }
            </View>
            <View style={styles.gpsTextWrap}>
              <Text style={styles.gpsLabel}>Use my current location</Text>
              <Text style={styles.gpsSub}>
                {locationLoading ? "Getting your location..." : "Mosques near where you are now"}
              </Text>
            </View>
            <Text style={styles.gpsArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Divider */}
        {isStateStep && <View style={styles.orDivider}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or choose manually</Text>
          <View style={styles.orLine} />
        </View>}
        {/* Area step: let the user stop at city level */}
        {isAreaStep && (
          <TouchableOpacity
            style={styles.gpsRow}
            onPress={handleConfirmCityOnly}
            activeOpacity={0.82}
          >
            <View style={styles.gpsIconWrap}>
              <MapPinned size={13} color={COLORS.primary} strokeWidth={2.4} />
            </View>
            <View style={styles.gpsTextWrap}>
              <Text style={styles.gpsLabel}>Continue with {selectedCity?.name}</Text>
              <Text style={styles.gpsSub}>Skip picking a specific area</Text>
            </View>
            <Text style={styles.gpsArrow}>›</Text>
          </TouchableOpacity>
        )}

        {isAreaStep && (
          <View style={styles.orDivider}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or pick your area</Text>
            <View style={styles.orLine} />
          </View>
        )}
        {/* Error */}
        {error && (
          <TouchableOpacity
            style={styles.errorRow}
            onPress={
              isStateStep
                ? loadStates
                : isCityStep
                  ? () => handleStateSelect(selectedState)
                  : () => handleCitySelect(selectedCity)
            }
            activeOpacity={0.8}
          >
            <Text style={styles.errorText}>{error} Tap to retry.</Text>
          </TouchableOpacity>
        )}

        {/* List */}
        {isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loaderText}>
              {isStateStep ? "Loading states..." : isCityStep ? "Loading cities..." : "Loading areas..."}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {listData.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.listItem}
                onPress={() =>
                  isStateStep
                    ? handleStateSelect(item)
                    : isCityStep
                      ? handleCitySelect(item)
                      : handleAreaSelect(item)
                }
                activeOpacity={0.78}
              >
                <Text style={styles.listItemText}>{item.name}</Text>
                <Text style={styles.listItemArrow}>›</Text>
              </TouchableOpacity>
            ))}
            {listData.length === 0 && !isLoading && !error && (
              <Text style={styles.emptyListText}>
                {isAreaStep
                  ? "No areas found — you can still continue with the city above."
                  : "No options found."}
              </Text>
            )}
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },

  // ── Header ──
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backChevron: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  backChevronText: {
    fontSize: 22,
    color: COLORS.textPrimary,
    lineHeight: 26,
  },
  sheetHeaderText: { flex: 1 },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  sheetSub: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  closeBtnText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },

  // ── GPS row ──
  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
    gap: 12,
  },
  gpsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  gpsTextWrap: { flex: 1 },
  gpsLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 2,
  },
  gpsSub: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  gpsArrow: {
    fontSize: 20,
    color: COLORS.primary,
  },

  // ── Or divider ──
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 14,
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  orText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "500",
  },

  // ── Error ──
  errorRow: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444",
  },
  errorText: {
    fontSize: 13,
    color: "#B91C1C",
    lineHeight: 18,
  },

  // ── Loader ──
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },

  // ── List ──
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 4 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  listItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
    flex: 1,
  },
  listItemArrow: {
    fontSize: 20,
    color: COLORS.textMuted,
  },
  emptyListText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingTop: 30,
  },
});