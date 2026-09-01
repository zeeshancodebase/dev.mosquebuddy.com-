import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { COLORS, APP_CONFIG } from "../../constants";

function AnimatedInput({
  inputRef,
  style,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  returnKeyType,
  onSubmitEditing,
  secureTextEntry,
  children,
}) {
  const borderAnim = useRef(new Animated.Value(0)).current;

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.borderLight, COLORS.primary],
  });

  function handleFocus() {
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }

  function handleBlur() {
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }

  return (
    <Animated.View
      style={[
        styles.inputContainer,
        { borderColor },
      ]}
    >
      <TextInput
        ref={inputRef}
        style={[styles.input, style]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        onFocus={handleFocus}
        onBlur={handleBlur}
        secureTextEntry={secureTextEntry}
      />
      {children}
    </Animated.View>
  );
}

export default function LoginScreen({ navigation }) {
  const { login, skipAuth, hasSeenWelcome } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordRef = useRef(null);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(-30)).current;
  const formTranslateY = useRef(new Animated.Value(60)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  async function handleSkip() {
    await skipAuth();
    navigation.replace("MainTabs");
  }

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(formTranslateY, {
          toValue: 0,
          damping: 20,
          stiffness: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);
  }, []);

  function onPressIn() {
    Animated.timing(buttonScale, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }

  function onPressOut() {
    Animated.spring(buttonScale, {
      toValue: 1,
      damping: 15,
      useNativeDriver: true,
    }).start();
  }

  async function handleLogin() {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert("Missing Info", "Please enter your email/phone and password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/auth/login", {
        identifier: identifier.trim(),
        password,
      });
      await login(res.token, res.data);
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topSection}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ translateY: logoTranslateY }],
            },
          ]}
        >
          <View style={styles.emblem}>
            <Text style={styles.emblemIcon}>🕌</Text>
          </View>
          <Text style={styles.appName}>{APP_CONFIG.name}</Text>
          <Text style={styles.appNameArabic}>{APP_CONFIG.nameArabic}</Text>
          <Text style={styles.tagline}>{APP_CONFIG.tagline}</Text>
        </Animated.View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: formOpacity,
                transform: [{ translateY: formTranslateY }],
              },
            ]}
          >
            <Text style={styles.formTitle}>Welcome back</Text>
            <Text style={styles.formSubtitle}>
              Sign in to your {APP_CONFIG.name} account
            </Text>

            {/* Identifier field */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>Email or Phone</Text>
              <AnimatedInput
                placeholder="Enter your email or phone"
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            {/* Password field */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>Password</Text>
              <AnimatedInput
                inputRef={passwordRef}
                style={styles.passwordInput}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              >
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eyeText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </AnimatedInput>
            </View>

            {/* Login button */}
            <Animated.View
              style={[
                styles.buttonWrapper,
                { transform: [{ scale: buttonScale }] },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={1}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register link */}
            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate("Register")}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLinkText}>
                Don't have an account?{" "}
                <Text style={styles.registerLinkBold}>Create one</Text>
              </Text>
            </TouchableOpacity>
            {/* Skip login link */}
            {!hasSeenWelcome && (
              <TouchableOpacity
                style={styles.skipLink}
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.skipLinkText}>Continue as Guest</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  topSection: {
    backgroundColor: COLORS.dark,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emblem: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    elevation: 8,
  },
  emblemIcon: {
    fontSize: 32,
  },
  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 1,
    marginBottom: 4,
  },
  appNameArabic: {
    fontSize: 20,
    color: COLORS.primaryMid,
    marginBottom: 10,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 260,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 28,
  },
  fieldWrapper: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    height: "100%",
  },
  passwordInput: {
    paddingRight: 8,
  },
  eyeButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  eyeText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },
  buttonWrapper: {
    marginTop: 8,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  dividerText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginHorizontal: 12,
  },
  registerLink: {
    alignItems: "center",
    paddingVertical: 8,
  },
  registerLinkText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  registerLinkBold: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  skipLink: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 4,
  },
  skipLinkText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});