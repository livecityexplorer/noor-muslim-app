import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { fetchSurahList, type Surah } from "@/lib/services/QuranAPI";
import { useQuranContext } from "@/lib/contexts/QuranContext";
import { useAudioPlayer } from "@/lib/contexts/AudioPlayerContext";
import { useAppSettings } from "@/lib/contexts/AppSettingsContext";

export default function QuranScreen() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [filtered, setFiltered] = useState<Surah[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { lastRead } = useQuranContext();
  const { currentSurah, isPlaying, playSurah, togglePlayPause } = useAudioPlayer();
  const { settings } = useAppSettings();

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

  const handlePlaySurah = (item: Surah) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const isCurrentlyPlaying =
      currentSurah?.surahNumber === item.number && isPlaying;
    const isCurrentlyLoaded = currentSurah?.surahNumber === item.number;

    if (isCurrentlyLoaded) {
      togglePlayPause();
    } else {
      playSurah({
        surahNumber: item.number,
        surahName: item.englishName,
        surahArabicName: item.name,
        reciterId: settings.reciterId,
        totalSurahs: 114,
      });
    }
  };

  const renderSurah = ({ item }: { item: Surah }) => {
    const isLastRead = lastRead?.surahNumber === item.number;
    const isCurrentlyLoaded = currentSurah?.surahNumber === item.number;
    const isCurrentlyPlaying = isCurrentlyLoaded && isPlaying;

    return (
      <View style={[styles.surahRow, isLastRead && styles.surahRowHighlighted]}>
        {/* Tap row → navigate to detail */}
        <TouchableOpacity
          style={styles.surahRowContent}
          onPress={() => router.push(`/quran/${item.number}` as any)}
        >
          <View style={[styles.surahNumber, isCurrentlyLoaded && styles.surahNumberActive]}>
            {isCurrentlyPlaying ? (
              <Text style={styles.playingIndicator}>♪</Text>
            ) : (
              <Text style={[styles.surahNumberText, isCurrentlyLoaded && styles.surahNumberTextActive]}>
                {item.number}
              </Text>
            )}
          </View>
          <View style={styles.surahInfo}>
            <Text style={[styles.surahEnglishName, isCurrentlyLoaded && styles.surahEnglishNameActive]}>
              {item.englishName}
            </Text>
            <Text style={styles.surahMeta}>
              {item.englishNameTranslation} • {item.numberOfAyahs} Ayahs • {item.revelationType}
            </Text>
          </View>
          <Text style={styles.surahArabicName}>{item.name}</Text>
        </TouchableOpacity>

        {/* Play button on the right */}
        <TouchableOpacity
          style={[styles.playBtn, isCurrentlyLoaded && styles.playBtnActive]}
          onPress={() => handlePlaySurah(item)}
        >
          <Text style={[styles.playBtnIcon, isCurrentlyLoaded && styles.playBtnIconActive]}>
            {isCurrentlyPlaying ? "⏸" : "▶"}
          </Text>
        </TouchableOpacity>
      </View>
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

      {/* Currently playing banner */}
      {currentSurah && (
        <TouchableOpacity
          style={styles.nowPlayingBanner}
          onPress={() => router.push(`/quran/${currentSurah.surahNumber}` as any)}
        >
          <Text style={styles.nowPlayingIcon}>{isPlaying ? "🔊" : "⏸"}</Text>
          <Text style={styles.nowPlayingText} numberOfLines={1}>
            {isPlaying ? "Now Playing: " : "Paused: "}
            {currentSurah.surahName}
          </Text>
        </TouchableOpacity>
      )}

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
  nowPlayingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.4)",
    gap: 8,
  },
  nowPlayingIcon: { fontSize: 16 },
  nowPlayingText: {
    flex: 1,
    color: "#C4B5FD",
    fontSize: 13,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: "#8B8BB0", fontSize: 14 },
  errorText: { color: "#EF4444", fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  separator: { height: 1, backgroundColor: "#1C1C3A" },
  surahRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  surahRowHighlighted: {
    backgroundColor: "rgba(79, 195, 247, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  surahRowContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 14,
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
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    borderColor: "#7C3AED",
  },
  surahNumberText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8B8BB0",
  },
  surahNumberTextActive: { color: "#C4B5FD" },
  playingIndicator: {
    fontSize: 16,
    color: "#7C3AED",
  },
  surahInfo: { flex: 1 },
  surahEnglishName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F0F0FF",
    marginBottom: 2,
  },
  surahEnglishNameActive: { color: "#C4B5FD" },
  surahMeta: {
    fontSize: 12,
    color: "#8B8BB0",
  },
  surahArabicName: {
    fontSize: 20,
    color: "#F59E0B",
    fontWeight: "500",
    marginRight: 8,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#12122A",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  playBtnActive: {
    backgroundColor: "rgba(124, 58, 237, 0.25)",
    borderColor: "#7C3AED",
  },
  playBtnIcon: {
    fontSize: 14,
    color: "#8B8BB0",
  },
  playBtnIconActive: { color: "#C4B5FD" },
});
