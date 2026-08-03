import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteMyAccount } from "../../lib/endpoints";
import { COLORS } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DeleteAccountScreen({ navigation }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();

  const confirmAndDelete = () => {
    if (!password) {
      Alert.alert("Password required", "Please enter your password to continue.");
      return;
    }

    Alert.alert(
      "Delete your account?",
      "This action is permanent and cannot be undone. You will lose access to your saved data and contributions on MosqueBuddy.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Account", style: "destructive", onPress: handleDelete },
      ]
    );
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteMyAccount(password);

      await AsyncStorage.removeItem("sabeel_token");
      if (logout) {
        await logout();
      }

      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      Alert.alert(
        "Couldn't delete account",
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Delete Account</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={22} color="#DC2626" />
          <Text style={styles.warningText}>
            Deleting your account is permanent. This will remove your access to
            MosqueBuddy and your account cannot be recovered.
          </Text>
        </View>

        <Text style={styles.label}>Enter your password to confirm</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.deleteBtn, loading && { opacity: 0.6 }]}
          onPress={confirmAndDelete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.deleteBtnText}>Delete My Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.card },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: "700", color: COLORS.dark },
  content: { padding: 20 },
  warningBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  warningText: { flex: 1, fontSize: 13, color: "#991B1B", lineHeight: 19, marginLeft: 8 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.dark, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#FFF",
    marginBottom: 24,
    color: COLORS.dark,
  },
  deleteBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  deleteBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  cancelText: { textAlign: "center", color: COLORS.textMuted, fontSize: 14, fontWeight: "500" },
});