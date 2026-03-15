import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  getScanHistory,
  clearHistory,
  removeFromHistory,
  ScanHistoryItem,
} from "@/lib/services/HalalScannerAPI";
import { HalalStatus } from "@/lib/data/halalIngredients";

function StatusBadge({ status }: { status: HalalStatus }) {
  const cfg = {
    halal: { bg: "#1B4332", text: "#4ADE80", label: "HALAL", icon: "✅" },
    haram: { bg: "#450A0A", text: "#F87171", label: "HARAM", icon: "❌" },
    mushbooh: { bg: "#431407", text: "#FB923C", label: "MUSHBOOH", icon: "⚠️" },
    unknown: { bg: "#1C1C2E", text: "#94A3B8", label: "UNKNOWN", icon: "❓" },
  }[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.icon} {cfg.label}</Text>
    </View>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<HalalStatus | "all">("all");

  const loadHistory = useCallback(async () => {
    const data = await getScanHistory();
    setHistory(data);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  const handleClearAll = () => {
    Alert.alert("Clear History", "Are you sure you want to clear all scan history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All", style: "destructive",
        onPress: async () => { await clearHistory(); setHistory([]); },
      },
    ]);
  };

  const handleRemove = async (id: string) => {
    await removeFromHistory(id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const filtered = filter === "all" ? history : history.filter((h) => h.overallStatus === filter);

  const renderItem = ({ item }: { item: ScanHistoryItem }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
      onPress={() => router.push(`/scanner/product/${item.barcode}` as any)}
    >
      <View style={styles.cardLeft}>
        <View style={styles.cardIcon}><Text style={{ fontSize: 24 }}>🛒</Text></View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardName} numberOfLines={1}>{item.productName}</Text>
        <Text style={styles.cardBrand} numberOfLines={1}>{item.brand}</Text>
        <View style={styles.cardFooter}>
          <StatusBadge status={item.overallStatus} />
          <Text style={styles.cardTime}>{formatTime(item.scannedAt)}</Text>
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.6 }]}
        onPress={() => handleRemove(item.id)}
      >
        <IconSymbol name="xmark" size={16} color="#64748B" />
      </Pressable>
    </Pressable>
  );

  return (
    <ScreenContainer containerClassName="bg-[#0A0A1A]" safeAreaClassName="bg-[#0A0A1A]">
      <View style={styles.header}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Scan History</Text>
        {history.length > 0 ? (
          <Pressable style={({ pressed }) => [pressed && { opacity: 0.6 }]} onPress={handleClearAll}>
            <Text style={styles.clearBtn}>Clear</Text>
          </Pressable>
        ) : <View style={{ width: 40 }} />}
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {(["all", "halal", "haram", "mushbooh", "unknown"] as const).map((f) => (
          <Pressable
            key={f}
            style={({ pressed }) => [styles.filterChip, filter === f && styles.filterChipActive, pressed && { opacity: 0.8 }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>{history.length === 0 ? "No scans yet" : "No results"}</Text>
          <Text style={styles.emptyBody}>{history.length === 0 ? "Your scan history will appear here" : "No scans match this filter"}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ADE80" />}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1E293B", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  clearBtn: { fontSize: 14, color: "#F87171", fontWeight: "600" },
  filters: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#1E293B" },
  filterChipActive: { backgroundColor: "#166534" },
  filterChipText: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },
  filterChipTextActive: { color: "#FFFFFF" },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  card: { flexDirection: "row", backgroundColor: "#111827", borderRadius: 14, marginBottom: 10, padding: 14, alignItems: "center", gap: 12 },
  cardLeft: {},
  cardIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#1E293B", alignItems: "center", justifyContent: "center" },
  cardContent: { flex: 1, gap: 4 },
  cardName: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  cardBrand: { fontSize: 12, color: "#94A3B8" },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  cardTime: { fontSize: 11, color: "#4A5568" },
  removeBtn: { padding: 8 },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF", marginBottom: 8 },
  emptyBody: { fontSize: 14, color: "#94A3B8", textAlign: "center" },
});
