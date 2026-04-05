import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getScanHistory, ScanHistoryItem } from "@/lib/services/HalalScannerAPI";
import { INGREDIENT_DATABASE } from "@/lib/data/halalIngredients";
import { HalalStatus } from "@/lib/data/halalIngredients";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_INSIGHTS = [
  { title: "Did You Know?", body: "Carmine (E120) is made from crushed cochineal insects and is Haram." },
  { title: "Ingredient Alert", body: "Gelatin without source specification is Mushbooh — always check the source." },
  { title: "Hidden Haram", body: "'Natural flavors' can hide animal-derived or alcohol-based ingredients." },
  { title: "Tip", body: "Look for IFANCA, HFA, MUI, or JAKIM logos to identify Halal-certified products." },
  { title: "Did You Know?", body: "L-Cysteine (E920) in bread may be derived from human hair or hog hair." },
  { title: "Ramadan Tip", body: "Check your dates and dried fruits — some are coated with shellac (E904) from insects." },
  { title: "Ingredient Alert", body: "Mono- and diglycerides (E471) may be pork-derived. Look for plant-based versions." },
];

const INGREDIENT_OF_DAY = INGREDIENT_DATABASE[Math.floor(Date.now() / 86400000) % INGREDIENT_DATABASE.length];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, small }: { status: HalalStatus; small?: boolean }) {
  const config = {
    halal: { bg: "#1B4332", text: "#4ADE80", label: "HALAL", icon: "✅" },
    haram: { bg: "#450A0A", text: "#F87171", label: "HARAM", icon: "❌" },
    mushbooh: { bg: "#431407", text: "#FB923C", label: "MUSHBOOH", icon: "⚠️" },
    unknown: { bg: "#1C1C2E", text: "#94A3B8", label: "UNKNOWN", icon: "❓" },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, small && styles.badgeSmall]}>
      <Text style={[styles.badgeText, { color: config.text }, small && styles.badgeTextSmall]}>
        {config.icon} {config.label}
      </Text>
    </View>
  );
}

// ─── Recent Scan Card ─────────────────────────────────────────────────────────

function RecentScanCard({ item, onPress }: { item: ScanHistoryItem; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.recentCard, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      <View style={styles.recentImagePlaceholder}>
        <Text style={styles.recentImageEmoji}>🛒</Text>
      </View>
      <Text style={styles.recentName} numberOfLines={2}>{item.productName}</Text>
      <StatusBadge status={item.overallStatus} small />
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ScannerHomeScreen() {
  const router = useRouter();
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const todayInsight = DAILY_INSIGHTS[new Date().getDay()];

  const loadHistory = useCallback(async () => {
    const history = await getScanHistory();
    setRecentScans(history.slice(0, 10));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  return (
    <ScreenContainer containerClassName="bg-[#0A0A1A]" safeAreaClassName="bg-[#0A0A1A]">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ADE80" />}
      >
        {/* Header */}
        <LinearGradient
          colors={["#0D2B1A", "#0A0A1A"]}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Halal Scanner</Text>
              <Text style={styles.headerSubtitle}>Know what you eat</Text>
            </View>
            <View style={styles.headerIcon}>
              <Text style={{ fontSize: 28 }}>🔍</Text>
            </View>
          </View>

          {/* Welcome Banner */}
          <View style={styles.welcomeBanner}>
            <Text style={styles.welcomeQuote}>
              "And eat of what Allah has provided for you, lawful and good."
            </Text>
            <Text style={styles.welcomeRef}>— Quran 5:88</Text>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <Pressable
              style={({ pressed }) => [pressed && { opacity: 0.75 }]}
              onPress={() => router.push("/scanner/scan")}
            >
              <LinearGradient colors={["#10B981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickActionLarge}>
                <View style={styles.quickActionContent}>
                  <Text style={styles.quickActionEmoji}>📱</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quickActionTitle}>Scan Barcode</Text>
                    <Text style={styles.quickActionSub}>Quick scan</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={({ pressed }) => [pressed && { opacity: 0.75 }]}
              onPress={() => router.push("/scanner/search")}
            >
              <LinearGradient colors={["#3B82F6", "#1D4ED8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickActionLarge}>
                <View style={styles.quickActionContent}>
                  <Text style={styles.quickActionEmoji}>🔍</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quickActionTitle}>Search Products</Text>
                    <Text style={styles.quickActionSub}>Find by name</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={({ pressed }) => [pressed && { opacity: 0.75 }]}
              onPress={() => router.push("/scanner/ingredients")}
            >
              <LinearGradient colors={["#F59E0B", "#D97706"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickActionSmall}>
                <View style={styles.quickActionContent}>
                  <Text style={styles.quickActionEmoji}>📖</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quickActionTitle}>Ingredients</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={({ pressed }) => [pressed && { opacity: 0.75 }]}
              onPress={() => router.push("/scanner/learn")}
            >
              <LinearGradient colors={["#8B5CF6", "#6D28D9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickActionSmall}>
                <View style={styles.quickActionContent}>
                  <Text style={styles.quickActionEmoji}>📚</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quickActionTitle}>Learn Halal</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        {/* Today's Insight */}
        <View style={styles.section}>
          <LinearGradient colors={["#0D2B1A", "#0F172A"]} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightIcon}>💡</Text>
              <Text style={styles.insightTitle}>{todayInsight.title}</Text>
            </View>
            <Text style={styles.insightBody}>{todayInsight.body}</Text>
          </LinearGradient>
        </View>

        {/* Ingredient of the Day */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredient of the Day</Text>
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.8 }]}
            onPress={() => router.push(`/scanner/ingredient/${INGREDIENT_OF_DAY.id}`)}
          >
            <View style={styles.ingredientOfDay}>
              <View style={styles.ingredientOfDayLeft}>
                <Text style={styles.ingredientOfDayName}>{INGREDIENT_OF_DAY.name}</Text>
                {INGREDIENT_OF_DAY.eNumbers.length > 0 && (
                  <Text style={styles.ingredientOfDayEnum}>{INGREDIENT_OF_DAY.eNumbers.join(", ")}</Text>
                )}
                <Text style={styles.ingredientOfDayDesc} numberOfLines={2}>
                  {INGREDIENT_OF_DAY.shortDescription}
                </Text>
              </View>
              <View style={styles.ingredientOfDayRight}>
                <StatusBadge status={INGREDIENT_OF_DAY.status} small />
                <Text style={styles.ingredientLearnMore}>Learn more →</Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Recent Scans */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            {recentScans.length > 0 && (
              <Pressable onPress={() => router.push("/scanner/history")}>
                <Text style={styles.seeAll}>View All</Text>
              </Pressable>
            )}
          </View>

          {recentScans.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🛒</Text>
              <Text style={styles.emptyTitle}>No scans yet</Text>
              <Text style={styles.emptyBody}>Scan your first product to start building your Halal knowledge</Text>
              <Pressable
                style={({ pressed }) => [styles.emptyButton, pressed && { opacity: 0.8 }]}
                onPress={() => router.push("/scanner/scan")}
              >
                <Text style={styles.emptyButtonText}>Scan Now</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={recentScans}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <RecentScanCard
                  item={item}
                  onPress={() => router.push(`/scanner/product/${item.barcode}`)}
                />
              )}
              contentContainerStyle={{ paddingRight: 16 }}
            />
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{recentScans.length}</Text>
              <Text style={styles.statLabel}>Products Scanned</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: "#4ADE80" }]}>
                {recentScans.filter((s) => s.overallStatus === "halal").length}
              </Text>
              <Text style={styles.statLabel}>Halal Found</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: "#F87171" }]}>
                {recentScans.filter((s) => s.overallStatus === "haram").length}
              </Text>
              <Text style={styles.statLabel}>Haram Found</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: "#FB923C" }]}>
                {recentScans.filter((s) => s.overallStatus === "mushbooh").length}
              </Text>
              <Text style={styles.statLabel}>Mushbooh</Text>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ This app is for educational purposes only. Always verify with trusted scholars and certified Halal bodies. When in doubt, abstain.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#0A0A1A" },
  scrollContent: { paddingBottom: 120 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#FFFFFF" },
  headerSubtitle: { fontSize: 13, color: "#4ADE80", marginTop: 2 },
  headerIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#1B4332", alignItems: "center", justifyContent: "center" },
  welcomeBanner: { backgroundColor: "#0D2B1A", borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: "#4ADE80" },
  welcomeQuote: { fontSize: 13, color: "#D1FAE5", fontStyle: "italic", lineHeight: 20 },
  welcomeRef: { fontSize: 11, color: "#4ADE80", marginTop: 4, fontWeight: "600" },
  section: { paddingHorizontal: 20, marginTop: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", marginBottom: 12 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  seeAll: { fontSize: 13, color: "#4ADE80", fontWeight: "600" },
  quickActionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 },
  quickActionLarge: { width: "48%", borderRadius: 14, padding: 14, height: 105, justifyContent: "space-between", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  quickActionSmall: { width: "48%", borderRadius: 14, padding: 14, height: 105, justifyContent: "space-between", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  quickActionEmoji: { fontSize: 24 },
  quickActionTitle: { fontSize: 13, fontWeight: "700", color: "#FFFFFF", lineHeight: 16 },
  quickActionSub: { fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  insightCard: { borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  insightHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  insightIcon: { fontSize: 18, marginRight: 8 },
  insightTitle: { fontSize: 14, fontWeight: "700", color: "#4ADE80" },
  insightBody: { fontSize: 13, color: "#CBD5E1", lineHeight: 20 },
  ingredientOfDay: { backgroundColor: "#111827", borderRadius: 14, padding: 14, flexDirection: "row", gap: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  ingredientOfDayLeft: { flex: 1 },
  ingredientOfDayRight: { alignItems: "flex-end", justifyContent: "space-between" },
  ingredientOfDayName: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", marginBottom: 2 },
  ingredientOfDayEnum: { fontSize: 11, color: "#94A3B8", marginBottom: 6 },
  ingredientOfDayDesc: { fontSize: 12, color: "#94A3B8", lineHeight: 18 },
  ingredientLearnMore: { fontSize: 11, color: "#4ADE80", marginTop: 8 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeSmall: { paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  badgeTextSmall: { fontSize: 10 },
  recentCard: { width: 110, backgroundColor: "#111827", borderRadius: 12, padding: 9, marginRight: 10, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  recentImagePlaceholder: { width: 60, height: 60, borderRadius: 10, backgroundColor: "#1E293B", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  recentImageEmoji: { fontSize: 28 },
  recentName: { fontSize: 11, color: "#E2E8F0", textAlign: "center", marginBottom: 6, lineHeight: 15 },
  emptyState: { backgroundColor: "#111827", borderRadius: 16, padding: 28, alignItems: "center" },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", marginBottom: 6 },
  emptyBody: { fontSize: 13, color: "#94A3B8", textAlign: "center", lineHeight: 20, marginBottom: 16 },
  emptyButton: { backgroundColor: "#166534", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  emptyButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  statsGrid: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: "#111827", borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  quickActionContent: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  statNumber: { fontSize: 22, fontWeight: "800", color: "#FFFFFF" },
  statLabel: { fontSize: 9, color: "#64748B", marginTop: 3, textAlign: "center", lineHeight: 13 },
  disclaimer: { marginHorizontal: 20, marginTop: 20, backgroundColor: "#1C1917", borderRadius: 10, padding: 12 },
  disclaimerText: { fontSize: 11, color: "#78716C", lineHeight: 17, textAlign: "center" },
});
