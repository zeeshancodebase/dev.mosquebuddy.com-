import React from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { COLORS } from "./src/constants";
import { LocationProvider } from "./src/context/LocationContext";
import ActionFlowModal from "./src/components/ActionFlowModal";
import { KeyboardProvider } from "react-native-keyboard-controller";

export default function App() {
  return (
     <KeyboardProvider>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LocationProvider>
          <AuthProvider>
            <StatusBar style="dark" backgroundColor={COLORS.background} />
            <AppNavigator />
            <ActionFlowModal />
          </AuthProvider>
        </LocationProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView></KeyboardProvider>
  );
}
// npx expo start
// npx expo run:android
// npx expo start --dev-client


// below code is a code inwhich input works with keyboard
/*
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function App() {
  const [one, setOne] = useState("");
  const [two, setTwo] = useState("");
  const [three, setThree] = useState("");

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#F0F4F2" />

        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <Text style={styles.title}>Input Test</Text>

            <TextInput
              style={styles.input}
              placeholder="Field one"
              value={one}
              onChangeText={setOne}
              autoCapitalize="none"
              autoCorrect={false}
              underlineColorAndroid="transparent"
            />

            <TextInput
              style={styles.input}
              placeholder="Field two"
              value={two}
              onChangeText={setTwo}
              autoCapitalize="none"
              autoCorrect={false}
              underlineColorAndroid="transparent"
            />

            <TextInput
              style={styles.input}
              placeholder="Field three"
              value={three}
              onChangeText={setThree}
              autoCapitalize="none"
              autoCorrect={false}
              underlineColorAndroid="transparent"
            />

            <Text style={styles.preview}>One: {one}</Text>
            <Text style={styles.preview}>Two: {two}</Text>
            <Text style={styles.preview}>Three: {three}</Text>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F4F2",
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 24,
    color: "#0D1F17",
  },
  input: {
    height: 54,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 14,
    color: "#0D1F17",
  },
  preview: {
    fontSize: 15,
    marginTop: 8,
    color: "#374151",
  },
});
*/