// src/screens/main/SuggestMosqueScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants";
import {
  submitVenueSuggestion, fetchCountries,
  fetchStates,
  fetchCities,
  fetchAreas,
} from "../../lib/endpoints";

const VENUE_TYPE_OPTIONS = [
  { key: "masjid", label: "Masjid" },
  { key: "musalla", label: "Musalla" },
  { key: "islamic_center", label: "Islamic Center" },
  { key: "prayer_room", label: "Prayer Room" },
  { key: "temporary_jumuah_venue", label: "Temporary Jumu'ah Venue" },
  { key: "hall_community_venue", label: "Hall / Community Venue" },
  { key: "eidgah_open_ground", label: "Eidgah / Open Ground" },
  { key: "other", label: "Other" },
];

function FormInput({ label, value, onChange, placeholder, multiline = false, required = false }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={styles.requiredStar}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? "top" : "center"}
        autoCorrect={false}
      />
    </View>
  );
}

function LocationPickerField({
  label,
  placeholder,
  loading,
  selectedLabel,
  otherMode,
  otherValue,
  onOtherChange,
  onOpenPicker,
  onSwitchBackToList,
  showSwitchBackLink,
  allowManual = true,
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      {allowManual && otherMode ? (
        <>
          <TextInput
            style={styles.input}
            value={otherValue}
            onChangeText={onOtherChange}
            placeholder={`Type ${label.toLowerCase()} manually`}
            placeholderTextColor={COLORS.textMuted}
            autoCorrect={false}
          />
          {showSwitchBackLink && (
            <TouchableOpacity onPress={onSwitchBackToList} activeOpacity={0.7}>
              <Text style={pickerStyles.switchLinkText}>Choose from list instead</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <TouchableOpacity
          style={pickerStyles.pickerBox}
          onPress={onOpenPicker}
          activeOpacity={0.8}
        >
          <Text
            style={
              selectedLabel
                ? pickerStyles.pickerBoxTextSelected
                : pickerStyles.pickerBoxTextPlaceholder
            }
          >
            {loading ? "Loading..." : selectedLabel || placeholder}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function LocationPickerModal({
  visible,
  title,
  items,
  loading,
  onSelect,
  onSelectOther,
  onClose,
  allowManual = true,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pickerStyles.modalOverlay}>
        <View style={pickerStyles.modalSheet}>
          <View style={pickerStyles.modalHeader}>
            <Text style={pickerStyles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={pickerStyles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#059669" style={{ marginVertical: 32 }} />
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={pickerStyles.modalItem}
                  onPress={() => onSelect(item)}
                  activeOpacity={0.7}
                >
                  <Text style={pickerStyles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={pickerStyles.modalEmptyText}>No results found.</Text>
              }
            />
          )}

          {allowManual && (
            <TouchableOpacity
              style={pickerStyles.modalOtherItem}
              onPress={onSelectOther}
              activeOpacity={0.7}
            >
              <Text style={pickerStyles.modalOtherText}>
                My location isn't listed (type manually)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function SuggestMosqueScreen({ navigation }) {
  const [venueName, setVenueName] = useState("");
  const [venueType, setVenueType] = useState("masjid");
  const [areaText, setAreaText] = useState("");
  const [cityText, setCityText] = useState("");
  const [address, setAddress] = useState("");
  const [googleMapsLink, setGoogleMapsLink] = useState("");
  const [userNote, setUserNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contributionMessage, setContributionMessage] = useState(null);


  // ── State (select-only, DB-sourced, no manual entry) ──
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [selectedStateLabel, setSelectedStateLabel] = useState("");
  const [statePickerVisible, setStatePickerVisible] = useState(false);

  // ── Location resolution state ──
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedCityLabel, setSelectedCityLabel] = useState("");
  const [cityOtherMode, setCityOtherMode] = useState(false);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);

  const [areas, setAreas] = useState([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [selectedAreaLabel, setSelectedAreaLabel] = useState("");
  const [areaOtherMode, setAreaOtherMode] = useState(true); // true until a real city resolves areas
  const [areaPickerVisible, setAreaPickerVisible] = useState(false);

  const successScale = useSharedValue(0.8);
  const successOpacity = useSharedValue(0);

  const successAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
  }));

  useEffect(() => {
    loadStates();
  }, []);

  async function loadStates() {
    setStatesLoading(true);
    try {
      const countriesRes = await fetchCountries();
      const firstCountry = countriesRes.data?.[0];
      if (!firstCountry) return;

      const statesRes = await fetchStates(firstCountry.id);
      setStates(statesRes.data || []);
    } catch (error) {
      // Silent — state list stays empty; user just can't proceed until it loads.
    } finally {
      setStatesLoading(false);
    }
  }

  async function loadCities(stateId) {
    setCitiesLoading(true);
    try {
      const citiesRes = await fetchCities(stateId);
      setCities(citiesRes.data || []);
    } catch (error) {
      // Silent — the "type manually" fallback still works either way.
    } finally {
      setCitiesLoading(false);
    }
  }

  async function loadAreas(cityId) {
    setAreasLoading(true);
    try {
      const areasRes = await fetchAreas(cityId);
      setAreas(areasRes.data || []);
    } catch (error) {
      // Silent — falls back to manual area entry.
    } finally {
      setAreasLoading(false);
    }
  }

  function handleSelectState(state) {
    setSelectedStateId(state.id);
    setSelectedStateLabel(state.name);
    setStatePickerVisible(false);

    // City (and therefore area) depend on state — reset both, fetch fresh cities.
    setSelectedCityId(null);
    setSelectedCityLabel("");
    setCityText("");
    setCityOtherMode(false);
    setCities([]);
    loadCities(state.id);

    setSelectedAreaId(null);
    setSelectedAreaLabel("");
    setAreaText("");
    setAreaOtherMode(true);
    setAreas([]);
  }

  function handleSelectCity(city) {
    setSelectedCityId(city.id);
    setSelectedCityLabel(city.name);
    setCityOtherMode(false);
    setCityText("");
    setCityPickerVisible(false);

    // Area depends on the chosen city — reset it and fetch fresh areas.
    setSelectedAreaId(null);
    setSelectedAreaLabel("");
    setAreaText("");
    setAreaOtherMode(false);
    setAreas([]);
    loadAreas(city.id);
  }

  function handleSelectCityOther() {
    setSelectedCityId(null);
    setSelectedCityLabel("");
    setCityOtherMode(true);
    setCityPickerVisible(false);

    // No real city to derive areas from — area becomes manual too.
    setSelectedAreaId(null);
    setSelectedAreaLabel("");
    setAreaOtherMode(true);
    setAreas([]);
  }

  function handleSelectArea(area) {
    setSelectedAreaId(area.id);
    setSelectedAreaLabel(area.name);
    setAreaOtherMode(false);
    setAreaText("");
    setAreaPickerVisible(false);
  }

  function handleSelectAreaOther() {
    setSelectedAreaId(null);
    setSelectedAreaLabel("");
    setAreaOtherMode(true);
    setAreaPickerVisible(false);
  }

  // async function handleSubmit() {
  //   if (!venueName.trim()) {
  //     Alert.alert("Name required", "Please enter the mosque or venue name.");
  //     return;
  //   }
  //   if (!cityText.trim() && !areaText.trim()) {
  //     Alert.alert(
  //       "Location required",
  //       "Please enter at least the area or city so we can find and verify this mosque."
  //     );
  //     return;
  //   }

  //   setSubmitting(true);
  //   try {
  //     const body = {
  //       suggestedName: venueName.trim(),
  //       venueType,
  //       ...(areaText.trim() && { areaText: areaText.trim() }),
  //       ...(cityText.trim() && { cityText: cityText.trim() }),
  //       ...(address.trim() && { address: address.trim() }),
  //       ...(googleMapsLink.trim() && { googleMapsLink: googleMapsLink.trim() }),
  //       ...(userNote.trim() && { userNote: userNote.trim() }),
  //     };

  //     const res = await submitVenueSuggestion(body);
  //     setContributionMessage(
  //       res.contribution?.message ||
  //         "JazakAllahu khair. Your mosque suggestion has been submitted."
  //     );
  //     setSubmitted(true);
  //     successScale.value = withSpring(1, { damping: 14, stiffness: 120 });
  //     successOpacity.value = withTiming(1, { duration: 400 });
  //   } catch (error) {
  //     Alert.alert(
  //       "Submission failed",
  //       error.message || "Something went wrong. Please try again."
  //     );
  //   } finally {
  //     setSubmitting(false);
  //   }
  // }

  async function handleSubmit() {
    if (!venueName.trim()) {
      Alert.alert("Name required", "Please enter the mosque or venue name.");
      return;
    }

    if (!selectedStateId) {
      Alert.alert("State required", "Please select a state.");
      return;
    }

    const hasCity = Boolean(selectedCityId) || cityText.trim().length > 0;
    const hasArea = Boolean(selectedAreaId) || areaText.trim().length > 0;

    if (!hasCity && !hasArea) {
      Alert.alert(
        "Location required",
        "Please enter at least the area or city so we can find and verify this mosque."
      );
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        suggestedName: venueName.trim(),
        venueType,
        stateText: selectedStateLabel,
        ...(selectedCityId
          ? { cityId: selectedCityId, cityText: selectedCityLabel }
          : cityText.trim()
            ? { cityText: cityText.trim() }
            : {}),
        ...(selectedAreaId
          ? { areaId: selectedAreaId, areaText: selectedAreaLabel }
          : areaText.trim()
            ? { areaText: areaText.trim() }
            : {}),
        ...(address.trim() && { address: address.trim() }),
        ...(googleMapsLink.trim() && { googleMapsLink: googleMapsLink.trim() }),
        ...(userNote.trim() && { userNote: userNote.trim() }),
      };

      const res = await submitVenueSuggestion(body);
      setContributionMessage(
        res.contribution?.message ||
        "JazakAllahu khair. Your mosque suggestion has been submitted."
      );
      setSubmitted(true);
      successScale.value = withSpring(1, { damping: 14, stiffness: 120 });
      successOpacity.value = withTiming(1, { duration: 400 });
    } catch (error) {
      Alert.alert(
        "Submission failed",
        error.message || "Something went wrong. Please try again."
      );
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
            <Text style={styles.successIcon}>🕌</Text>
            <Text style={styles.successTitle}>Suggestion Submitted</Text>
            <Text style={styles.successMessage}>{contributionMessage}</Text>
            <Text style={styles.successSub}>
              Our team will verify and add this mosque to Sabeel. You'll help
              other Muslims find a place to pray — JazakAllahu khair.
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
      {/* ── Header ── */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Suggest a Mosque</Text>
            <Text style={styles.headerSub}>
              Know a mosque that's missing from Sabeel? Help the community.
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
        {/* ── Venue type ── */}
        <Text style={styles.sectionLabel}>TYPE OF VENUE</Text>
        <View style={styles.typeGrid}>
          {VENUE_TYPE_OPTIONS.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.typeChip,
                venueType === type.key && styles.typeChipSelected,
              ]}
              onPress={() => setVenueType(type.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.typeChipText,
                  venueType === type.key && styles.typeChipTextSelected,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Name ── */}
        <Text style={styles.sectionLabel}>MOSQUE DETAILS</Text>
        <FormInput
          label="Mosque / Venue Name"
          value={venueName}
          onChange={setVenueName}
          placeholder="e.g. Masjid Al-Noor"
          required
        />
        <LocationPickerField
          label="State *"
          placeholder="Select state"
          loading={statesLoading}
          selectedLabel={selectedStateLabel}
          allowManual={false}
          onOpenPicker={() => setStatePickerVisible(true)}
        />

        <LocationPickerField
          label="City"
          placeholder={selectedStateId ? "Select city" : "Select a state first"}
          loading={citiesLoading}
          selectedLabel={selectedCityLabel}
          otherMode={cityOtherMode}
          otherValue={cityText}
          onOtherChange={setCityText}
          onOpenPicker={() => {
            if (!selectedStateId) {
              Alert.alert("Select a state first", "Please choose a state before picking a city.");
              return;
            }
            setCityPickerVisible(true);
          }}
          onSwitchBackToList={() => {
            setCityOtherMode(false);
            setCityText("");
          }}
          showSwitchBackLink={cities.length > 0}
        />

        <LocationPickerField
          label="Area / Locality"
          placeholder={selectedCityId ? "Select area" : "Type your area"}
          loading={areasLoading}
          selectedLabel={selectedAreaLabel}
          otherMode={areaOtherMode || !selectedCityId}
          otherValue={areaText}
          onOtherChange={setAreaText}
          onOpenPicker={() => setAreaPickerVisible(true)}
          onSwitchBackToList={() => {
            setAreaOtherMode(false);
            setAreaText("");
          }}
          showSwitchBackLink={Boolean(selectedCityId) && areas.length > 0}
        />
        {/* <FormInput
          label="Area / Locality"
          value={areaText}
          onChange={setAreaText}
          placeholder="e.g. BTM Layout, Frazer Town"
        />
        <FormInput
          label="City"
          value={cityText}
          onChange={setCityText}
          placeholder="e.g. Bengaluru"
        /> */}
        <FormInput
          label="Address (optional)"
          value={address}
          onChange={setAddress}
          placeholder="Street address or landmark"
          multiline
        />
        <FormInput
          label="Google Maps Link (optional)"
          value={googleMapsLink}
          onChange={setGoogleMapsLink}
          placeholder="Paste a Google Maps link"
        />

        {/* ── Note ── */}
        <Text style={styles.sectionLabel}>ADDITIONAL NOTES</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={userNote}
          onChangeText={setUserNote}
          placeholder="Anything else we should know — prayer timings, contact, how you know about this place, etc."
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.charCount}>{userNote.length}/500</Text>

        {/* ── Info ── */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🔒 Your suggestion goes to our review team. Mosques are not added
            automatically — we verify each suggestion before publishing. This
            keeps Sabeel's data trustworthy.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? "Submitting..." : "Submit Suggestion"}
          </Text>
        </TouchableOpacity>

        <LocationPickerModal
          visible={statePickerVisible}
          title="Select State"
          items={states}
          loading={statesLoading}
          onSelect={handleSelectState}
          allowManual={false}
          onClose={() => setStatePickerVisible(false)}
        />

        <LocationPickerModal
          visible={cityPickerVisible}
          title="Select City"
          items={cities}
          loading={citiesLoading}
          onSelect={handleSelectCity}
          onSelectOther={handleSelectCityOther}
          onClose={() => setCityPickerVisible(false)}
        />

        <LocationPickerModal
          visible={areaPickerVisible}
          title="Select Area"
          items={areas}
          loading={areasLoading}
          onSelect={handleSelectArea}
          onSelectOther={handleSelectAreaOther}
          onClose={() => setAreaPickerVisible(false)}
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ── Header ──
  header: { backgroundColor: COLORS.dark, paddingBottom: 20 },
  headerContent: { paddingHorizontal: 20, paddingTop: 8 },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 14,
  },
  backButtonText: { fontSize: 14, color: COLORS.white, fontWeight: "600" },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 6,
  },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 19 },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  // ── Labels ──
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginTop: 20,
    marginBottom: 10,
  },

  // ── Type chips ──
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  typeChipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  typeChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  typeChipTextSelected: { color: COLORS.primary, fontWeight: "700" },

  // ── Form inputs ──
  inputGroup: { marginBottom: 12 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  requiredStar: { color: "#EF4444" },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  inputMultiline: { minHeight: 90, paddingTop: 12 },
  charCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "right",
    marginTop: 4,
  },

  // ── Info box ──
  infoBox: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  infoText: { fontSize: 12, color: "#0369A1", lineHeight: 18 },

  // ── Submit ──
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 20,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.borderLight,
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.3,
  },

  // ── Success ──
  successHeader: { backgroundColor: COLORS.dark },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  successCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    width: "100%",
    elevation: 4,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 22,
  },
  successSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: COLORS.dark,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  successButtonText: { fontSize: 15, fontWeight: "700", color: COLORS.white },
});


const pickerStyles = StyleSheet.create({
  pickerBox: {
    borderWidth: 1,
    borderColor: "#E2E8E4",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: "#FFFFFF",
  },
  pickerBoxTextPlaceholder: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  pickerBoxTextSelected: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  switchLinkText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#F0F4F2",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8E4",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0C1A14",
  },
  modalClose: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
  },
  modalItem: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E9EDEA",
  },
  modalItemText: {
    fontSize: 14,
    color: "#111827",
  },
  modalEmptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 13,
    marginVertical: 24,
  },
  modalOtherItem: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 4,
  },
  modalOtherText: {
    fontSize: 13,
    color: "#D4A843",
    fontWeight: "600",
  },
});