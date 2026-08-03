import React from "react";
import { View, Text, TouchableOpacity, StyleSheet} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountSettingsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Account Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate("DeleteAccount")}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="trash-outline" size={20} color="#DC2626" />
            <Text style={styles.rowTextDanger}>Delete Account</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
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
  section: { marginTop: 20, paddingHorizontal: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowTextDanger: { fontSize: 15, fontWeight: "600", color: "#DC2626", marginLeft: 10 },
});