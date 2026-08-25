import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { NavigationHeader } from "../components/NavigationHeader";
import { useDispatch } from "../context/DispatchContext";
import { RF } from "../utils/Responsive";

// ─────────────────────────────────────────────
// CONFIG — change SERVER_URL to your backend IP
// e.g. "http://192.168.1.42:3000"
// Make sure your phone and Pi are on the same Wi-Fi
// ─────────────────────────────────────────────
const SERVER_URL = "http://192.168.4.1";
const POLL_INTERVAL = 2500; // ms

type LogEntry = {
  id: string;
  emoji: string;
  text: string;
  time: string;
  dotColor: string;
};

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function IoTScreen() {
  const router = useRouter();
  const { C, isDark } = useTheme();
  const { iotOnline, iotLogs, addIotLog, clearIotLogs, dispatches } = useDispatch();
  const styles = getStyles(C);
  // Polling moved to _layout.tsx for global listener

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.navy }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.navy} />

      <NavigationHeader title="IoT Device Status" subtitle="Hardware & connectivity status" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={[styles.deviceCard, { backgroundColor: C.cardBg, borderColor: C.cardBorder, marginTop: 40 }]}>
          <View style={[styles.statusRing, { borderColor: iotOnline ? C.teal : C.red }]}>
            <Ionicons name="hardware-chip" size={48} color={iotOnline ? C.teal : C.textDim} />
          </View>

          <Text style={styles.deviceName}>RapidCare Button v1</Text>
          <Text style={styles.deviceId}>ID: RC-IOT-2024-001 · ESP32-DevKitV1</Text>

          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text
                style={[
                  styles.statusVal,
                  { color: iotOnline ? C.success : C.red },
                ]}
              >
                {iotOnline ? "Online" : "Offline"}
              </Text>
              <Text style={styles.statusLbl}>Status</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusVal, { color: C.textMain }]}>100%</Text>
              <Text style={[styles.statusLbl, { color: C.textDim }]}>Battery</Text>
            </View>
            <View style={styles.statusItem}>
              <Text
                style={[
                  styles.statusVal,
                  { color: iotOnline ? C.success : C.textDim },
                ]}
              >
                {iotOnline ? "Strong" : "N/A"}
              </Text>
              <Text style={styles.statusLbl}>Wi-Fi</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusVal, { color: C.amber }]}>
                {iotLogs ? iotLogs.filter(l => l.emoji === "🔴").length : 0}
              </Text>
              <Text style={styles.statusLbl}>Alerts sent</Text>
            </View>
          </View>
        </View>

        {/* Activity log */}
        <Text style={styles.logTitle}>System Events (Last 20)</Text>
        <View style={styles.logList}>
          {iotLogs && iotLogs.map((entry) => (
            <View key={entry.id} style={[styles.logItem, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
              <Text style={{ fontSize: RF(18) }}>{entry.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.logText, { color: C.textMain }]}>{entry.text}</Text>
                <Text style={[styles.logTime, { color: C.textDim }]}>{entry.time}</Text>
              </View>
              <View
                style={[styles.logDot, { backgroundColor: entry.dotColor }]}
              />
            </View>
          ))}
          {(!iotLogs || iotLogs.length === 0) && (
            <Text style={{ textAlign: 'center', color: C.textDim, marginTop: 20 }}>No activity recorded yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  container: { flex: 1 },
  flashOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: C.red,
    zIndex: 200,
    pointerEvents: "none",
  },
  header: { paddingHorizontal: 22, paddingTop: 56, paddingBottom: 16 },
  title: {
    fontSize: RF(26),
    fontWeight: "700",
    color: C.textMain,
    letterSpacing: -0.5,
  },
  sub: { fontSize: RF(13), color: C.textMuted, marginTop: 3 },
  deviceCard: {
    marginHorizontal: 22,
    marginBottom: 14,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
  },
  statusRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  deviceName: {
    fontSize: RF(16),
    fontWeight: "700",
    color: C.textMain,
    marginBottom: 4,
  },
  deviceId: {
    fontSize: RF(11),
    color: C.textDim,
    fontFamily: "monospace",
    marginBottom: 18,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 16,
  },
  statusItem: { alignItems: "center" },
  statusVal: { fontSize: RF(14), fontWeight: "700", color: C.textMain },
  statusLbl: { fontSize: RF(10), color: C.textDim, marginTop: 2 },
  configCard: {
    marginHorizontal: 22,
    marginBottom: 18,
    backgroundColor: "rgba(0,201,167,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,201,167,0.15)",
    borderRadius: 14,
    padding: 14,
  },
  configTitle: {
    fontSize: RF(13),
    fontWeight: "700",
    color: C.teal,
    marginBottom: 8,
  },
  configText: { fontSize: RF(12), color: C.textMuted, marginBottom: 2 },
  logTitle: {
    fontSize: RF(14),
    fontWeight: "700",
    color: C.textMain,
    paddingHorizontal: 22,
    marginBottom: 12,
  },
  logList: { paddingHorizontal: 22, gap: 8 },
  logItem: {
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logText: { fontSize: RF(13), fontWeight: "600", color: C.textMain },
  logTime: { fontSize: RF(11), color: C.textDim, marginTop: 2 },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(10,22,40,0.92)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  modal: {
    backgroundColor: C.navy2,
    borderWidth: 1,
    borderColor: "rgba(232,41,58,0.4)",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: RF(22),
    fontWeight: "800",
    color: "#FF4D5E",
    marginBottom: 8,
  },
  modalMsg: {
    fontSize: RF(13),
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  modalBtns: { flexDirection: "row", gap: 10, width: "100%" },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: "center",
  },
  sendBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: C.red,
    alignItems: "center",
  },
});
