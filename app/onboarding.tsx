import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSettings, LANGUAGES } from "@/lib/contexts/AppSettingsContext";
import { requestNotificationPermissions } from "@/lib/services/NotificationService";
import { usePrayerContext } from "@/lib/contexts/PrayerContext";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "welcome",
    title: "نور",
    subtitle: "Your Complete Muslim Companion",
    description: "Quran, Prayer Times, Qibla, Hadith & Dhikr — everything you need for your daily Islamic practice.",
    icon: "☪️",
    gradient: ["#1A0050", "#0D1B4A", "#0A0A1A"] as [string, string, string],
  },
  {
    id: "location",
    title: "Prayer Times",
    subtitle: "Know when to pray, wherever you are",
    description: "Allow location access to get accurate prayer times and Qibla direction for your exact location.",
    icon: "🕌",
    gradient: ["#0D1B4A", "#1A0050", "#0A0A1A"] as [string, string, string],
  },
  {
    id: "notifications",
    title: "Never Miss a Prayer",
    subtitle: "Get reminded before each Salah",
    description: "Enable notifications to receive reminders 10 minutes before each prayer time.",
    icon: "🔔",
    gradient: ["#1A0050", "#0A2A1A", "#0A0A1A"] as [string, string, string],
  },
];

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [languageSearch, setLanguageSearch] = useState("");
  const [locationGranted, setLocationGranted] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { updateSettings } = useAppSettings();
  const { setLocation } = usePrayerContext();

  const filteredLanguages = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(languageSearch.toLowerCase())
  );

  const handleLocationRequest = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setLocationGranted(true);
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        // Reverse geocode for city name
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
      }
    } catch {}
  };

  const handleNotifRequest = async () => {
    const granted = await requestNotificationPermissions();
    setNotifGranted(granted);
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      const next = currentSlide + 1;
      setCurrentSlide(next);
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    await updateSettings({ language: selectedLanguage, onboardingCompleted: true });
    router.replace("/(tabs)");
  };

  const renderSlide = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => (
    <View style={{ width }}>
      <LinearGradient colors={item.gradient} style={styles.slideGradient}>
        {/* Decorative circles */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorCircle3} />

        <View style={styles.slideContent}>
          <Text style={styles.slideIcon}>{item.icon}</Text>
          <Text style={[styles.slideTitle, index === 0 && styles.arabicTitle]}>{item.title}</Text>
          <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
          <Text style={styles.slideDescription}>{item.description}</Text>

          {/* Location slide */}
          {index === 1 && (
            <View style={styles.actionContainer}>
              {!locationGranted ? (
                <TouchableOpacity style={styles.primaryButton} onPress={handleLocationRequest}>
                  <Text style={styles.primaryButtonText}>📍 Allow Location</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.grantedBadge}>
                  <Text style={styles.grantedText}>✓ Location Enabled</Text>
                </View>
              )}
              <TouchableOpacity onPress={handleNext}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Notifications slide */}
          {index === 2 && (
            <View style={styles.actionContainer}>
              {!notifGranted ? (
                <TouchableOpacity style={styles.primaryButton} onPress={handleNotifRequest}>
                  <Text style={styles.primaryButtonText}>🔔 Enable Notifications</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.grantedBadge}>
                  <Text style={styles.grantedText}>✓ Notifications Enabled</Text>
                </View>
              )}

              {/* Language Selection */}
              <Text style={styles.languageLabel}>Select Your Language</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search language..."
                placeholderTextColor="#8B8BB0"
                value={languageSearch}
                onChangeText={setLanguageSearch}
              />
              <View style={styles.languageList}>
                <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                  {filteredLanguages.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.languageItem,
                        selectedLanguage === lang.code && styles.languageItemSelected,
                      ]}
                      onPress={() => setSelectedLanguage(lang.code)}
                    >
                      <Text style={[styles.languageItemText, selectedLanguage === lang.code && styles.languageItemTextSelected]}>
                        {lang.nativeName}
                      </Text>
                      <Text style={styles.languageItemSubtext}>{lang.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />

      {/* Dots & Button */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, currentSlide === i && styles.dotActive]}
            />
          ))}
        </View>

        {currentSlide === 0 && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <LinearGradient
              colors={["#7C3AED", "#4FC3F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>Get Started →</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {currentSlide === 1 && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <LinearGradient
              colors={["#7C3AED", "#4FC3F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>Continue →</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {currentSlide === 2 && (
          <TouchableOpacity style={styles.nextButton} onPress={handleComplete}>
            <LinearGradient
              colors={["#7C3AED", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>Start Using Noor ✨</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A1A",
  },
  slideGradient: {
    flex: 1,
    minHeight: Dimensions.get("window").height - 140,
    overflow: "hidden",
  },
  decorCircle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
    top: -100,
    right: -80,
  },
  decorCircle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(79, 195, 247, 0.15)",
    top: 50,
    right: -30,
  },
  decorCircle3: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.1)",
    bottom: 20,
    left: -40,
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    alignItems: "center",
  },
  slideIcon: {
    fontSize: 72,
    marginBottom: 24,
  },
  slideTitle: {
    fontSize: 42,
    fontWeight: "800",
    color: "#F0F0FF",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 1,
  },
  arabicTitle: {
    fontSize: 64,
    color: "#F59E0B",
  },
  slideSubtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#7C3AED",
    textAlign: "center",
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 15,
    color: "#8B8BB0",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  actionContainer: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "rgba(124, 58, 237, 0.3)",
    borderWidth: 1,
    borderColor: "#7C3AED",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#F0F0FF",
    fontSize: 16,
    fontWeight: "600",
  },
  grantedBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderWidth: 1,
    borderColor: "#22C55E",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
  },
  grantedText: {
    color: "#22C55E",
    fontSize: 15,
    fontWeight: "600",
  },
  skipText: {
    color: "#8B8BB0",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  languageLabel: {
    color: "#F0F0FF",
    fontSize: 15,
    fontWeight: "600",
    alignSelf: "flex-start",
    marginTop: 8,
  },
  searchInput: {
    backgroundColor: "#12122A",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#F0F0FF",
    fontSize: 15,
    width: "100%",
  },
  languageList: {
    width: "100%",
    backgroundColor: "#12122A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    overflow: "hidden",
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C3A",
  },
  languageItemSelected: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
  },
  languageItemText: {
    color: "#F0F0FF",
    fontSize: 15,
    fontWeight: "500",
  },
  languageItemTextSelected: {
    color: "#7C3AED",
  },
  languageItemSubtext: {
    color: "#8B8BB0",
    fontSize: 12,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === "ios" ? 8 : 16,
    paddingTop: 16,
    backgroundColor: "#0A0A1A",
    alignItems: "center",
    gap: 16,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2A2A4A",
  },
  dotActive: {
    width: 24,
    backgroundColor: "#7C3AED",
  },
  nextButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  nextButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
