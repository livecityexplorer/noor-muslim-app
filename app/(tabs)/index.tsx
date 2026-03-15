import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePrayerContext } from "@/lib/contexts/PrayerContext";
import { useQuranContext } from "@/lib/contexts/QuranContext";
import { fetchRandomHadith, type HadithItem } from "@/lib/services/HadithAPI";

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Assalamu Alaikum";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 20) return "Good Evening";
  return "Good Night";
}

const PRAYER_COLORS: Record<string, string> = {
  Fajr: "#7C3AED",
  Dhuhr: "#F59E0B",
  Asr: "#4FC3F7",
  Maghrib: "#EC4899",
  Isha: "#8B5CF6",
};

export default function HomeScreen() {
  const { prayerTimes, nextPrayer, timeUntilNextPrayer, isLoading, location, islamicDate } = usePrayerContext();
  const { lastRead } = useQuranContext();
  const [dailyHadith, setDailyHadith] = useState<HadithItem | null>(null);
  const [hadithLoading, setHadithLoading] = useState(true);

  useEffect(() => {
    fetchRandomHadith().then((h) => {
      setDailyHadith(h);
      setHadithLoading(false);
    });
  }, []);

  const nextColor = nextPrayer ? PRAYER_COLORS[nextPrayer.name] || "#7C3AED" : "#7C3AED";

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#1A0050", "#0D1B4A", "#0A0A1A"]}
        style={styles.header}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.islamicDate}>{islamicDate || "Loading date..."}</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => router.push("/settings" as any)}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
          {location && (
            <Text style={styles.locationText}>
              📍 {location.city}{location.country ? `, ${location.country}` : ""}
            </Text>
          )}
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Next Prayer Card */}
        {isLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#7C3AED" size="large" />
            <Text style={styles.loadingText}>Calculating prayer times...</Text>
          </View>
        ) : nextPrayer ? (
          <LinearGradient
            colors={[nextColor + "40", nextColor + "15", "#12122A"]}
            style={styles.nextPrayerCard}
          >
            <View style={styles.nextPrayerGlow} />
            <Text style={styles.nextPrayerLabel}>Next Prayer</Text>
            <Text style={[styles.nextPrayerName, { color: nextColor }]}>{nextPrayer.displayName}</Text>
            <Text style={styles.nextPrayerTime}>{nextPrayer.time}</Text>
            <Text style={styles.countdown}>{formatCountdown(timeUntilNextPrayer)}</Text>
            <Text style={styles.countdownLabel}>Time Remaining</Text>
          </LinearGradient>
        ) : (
          <TouchableOpacity
            style={styles.setupCard}
            onPress={() => router.push("/(tabs)/prayer" as any)}
          >
            <Text style={styles.setupCardIcon}>🕌</Text>
            <Text style={styles.setupCardTitle}>Set Up Prayer Times</Text>
            <Text style={styles.setupCardText}>Tap to configure your location</Text>
          </TouchableOpacity>
        )}

        {/* Today's Prayers */}
        {prayerTimes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Prayers</Text>
            <View style={styles.prayerGrid}>
              {prayerTimes.map((prayer) => {
                const isNext = nextPrayer?.name === prayer.name;
                const isPast = prayer.timestamp < Date.now();
                const color = PRAYER_COLORS[prayer.name] || "#7C3AED";
                return (
                  <View
                    key={prayer.name}
                    style={[
                      styles.prayerItem,
                      isNext && { borderColor: color, borderWidth: 1 },
                      isPast && !isNext && styles.prayerItemPast,
                    ]}
                  >
                    <Text style={[styles.prayerItemName, { color: isNext ? color : "#F0F0FF" }]}>
                      {prayer.displayName}
                    </Text>
                    <Text style={[styles.prayerItemTime, { color: isNext ? color : "#8B8BB0" }]}>
                      {prayer.time}
                    </Text>
                    {isNext && <View style={[styles.prayerDot, { backgroundColor: color }]} />}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Last Read Quran */}
        {lastRead && (
          <TouchableOpacity
            style={styles.lastReadCard}
            onPress={() => router.push(`/quran/${lastRead.surahNumber}` as any)}
          >
            <LinearGradient
              colors={["rgba(79, 195, 247, 0.15)", "rgba(124, 58, 237, 0.1)"]}
              style={styles.lastReadGradient}
            >
              <Text style={styles.lastReadLabel}>Continue Reading</Text>
              <Text style={styles.lastReadSurah}>{lastRead.surahName}</Text>
              <Text style={styles.lastReadAyah}>Ayah {lastRead.ayahNumber}</Text>
              <Text style={styles.lastReadArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Daily Hadith */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Hadith</Text>
          {hadithLoading ? (
            <View style={styles.hadithCard}>
              <ActivityIndicator color="#F59E0B" />
            </View>
          ) : dailyHadith ? (
            <View style={styles.hadithCard}>
              <View style={styles.hadithBadge}>
                <Text style={styles.hadithBadgeText}>{dailyHadith.collection}</Text>
              </View>
              {dailyHadith.arab ? (
                <Text style={styles.hadithArabic}>{dailyHadith.arab.substring(0, 200)}</Text>
              ) : null}
              {dailyHadith.en_text ? (
                <Text style={styles.hadithText}>
                  {dailyHadith.en_text.substring(0, 300)}
                  {dailyHadith.en_text.length > 300 ? "..." : ""}
                </Text>
              ) : null}
              <Text style={styles.hadithNumber}>Hadith #{dailyHadith.hadithNumber}</Text>
            </View>
          ) : (
            <View style={styles.hadithCard}>
              <Text style={styles.hadithText}>
                "The best of you are those who learn the Quran and teach it." — Sahih Al-Bukhari
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickAction, { borderColor: "#4FC3F7" }]}
              onPress={() => router.push("/(tabs)/quran" as any)}
            >
              <Text style={styles.quickActionIcon}>📖</Text>
              <Text style={styles.quickActionText}>Quran</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAction, { borderColor: "#22C55E" }]}
              onPress={() => router.push("/(tabs)/qibla" as any)}
            >
              <Text style={styles.quickActionIcon}>🧭</Text>
              <Text style={styles.quickActionText}>Qibla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAction, { borderColor: "#EC4899" }]}
              onPress={() => router.push("/(tabs)/more" as any)}
            >
              <Text style={styles.quickActionIcon}>📿</Text>
              <Text style={styles.quickActionText}>Dhikr</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
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
  decorCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
    top: -60,
    right: -40,
  },
  decorCircle2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(79, 195, 247, 0.15)",
    top: 20,
    right: 60,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 8,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  islamicDate: {
    fontSize: 13,
    color: "#F59E0B",
    marginTop: 2,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: { fontSize: 20 },
  locationText: {
    fontSize: 12,
    color: "#8B8BB0",
    marginTop: 4,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  loadingCard: {
    backgroundColor: "#12122A",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    gap: 12,
  },
  loadingText: { color: "#8B8BB0", fontSize: 14 },
  nextPrayerCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  nextPrayerGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(124, 58, 237, 0.05)",
    top: -60,
    alignSelf: "center",
  },
  nextPrayerLabel: {
    fontSize: 12,
    color: "#8B8BB0",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  nextPrayerName: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 4,
  },
  nextPrayerTime: {
    fontSize: 18,
    color: "#8B8BB0",
    marginBottom: 16,
  },
  countdown: {
    fontSize: 44,
    fontWeight: "800",
    color: "#F0F0FF",
    fontVariant: ["tabular-nums"],
    letterSpacing: 2,
  },
  countdownLabel: {
    fontSize: 11,
    color: "#8B8BB0",
    marginTop: 4,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  setupCard: {
    backgroundColor: "#12122A",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    borderStyle: "dashed",
    gap: 8,
  },
  setupCardIcon: { fontSize: 40 },
  setupCardTitle: { fontSize: 18, fontWeight: "700", color: "#F0F0FF" },
  setupCardText: { fontSize: 13, color: "#8B8BB0" },
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F0F0FF",
    letterSpacing: 0.5,
  },
  prayerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  prayerItem: {
    flex: 1,
    minWidth: "18%",
    backgroundColor: "#12122A",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    gap: 4,
  },
  prayerItemPast: {
    opacity: 0.5,
  },
  prayerItemName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#F0F0FF",
  },
  prayerItemTime: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8B8BB0",
  },
  prayerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  lastReadCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(79, 195, 247, 0.3)",
  },
  lastReadGradient: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  lastReadLabel: {
    fontSize: 11,
    color: "#4FC3F7",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginRight: 8,
  },
  lastReadSurah: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  lastReadAyah: {
    fontSize: 12,
    color: "#8B8BB0",
    marginRight: 8,
  },
  lastReadArrow: {
    fontSize: 18,
    color: "#4FC3F7",
  },
  hadithCard: {
    backgroundColor: "#12122A",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
    gap: 10,
    minHeight: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  hadithBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  hadithBadgeText: {
    fontSize: 11,
    color: "#F59E0B",
    fontWeight: "600",
  },
  hadithArabic: {
    fontSize: 18,
    color: "#F0F0FF",
    textAlign: "right",
    lineHeight: 30,
    fontFamily: "System",
    writingDirection: "rtl",
  },
  hadithText: {
    fontSize: 14,
    color: "#8B8BB0",
    lineHeight: 22,
  },
  hadithNumber: {
    fontSize: 11,
    color: "#4A4A6A",
    alignSelf: "flex-end",
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: "#12122A",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    gap: 8,
  },
  quickActionIcon: { fontSize: 28 },
  quickActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F0F0FF",
  },
});
