import { createAudioPlayer, setAudioModeAsync, useAudioPlayerStatus } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSettings, RECITERS } from "@/lib/contexts/AppSettingsContext";
import { useQuranContext } from "@/lib/contexts/QuranContext";
import {
  fetchSurahWithTranslation,
  getAudioUrl,
  getTranslationEdition,
  type SurahDetail,
  type AyahWithTranslation,
} from "@/lib/services/QuranAPI";

export default function SurahDetailScreen() {
  const { surahNumber } = useLocalSearchParams<{ surahNumber: string }>();
  const num = parseInt(surahNumber || "1", 10);
  const { settings } = useAppSettings();
  const { addBookmark, removeBookmark, isBookmarked, setLastRead } = useQuranContext();

  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAyah, setCurrentAyah] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReciterPicker, setShowReciterPicker] = useState(false);

  const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    return () => {
      playerRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    const edition = getTranslationEdition(settings.language);
    fetchSurahWithTranslation(num, edition, settings.reciterId)
      .then((data) => {
        setSurah(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load surah. Check your connection.");
        setLoading(false);
      });
  }, [num, settings.language, settings.reciterId]);

  const playAyah = useCallback(async (ayahNumberInSurah: number) => {
    try {
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }
      const url = getAudioUrl(settings.reciterId, num, ayahNumberInSurah);
      const player = createAudioPlayer({ uri: url });
      playerRef.current = player;
      player.play();
      setCurrentAyah(ayahNumberInSurah);
      setIsPlaying(true);

      // Update last read
      if (surah) {
        await setLastRead({
          surahNumber: num,
          ayahNumber: ayahNumberInSurah,
          surahName: surah.englishName,
        });
      }

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      console.error("Audio error:", e);
    }
  }, [settings.reciterId, num, surah, setLastRead]);

  const togglePlayPause = useCallback(() => {
    if (!playerRef.current) {
      if (surah) playAyah(1);
      return;
    }
    if (isPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      playerRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, surah, playAyah]);

  const playNext = useCallback(() => {
    if (!surah || currentAyah === null) return;
    const next = currentAyah + 1;
    if (next <= surah.numberOfAyahs) {
      playAyah(next);
      flatListRef.current?.scrollToIndex({ index: next - 1, animated: true, viewPosition: 0.3 });
    }
  }, [currentAyah, surah, playAyah]);

  const playPrev = useCallback(() => {
    if (!surah || currentAyah === null) return;
    const prev = currentAyah - 1;
    if (prev >= 1) {
      playAyah(prev);
      flatListRef.current?.scrollToIndex({ index: prev - 1, animated: true, viewPosition: 0.3 });
    }
  }, [currentAyah, surah, playAyah]);

  const toggleBookmark = useCallback(async (ayahNum: number) => {
    if (!surah) return;
    if (isBookmarked(num, ayahNum)) {
      await removeBookmark(num, ayahNum);
    } else {
      await addBookmark({
        surahNumber: num,
        ayahNumber: ayahNum,
        surahName: surah.englishName,
        savedAt: Date.now(),
      });
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [surah, num, isBookmarked, addBookmark, removeBookmark]);

  const renderAyah = ({ item }: { item: AyahWithTranslation }) => {
    const ayahNum = item.arabic.numberInSurah;
    const isActive = currentAyah === ayahNum;
    const bookmarked = isBookmarked(num, ayahNum);

    return (
      <View style={[styles.ayahContainer, isActive && styles.ayahContainerActive]}>
        {/* Ayah number + actions */}
        <View style={styles.ayahHeader}>
          <View style={[styles.ayahBadge, isActive && styles.ayahBadgeActive]}>
            <Text style={[styles.ayahBadgeText, isActive && styles.ayahBadgeTextActive]}>
              {ayahNum}
            </Text>
          </View>
          <View style={styles.ayahActions}>
            <TouchableOpacity
              style={styles.ayahActionBtn}
              onPress={() => playAyah(ayahNum)}
            >
              <Text style={[styles.ayahActionIcon, isActive && styles.ayahActionIconActive]}>
                {isActive && isPlaying ? "⏸" : "▶"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ayahActionBtn}
              onPress={() => toggleBookmark(ayahNum)}
            >
              <Text style={[styles.ayahActionIcon, bookmarked && styles.bookmarkActive]}>
                {bookmarked ? "🔖" : "🏷"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Arabic text */}
        <Text style={[styles.arabicText, isActive && styles.arabicTextActive]}>
          {item.arabic.text}
        </Text>

        {/* Translation */}
        {item.translation?.text && (
          <Text style={styles.translationText}>{item.translation.text}</Text>
        )}
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
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              {surah ? (
                <>
                  <Text style={styles.surahArabicName}>{surah.name}</Text>
                  <Text style={styles.surahEnglishName}>{surah.englishName}</Text>
                  <Text style={styles.surahMeta}>
                    {surah.numberOfAyahs} Ayahs • {surah.revelationType}
                  </Text>
                </>
              ) : (
                <Text style={styles.surahEnglishName}>Loading...</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.reciterBtn}
              onPress={() => setShowReciterPicker(!showReciterPicker)}
            >
              <Text style={styles.reciterIcon}>🎙</Text>
            </TouchableOpacity>
          </View>

          {/* Reciter picker */}
          {showReciterPicker && (
            <View style={styles.reciterPicker}>
              {RECITERS.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.reciterItem,
                    settings.reciterId === r.id && styles.reciterItemActive,
                  ]}
                  onPress={() => {
                    // Update reciter via settings
                    setShowReciterPicker(false);
                  }}
                >
                  <Text style={[styles.reciterItemText, settings.reciterId === r.id && styles.reciterItemTextActive]}>
                    {r.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#4FC3F7" size="large" />
          <Text style={styles.loadingText}>Loading surah...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => {
            setError(null);
            setLoading(true);
            const edition = getTranslationEdition(settings.language);
            fetchSurahWithTranslation(num, edition, settings.reciterId)
              .then((data) => { setSurah(data); setLoading(false); })
              .catch(() => { setError("Failed to load surah."); setLoading(false); });
          }}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={surah?.ayahs || []}
          renderItem={renderAyah}
          keyExtractor={(item) => String(item.arabic.numberInSurah)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={() => {}}
          ListHeaderComponent={
            <View style={styles.bismillah}>
              {num !== 9 && (
                <Text style={styles.bismillahText}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
              )}
            </View>
          }
        />
      )}

      {/* Audio Player Bar */}
      {surah && (
        <View style={styles.playerBar}>
          <LinearGradient
            colors={["#0D0D20", "#12122A"]}
            style={styles.playerBarGradient}
          >
            <View style={styles.playerInfo}>
              <Text style={styles.playerSurahName} numberOfLines={1}>
                {surah.englishName}
              </Text>
              {currentAyah !== null && (
                <Text style={styles.playerAyahNum}>Ayah {currentAyah}</Text>
              )}
            </View>
            <View style={styles.playerControls}>
              <TouchableOpacity style={styles.playerBtn} onPress={playPrev}>
                <Text style={styles.playerBtnIcon}>⏮</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.playerPlayBtn} onPress={togglePlayPause}>
                <LinearGradient
                  colors={["#7C3AED", "#4FC3F7"]}
                  style={styles.playerPlayBtnGradient}
                >
                  <Text style={styles.playerPlayBtnIcon}>{isPlaying ? "⏸" : "▶"}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.playerBtn} onPress={playNext}>
                <Text style={styles.playerBtnIcon}>⏭</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
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
  surahArabicName: {
    fontSize: 24,
    color: "#F59E0B",
    fontWeight: "600",
  },
  surahEnglishName: {
    fontSize: 16,
    color: "#F0F0FF",
    fontWeight: "700",
  },
  surahMeta: { fontSize: 12, color: "#8B8BB0" },
  reciterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  reciterIcon: { fontSize: 20 },
  reciterPicker: {
    backgroundColor: "#12122A",
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    overflow: "hidden",
  },
  reciterItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C3A",
  },
  reciterItemActive: { backgroundColor: "rgba(124, 58, 237, 0.2)" },
  reciterItemText: { color: "#F0F0FF", fontSize: 14 },
  reciterItemTextActive: { color: "#7C3AED", fontWeight: "600" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: { color: "#8B8BB0", fontSize: 14 },
  errorText: { color: "#EF4444", fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  retryBtn: {
    backgroundColor: "rgba(124, 58, 237, 0.3)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#7C3AED",
  },
  retryBtnText: { color: "#F0F0FF", fontWeight: "600" },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  bismillah: {
    paddingVertical: 20,
    alignItems: "center",
  },
  bismillahText: {
    fontSize: 24,
    color: "#F59E0B",
    textAlign: "center",
    lineHeight: 40,
  },
  ayahContainer: {
    backgroundColor: "#12122A",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  ayahContainerActive: {
    borderColor: "#4FC3F7",
    backgroundColor: "rgba(79, 195, 247, 0.05)",
  },
  ayahHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ayahBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#1C1C3A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  ayahBadgeActive: {
    backgroundColor: "rgba(79, 195, 247, 0.2)",
    borderColor: "#4FC3F7",
  },
  ayahBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8B8BB0",
  },
  ayahBadgeTextActive: { color: "#4FC3F7" },
  ayahActions: {
    flexDirection: "row",
    gap: 8,
  },
  ayahActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#1C1C3A",
    alignItems: "center",
    justifyContent: "center",
  },
  ayahActionIcon: { fontSize: 14, color: "#8B8BB0" },
  ayahActionIconActive: { color: "#4FC3F7" },
  bookmarkActive: { color: "#F59E0B" },
  arabicText: {
    fontSize: 22,
    color: "#F0F0FF",
    textAlign: "right",
    lineHeight: 40,
    writingDirection: "rtl",
    marginBottom: 12,
    fontFamily: "System",
  },
  arabicTextActive: { color: "#F59E0B" },
  translationText: {
    fontSize: 14,
    color: "#8B8BB0",
    lineHeight: 22,
    borderTopWidth: 1,
    borderTopColor: "#2A2A4A",
    paddingTop: 10,
  },
  playerBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "#2A2A4A",
  },
  playerBarGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    gap: 16,
  },
  playerInfo: { flex: 1 },
  playerSurahName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F0F0FF",
  },
  playerAyahNum: {
    fontSize: 12,
    color: "#8B8BB0",
  },
  playerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1C1C3A",
    alignItems: "center",
    justifyContent: "center",
  },
  playerBtnIcon: { fontSize: 16, color: "#F0F0FF" },
  playerPlayBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  playerPlayBtnGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  playerPlayBtnIcon: { fontSize: 18, color: "#FFFFFF" },
});
