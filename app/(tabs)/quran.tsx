import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchSurahList, type Surah } from "@/lib/services/QuranAPI";
import { useQuranContext } from "@/lib/contexts/QuranContext";

export default function QuranScreen() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [filtered, setFiltered] = useState<Surah[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { lastRead } = useQuranContext();

  useEffect(() => {
    fetchSurahList()
      .then((list) => {
        setSurahs(list);
        setFiltered(list);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load Quran. Check your connection.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(surahs);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        surahs.filter(
          (s) =>
            s.englishName.toLowerCase().includes(q) ||
            s.name.includes(search) ||
            String(s.number).includes(q) ||
            s.englishNameTranslation.toLowerCase().includes(q)
        )
      );
    }
  }, [search, surahs]);

  const renderSurah = ({ item }: { item: Surah }) => {
    const isLastRead = lastRead?.surahNumber === item.number;
    return (
      <TouchableOpacity
        style={[styles.surahItem, isLastRead && styles.surahItemHighlighted]}
        onPress={() => router.push(`/quran/${item.number}` as any)}
      >
        <View style={[styles.surahNumber, isLastRead && styles.surahNumberActive]}>
          <Text style={[styles.surahNumberText, isLastRead && styles.surahNumberTextActive]}>
            {item.number}
          </Text>
        </View>
        <View style={styles.surahInfo}>
          <Text style={styles.surahEnglishName}>{item.englishName}</Text>
          <Text style={styles.surahMeta}>
            {item.englishNameTranslation} • {item.numberOfAyahs} Ayahs • {item.revelationType}
          </Text>
        </View>
        <Text style={styles.surahArabicName}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#001A3A", "#0D1B4A", "#0A0A1A"]}
        style={styles.header}
      >
        <View style={styles.decorCircle} />
        <SafeAreaView edges={["top"]}>
          <Text style={styles.headerTitle}>القرآن الكريم</Text>
          <Text style={styles.headerSubtitle}>The Holy Quran</Text>
          {lastRead && (
            <TouchableOpacity
              style={styles.continueReading}
              onPress={() => router.push(`/quran/${lastRead.surahNumber}` as any)}
            >
              <Text style={styles.continueReadingText}>
                ▶ Continue: {lastRead.surahName} — Ayah {lastRead.ayahNumber}
              </Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Surah..."
          placeholderTextColor="#4A4A6A"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#4FC3F7" size="large" />
          <Text style={styles.loadingText}>Loading Quran...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderSurah}
          keyExtractor={(item) => String(item.number)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A1A" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    overflow: "hidden",
  },
  decorCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(79, 195, 247, 0.15)",
    top: -60,
    right: -40,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#F59E0B",
    textAlign: "center",
    paddingTop: 8,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#8B8BB0",
    textAlign: "center",
    marginBottom: 12,
  },
  continueReading: {
    backgroundColor: "rgba(79, 195, 247, 0.15)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(79, 195, 247, 0.3)",
  },
  continueReadingText: {
    color: "#4FC3F7",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#12122A",
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    color: "#F0F0FF",
    fontSize: 15,
    padding: 0,
  },
  clearIcon: { color: "#4A4A6A", fontSize: 16 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: "#8B8BB0", fontSize: 14 },
  errorText: { color: "#EF4444", fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  separator: { height: 1, backgroundColor: "#1C1C3A" },
  surahItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 14,
  },
  surahItemHighlighted: {
    backgroundColor: "rgba(79, 195, 247, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  surahNumber: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#12122A",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    alignItems: "center",
    justifyContent: "center",
  },
  surahNumberActive: {
    backgroundColor: "rgba(79, 195, 247, 0.15)",
    borderColor: "#4FC3F7",
  },
  surahNumberText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8B8BB0",
  },
  surahNumberTextActive: { color: "#4FC3F7" },
  surahInfo: { flex: 1 },
  surahEnglishName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F0F0FF",
    marginBottom: 2,
  },
  surahMeta: {
    fontSize: 12,
    color: "#8B8BB0",
  },
  surahArabicName: {
    fontSize: 20,
    color: "#F59E0B",
    fontWeight: "500",
  },
});
