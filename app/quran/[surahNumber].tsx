import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSettings, RECITERS } from "@/lib/contexts/AppSettingsContext";
import { useQuranContext } from "@/lib/contexts/QuranContext";
import { useAudioPlayer } from "@/lib/contexts/AudioPlayerContext";
import {
  fetchSurahWithTranslation,
  getTranslationEdition,
  type SurahDetail,
  type AyahWithTranslation,
} from "@/lib/services/QuranAPI";

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function SurahDetailScreen() {
  const { surahNumber } = useLocalSearchParams<{ surahNumber: string }>();
  const num = parseInt(surahNumber || "1", 10);
  const { settings, updateSettings } = useAppSettings();
  const { addBookmark, removeBookmark, isBookmarked, setLastRead } = useQuranContext();
  const {
    currentSurah,
    isPlaying,
    currentTime,
    duration,
    isLoading: audioLoading,
    playSurah,
    togglePlayPause,
    playNext,
    playPrev,
    seekTo,
  } = useAudioPlayer();

  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const isThisSurahLoaded = currentSurah?.surahNumber === num;
  const isThisSurahPlaying = isThisSurahLoaded && isPlaying;

  useEffect(() => {
    const edition = getTranslationEdition(settings.language);
    fetchSurahWithTranslation(num, edition, settings.reciterId)
      .then((data) => {
        setSurah(data);
        setLoading(false);
        // Update last read to this surah
        setLastRead({
          surahNumber: num,
          ayahNumber: 1,
          surahName: data.englishName,
        });
      })
      .catch(() => {
        setError("Failed to load surah. Check your connection.");
        setLoading(false);
      });
  }, [num, settings.language, settings.reciterId]);

  const handlePlayPause = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (isThisSurahLoaded) {
      togglePlayPause();
    } else if (surah) {
      playSurah({
        surahNumber: num,
        surahName: surah.englishName,
        surahArabicName: surah.name,
        reciterId: settings.reciterId,
        totalSurahs: 114,
      });
    }
  }, [isThisSurahLoaded, togglePlayPause, playSurah, surah, num, settings.reciterId]);

  const handleSeek = useCallback((direction: "forward" | "backward") => {
    if (!isThisSurahLoaded) return;
    const delta = direction === "forward" ? 15 : -15;
    const newTime = Math.max(0, Math.min(currentTime + delta, duration));
    seekTo(newTime);
  }, [isThisSurahLoaded, currentTime, duration, seekTo]);

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

  const handleSelectReciter = useCallback(async (reciterId: string) => {
    await updateSettings({ reciterId });
    setShowReciterPicker(false);
    // If this surah is currently playing, restart with new reciter
    if (isThisSurahLoaded && surah) {
      playSurah({
        surahNumber: num,
        surahName: surah.englishName,
        surahArabicName: surah.name,
        reciterId,
        totalSurahs: 114,
      });
    }
  }, [updateSettings, isThisSurahLoaded, surah, num, playSurah]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const renderAyah = ({ item }: { item: AyahWithTranslation }) => {
    const ayahNum = item.arabic.numberInSurah;
    const bookmarked = isBookmarked(num, ayahNum);

    return (
      <View style={styles.ayahContainer}>
        {/* Ayah number + bookmark */}
        <View style={styles.ayahHeader}>
          <View style={styles.ayahBadge}>
            <Text style={styles.ayahBadgeText}>{ayahNum}</Text>
          </View>
          <TouchableOpacity
            style={styles.ayahActionBtn}
            onPress={() => toggleBookmark(ayahNum)}
          >
            <Text style={[styles.ayahActionIcon, bookmarked && styles.bookmarkActive]}>
              {bookmarked ? "🔖" : "🏷"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Arabic text */}
        <Text style={styles.arabicText}>{item.arabic.text}</Text>

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
                  onPress={() => handleSelectReciter(r.id)}
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

      {/* Full Surah Audio Player Bar */}
      {surah && (
        <View style={styles.playerBar}>
          <LinearGradient
            colors={["#0D0D20", "#12122A"]}
            style={styles.playerBarGradient}
          >
            {/* Progress bar */}
            {isThisSurahLoaded && duration > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
                <View style={styles.progressTimes}>
                  <Text style={styles.progressTime}>{formatTime(currentTime)}</Text>
                  <Text style={styles.progressTime}>{formatTime(duration)}</Text>
                </View>
              </View>
            )}

            {/* Controls */}
            <View style={styles.playerControls}>
              {/* Prev surah */}
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={() => {
                  if (isThisSurahLoaded) {
                    playPrev();
                  }
                }}
              >
                <Text style={styles.controlIcon}>⏮</Text>
              </TouchableOpacity>

              {/* Rewind 15s */}
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={() => handleSeek("backward")}
              >
                <Text style={styles.controlIcon}>↺15</Text>
              </TouchableOpacity>

              {/* Play/Pause */}
              <TouchableOpacity
                style={[styles.playPauseBtn, isThisSurahPlaying && styles.playPauseBtnActive]}
                onPress={handlePlayPause}
              >
                {audioLoading && isThisSurahLoaded ? (
                  <ActivityIndicator color="#F0F0FF" size="small" />
                ) : (
                  <Text style={styles.playPauseIcon}>
                    {isThisSurahPlaying ? "⏸" : "▶"}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Forward 15s */}
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={() => handleSeek("forward")}
              >
                <Text style={styles.controlIcon}>↻15</Text>
              </TouchableOpacity>

              {/* Next surah */}
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={() => {
                  if (isThisSurahLoaded) {
                    playNext();
                  }
                }}
              >
                <Text style={styles.controlIcon}>⏭</Text>
              </TouchableOpacity>
            </View>

            {/* Surah info */}
            <View style={styles.playerInfo}>
              <Text style={styles.playerSurahName} numberOfLines={1}>
                {isThisSurahLoaded
                  ? `${surah.englishName} — ${isThisSurahPlaying ? "Playing" : "Paused"}`
                  : `${surah.englishName} — Tap ▶ to play full surah`}
              </Text>
              {isThisSurahLoaded && (
                <Text style={styles.playerReciter}>
                  {RECITERS.find((r) => r.id === settings.reciterId)?.name || "Alafasy"}
                </Text>
              )}
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
    paddingBottom: 12,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    gap: 8,
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
    fontWeight: "700",
  },
  surahEnglishName: {
    fontSize: 16,
    color: "#F0F0FF",
    fontWeight: "600",
  },
  surahMeta: {
    fontSize: 12,
    color: "#8B8BB0",
    marginTop: 2,
  },
  reciterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  reciterIcon: { fontSize: 18 },
  reciterPicker: {
    backgroundColor: "#12122A",
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    overflow: "hidden",
  },
  reciterItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C3A",
  },
  reciterItemActive: { backgroundColor: "rgba(124, 58, 237, 0.2)" },
  reciterItemText: { color: "#8B8BB0", fontSize: 14 },
  reciterItemTextActive: { color: "#C4B5FD", fontWeight: "600" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: "#8B8BB0", fontSize: 14 },
  errorText: { color: "#EF4444", fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  retryBtn: {
    backgroundColor: "#12122A",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  retryBtnText: { color: "#4FC3F7", fontWeight: "600" },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  bismillah: {
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C3A",
    marginBottom: 8,
  },
  bismillahText: {
    fontSize: 26,
    color: "#F59E0B",
    textAlign: "center",
    lineHeight: 44,
  },
  ayahContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C3A",
  },
  ayahHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  ayahBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#12122A",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    alignItems: "center",
    justifyContent: "center",
  },
  ayahBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8B8BB0",
  },
  ayahActions: {
    flexDirection: "row",
    gap: 8,
  },
  ayahActionBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  ayahActionIcon: { fontSize: 18, color: "#4A4A6A" },
  bookmarkActive: { color: "#F59E0B" },
  arabicText: {
    fontSize: 24,
    color: "#F0F0FF",
    textAlign: "right",
    lineHeight: 44,
    fontWeight: "400",
    marginBottom: 12,
  },
  translationText: {
    fontSize: 14,
    color: "#8B8BB0",
    lineHeight: 22,
  },
  // Player bar
  playerBar: {
    borderTopWidth: 1,
    borderTopColor: "#2A2A4A",
  },
  playerBarGradient: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressTrack: {
    height: 3,
    backgroundColor: "#2A2A4A",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 2,
  },
  progressTimes: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  progressTime: {
    fontSize: 11,
    color: "#4A4A6A",
  },
  playerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 8,
  },
  controlBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  controlIcon: {
    fontSize: 18,
    color: "#8B8BB0",
  },
  playPauseBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1C1C3A",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    alignItems: "center",
    justifyContent: "center",
  },
  playPauseBtnActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#9D5CF5",
  },
  playPauseIcon: {
    fontSize: 22,
    color: "#F0F0FF",
  },
  playerInfo: {
    alignItems: "center",
    gap: 2,
  },
  playerSurahName: {
    fontSize: 14,
    color: "#F0F0FF",
    fontWeight: "600",
    textAlign: "center",
  },
  playerReciter: {
    fontSize: 12,
    color: "#8B8BB0",
  },
});
