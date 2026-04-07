import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePrayerContext } from "@/lib/contexts/PrayerContext";
import { useAppSettings, CALCULATION_METHODS, ADHAN_STYLES } from "@/lib/contexts/AppSettingsContext";
import {
  requestNotificationPermissions,
  schedulePrayerNotifications,
} from "@/lib/services/NotificationService";

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

const PRAYER_ICONS: Record<string, string> = {
  Fajr: "🌙",
  Dhuhr: "☀️",
  Asr: "🌤️",
  Maghrib: "🌅",
  Isha: "🌙",
};

const PRAYER_COLORS: Record<string, string> = {
  Fajr: "#7C3AED",
  Dhuhr: "#F59E0B",
  Asr: "#4FC3F7",
  Maghrib: "#EC4899",
  Isha: "#8B5CF6",
};

export default function PrayerScreen() {
  const { location, prayerTimes, nextPrayer, timeUntilNextPrayer, isLoading, error, setLocation, refreshPrayerTimes, islamicDate } = usePrayerContext();
  const { settings, updateSettings } = useAppSettings();
  const [locationLoading, setLocationLoading] = useState(false);
  const [manualCity, setManualCity] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showAdhanPicker, setShowAdhanPicker] = useState(false);
  const [adhanPlaying, setAdhanPlaying] = useState(false);
  const [adhanPreviewDuration, setAdhanPreviewDuration] = useState(0);
  const adhanPlayerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    return () => {
      adhanPlayerRef.current?.remove();
    };
  }, []);

  // Schedule notifications whenever prayer times change
  useEffect(() => {
    if (prayerTimes.length > 0) {
      schedulePrayerNotifications(prayerTimes, settings.notifications).catch(() => {});
    }
  }, [prayerTimes, settings.notifications]);

  const handleDetectLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission",
          "Please enable location access in Settings to get accurate prayer times.",
          [{ text: "OK" }]
        );
        setLocationLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      try {
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        await setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          city: geo?.city || geo?.district || "Your Location",
          country: geo?.country || "",
        });
      } catch {
        await setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          city: "Your Location",
          country: "",
        });
      }
    } catch {
      Alert.alert("Error", "Could not detect your location. Please try manual entry.");
    } finally {
      setLocationLoading(false);
    }
  }, [setLocation]);

  const handleManualLocation = useCallback(async () => {
    if (!manualCity.trim()) return;
    setLocationLoading(true);
    try {
      const results = await Location.geocodeAsync(manualCity);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        await setLocation({
          latitude,
          longitude,
          city: manualCity,
          country: "",
        });
        setShowManualEntry(false);
        setManualCity("");
      } else {
        Alert.alert("Not Found", "Could not find that location. Try a different city name.");
      }
    } catch {
      Alert.alert("Error", "Could not geocode that location.");
    } finally {
      setLocationLoading(false);
    }
  }, [manualCity, setLocation]);

  const playAdhanPreview = useCallback(async (adhanId: string) => {
    try {
      if (adhanPlayerRef.current) {
        adhanPlayerRef.current.remove();
        adhanPlayerRef.current = null;
        setAdhanPlaying(false);
      }
      const adhan = ADHAN_STYLES.find((a) => a.id === adhanId);
      if (!adhan) return;
      // Use the bundled custom Adhan audio file
      // For APK builds, use the asset URI directly
      const audioUri = Platform.OS === "web" 
        ? require("@/assets/sounds/adhan_custom.mp3")
        : "file:///android_asset/assets/sounds/adhan_custom.mp3";
      
      const player = createAudioPlayer({ uri: audioUri });
      adhanPlayerRef.current = player;
      
      // Set audio mode FIRST to ensure it plays in silent mode with max volume
      await setAudioModeAsync({
        playsInSilentMode: true,
      });
      
      // Set volume to maximum
      player.volume = 1.0;
      
      // Play the audio
      console.log("[Adhan Preview] Starting playback");
      await player.play();
      setAdhanPlaying(true);
      
      // Auto-stop after 10 seconds
      const timeoutId = setTimeout(async () => {
        try {
          if (adhanPlayerRef.current) {
            await adhanPlayerRef.current.pause();
            adhanPlayerRef.current.remove();
            adhanPlayerRef.current = null;
          }
        } catch (e) {
          console.warn("Error stopping audio:", e);
        }
        setAdhanPlaying(false);
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    } catch (error) {
      console.error("[Adhan Preview] Error:", error);
      setAdhanPlaying(false);
      Alert.alert("Audio Error", "Could not play Adhan audio. Please check your device volume.");
    }
  }, []);

  const toggleNotification = useCallback(async (prayerKey: keyof typeof settings.notifications) => {
    const newNotifs = {
      ...settings.notifications,
      [prayerKey]: !settings.notifications[prayerKey],
    };
    await updateSettings({ notifications: newNotifs });
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [settings.notifications, updateSettings]);

  const handleRequestNotifPermission = useCallback(async () => {
    const granted = await requestNotificationPermissions();
    if (!granted) {
      Alert.alert("Notifications", "Please enable notifications in Settings to receive prayer reminders.");
    }
  }, []);

  const prayerNotifKeys: Record<string, keyof typeof settings.notifications> = {
    Fajr: "fajr",
    Dhuhr: "dhuhr",
    Asr: "asr",
    Maghrib: "maghrib",
    Isha: "isha",
  };

  const currentMethod = CALCULATION_METHODS.find((m) => m.id === settings.calculationMethodId);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#1A0A00", "#2A1500", "#0A0A1A"]}
        style={styles.header}
      >
        <View style={styles.decorCircle} />
        <SafeAreaView edges={["top"]}>
          <Text style={styles.headerTitle}>Prayer Times</Text>
          {islamicDate ? <Text style={styles.islamicDate}>{islamicDate}</Text> : null}
          {location ? (
            <Text style={styles.locationText}>
              📍 {location.city}{location.country ? `, ${location.country}` : ""}
            </Text>
          ) : null}
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Location Setup */}
        {!location && (
          <View style={styles.locationCard}>
            <Text style={styles.locationCardTitle}>Set Your Location</Text>
            <Text style={styles.locationCardText}>
              Enable location to get accurate prayer times for your area.
            </Text>
            <TouchableOpacity
              style={styles.locationBtn}
              onPress={handleDetectLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator color="#F59E0B" />
              ) : (
                <Text style={styles.locationBtnText}>📍 Detect My Location</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.manualBtn}
              onPress={() => setShowManualEntry(!showManualEntry)}
            >
              <Text style={styles.manualBtnText}>Enter City Manually</Text>
            </TouchableOpacity>
            {showManualEntry && (
              <View style={styles.manualEntry}>
                <TextInput
                  style={styles.manualInput}
                  placeholder="City name (e.g., London)"
                  placeholderTextColor="#4A4A6A"
                  value={manualCity}
                  onChangeText={setManualCity}
                  returnKeyType="search"
                  onSubmitEditing={handleManualLocation}
                />
                <TouchableOpacity
                  style={styles.manualSearchBtn}
                  onPress={handleManualLocation}
                  disabled={locationLoading}
                >
                  <Text style={styles.manualSearchBtnText}>Search</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Location Change */}
        {location && (
          <View style={styles.locationChangeRow}>
            <TouchableOpacity
              style={styles.changeLocationBtn}
              onPress={handleDetectLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator color="#F59E0B" size="small" />
              ) : (
                <Text style={styles.changeLocationText}>📍 Update Location</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.changeLocationBtn}
              onPress={() => setShowManualEntry(!showManualEntry)}
            >
              <Text style={styles.changeLocationText}>✏️ Manual</Text>
            </TouchableOpacity>
          </View>
        )}

        {showManualEntry && location && (
          <View style={styles.manualEntry}>
            <TextInput
              style={styles.manualInput}
              placeholder="City name (e.g., London)"
              placeholderTextColor="#4A4A6A"
              value={manualCity}
              onChangeText={setManualCity}
              returnKeyType="search"
              onSubmitEditing={handleManualLocation}
            />
            <TouchableOpacity
              style={styles.manualSearchBtn}
              onPress={handleManualLocation}
            >
              <Text style={styles.manualSearchBtnText}>Search</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Next Prayer Countdown */}
        {nextPrayer && (
          <LinearGradient
            colors={[PRAYER_COLORS[nextPrayer.name] + "30", "#12122A"]}
            style={styles.countdownCard}
          >
            <Text style={styles.countdownLabel}>Next Prayer</Text>
            <Text style={[styles.countdownPrayer, { color: PRAYER_COLORS[nextPrayer.name] }]}>
              {PRAYER_ICONS[nextPrayer.name]} {nextPrayer.displayName}
            </Text>
            <Text style={styles.countdownTime}>{nextPrayer.time}</Text>
            <Text style={styles.countdown}>{formatCountdown(timeUntilNextPrayer)}</Text>
          </LinearGradient>
        )}

        {/* Prayer Times List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#F59E0B" size="large" />
            <Text style={styles.loadingText}>Calculating prayer times...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={refreshPrayerTimes}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : prayerTimes.length > 0 ? (
          <View style={styles.prayerList}>
            <Text style={styles.sectionTitle}>Today's Prayer Times</Text>
            {prayerTimes.map((prayer) => {
              const isNext = nextPrayer?.name === prayer.name;
              const isPast = prayer.timestamp < Date.now();
              const color = PRAYER_COLORS[prayer.name] || "#7C3AED";
              const notifKey = prayerNotifKeys[prayer.name];
              return (
                <View
                  key={prayer.name}
                  style={[
                    styles.prayerRow,
                    isNext && { borderColor: color, borderWidth: 1 },
                    isPast && !isNext && styles.prayerRowPast,
                  ]}
                >
                  <View style={styles.prayerLeft}>
                    <Text style={styles.prayerIcon}>{PRAYER_ICONS[prayer.name]}</Text>
                    <View>
                      <Text style={[styles.prayerName, isNext && { color }]}>{prayer.displayName}</Text>
                      {isNext && <Text style={[styles.prayerNextLabel, { color }]}>Next</Text>}
                    </View>
                  </View>
                  <View style={styles.prayerRight}>
                    <Text style={[styles.prayerTime, isNext && { color }]}>{prayer.time}</Text>
                    {notifKey && (
                      <Switch
                        value={settings.notifications[notifKey]}
                        onValueChange={() => toggleNotification(notifKey)}
                        trackColor={{ false: "#2A2A4A", true: color + "80" }}
                        thumbColor={settings.notifications[notifKey] ? color : "#4A4A6A"}
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Notification Permission */}
        <TouchableOpacity style={styles.notifPermBtn} onPress={handleRequestNotifPermission}>
          <Text style={styles.notifPermText}>🔔 Enable Prayer Notifications</Text>
        </TouchableOpacity>

        {/* Calculation Method */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Calculation Method</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowMethodPicker(!showMethodPicker)}
          >
            <Text style={styles.settingLabel}>Method</Text>
            <View style={styles.settingValue}>
              <Text style={styles.settingValueText} numberOfLines={1}>
                {currentMethod?.name || "Select Method"}
              </Text>
              <Text style={styles.chevron}>{showMethodPicker ? "▲" : "▼"}</Text>
            </View>
          </TouchableOpacity>
          {showMethodPicker && (
            <View style={styles.picker}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {CALCULATION_METHODS.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.pickerItem,
                      settings.calculationMethodId === method.id && styles.pickerItemActive,
                    ]}
                    onPress={async () => {
                      await updateSettings({ calculationMethodId: method.id });
                      setShowMethodPicker(false);
                      refreshPrayerTimes();
                    }}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      settings.calculationMethodId === method.id && styles.pickerItemTextActive,
                    ]}>
                      {method.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Adhan Style */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Adhan Style</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowAdhanPicker(!showAdhanPicker)}
          >
            <Text style={styles.settingLabel}>Adhan</Text>
            <View style={styles.settingValue}>
              <Text style={styles.settingValueText}>
                {ADHAN_STYLES.find((a) => a.id === settings.adhanStyleId)?.name || "Select Adhan"}
              </Text>
              <Text style={styles.chevron}>{showAdhanPicker ? "▲" : "▼"}</Text>
            </View>
          </TouchableOpacity>
          {showAdhanPicker && (
            <View style={styles.picker}>
              {ADHAN_STYLES.map((adhan) => (
                <TouchableOpacity
                  key={adhan.id}
                  style={[
                    styles.pickerItem,
                    settings.adhanStyleId === adhan.id && styles.pickerItemActive,
                  ]}
                  onPress={async () => {
                    await updateSettings({ adhanStyleId: adhan.id });
                    playAdhanPreview(adhan.id);
                  }}
                >
                  <Text style={[
                    styles.pickerItemText,
                    settings.adhanStyleId === adhan.id && styles.pickerItemTextActive,
                  ]}>
                    {adhan.name}
                  </Text>
                  {settings.adhanStyleId === adhan.id && adhanPlaying && (
                    <Text style={styles.playingIndicator}>♪ Playing...</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
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
  decorCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.15)",
    top: -60,
    right: -40,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#F0F0FF",
    paddingTop: 8,
  },
  islamicDate: {
    fontSize: 13,
    color: "#F59E0B",
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: "#8B8BB0",
    marginTop: 4,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  locationCard: {
    backgroundColor: "#12122A",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    gap: 12,
    alignItems: "center",
  },
  locationCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  locationCardText: {
    fontSize: 14,
    color: "#8B8BB0",
    textAlign: "center",
    lineHeight: 20,
  },
  locationBtn: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#F59E0B",
    width: "100%",
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  locationBtnText: {
    color: "#F59E0B",
    fontSize: 15,
    fontWeight: "600",
  },
  manualBtn: {
    paddingVertical: 8,
  },
  manualBtnText: {
    color: "#8B8BB0",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  locationChangeRow: {
    flexDirection: "row",
    gap: 12,
  },
  changeLocationBtn: {
    flex: 1,
    backgroundColor: "#12122A",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    minHeight: 40,
    justifyContent: "center",
  },
  changeLocationText: {
    color: "#8B8BB0",
    fontSize: 13,
  },
  manualEntry: {
    flexDirection: "row",
    gap: 8,
  },
  manualInput: {
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
  manualSearchBtn: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  manualSearchBtnText: {
    color: "#F59E0B",
    fontWeight: "600",
    fontSize: 14,
  },
  countdownCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    gap: 4,
  },
  countdownLabel: {
    fontSize: 12,
    color: "#8B8BB0",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  countdownPrayer: {
    fontSize: 28,
    fontWeight: "800",
  },
  countdownTime: {
    fontSize: 16,
    color: "#8B8BB0",
  },
  countdown: {
    fontSize: 40,
    fontWeight: "800",
    color: "#F0F0FF",
    fontVariant: ["tabular-nums"],
    letterSpacing: 2,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  loadingText: { color: "#8B8BB0", fontSize: 14 },
  errorContainer: {
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  errorText: { color: "#EF4444", fontSize: 14, textAlign: "center" },
  retryBtn: {
    backgroundColor: "rgba(124, 58, 237, 0.3)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#7C3AED",
  },
  retryBtnText: { color: "#F0F0FF", fontWeight: "600" },
  prayerList: { gap: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F0F0FF",
    marginBottom: 8,
  },
  prayerRow: {
    backgroundColor: "#12122A",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  prayerRowPast: { opacity: 0.5 },
  prayerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  prayerIcon: { fontSize: 24 },
  prayerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F0F0FF",
  },
  prayerNextLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  prayerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  prayerTime: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  notifPermBtn: {
    backgroundColor: "rgba(124, 58, 237, 0.15)",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  notifPermText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "600",
  },
  settingsSection: { gap: 8 },
  settingRow: {
    backgroundColor: "#12122A",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  settingLabel: {
    fontSize: 15,
    color: "#F0F0FF",
    fontWeight: "500",
  },
  settingValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "60%",
  },
  settingValueText: {
    fontSize: 13,
    color: "#8B8BB0",
    flex: 1,
    textAlign: "right",
  },
  chevron: { color: "#8B8BB0", fontSize: 12 },
  picker: {
    backgroundColor: "#12122A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    overflow: "hidden",
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C3A",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerItemActive: { backgroundColor: "rgba(245, 158, 11, 0.1)" },
  pickerItemText: { color: "#F0F0FF", fontSize: 14 },
  pickerItemTextActive: { color: "#F59E0B", fontWeight: "600" },
  playingIndicator: { color: "#F59E0B", fontSize: 12 },
});
