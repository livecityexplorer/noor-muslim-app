import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { INGREDIENT_DATABASE, HalalStatus } from "@/lib/data/halalIngredients";

function StatusBadge({ status }: { status: HalalStatus }) {
  const cfg = {
    halal: { bg: "#1B4332", text: "#4ADE80", label: "HALAL" },
    haram: { bg: "#450A0A", text: "#F87171", label: "HARAM" },
    mushbooh: { bg: "#431407", text: "#FB923C", label: "MUSHBOOH" },
    unknown: { bg: "#1C1C2E", text: "#94A3B8", label: "UNKNOWN" },
  }[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

export default function IngredientsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<HalalStatus | "all">("all");

  const filtered = useMemo(() => {
    let list = INGREDIENT_DATABASE;
    if (filter !== "all") list = list.filter((i) => i.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.eNumbers.some((e) => e.toLowerCase().includes(q)) ||
          i.otherNames.some((n) => n.toLowerCase().includes(q)) ||
          i.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [query, filter]);

  return (
    <ScreenContainer containerClassName="bg-[#0A0A1A]" safeAreaClassName="bg-[#0A0A1A]">
      <View style={styles.header}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Ingredient Guide</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <IconSymbol name="magnifyingglass" size={18} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search ingredients or E-numbers..."
          placeholderTextColor="#4A5568"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")}>
            <IconSymbol name="xmark.circle.fill" size={18} color="#64748B" />
          </Pressable>
        )}
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
              {f === "all" ? `All (${INGREDIENT_DATABASE.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.resultCount}>{filtered.length} ingredient{filtered.length !== 1 ? "s" : ""}</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
            onPress={() => router.push(`/scanner/ingredient/${item.id}` as any)}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.cardName}>{item.name}</Text>
              {item.eNumbers.length > 0 && (
                <Text style={styles.cardEnum}>{item.eNumbers.join(", ")}</Text>
              )}
              <Text style={styles.cardCategory}>{item.category}</Text>
            </View>
            <View style={styles.cardRight}>
              <StatusBadge status={item.status} />
              <IconSymbol name="chevron.right" size={16} color="#4A5568" style={{ marginTop: 8 }} />
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No ingredients found</Text>
            <Text style={styles.emptyBody}>Try a different search term or filter</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1E293B", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#111827", borderRadius: 12, marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 11, gap: 10, borderWidth: 1, borderColor: "#1E293B", marginBottom: 12 },
  searchInput: { flex: 1, color: "#FFFFFF", fontSize: 14 },
  filters: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#1E293B" },
  filterChipActive: { backgroundColor: "#166534" },
  filterChipText: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },
  filterChipTextActive: { color: "#FFFFFF" },
  resultCount: { fontSize: 12, color: "#4A5568", paddingHorizontal: 20, marginBottom: 8 },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  card: { flexDirection: "row", backgroundColor: "#111827", borderRadius: 12, marginBottom: 8, padding: 14, alignItems: "center" },
  cardLeft: { flex: 1 },
  cardRight: { alignItems: "flex-end" },
  cardName: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  cardEnum: { fontSize: 12, color: "#4ADE80", marginTop: 2 },
  cardCategory: { fontSize: 11, color: "#64748B", marginTop: 4, textTransform: "capitalize" },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  empty: { alignItems: "center", justifyContent: "center", padding: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", marginBottom: 6 },
  emptyBody: { fontSize: 13, color: "#94A3B8", textAlign: "center" },
});
