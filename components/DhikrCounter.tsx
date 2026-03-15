import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface DhikrPreset {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  target: number;
  color: string;
}

const DHIKR_PRESETS: DhikrPreset[] = [
  {
    id: "subhanallah",
    arabic: "سُبْحَانَ اللَّهِ",
    transliteration: "Subhan Allah",
    translation: "Glory be to Allah",
    target: 33,
    color: "#7C3AED",
  },
  {
    id: "alhamdulillah",
    arabic: "الْحَمْدُ لِلَّهِ",
    transliteration: "Alhamdulillah",
    translation: "All praise be to Allah",
    target: 33,
    color: "#F59E0B",
  },
  {
    id: "allahuakbar",
    arabic: "اللَّهُ أَكْبَرُ",
    transliteration: "Allahu Akbar",
    translation: "Allah is the Greatest",
    target: 34,
    color: "#4FC3F7",
  },
  {
    id: "lailahaillallah",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ",
    transliteration: "La ilaha illa Allah",
    translation: "There is no god but Allah",
    target: 100,
    color: "#22C55E",
  },
  {
    id: "astaghfirullah",
    arabic: "أَسْتَغْفِرُ اللَّهَ",
    transliteration: "Astaghfirullah",
    translation: "I seek forgiveness from Allah",
    target: 100,
    color: "#EC4899",
  },
  {
    id: "salawat",
    arabic: "صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ",
    transliteration: "Sallallahu Alayhi Wasallam",
    translation: "May Allah's peace be upon him",
    target: 100,
    color: "#8B5CF6",
  },
  {
    id: "hauqala",
    arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    transliteration: "La hawla wa la quwwata illa billah",
    translation: "There is no power except with Allah",
    target: 100,
    color: "#F97316",
  },
];

const STORAGE_KEY = "dhikr_counts";

export function DhikrCounter() {
  const [selectedDhikr, setSelectedDhikr] = useState<DhikrPreset>(DHIKR_PRESETS[0]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totalToday, setTotalToday] = useState(0);
  const [customTarget, setCustomTarget] = useState("");
  const [showCustomTarget, setShowCustomTarget] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if it's from today
        const today = new Date().toDateString();
        if (parsed.date === today) {
          setCounts(parsed.counts || {});
          setTotalToday(parsed.total || 0);
        } else {
          // New day, reset
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, counts: {}, total: 0 }));
        }
      }
    } catch {}
  };

  const saveCounts = async (newCounts: Record<string, number>, total: number) => {
    try {
      const today = new Date().toDateString();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, counts: newCounts, total }));
    } catch {}
  };

  const handleCount = useCallback(async () => {
    const newCounts = { ...counts, [selectedDhikr.id]: (counts[selectedDhikr.id] || 0) + 1 };
    const newTotal = totalToday + 1;
    setCounts(newCounts);
    setTotalToday(newTotal);
    await saveCounts(newCounts, newTotal);

    // Haptic feedback
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Button animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.94, duration: 60, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    // Pulse on target reached
    const currentCount = newCounts[selectedDhikr.id] || 0;
    const target = parseInt(customTarget) || selectedDhikr.target;
    if (currentCount === target) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [counts, selectedDhikr, totalToday, customTarget, scaleAnim, pulseAnim]);

  const handleReset = useCallback(async () => {
    const newCounts = { ...counts, [selectedDhikr.id]: 0 };
    setCounts(newCounts);
    await saveCounts(newCounts, totalToday);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [counts, selectedDhikr, totalToday]);

  const handleResetAll = useCallback(async () => {
    setCounts({});
    setTotalToday(0);
    await saveCounts({}, 0);
  }, []);

  const currentCount = counts[selectedDhikr.id] || 0;
  const target = parseInt(customTarget) || selectedDhikr.target;
  const progress = Math.min(currentCount / target, 1);
  const isComplete = currentCount >= target;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Dhikr Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presetList}
      >
        {DHIKR_PRESETS.map((dhikr) => {
          const isSelected = selectedDhikr.id === dhikr.id;
          const count = counts[dhikr.id] || 0;
          return (
            <TouchableOpacity
              key={dhikr.id}
              style={[
                styles.presetChip,
                isSelected && { borderColor: dhikr.color, backgroundColor: dhikr.color + "20" },
              ]}
              onPress={() => setSelectedDhikr(dhikr)}
            >
              <Text style={[styles.presetChipText, isSelected && { color: dhikr.color }]}>
                {dhikr.transliteration}
              </Text>
              {count > 0 && (
                <View style={[styles.presetCount, { backgroundColor: dhikr.color }]}>
                  <Text style={styles.presetCountText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Main Counter */}
      <Animated.View style={[styles.counterCard, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient
          colors={[selectedDhikr.color + "25", selectedDhikr.color + "10", "#12122A"]}
          style={styles.counterGradient}
        >
          {/* Arabic text */}
          <Text style={styles.arabicText}>{selectedDhikr.arabic}</Text>
          <Text style={styles.transliteration}>{selectedDhikr.transliteration}</Text>
          <Text style={styles.translation}>{selectedDhikr.translation}</Text>

          {/* Progress ring */}
          <View style={styles.progressContainer}>
            <View style={styles.progressRing}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress * 100}%`,
                    backgroundColor: isComplete ? "#22C55E" : selectedDhikr.color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: isComplete ? "#22C55E" : selectedDhikr.color }]}>
              {currentCount} / {target}
            </Text>
          </View>

          {/* Count display */}
          <Text style={[styles.countDisplay, { color: isComplete ? "#22C55E" : "#F0F0FF" }]}>
            {currentCount}
          </Text>
          {isComplete && (
            <Text style={styles.completedText}>✓ Target Reached! Masha'Allah!</Text>
          )}
        </LinearGradient>
      </Animated.View>

      {/* Tap Button */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          style={({ pressed }) => [
            styles.tapButton,
            { borderColor: selectedDhikr.color },
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleCount}
        >
          <LinearGradient
            colors={[selectedDhikr.color + "60", selectedDhikr.color + "30"]}
            style={styles.tapButtonGradient}
          >
            <Text style={styles.tapButtonIcon}>📿</Text>
            <Text style={[styles.tapButtonText, { color: selectedDhikr.color }]}>
              Tap to Count
            </Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={handleReset}>
          <Text style={styles.controlBtnText}>↺ Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => setShowCustomTarget(!showCustomTarget)}
        >
          <Text style={styles.controlBtnText}>🎯 Target: {target}</Text>
        </TouchableOpacity>
      </View>

      {showCustomTarget && (
        <View style={styles.customTargetRow}>
          <TextInput
            style={styles.customTargetInput}
            placeholder="Custom target..."
            placeholderTextColor="#4A4A6A"
            value={customTarget}
            onChangeText={setCustomTarget}
            keyboardType="numeric"
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.customTargetBtn}
            onPress={() => setShowCustomTarget(false)}
          >
            <Text style={styles.customTargetBtnText}>Set</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Daily Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Today's Dhikr</Text>
        <Text style={styles.statsTotal}>{totalToday.toLocaleString()}</Text>
        <Text style={styles.statsLabel}>Total remembrances</Text>
        <TouchableOpacity style={styles.resetAllBtn} onPress={handleResetAll}>
          <Text style={styles.resetAllBtnText}>Reset All</Text>
        </TouchableOpacity>
      </View>

      {/* All counts */}
      <View style={styles.allCountsCard}>
        <Text style={styles.allCountsTitle}>Session Summary</Text>
        {DHIKR_PRESETS.filter((d) => (counts[d.id] || 0) > 0).map((dhikr) => (
          <View key={dhikr.id} style={styles.allCountRow}>
            <Text style={[styles.allCountName, { color: dhikr.color }]}>{dhikr.transliteration}</Text>
            <Text style={styles.allCountValue}>{counts[dhikr.id] || 0}</Text>
          </View>
        ))}
        {Object.values(counts).every((v) => v === 0) && (
          <Text style={styles.noCountsText}>Start counting to see your progress</Text>
        )}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  presetList: { gap: 8, paddingBottom: 4 },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#12122A",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    gap: 6,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B8BB0",
  },
  presetCount: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  presetCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  counterCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  counterGradient: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  arabicText: {
    fontSize: 28,
    color: "#F0F0FF",
    textAlign: "center",
    lineHeight: 44,
    writingDirection: "rtl",
  },
  transliteration: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  translation: {
    fontSize: 13,
    color: "#8B8BB0",
    marginBottom: 8,
  },
  progressContainer: {
    width: "100%",
    gap: 6,
    alignItems: "center",
  },
  progressRing: {
    width: "100%",
    height: 6,
    backgroundColor: "#2A2A4A",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: "600",
  },
  countDisplay: {
    fontSize: 64,
    fontWeight: "800",
    letterSpacing: -2,
    fontVariant: ["tabular-nums"],
  },
  completedText: {
    fontSize: 14,
    color: "#22C55E",
    fontWeight: "600",
  },
  tapButton: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    height: 100,
  },
  tapButtonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  tapButtonIcon: { fontSize: 32 },
  tapButtonText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  controls: {
    flexDirection: "row",
    gap: 12,
  },
  controlBtn: {
    flex: 1,
    backgroundColor: "#12122A",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  controlBtnText: {
    color: "#8B8BB0",
    fontSize: 14,
    fontWeight: "600",
  },
  customTargetRow: {
    flexDirection: "row",
    gap: 8,
  },
  customTargetInput: {
    flex: 1,
    backgroundColor: "#12122A",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#F0F0FF",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  customTargetBtn: {
    backgroundColor: "rgba(124, 58, 237, 0.3)",
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#7C3AED",
  },
  customTargetBtnText: {
    color: "#7C3AED",
    fontWeight: "700",
    fontSize: 14,
  },
  statsCard: {
    backgroundColor: "#12122A",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    gap: 4,
  },
  statsTitle: {
    fontSize: 13,
    color: "#8B8BB0",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statsTotal: {
    fontSize: 48,
    fontWeight: "800",
    color: "#7C3AED",
    fontVariant: ["tabular-nums"],
  },
  statsLabel: {
    fontSize: 13,
    color: "#8B8BB0",
    marginBottom: 8,
  },
  resetAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  resetAllBtnText: {
    color: "#EF4444",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  allCountsCard: {
    backgroundColor: "#12122A",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    gap: 10,
  },
  allCountsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F0F0FF",
    marginBottom: 4,
  },
  allCountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C3A",
  },
  allCountName: {
    fontSize: 14,
    fontWeight: "600",
  },
  allCountValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  noCountsText: {
    color: "#4A4A6A",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 8,
  },
});
