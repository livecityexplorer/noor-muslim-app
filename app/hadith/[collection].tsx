import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchHadithFromCollection, HADITH_COLLECTIONS, type HadithItem } from "@/lib/services/HadithAPI";

const COLLECTION_COLORS: Record<string, string> = {
  bukhari: "#F59E0B",
  muslim: "#4FC3F7",
  abudawud: "#7C3AED",
  tirmidhi: "#EC4899",
  nasai: "#22C55E",
  ibnmajah: "#8B5CF6",
  malik: "#F97316",
  riyadussalihin: "#06B6D4",
};

export default function HadithCollectionScreen() {
  const { collection } = useLocalSearchParams<{ collection: string }>();
  const [hadiths, setHadiths] = useState<HadithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const collectionInfo = HADITH_COLLECTIONS.find((c) => c.id === collection);
  const color = COLLECTION_COLORS[collection || ""] || "#7C3AED";

  const loadHadiths = useCallback(async (pageNum: number, append = false) => {
    if (!collection) return;
    try {
      const result = await fetchHadithFromCollection(collection, pageNum, 20);
      if (append) {
        setHadiths((prev) => [...prev, ...result.hadiths]);
      } else {
        setHadiths(result.hadiths);
      }
      setTotal(result.total);
    } catch {
      setError("Failed to load hadiths. Check your connection.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [collection]);

  useEffect(() => {
    loadHadiths(1);
  }, [loadHadiths]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || hadiths.length >= total) return;
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    loadHadiths(nextPage, true);
  }, [loadingMore, hadiths.length, total, page, loadHadiths]);

  const renderHadith = ({ item }: { item: HadithItem }) => (
    <View style={styles.hadithCard}>
      <View style={[styles.hadithNumberBadge, { backgroundColor: color + "20", borderColor: color + "40" }]}>
        <Text style={[styles.hadithNumber, { color }]}>#{item.hadithNumber}</Text>
      </View>
      {item.arab ? (
        <Text style={styles.arabicText}>{item.arab}</Text>
      ) : null}
      {item.en_text ? (
        <Text style={styles.hadithText}>{item.en_text}</Text>
      ) : (
        <Text style={styles.hadithTextMuted}>Translation not available</Text>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={color} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[color + "30", color + "10", "#0A0A1A"]}
        style={styles.header}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={[styles.headerTitle, { color }]}>{collectionInfo?.name || collection}</Text>
              {total > 0 && (
                <Text style={styles.headerSubtitle}>{total.toLocaleString()} Hadiths</Text>
              )}
            </View>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={color} size="large" />
          <Text style={styles.loadingText}>Loading hadiths...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { borderColor: color }]}
            onPress={() => {
              setError(null);
              setLoading(true);
              loadHadiths(1);
            }}
          >
            <Text style={[styles.retryBtnText, { color }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : hadiths.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No hadiths found for this collection.</Text>
          <Text style={styles.emptySubtext}>The API may be temporarily unavailable.</Text>
        </View>
      ) : (
        <FlatList
          data={hadiths}
          renderItem={renderHadith}
          keyExtractor={(item) => `${item.hadithNumber}-${item.id}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A1A" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 20, color: "#F0F0FF" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#8B8BB0",
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  loadingText: { color: "#8B8BB0", fontSize: 14 },
  errorText: { color: "#EF4444", fontSize: 14, textAlign: "center" },
  emptyText: { color: "#F0F0FF", fontSize: 16, fontWeight: "600", textAlign: "center" },
  emptySubtext: { color: "#8B8BB0", fontSize: 13, textAlign: "center" },
  retryBtn: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
  },
  retryBtnText: { fontWeight: "600" },
  listContent: { padding: 16, paddingBottom: 40 },
  separator: { height: 12 },
  hadithCard: {
    backgroundColor: "#12122A",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    gap: 10,
  },
  hadithNumberBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  hadithNumber: {
    fontSize: 12,
    fontWeight: "700",
  },
  arabicText: {
    fontSize: 18,
    color: "#F0F0FF",
    textAlign: "right",
    lineHeight: 32,
    writingDirection: "rtl",
    fontFamily: "System",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A4A",
    paddingBottom: 10,
  },
  hadithText: {
    fontSize: 14,
    color: "#8B8BB0",
    lineHeight: 22,
  },
  hadithTextMuted: {
    fontSize: 13,
    color: "#4A4A6A",
    fontStyle: "italic",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
