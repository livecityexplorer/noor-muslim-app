import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSettings, LANGUAGES, RECITERS, CALCULATION_METHODS, ADHAN_STYLES } from "@/lib/contexts/AppSettingsContext";

interface SettingRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  color?: string;
}

function SettingRow({ label, value, onPress, rightElement, color }: SettingRowProps) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <Text style={[styles.settingLabel, color ? { color } : {}]}>{label}</Text>
      <View style={styles.settingRight}>
        {value ? <Text style={styles.settingValue}>{value}</Text> : null}
        {rightElement}
        {onPress && <Text style={styles.chevron}>›</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings } = useAppSettings();
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showAdhanPicker, setShowAdhanPicker] = useState(false);

  const currentLanguage = LANGUAGES.find((l) => l.code === settings.language);
  const currentReciter = RECITERS.find((r) => r.id === settings.reciterId);
  const currentMethod = CALCULATION_METHODS.find((m) => m.id === settings.calculationMethodId);
  const currentAdhan = ADHAN_STYLES.find((a) => a.id === settings.adhanStyleId);

  const handleResetOnboarding = () => {
    Alert.alert(
      "Reset Onboarding",
      "This will restart the app setup process.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await updateSettings({ onboardingCompleted: false });
            router.replace("/onboarding" as any);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0A0A2A", "#0A0A1A"]}
        style={styles.header}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quran Settings */}
        <Text style={styles.sectionHeader}>Quran</Text>
        <View style={styles.settingsGroup}>
          <SettingRow
            label="Translation Language"
            value={currentLanguage?.name || settings.language}
            onPress={() => setShowLanguagePicker(!showLanguagePicker)}
          />
          {showLanguagePicker && (
            <View style={styles.picker}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.pickerItem,
                      settings.language === lang.code && styles.pickerItemActive,
                    ]}
                    onPress={async () => {
                      await updateSettings({ language: lang.code });
                      setShowLanguagePicker(false);
                    }}
                  >
                    <Text style={[styles.pickerItemText, settings.language === lang.code && styles.pickerItemTextActive]}>
                      {lang.nativeName}
                    </Text>
                    <Text style={styles.pickerItemSub}>{lang.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <SettingRow
            label="Reciter"
            value={currentReciter?.name || settings.reciterId}
            onPress={() => setShowReciterPicker(!showReciterPicker)}
          />
          {showReciterPicker && (
            <View style={styles.picker}>
              {RECITERS.map((reciter) => (
                <TouchableOpacity
                  key={reciter.id}
                  style={[
                    styles.pickerItem,
                    settings.reciterId === reciter.id && styles.pickerItemActive,
                  ]}
                  onPress={async () => {
                    await updateSettings({ reciterId: reciter.id });
                    setShowReciterPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, settings.reciterId === reciter.id && styles.pickerItemTextActive]}>
                    {reciter.name}
                  </Text>
                  <Text style={styles.pickerItemSub}>{reciter.identifier}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Prayer Settings */}
        <Text style={styles.sectionHeader}>Prayer Times</Text>
        <View style={styles.settingsGroup}>
          <SettingRow
            label="Calculation Method"
            value={currentMethod?.name || String(settings.calculationMethodId)}
            onPress={() => setShowMethodPicker(!showMethodPicker)}
          />
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
                    }}
                  >
                    <Text style={[styles.pickerItemText, settings.calculationMethodId === method.id && styles.pickerItemTextActive]}>
                      {method.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <SettingRow
            label="Adhan Style"
            value={currentAdhan?.name || settings.adhanStyleId}
            onPress={() => setShowAdhanPicker(!showAdhanPicker)}
          />
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
                    setShowAdhanPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, settings.adhanStyleId === adhan.id && styles.pickerItemTextActive]}>
                    {adhan.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Notifications */}
        <Text style={styles.sectionHeader}>Notifications</Text>
        <View style={styles.settingsGroup}>
          {[
            { key: "fajr" as const, label: "Fajr" },
            { key: "dhuhr" as const, label: "Dhuhr" },
            { key: "asr" as const, label: "Asr" },
            { key: "maghrib" as const, label: "Maghrib" },
            { key: "isha" as const, label: "Isha" },
          ].map(({ key, label }) => (
            <SettingRow
              key={key}
              label={`${label} Reminder`}
              rightElement={
                <Switch
                  value={settings.notifications[key]}
                  onValueChange={async (val) => {
                    await updateSettings({
                      notifications: { ...settings.notifications, [key]: val },
                    });
                  }}
                  trackColor={{ false: "#2A2A4A", true: "rgba(124, 58, 237, 0.5)" }}
                  thumbColor={settings.notifications[key] ? "#7C3AED" : "#4A4A6A"}
                />
              }
            />
          ))}
        </View>

        {/* App */}
        <Text style={styles.sectionHeader}>App</Text>
        <View style={styles.settingsGroup}>
          <SettingRow
            label="Restart Onboarding"
            onPress={handleResetOnboarding}
          />
        </View>

        {/* About */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>نور • Noor</Text>
          <Text style={styles.aboutSubtitle}>Muslim Companion App</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          <Text style={styles.aboutText}>
            Quran data from AlQuran.cloud API{"\n"}
            Prayer times calculated using astronomical formulas{"\n"}
            Hadith data from hadith.gading.dev
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#F0F0FF",
    textAlign: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 8 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7C3AED",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  settingsGroup: {
    backgroundColor: "#12122A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C3A",
  },
  settingLabel: {
    fontSize: 15,
    color: "#F0F0FF",
    fontWeight: "500",
    flex: 1,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "60%",
  },
  settingValue: {
    fontSize: 13,
    color: "#8B8BB0",
    textAlign: "right",
    flex: 1,
  },
  chevron: { color: "#4A4A6A", fontSize: 18 },
  picker: {
    borderTopWidth: 1,
    borderTopColor: "#2A2A4A",
    backgroundColor: "#0D0D20",
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C3A",
  },
  pickerItemActive: { backgroundColor: "rgba(124, 58, 237, 0.15)" },
  pickerItemText: { color: "#F0F0FF", fontSize: 14 },
  pickerItemTextActive: { color: "#7C3AED", fontWeight: "600" },
  pickerItemSub: { color: "#4A4A6A", fontSize: 12 },
  aboutCard: {
    backgroundColor: "#12122A",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    gap: 4,
    marginTop: 8,
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F59E0B",
  },
  aboutSubtitle: {
    fontSize: 14,
    color: "#8B8BB0",
  },
  aboutVersion: {
    fontSize: 12,
    color: "#4A4A6A",
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 12,
    color: "#4A4A6A",
    textAlign: "center",
    lineHeight: 20,
  },
});
