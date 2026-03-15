import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  Animated,
  Easing,
  Keyboard,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { fetchProductByBarcode, analyzeProduct, addToHistory } from "@/lib/services/HalalScannerAPI";
import { HalalStatus } from "@/lib/data/halalIngredients";

// Barcode types to detect — covers all common product barcodes
const BARCODE_TYPES = ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr"] as const;

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
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [quickResult, setQuickResult] = useState<{
    name: string; brand: string; status: HalalStatus; summary: string; barcode: string;
  } | null>(null);

  // Laser line animation
  const laserAnim = useRef(new Animated.Value(0)).current;

  // Activate camera only when screen is focused, deactivate on blur
  useFocusEffect(
    useCallback(() => {
      setCameraActive(true);
      return () => {
        setCameraActive(false);
        setScanned(false);
      };
    }, [])
  );

  // Animate laser line
  useEffect(() => {
    if (!cameraActive || scanned || loading) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(laserAnim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [cameraActive, scanned, loading, laserAnim]);

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 160],
  });

  const handleLookup = async (barcode: string) => {
    const code = barcode.trim();
    if (!code) return;
    Keyboard.dismiss();
    setLoading(true);
    setShowManual(false);
    try {
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      const product = await fetchProductByBarcode(code);
      if (!product) {
        setScanned(false);
        setLoading(false);
        Alert.alert(
          "Product Not Found",
          "This barcode was not found in the Open Food Facts database. Try searching by product name instead.",
          [
            { text: "Search by Name", onPress: () => router.push("/scanner/search" as any) },
            { text: "Scan Again", onPress: () => setScanned(false) },
          ]
        );
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
      setScanned(false);
      Alert.alert("Error", "Failed to look up product. Please check your connection.");
    }
    setLoading(false);
  };

  const handleBarcodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (scanned || loading) return;
      setScanned(true);
      handleLookup(data);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scanned, loading]
  );

  const handleScanAnother = () => {
    setQuickResult(null);
    setManualBarcode("");
    setScanned(false);
  };

  // ─── Permission not yet determined ───────────────────────────────────────
  if (!permission) {
    return (
      <ScreenContainer containerClassName="bg-[#0A0A1A]" safeAreaClassName="bg-[#0A0A1A]">
        <View style={styles.center}>
          <ActivityIndicator color="#4ADE80" size="large" />
        </View>
      </ScreenContainer>
    );
  }

  // ─── Permission denied ────────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <ScreenContainer containerClassName="bg-[#0A0A1A]" safeAreaClassName="bg-[#0A0A1A]">
        <View style={styles.header}>
          <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Scan Barcode</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.permEmoji}>📷</Text>
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permBody}>
            Noor needs camera access to scan product barcodes for Halal verification.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.permBtn, pressed && { opacity: 0.8 }]}
            onPress={requestPermission}
          >
            <Text style={styles.permBtnText}>Grant Camera Access</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.permBtnSecondary, pressed && { opacity: 0.8 }]}
            onPress={() => setShowManual(true)}
          >
            <Text style={styles.permBtnSecondaryText}>Enter Barcode Manually</Text>
          </Pressable>
          {showManual && (
            <View style={styles.manualCard}>
              <Text style={styles.manualLabel}>Enter barcode number</Text>
              <View style={styles.manualRow}>
                <TextInput
                  style={styles.manualInput}
                  value={manualBarcode}
                  onChangeText={setManualBarcode}
                  placeholder="e.g. 3017620422003"
                  placeholderTextColor="#4A5568"
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onSubmitEditing={() => handleLookup(manualBarcode)}
                  autoFocus
                />
                <Pressable
                  style={({ pressed }) => [styles.lookupBtn, pressed && { opacity: 0.8 }, loading && { opacity: 0.5 }]}
                  onPress={() => handleLookup(manualBarcode)}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.lookupBtnText}>Go</Text>}
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScreenContainer>
    );
  }

  // ─── Main scan screen ─────────────────────────────────────────────────────
  return (
    <View style={styles.fullScreen}>
      {/* Live Camera */}
      {cameraActive && !quickResult && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torchOn}
          barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES as any }}
          onBarcodeScanned={scanned || loading ? undefined : handleBarcodeScanned}
        />
      )}

      {/* Dark overlay when result is shown */}
      {quickResult && <View style={[StyleSheet.absoluteFill, styles.dimOverlay]} />}

      {/* Header overlay */}
      <View style={styles.overlayHeader}>
        <Pressable style={({ pressed }) => [styles.overlayBtn, pressed && { opacity: 0.6 }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.overlayTitle}>Scan Barcode</Text>
        <Pressable
          style={({ pressed }) => [styles.overlayBtn, torchOn && styles.overlayBtnActive, pressed && { opacity: 0.6 }]}
          onPress={() => setTorchOn((v) => !v)}
        >
          <Text style={{ fontSize: 18 }}>{torchOn ? "🔦" : "💡"}</Text>
        </Pressable>
      </View>

      {/* Viewfinder frame */}
      {!quickResult && (
        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {/* Laser line */}
            {!loading && !scanned && (
              <Animated.View
                style={[styles.laser, { transform: [{ translateY: laserTranslateY }] }]}
              />
            )}
            {/* Loading spinner over viewfinder */}
            {loading && (
              <View style={styles.viewfinderLoading}>
                <ActivityIndicator color="#4ADE80" size="large" />
                <Text style={styles.viewfinderLoadingText}>Looking up product...</Text>
              </View>
            )}
          </View>
          <Text style={styles.scanHint}>
            {loading ? "Fetching product data..." : "Point camera at a product barcode"}
          </Text>
        </View>
      )}

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
        {/* Quick result */}
        {quickResult ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName} numberOfLines={2}>{quickResult.name}</Text>
                <Text style={styles.resultBrand}>{quickResult.brand}</Text>
              </View>
              <StatusBadge status={quickResult.status} />
            </View>
            <Text style={styles.resultSummary} numberOfLines={3}>{quickResult.summary}</Text>
            <View style={styles.resultActions}>
              <Pressable
                style={({ pressed }) => [styles.resultBtn, pressed && { opacity: 0.8 }]}
                onPress={() => router.push(`/scanner/product/${quickResult.barcode}` as any)}
              >
                <Text style={styles.resultBtnText}>Full Analysis →</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.resultBtnSecondary, pressed && { opacity: 0.8 }]}
                onPress={handleScanAnother}
              >
                <Text style={styles.resultBtnSecondaryText}>Scan Another</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.manualEntryPanel}>
            <Pressable
              style={({ pressed }) => [styles.manualToggleBtn, pressed && { opacity: 0.8 }]}
              onPress={() => setShowManual((v) => !v)}
            >
              <IconSymbol name="list.bullet" size={18} color="#94A3B8" />
              <Text style={styles.manualToggleText}>Enter barcode manually</Text>
              <IconSymbol name={showManual ? "chevron.down" : "chevron.right"} size={16} color="#64748B" />
            </Pressable>
            {showManual && (
              <View style={styles.manualRow}>
                <TextInput
                  style={styles.manualInput}
                  value={manualBarcode}
                  onChangeText={setManualBarcode}
                  placeholder="e.g. 3017620422003"
                  placeholderTextColor="#4A5568"
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onSubmitEditing={() => handleLookup(manualBarcode)}
                  autoFocus
                />
                <Pressable
                  style={({ pressed }) => [styles.lookupBtn, pressed && { opacity: 0.8 }, loading && { opacity: 0.5 }]}
                  onPress={() => handleLookup(manualBarcode)}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.lookupBtnText}>Go</Text>}
                </Pressable>
              </View>
            )}
            {/* Example barcodes */}
            {!showManual && (
              <View style={styles.examplesRow}>
                <Text style={styles.examplesLabel}>Try: </Text>
                {[
                  { code: "3017620422003", name: "Nutella" },
                  { code: "5000159484695", name: "Kit Kat" },
                  { code: "0016000275287", name: "Cheerios" },
                ].map((item) => (
                  <Pressable
                    key={item.code}
                    style={({ pressed }) => [styles.exampleChip, pressed && { opacity: 0.7 }]}
                    onPress={() => handleLookup(item.code)}
                  >
                    <Text style={styles.exampleChipText}>{item.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: "#000000" },
  dimOverlay: { backgroundColor: "rgba(0,0,0,0.85)" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },

  // Header overlay
  overlayHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  overlayBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  overlayBtnActive: { backgroundColor: "rgba(250,204,21,0.3)" },
  overlayTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },

  // Viewfinder
  viewfinderContainer: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 80 },
  viewfinder: { width: 260, height: 180, position: "relative", overflow: "hidden" },
  corner: { position: "absolute", width: 28, height: 28, borderColor: "#4ADE80", borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  laser: { position: "absolute", left: 0, right: 0, height: 2, backgroundColor: "#4ADE80", shadowColor: "#4ADE80", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6, elevation: 4 },
  viewfinderLoading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", gap: 12 },
  viewfinderLoadingText: { color: "#4ADE80", fontSize: 13, fontWeight: "600" },
  scanHint: { color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 20, textAlign: "center" },

  // Bottom panel
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(10,10,26,0.95)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Manual entry
  manualEntryPanel: { gap: 12 },
  manualToggleBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  manualToggleText: { flex: 1, fontSize: 14, color: "#94A3B8" },
  manualRow: { flexDirection: "row", gap: 10 },
  manualInput: { flex: 1, backgroundColor: "#111827", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: "#FFFFFF", fontSize: 15, borderWidth: 1, borderColor: "#1E293B" },
  lookupBtn: { backgroundColor: "#166534", borderRadius: 12, paddingHorizontal: 20, justifyContent: "center", alignItems: "center", minWidth: 60 },
  lookupBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  examplesRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  examplesLabel: { fontSize: 12, color: "#4A5568" },
  exampleChip: { backgroundColor: "#1E293B", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  exampleChipText: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },

  // Quick result
  resultCard: { gap: 12 },
  resultHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  resultName: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  resultBrand: { fontSize: 13, color: "#94A3B8", marginTop: 2 },
  resultSummary: { fontSize: 13, color: "#CBD5E1", lineHeight: 20 },
  resultActions: { flexDirection: "row", gap: 10 },
  resultBtn: { flex: 1, backgroundColor: "#166534", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  resultBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  resultBtnSecondary: { flex: 1, backgroundColor: "#1E293B", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  resultBtnSecondaryText: { color: "#94A3B8", fontWeight: "600", fontSize: 14 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: "700" },

  // Permission screen
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1E293B", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  permEmoji: { fontSize: 56, marginBottom: 20 },
  permTitle: { fontSize: 22, fontWeight: "800", color: "#FFFFFF", marginBottom: 12, textAlign: "center" },
  permBody: { fontSize: 14, color: "#94A3B8", textAlign: "center", lineHeight: 22, marginBottom: 28 },
  permBtn: { backgroundColor: "#166534", borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 12 },
  permBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  permBtnSecondary: { paddingVertical: 12 },
  permBtnSecondaryText: { color: "#64748B", fontSize: 14, textDecorationLine: "underline" },
  manualCard: { width: "100%", backgroundColor: "#111827", borderRadius: 14, padding: 16, marginTop: 16, gap: 10 },
  manualLabel: { fontSize: 13, color: "#94A3B8", marginBottom: 4 },
});
