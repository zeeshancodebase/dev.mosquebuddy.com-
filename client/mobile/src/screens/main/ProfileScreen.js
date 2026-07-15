import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Share,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from "react-native-reanimated";
import {
  Share2,
  HeartHandshake,
  MapPin,
  User,
  Landmark,
  Clock,
  ClipboardList,
  CheckCircle2,
  Camera,
  Settings,
  Flag,
  PlusCircle,
  Bell,
  Info,
  Star,
  MessageCircle,
  LogOut,
  MapPinPlus,
  TriangleAlert,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { COLORS, APP_CONFIG } from "../../constants";
import IslamicPattern from "../../components/IslamicPattern";
import Card from "../../components/Card";
import LocationBottomSheet from "../../components/LocationBottomSheet";
import { useLocation } from "../../context/LocationContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Menu Item ────────────────────────────────────────────────
function MenuItem({ icon, label, sublabel = null, onPress, danger = false, rightElement = null }) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
          {typeof icon === "string" ? (
            <Text style={styles.menuIconText}>{icon}</Text>
          ) : (
            icon
          )}
        </View>
        <View style={styles.menuItemText}>
          <Text style={[styles.menuItemLabel, danger && styles.menuItemLabelDanger]}>
            {label}
          </Text>
          {sublabel && (
            <Text style={styles.menuItemSublabel}>{sublabel}</Text>
          )}
        </View>
      </View>
      {rightElement || (
        <Text style={styles.menuItemChevron}>›</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Section Header ───────────────────────────────────────────
function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

// ─── Main Screen ──────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { user, isLoggedIn, logout, isSuperAdmin, isMosqueAdmin, isVolunteer } =
    useAuth();

  const {
    locationContext,
    locationLabel,
    locationSheetVisible,
    selectLocation,
    openLocationSheet,
    closeLocationSheet,
  } = useLocation();

  // Animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(24);

  useEffect(() => {
    headerOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
    headerTranslateY.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
    contentOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 500 })
    );
    contentTranslateY.value = withDelay(
      200,
      withSpring(0, { damping: 18, stiffness: 100 })
    );
  }, []);

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  function handleLogout() {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: logout,
        },
      ]
    );
  }

  function getInitials(name) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function getRoleBadge() {
    if (isSuperAdmin()) return { label: "Super Admin", color: COLORS.primary };
    if (isMosqueAdmin()) return { label: "Mosque Admin", color: "#7C3AED" };
    if (isVolunteer()) return { label: "Volunteer", color: "#D97706" };
    return null;
  }

  const roleBadge = getRoleBadge();

  async function handleShareApp() {
    try {
      await Share.share({
        title: APP_CONFIG.name,
        message: `I've been using ${APP_CONFIG.name} to find nearby mosques and prayer timings.

${APP_CONFIG.appStoreUrl}`,
        url: APP_CONFIG.appStoreUrl,
      });
    } catch (error) {
      console.log("Share cancelled or failed:", error);
    }
  }

  return (
    <View style={styles.container}>
      {/* ── Dark Header ── */}
      <View style={styles.header}>
        <IslamicPattern
          width={SCREEN_WIDTH}
          height={220}
          color="rgba(255,255,255,0.035)"
        />
        <SafeAreaView edges={["top"]}>
          <Animated.View style={[styles.headerContent, headerAnimStyle]}>
            {isLoggedIn && user ? (
              <>
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {getInitials(user.name)}
                    </Text>
                  </View>
                  {roleBadge && (
                    <View
                      style={[
                        styles.roleBadge,
                        { backgroundColor: roleBadge.color },
                      ]}
                    >
                      <Text style={styles.roleBadgeText}>
                        {roleBadge.label}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>
                  {user.email || user.phone}
                </Text>
              </>
            ) : (
              <>
                <View style={styles.guestIconContainer}>
                  {/* <Text style={styles.guestIcon}>👤</Text> */}
                  <User size={32} color="rgba(255,255,255,0.8)" />
                </View>
                <Text style={styles.guestTitle}>You're browsing as guest</Text>
                <Text style={styles.guestSubtitle}>
                  Sign in to report timings, suggest mosques, and more
                </Text>
              </>
            )}
          </Animated.View>
        </SafeAreaView>
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={contentAnimStyle}>

          {/* Guest — sign in prompt */}
          {!isLoggedIn && (
            <Card style={styles.authCard}>
              <TouchableOpacity
                style={styles.signInButton}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.registerButton}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("Register")}
              >
                <Text style={styles.registerButtonText}>Create Account</Text>
              </TouchableOpacity>
            </Card>
          )}

          {/* ── Mosque Admin Tools ── */}
          {isMosqueAdmin() && (
            <>
              <SectionHeader title="MOSQUE ADMIN" />
              <Card padded={false}>
                <MenuItem
                  // icon="🕌"
                  icon={<Landmark size={20} color={COLORS.primary} />}
                  label="My Mosque"
                  sublabel="Manage timings and profile"
                  onPress={() => navigation.navigate("MosqueAdminHome")}
                />
                <MenuItem
                  // icon="🕐"
                  icon={<Clock size={20} color={COLORS.primary} />}
                  label="Update Daily Timings"
                  // onPress={() =>
                  //   Alert.alert("Coming Soon", "Coming soon.")
                  // }
                  onPress={() => navigation.navigate("MosqueAdminHome", {
                    mode: "select_for_update"
                  })}
                />
                <MenuItem
                  // icon="📋"
                  icon={<ClipboardList size={20} color={COLORS.primary} />}
                  label="View Reports"
                  sublabel="Reports submitted for your mosque"
                  onPress={() => navigation.navigate("MosqueAdminReports")}
                />
              </Card>
            </>
          )}

          {/* ── Volunteer Tools ── */}
          {isVolunteer() && (
            <>
              <SectionHeader title="VOLUNTEER" />
              <Card padded={false}>
                <MenuItem
                  // icon="✅"
                  icon={<CheckCircle2 size={20} color={COLORS.primary} />}
                  label="Assigned Mosques"
                  sublabel="Verify and update timings"
                  onPress={() => navigation.navigate("VolunteerHome")}
                />
                <MenuItem
                  // icon="📸"
                  icon={<Camera size={20} color={COLORS.primary} />}
                  label="Upload Proof"
                  sublabel="Submit verification photos"
                  onPress={() =>
                    Alert.alert("Coming Soon", "Coming soon.")
                  }
                />
              </Card>
            </>
          )}

          {/* ── Super Admin Tools ── */}
          {isSuperAdmin() && (
            <>
              <SectionHeader title="SUPER ADMIN" />
              <Card padded={false}>
                <MenuItem
                  // icon="⚙️"
                  icon={<Settings size={20} color={COLORS.primary} />}
                  label="Admin Panel"
                  sublabel="Open web admin dashboard"
                  onPress={() =>
                    Alert.alert("Coming Soon", "Opens web admin panel.")
                  }
                />
                <MenuItem
                  // icon="🚩"
                  icon={<ClipboardList size={20} color={COLORS.primary} />}
                  label="Pending Reports"
                  sublabel="Review user submitted reports"
                  onPress={() =>
                    Alert.alert("Coming Soon", "Coming soon.")
                  }
                />
              </Card>
            </>
          )}

          {/* ── Contributions ── */}
          {isLoggedIn && (
            <>
              <SectionHeader title="CONTRIBUTE" />
              <Card padded={false}>
                <MenuItem
                  // icon="🚩"
                 icon={<TriangleAlert size={20} color={COLORS.primary} />} 
                  label="Report Wrong Timing"
                  sublabel="Help keep timings accurate"
                  // onPress={() => navigation.navigate("ReportTiming")}
                  onPress={() =>
                    Alert.alert(
                      "Report Timing",
                      "Select a mosque on nearby screen and report there",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Go to Mosques",
                          onPress: () => navigation.navigate("Nearby"),
                        },
                      ]
                    )
                  }
                />
                <MenuItem
                  // icon="➕"
                  icon={<MapPinPlus size={20} color={COLORS.primary} />}
                  label="Suggest a Mosque"
                  sublabel="Add a missing mosque"
                  onPress={() => navigation.navigate("SuggestMosque")}
                />
                {/* <MenuItem
                  icon={<HeartHandshake size={20} color={COLORS.primary} />}
                  label="Support the Project"
                  sublabel="Help us keep the app free for everyone"
                  onPress={() => {
                    // TODO
                  }}
                /> */}

                <MenuItem
                  icon={<Share2 size={20} color={COLORS.primary} />}
                  label={`Share ${APP_CONFIG.name}`}
                  sublabel="Invite family and friends"
                  onPress={handleShareApp}
                />
              </Card>
            </>
          )}

          {/* ── Settings ── */}
          <SectionHeader title="SETTINGS" />
          <Card padded={false}>
            <MenuItem
              // icon="🔔"
              icon={<Bell size={20} color={COLORS.primary} />}
              label="Notifications"
              sublabel="Prayer reminders and alerts"
              onPress={() =>
                Alert.alert("Coming Soon", "Notification settings coming soon.")
              }
            />
            <MenuItem
              icon={<MapPin size={20} color={COLORS.primary} />}
              label="Location"
              onPress={openLocationSheet}
              sublabel={
                locationLabel && locationLabel !== "Set location"
                  ? `Current: ${locationLabel}`
                  : "Tap to set your location"
              }
            // sublabel="Change your city or area"
            // onPress={() =>
            //   Alert.alert("Coming Soon", "Location settings coming soon.")
            // }
            />
          </Card>

          {/* ── About ── */}
          <SectionHeader title="ABOUT" />
          <Card padded={false}>
            <MenuItem
              // icon="ℹ️"
              icon={<Info size={20} color={COLORS.primary} />}
              label="About Sabeel"
              sublabel="Version 1.0.0"
              onPress={() =>
                Alert.alert(
                  APP_CONFIG.name,
                  `${APP_CONFIG.nameArabic}\n\n${APP_CONFIG.tagline}\n\nVersion 1.0.0`
                )
              }
            />
            <MenuItem
              // icon="⭐"
              icon={<Star size={20} color={COLORS.primary} />}
              label="Rate the App"
              onPress={() =>
                Alert.alert("Coming Soon", "Play Store link coming soon.")
              }
            />
            <MenuItem
              // icon="💬"
              icon={<MessageCircle size={20} color={COLORS.primary} />}
              label="Send Feedback"
              onPress={() => navigation.navigate("Feedback")}
            />
          </Card>

          {/* ── Sign Out ── */}
          {isLoggedIn && (
            <>
              <SectionHeader title="" />
              <Card padded={false}>
                <MenuItem
                  // icon="🚪"
                  icon={<LogOut size={20} color={COLORS.error} />}
                  label="Sign Out"
                  onPress={handleLogout}
                  danger
                />
              </Card>
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>{APP_CONFIG.name}</Text>
            <Text style={styles.footerArabic}>{APP_CONFIG.nameArabic}</Text>
            <Text style={styles.footerTagline}>{APP_CONFIG.tagline}</Text>
          </View>

          <View style={styles.bottomPadding} />
        </Animated.View>
      </ScrollView>

      <LocationBottomSheet
        visible={locationSheetVisible}
        onClose={closeLocationSheet}
        onLocationSelect={selectLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Header ──
  header: {
    backgroundColor: COLORS.dark,
    paddingBottom: 28,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: "center",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.15)",
  },
  avatarText: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.white,
  },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
  guestIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  guestIcon: {
    fontSize: 32,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 6,
    textAlign: "center",
  },
  guestSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 18,
  },

  // ── Content ──
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // ── Auth Card ──
  authCard: {
    marginBottom: 8,
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
    elevation: 4,
  },
  signInButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
  registerButton: {
    backgroundColor: COLORS.transparent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  registerButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },

  // ── Section Header ──
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },

  // ── Menu Item ──
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuIconDanger: {
    backgroundColor: COLORS.errorBg,
  },
  menuIconText: {
    fontSize: 18,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  menuItemLabelDanger: {
    color: COLORS.error,
  },
  menuItemSublabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  menuItemChevron: {
    fontSize: 20,
    color: COLORS.textMuted,
  },

  // ── Footer ──
  footer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#D4A843",
    letterSpacing: 1,
    marginBottom: 4,
  },
  footerArabic: {
    fontSize: 14,
    color: "rgba(212,168,67,0.6)",
    letterSpacing: 2,
    marginBottom: 8,
  },
  footerTagline: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
  },

  // ── Bottom ──
  bottomPadding: {
    height: 40,
  },
});