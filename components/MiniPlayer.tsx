import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudioPlayer } from "@/lib/contexts/AudioPlayerContext";

/**
 * MiniPlayer — a persistent floating audio player bar that appears above the tab bar
 * whenever a surah is loaded. It shows surah name, play/pause, prev/next controls,
 * and a progress bar. Tapping the surah name navigates to the full player screen.
 */
export function MiniPlayer() {
  const {
    currentSurah,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    togglePlayPause,
    playNext,
    playPrev,
    stop,
  } = useAudioPlayer();
  const insets = useSafeAreaInsets();

  // Slide-in animation
  const slideAnim = useRef(new Animated.Value(80)).current;
  const prevSurahRef = useRef<typeof currentSurah>(null);

  useEffect(() => {
    if (currentSurah && !prevSurahRef.current) {
      // Animate in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else if (!currentSurah && prevSurahRef.current) {
      // Animate out
      Animated.timing(slideAnim, {
        toValue: 80,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    prevSurahRef.current = currentSurah;
  }, [currentSurah]);

  if (!currentSurah) return null;

  const progressPercent = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  const handlePlayPause = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    togglePlayPause();
  };

  const handleNext = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    playNext();
  };

  const handlePrev = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    playPrev();
  };

  const handleStop = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    stop();
  };

  const handleTapSurahName = () => {
    router.push(`/quran/${currentSurah.surahNumber}` as any);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <LinearGradient
        colors={["#1A0A3A", "#0D0D20"]}
        style={styles.gradient}
      >
        {/* Progress bar at top */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        <View style={styles.content}>
          {/* Surah info — tap to open full player */}
          <TouchableOpacity style={styles.infoArea} onPress={handleTapSurahName}>
            <View style={[styles.iconBadge, isPlaying && styles.iconBadgeActive]}>
              <Text style={styles.iconBadgeText}>
                {isLoading ? "⏳" : isPlaying ? "♪" : "⏸"}
              </Text>
            </View>
            <View style={styles.textArea}>
              <Text style={styles.surahName} numberOfLines={1}>
                {currentSurah.surahArabicName
                  ? `${currentSurah.surahArabicName} — ${currentSurah.surahName}`
                  : currentSurah.surahName}
              </Text>
              <Text style={styles.surahStatus}>
                {isLoading
                  ? "Loading..."
                  : isPlaying
                  ? "Playing • Tap for full player"
                  : "Paused • Tap for full player"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlBtn} onPress={handlePrev}>
              <Text style={styles.controlIcon}>⏮</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.playBtn, isPlaying && styles.playBtnActive]}
              onPress={handlePlayPause}
            >
              <Text style={styles.playBtnIcon}>{isPlaying ? "⏸" : "▶"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn} onPress={handleNext}>
              <Text style={styles.controlIcon}>⏭</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn} onPress={handleStop}>
              <Text style={[styles.controlIcon, styles.stopIcon]}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    // Positioned just above the tab bar (tab bar is ~68px tall)
    bottom: 68,
    zIndex: 100,
    elevation: 10,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  gradient: {
    borderTopWidth: 1,
    borderTopColor: "#3A1A6A",
  },
  progressTrack: {
    height: 2,
    backgroundColor: "#2A2A4A",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#7C3AED",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  infoArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#1C1C3A",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadgeActive: {
    backgroundColor: "rgba(124, 58, 237, 0.3)",
    borderColor: "#7C3AED",
  },
  iconBadgeText: { fontSize: 16 },
  textArea: { flex: 1 },
  surahName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F0F0FF",
    lineHeight: 18,
  },
  surahStatus: {
    fontSize: 11,
    color: "#8B8BB0",
    marginTop: 2,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  controlBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  controlIcon: {
    fontSize: 16,
    color: "#8B8BB0",
  },
  stopIcon: {
    fontSize: 14,
    color: "#4A4A6A",
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1C1C3A",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#9D5CF5",
  },
  playBtnIcon: {
    fontSize: 16,
    color: "#F0F0FF",
  },
});
