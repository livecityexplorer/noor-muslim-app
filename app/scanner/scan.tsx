import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import { fetchProductByBarcode, analyzeProduct, addToHistory } from "@/lib/services/HalalScannerAPI";
import { HalalStatus } from "@/lib/data/halalIngredients";

const SCAN_FACTS = [
  "Did you know? Gelatin from fish is Halal.",
  "Tip: Look for IFANCA or JAKIM logos for certified Halal products.",
  "Did you know? Carmine (E120) is made from crushed insects.",
  "Tip: 'Natural flavors' may hide animal-derived ingredients.",
  "Did you know? Agar-agar is a Halal alternative to gelatin.",
];

function StatusBadge({ status }: { status: HalalStatus }) {
  const config = {
    halal: { bg: "#1B4332", text: "#4ADE80", label: "HALAL", icon: "✅" },
    haram: { bg: "#450A0A", text: "#F87171", label: "HARAM", icon: "❌" },
    mushbooh: { bg: "#431407", text: "#FB923C", label: "MUSHBOOH", icon: "⚠️" },
    unknown: { bg: "#1C1C2E", text: "#94A3B8", label: "UNKNOWN", icon: "❓" },
  }[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.text }]}>
        {config.icon} {config.label}
      </Text>
    </View>
  );
}

export default function ScanScreen() {
  const router = useRouter();
  const [manualBarcode, setManualBarcode] = useState("");
  const [showManualModal, setShowManualModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const [quickResult, setQuickResult] = useState<{
    name: string; brand: string; status: HalalStatus; summary: string; barcode: string;
  } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((i) => (i + 1) % SCAN_FACTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleLookup = async (barcode: string) => {
    if (!barcode.trim()) return;
    setLoading(true);
    setShowManualModal(false);
    try {
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      const product = await fetchProductByBarcode(barcode.trim());
      if (!product) {
        Alert.alert(
          "Product Not Found",
          "This barcode was not found in the Open Food Facts database. Try searching by product name instead.",
          [
            { text: "Search by Name", onPress: () => router.push("/scanner/search") },
            { text: "OK" },
          ]
        );
        setLoading(false);
        return;
      }
      const analysis = analyzeProduct(product);
      await addToHistory(analysis);
      setQuickResult({
        name: analysis.productName,
        brand: analysis.brand,
        status: analysis.overallStatus,
        summary: analysis.summary,
        barcode: analysis.barcode,
      });
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(
          analysis.overallStatus === "halal"
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning
        );
      }
    } catch {
      Alert.alert("Error", "Failed to look up product. Please check your connection.");
    }
    setLoading(false);
  };

  return (
    <ScreenContainer containerClassName="bg-[#0A0A1A]" safeAreaClassName="bg-[#0A0A1A]">
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Scan Barcode</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Camera Placeholder (native camera requires native build) */}
        <View style={styles.cameraContainer}>
          <View style={styles.cameraPlaceholder}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.cameraText}>Camera scanning available in native build</Text>
            <Text style={styles.cameraSubText}>Use manual entry below to look up products</Text>
          </View>

          {/* Scanning fact */}
          <View style={styles.factBubble}>
            <Text style={styles.factText}>{SCAN_FACTS[factIndex]}</Text>
          </View>
        </View>

        {/* Manual Entry */}
        <View style={styles.manualSection}>
          <Text style={styles.manualTitle}>Enter Barcode Manually</Text>
          <View style={styles.manualInputRow}>
            <TextInput
              style={styles.manualInput}
              value={manualBarcode}
              onChangeText={setManualBarcode}
              placeholder="e.g. 3017620422003"
              placeholderTextColor="#4A5568"
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={() => handleLookup(manualBarcode)}
            />
            <Pressable
              style={({ pressed }) => [styles.lookupBtn, pressed && { opacity: 0.8 }, loading && { opacity: 0.5 }]}
              onPress={() => handleLookup(manualBarcode)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.lookupBtnText}>Look Up</Text>
              )}
            </Pressable>
          </View>

          {/* Popular test barcodes */}
          <Text style={styles.tryTitle}>Try these example barcodes:</Text>
          <View style={styles.exampleBarcodes}>
            {[
              { code: "3017620422003", name: "Nutella" },
              { code: "5000159484695", name: "Kit Kat" },
              { code: "0016000275287", name: "Cheerios" },
            ].map((item) => (
              <Pressable
                key={item.code}
                style={({ pressed }) => [styles.exampleChip, pressed && { opacity: 0.7 }]}
                onPress={() => {
                  setManualBarcode(item.code);
                  handleLookup(item.code);
                }}
              >
                <Text style={styles.exampleChipText}>{item.name}</Text>
                <Text style={styles.exampleChipCode}>{item.code}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Quick Result */}
        {quickResult && (
          <View style={styles.quickResult}>
            <View style={styles.quickResultHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickResultName} numberOfLines={2}>{quickResult.name}</Text>
                <Text style={styles.quickResultBrand}>{quickResult.brand}</Text>
              </View>
              <StatusBadge status={quickResult.status} />
            </View>
            <Text style={styles.quickResultSummary} numberOfLines={3}>{quickResult.summary}</Text>
            <View style={styles.quickResultActions}>
              <Pressable
                style={({ pressed }) => [styles.quickResultBtn, pressed && { opacity: 0.8 }]}
                onPress={() => router.push(`/scanner/product/${quickResult.barcode}` as any)}
              >
                <Text style={styles.quickResultBtnText}>View Full Analysis</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.quickResultBtnSecondary, pressed && { opacity: 0.8 }]}
                onPress={() => {
                  setQuickResult(null);
                  setManualBarcode("");
                }}
              >
                <Text style={styles.quickResultBtnSecondaryText}>Scan Another</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, backgroundColor: "#0A0A1A" },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1E293B", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  content: { paddingBottom: 120 },
  cameraContainer: { margin: 20 },
  cameraPlaceholder: { backgroundColor: "#111827", borderRadius: 20, height: 280, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  scanFrame: { position: "absolute", width: 200, height: 160 },
  corner: { position: "absolute", width: 24, height: 24, borderColor: "#4ADE80", borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  cameraIcon: { fontSize: 48, marginBottom: 12 },
  cameraText: { fontSize: 14, color: "#94A3B8", textAlign: "center", paddingHorizontal: 20 },
  cameraSubText: { fontSize: 12, color: "#4A5568", textAlign: "center", marginTop: 6 },
  factBubble: { backgroundColor: "#0D2B1A", borderRadius: 10, padding: 12, marginTop: 12, borderLeftWidth: 3, borderLeftColor: "#4ADE80" },
  factText: { fontSize: 12, color: "#D1FAE5", lineHeight: 18 },
  manualSection: { paddingHorizontal: 20, marginTop: 8 },
  manualTitle: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", marginBottom: 12 },
  manualInputRow: { flexDirection: "row", gap: 10 },
  manualInput: { flex: 1, backgroundColor: "#111827", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: "#FFFFFF", fontSize: 15, borderWidth: 1, borderColor: "#1E293B" },
  lookupBtn: { backgroundColor: "#166534", borderRadius: 12, paddingHorizontal: 20, justifyContent: "center", alignItems: "center", minWidth: 90 },
  lookupBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  tryTitle: { fontSize: 13, color: "#64748B", marginTop: 16, marginBottom: 10 },
  exampleBarcodes: { gap: 8 },
  exampleChip: { backgroundColor: "#111827", borderRadius: 10, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  exampleChipText: { fontSize: 14, color: "#FFFFFF", fontWeight: "600" },
  exampleChipCode: { fontSize: 12, color: "#64748B" },
  quickResult: { margin: 20, backgroundColor: "#111827", borderRadius: 16, padding: 18 },
  quickResultHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  quickResultName: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  quickResultBrand: { fontSize: 13, color: "#94A3B8", marginTop: 2 },
  quickResultSummary: { fontSize: 13, color: "#CBD5E1", lineHeight: 20, marginBottom: 16 },
  quickResultActions: { flexDirection: "row", gap: 10 },
  quickResultBtn: { flex: 1, backgroundColor: "#166534", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  quickResultBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  quickResultBtnSecondary: { flex: 1, backgroundColor: "#1E293B", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  quickResultBtnSecondaryText: { color: "#94A3B8", fontWeight: "600", fontSize: 13 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: "700" },
});
