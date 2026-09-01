import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { COLORS, APP_CONFIG } from "../../constants";
import Input from "../../components/Input";
import Button from "../../components/Button";

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(-30)).current;
  const formTranslateY = useRef(new Animated.Value(60)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

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

  function validate() {
    const newErrors = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Enter a valid email address";
    if (phone.trim() && !/^\+?[\d\s\-]{8,15}$/.test(phone))
      newErrors.phone = "Enter a valid phone number";
    if (!password.trim()) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!confirmPassword.trim())
      newErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const body = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      };

      if (phone.trim()) body.phone = phone.trim();

      const res = await api.post("/auth/register", body);
      Alert.alert(
        "Registration Successful",
        "Your account has been created successfully.",
        [
          {
            text: "Continue",
            onPress: async () => {
               setIsLoading(true);
              try {
                await login(res.token, res.data);
                navigation.reset({
                  index: 0,
                  routes: [{ name: "MainTabs" }],
                });
              } catch (e) {
                Alert.alert(
                  "Account Created",
      "Your account was created successfully. Please sign in.",
      [
        {
          text: "OK",
          onPress: () => navigation.replace("Login"),
        },
      ]
    );
              }finally {
    setIsLoading(false);
  }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Registration Failed",
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Dark top section */}
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
        </Animated.View>
      </View>

      {/* Form section */}
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
            <Text style={styles.formTitle}>Create account</Text>
            <Text style={styles.formSubtitle}>
              Join {APP_CONFIG.name} and never miss a Jamā'ah
            </Text>

            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: null });
              }}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              error={errors.name}
            />

            <Input
              ref={emailRef}
              label="Email"
              placeholder="Enter your email address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: null });
              }}
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              error={errors.email}
            />

            <Input
              ref={phoneRef}
              label="Phone Number (Optional)"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (errors.phone) setErrors({ ...errors, phone: null });
              }}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={errors.phone}
              hint="Used for mosque admin verification if needed"
            />

            <Input
              ref={passwordRef}
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: null });
              }}
              secureTextEntry
              showToggle
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              error={errors.password}
              hint="Minimum 6 characters"
            />

            <Input
              ref={confirmPasswordRef}
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword)
                  setErrors({ ...errors, confirmPassword: null });
              }}
              secureTextEntry
              showToggle
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              error={errors.confirmPassword}
            />

            <View style={styles.buttonWrapper}>
              <Button
                title="Create Account"
                onPress={handleRegister}
                loading={isLoading}
                disabled={isLoading}
              />
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLinkText}>
                Already have an account?{" "}
                <Text style={styles.loginLinkBold}>Sign in</Text>
              </Text>
            </TouchableOpacity>
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
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emblem: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    elevation: 8,
  },
  emblemIcon: {
    fontSize: 26,
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 1,
    marginBottom: 4,
  },
  appNameArabic: {
    fontSize: 16,
    color: COLORS.primaryMid,
    letterSpacing: 2,
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
  buttonWrapper: {
    marginTop: 8,
    marginBottom: 20,
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
  loginLink: {
    alignItems: "center",
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  loginLinkBold: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});