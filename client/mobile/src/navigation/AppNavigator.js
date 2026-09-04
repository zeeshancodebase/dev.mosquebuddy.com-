// src/navigation/AppNavigator.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../constants";
import mobileAds from "react-native-google-mobile-ads";

// Auth Screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

// Main Screens
import HomeScreen from "../screens/main/HomeScreen";
import NearbyScreen from "../screens/main/NearbyScreen";
import JumuahScreen from "../screens/main/JumuahScreen";
import SearchScreen from "../screens/main/SearchScreen";
import ProfileScreen from "../screens/main/ProfileScreen";

// Detail / Flow Screens
import VenueDetailScreen from "../screens/main/VenueDetailScreen";
import ReportTimingScreen from "../screens/main/ReportTimingScreen";
import SuggestMosqueScreen from "../screens/main/SuggestMosqueScreen";


import MosqueAdminHomeScreen from "../screens/mosqueAdmin/MosqueAdminHomeScreen";
import MosqueAdminDetailsScreen from "../screens/mosqueAdmin/MosqueAdminDetailsScreen";
import MosqueAdminEditTimingsScreen from "../screens/mosqueAdmin/MosqueAdminEditTimingsScreen";
import MosqueAdminEditJumuahScreen from "../screens/mosqueAdmin/MosqueAdminEditJumuahScreen";
import MosqueAdminReportsScreen from "../screens/mosqueAdmin/MosqueAdminReportsScreen";
import PostAnnouncementScreen from "../screens/main/PostAnnouncementScreen";
import VolunteerHomeScreen from "../screens/volunteer/VolunteerHomeScreen";

import FeedbackScreen from "../screens/main/FeedbackScreen.js";

import QiblaScreen from "../screens/main/QiblaScreen";
import TasbeehScreen from "../screens/main/TasbeehScreen";

import AccountSettingsScreen from "../screens/main/AccountSettingsScreen";
import DeleteAccountScreen from "../screens/main/DeleteAccountScreen";

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// import TabIcon from "../components/TabIcon";

import { Ionicons } from "@expo/vector-icons";
import VolunteerVenueDetailScreen from "../screens/volunteer/VolunteerVenueDetailScreen.js";
import VolunteerEditTimingsScreen from "../screens/volunteer/VolunteerEditTimingsScreen.js";
import VolunteerEditJumuahScreen from "../screens/volunteer/VolunteerEditJumuahScreen.js";
import VolunteerReportsScreen from "../screens/volunteer/VolunteerReportsScreen.js";
import VolunteerSuggestionsScreen from "../screens/volunteer/VolunteerSuggestionsScreen.js";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabIcon({ name, color }) {
  const icons = {
    Home: "home",
    Nearby: "location",
    Jumuah: "moon",
    Search: "search",
    Profile: "person",
  };
  return <Ionicons name={icons[name]} size={22} color={color} />;
}

// function TabIcon({ name, focused }) {
//   const icons = {
//     Home: "🕌",
//     Nearby: "📍",
//     Jumuah: "🌙",
//     Search: "🔍",
//     Profile: "👤",
//   };
//   return (
//     <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>
//       {icons[name]}
//     </Text>
//   );
// }

function BottomTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} color={color} size={24} />
        ),
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.borderLight,
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          height: 57 + Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Nearby" component={NearbyScreen} />
      <Tab.Screen
        name="Jumuah"
        component={JumuahScreen}
        options={{ title: "Jumu'ah" }}
      />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.dark,
      }}
    >
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

export default function AppNavigator() {
  const { isLoading, hasSeenWelcome } = useAuth();

   React.useEffect(() => {
    mobileAds()
      .initialize()
      .then(() => console.log("AdMob initialized"));
  }, []);

  if (isLoading) return <LoadingScreen />;

  // ── Root stack owns ALL screens so navigation.navigate("X")
  // works from any depth — tabs, modals, nested stacks —
  // without needing to know where in the tree you are.
  //
  // Guest browsing: the whole app (tabs + detail screens) is always
  // accessible. Login/Register are reachable on demand. Auth is
  // only forced on the very first install (hasSeenWelcome = false),
  // matching the big-tech "skip" pattern. After that, individual
  // screens gate their own actions (Report, Suggest, Profile tools).
  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={hasSeenWelcome ? "MainTabs" : "Login"}
      >
        {/* ── Main app shell ── */}
        <RootStack.Screen name="MainTabs" component={BottomTabs} />

        {/* ── Venue detail flow ── */}
        <RootStack.Screen
          name="VenueDetail"
          component={VenueDetailScreen}
          options={{ animation: "slide_from_right" }}
        />

        {/* ── Contribution flows (login-gated at screen level) ── */}
        <RootStack.Screen
          name="ReportTiming"
          component={ReportTimingScreen}
          options={{ animation: "slide_from_bottom" }}
        />
        <RootStack.Screen
          name="SuggestMosque"
          component={SuggestMosqueScreen}
          options={{ animation: "slide_from_bottom" }}
        />

        {/* ── Auth screens (on-demand after first launch) ── */}
        <RootStack.Screen
          name="Login"
          component={LoginScreen}
          options={{ animation: "fade" }}
        />
        <RootStack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ animation: "slide_from_right" }}
        />

        <RootStack.Screen
          name="AccountSettings"
          component={AccountSettingsScreen}
          options={{ animation: "slide_from_right" }}
        />
        <RootStack.Screen
          name="DeleteAccount"
          component={DeleteAccountScreen}
          options={{ animation: "slide_from_right" }}
        />

        <RootStack.Screen
          name="Feedback"
          component={FeedbackScreen}
          options={{ animation: "slide_from_bottom" }}
        />

        <RootStack.Screen name="MosqueAdminHome" component={MosqueAdminHomeScreen} options={{ animation: "slide_from_right" }} />
        <RootStack.Screen name="MosqueAdminDetails" component={MosqueAdminDetailsScreen} options={{ animation: "slide_from_right" }} />
        <RootStack.Screen name="MosqueAdminEditTimings" component={MosqueAdminEditTimingsScreen} options={{ animation: "slide_from_right" }} />
        <RootStack.Screen name="MosqueAdminEditJumuah" component={MosqueAdminEditJumuahScreen} options={{ animation: "slide_from_right" }} />
        <RootStack.Screen name="MosqueAdminReports" component={MosqueAdminReportsScreen} options={{ animation: "slide_from_right" }} />
        <RootStack.Screen name="PostAnnouncement" component={PostAnnouncementScreen} options={{ animation: "slide_from_right" }} />
        <RootStack.Screen name="VolunteerHome" component={VolunteerHomeScreen} options={{ animation: "slide_from_right" }} />
        <RootStack.Screen name="VolunteerVenueDetail" component={VolunteerVenueDetailScreen} options={{ animation: "slide_from_right" }} />
        <RootStack.Screen name="VolunteerEditTimings" component={VolunteerEditTimingsScreen} options={{ animation: "slide_from_right" }} />
        <RootStack.Screen name="VolunteerEditJumuah" component={VolunteerEditJumuahScreen} options={{ animation: "slide_from_right" }} />
        <RootStack.Screen name="VolunteerReports" component={VolunteerReportsScreen} options={{ animation: "slide_from_right" }} />
        <RootStack.Screen name="VolunteerSuggestions" component={VolunteerSuggestionsScreen} options={{ animation: "slide_from_right" }} />
        <RootStack.Screen
          name="Qibla"
          component={QiblaScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="Tasbeeh" component={TasbeehScreen}
          options={{ headerShown: false }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}


// Below is the old code which works fine without welcome screen tracking and skip option for login
// import React from "react";
// import { NavigationContainer } from "@react-navigation/native";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import { View, Text, ActivityIndicator } from "react-native";
// import { useAuth } from "../context/AuthContext";
// import { COLORS } from "../constants";

// // Auth Screens
// import LoginScreen from "../screens/auth/LoginScreen";
// import RegisterScreen from "../screens/auth/RegisterScreen";

// // Main Screens
// import HomeScreen from "../screens/main/HomeScreen";
// import NearbyScreen from "../screens/main/NearbyScreen";
// import JumuahScreen from "../screens/main/JumuahScreen";
// import SearchScreen from "../screens/main/SearchScreen";
// import ProfileScreen from "../screens/main/ProfileScreen";

// // Detail Screens
// import VenueDetailScreen from "../screens/main/VenueDetailScreen";

// const Stack = createNativeStackNavigator();
// const Tab = createBottomTabNavigator();

// function TabIcon({ name, focused }) {
//   const icons = {
//     Home: focused ? "🕌" : "🕌",
//     Nearby: focused ? "📍" : "📍",
//     Jumuah: focused ? "🌙" : "🌙",
//     Search: focused ? "🔍" : "🔍",
//     Profile: focused ? "👤" : "👤",
//   };

//   return (
//     <Text style={{ fontSize: 20 }}>{icons[name]}</Text>
//   );
// }

// function BottomTabs() {
//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         headerShown: false,
//         tabBarIcon: ({ focused }) => (
//           <TabIcon name={route.name} focused={focused} />
//         ),
//         tabBarActiveTintColor: COLORS.primary,
//         tabBarInactiveTintColor: COLORS.textMuted,
//         tabBarStyle: {
//           backgroundColor: COLORS.card,
//           borderTopColor: COLORS.borderLight,
//           borderTopWidth: 1,
//           paddingBottom: 8,
//           paddingTop: 8,
//           height: 65,
//         },
//         tabBarLabelStyle: {
//           fontSize: 11,
//           fontWeight: "600",
//           marginTop: 2,
//         },
//       })}
//     >
//       <Tab.Screen name="Home" component={HomeScreen} />
//       <Tab.Screen name="Nearby" component={NearbyScreen} />
//       <Tab.Screen name="Jumuah" component={JumuahScreen} />
//       <Tab.Screen name="Search" component={SearchScreen} />
//       <Tab.Screen name="Profile" component={ProfileScreen} />
//     </Tab.Navigator>
//   );
// }

// function AuthStack() {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="Login" component={LoginScreen} />
//       <Stack.Screen name="Register" component={RegisterScreen} />
//     </Stack.Navigator>
//   );
// }

// function AppStack() {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="MainTabs" component={BottomTabs} />
//       <Stack.Screen name="VenueDetail" component={VenueDetailScreen} />
//     </Stack.Navigator>
//   );
// }

// function LoadingScreen() {
//   return (
//     <View
//       style={{
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//         backgroundColor: COLORS.dark,
//       }}
//     >
//       <ActivityIndicator size="large" color={COLORS.primary} />
//     </View>
//   );
// }

// export default function AppNavigator() {
//   const { isLoggedIn, isLoading } = useAuth();

//   if (isLoading) {
//     return <LoadingScreen />;
//   }

//   return (
//     <NavigationContainer>
//       {isLoggedIn ? <AppStack /> : <AuthStack />}
//     </NavigationContainer>
//   );
// }