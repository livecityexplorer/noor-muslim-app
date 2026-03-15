import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { searchProducts, analyzeProduct, OpenFoodFactsProduct } from "@/lib/services/HalalScannerAPI";
import { HalalStatus } from "@/lib/data/halalIngredients";

interface SearchResult {
  product: OpenFoodFactsProduct;
  status: HalalStatus;
  summary: string;
}

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

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const products = await searchProducts(searchQuery.trim());
      const analyzed: SearchResult[] = products.map((p) => {
        const analysis = analyzeProduct(p);
        return { product: p, status: analysis.overallStatus, summary: analysis.summary };
      });
      setResults(analyzed);
      // Save to recent searches
      setRecentSearches((prev) => {
        const updated = [searchQuery.trim(), ...prev.filter((s) => s !== searchQuery.trim())].slice(0, 8);
        return updated;
      });
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  const renderItem = ({ item }: { item: SearchResult }) => (
    <Pressable
      style={({ pressed }) => [styles.resultCard, pressed && { opacity: 0.75 }]}
      onPress={() => router.push(`/scanner/product/${item.product.code}` as any)}
    >
      <View style={styles.resultImageContainer}>
        {item.product.image_front_url ? (
          <Image source={{ uri: item.product.image_front_url }} style={styles.resultImage} />
        ) : (
          <View style={styles.resultImagePlaceholder}>
            <Text style={{ fontSize: 28 }}>🛒</Text>
          </View>
        )}
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={2}>
          {item.product.product_name || "Unknown Product"}
        </Text>
        <Text style={styles.resultBrand} numberOfLines={1}>
          {item.product.brands || "Unknown Brand"}
        </Text>
        <Text style={styles.resultSummary} numberOfLines={2}>{item.summary}</Text>
        <StatusBadge status={item.status} />
      </View>
    </Pressable>
  );

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
        <Text style={styles.headerTitle}>Search Products</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <IconSymbol name="magnifyingglass" size={20} color="#64748B" />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by product name or brand..."
          placeholderTextColor="#4A5568"
          returnKeyType="search"
          onSubmitEditing={() => handleSearch(query)}
          autoFocus
        />
        {query.length > 0 && (
          <Pressable onPress={() => { setQuery(""); setResults([]); setSearched(false); }}>
            <IconSymbol name="xmark.circle.fill" size={20} color="#64748B" />
          </Pressable>
        )}
      </View>

      {/* Search Button */}
      <View style={styles.searchBtnContainer}>
        <Pressable
          style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.8 }, loading && { opacity: 0.5 }]}
          onPress={() => handleSearch(query)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.searchBtnText}>Search</Text>
          )}
        </Pressable>
      </View>

      {/* Recent Searches */}
      {!searched && recentSearches.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recent Searches</Text>
          {recentSearches.map((s) => (
            <Pressable
              key={s}
              style={({ pressed }) => [styles.recentItem, pressed && { opacity: 0.7 }]}
              onPress={() => { setQuery(s); handleSearch(s); }}
            >
              <IconSymbol name="clock.fill" size={16} color="#64748B" />
              <Text style={styles.recentItemText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Results */}
      {searched && !loading && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {results.length > 0 ? `${results.length} products found` : "No products found"}
          </Text>
        </View>
      )}

      {searched && !loading && results.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptyBody}>Try a different search term or scan the barcode directly</Text>
          <Pressable
            style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.8 }]}
            onPress={() => router.push("/scanner/scan" as any)}
          >
            <Text style={styles.emptyBtnText}>Scan Barcode</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.product.code}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, backgroundColor: "#0A0A1A" },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1E293B", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#111827", borderRadius: 14, marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: "#1E293B" },
  searchInput: { flex: 1, color: "#FFFFFF", fontSize: 15 },
  searchBtnContainer: { paddingHorizontal: 20, marginTop: 10 },
  searchBtn: { backgroundColor: "#166534", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  searchBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  recentSection: { paddingHorizontal: 20, marginTop: 20 },
  recentTitle: { fontSize: 14, fontWeight: "700", color: "#64748B", marginBottom: 10 },
  recentItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#1E293B" },
  recentItemText: { fontSize: 14, color: "#CBD5E1" },
  resultsHeader: { paddingHorizontal: 20, paddingVertical: 12 },
  resultsCount: { fontSize: 13, color: "#64748B" },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },
  resultCard: { flexDirection: "row", backgroundColor: "#111827", borderRadius: 14, marginBottom: 12, overflow: "hidden" },
  resultImageContainer: { width: 90, height: 90 },
  resultImage: { width: 90, height: 90, resizeMode: "cover" },
  resultImagePlaceholder: { width: 90, height: 90, backgroundColor: "#1E293B", alignItems: "center", justifyContent: "center" },
  resultInfo: { flex: 1, padding: 12, gap: 4 },
  resultName: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  resultBrand: { fontSize: 12, color: "#94A3B8" },
  resultSummary: { fontSize: 11, color: "#64748B", lineHeight: 16 },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginTop: 4 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF", marginBottom: 8 },
  emptyBody: { fontSize: 14, color: "#94A3B8", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  emptyBtn: { backgroundColor: "#166534", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  emptyBtnText: { color: "#FFFFFF", fontWeight: "700" },
});
