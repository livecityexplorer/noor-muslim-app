import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DhikrCounter } from "@/components/DhikrCounter";

const HADITH_COLLECTIONS = [
  { id: "bukhari", name: "Sahih Al-Bukhari", count: "7,563", color: "#F59E0B", icon: "📚" },
  { id: "muslim", name: "Sahih Muslim", count: "5,362", color: "#4FC3F7", icon: "📖" },
  { id: "abudawud", name: "Sunan Abu Dawud", count: "5,274", color: "#7C3AED", icon: "📜" },
  { id: "tirmidhi", name: "Jami At-Tirmidhi", count: "3,956", color: "#EC4899", icon: "📋" },
  { id: "nasai", name: "Sunan An-Nasa'i", count: "5,758", color: "#22C55E", icon: "📝" },
  { id: "ibnmajah", name: "Sunan Ibn Majah", count: "4,341", color: "#8B5CF6", icon: "📃" },
];

type Tab = "dhikr" | "hadith";

export default function MoreScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("dhikr");

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#1A0040", "#0D0D2A", "#0A0A1A"]}
        style={styles.header}
      >
        <View style={styles.decorCircle} />
        <SafeAreaView edges={["top"]}>
          <Text style={styles.headerTitle}>More</Text>
          {/* Tab switcher */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "dhikr" && styles.tabBtnActive]}
              onPress={() => setActiveTab("dhikr")}
            >
              <Text style={[styles.tabBtnText, activeTab === "dhikr" && styles.tabBtnTextActive]}>
                📿 Dhikr Counter
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "hadith" && styles.tabBtnActive]}
              onPress={() => setActiveTab("hadith")}
            >
              <Text style={[styles.tabBtnText, activeTab === "hadith" && styles.tabBtnTextActive]}>
                📚 Hadith
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {activeTab === "dhikr" ? (
        <DhikrCounter />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Hadith Collections</Text>
          <Text style={styles.sectionSubtitle}>
            Browse authentic hadith from the major collections
          </Text>
          {HADITH_COLLECTIONS.map((collection) => (
            <TouchableOpacity
              key={collection.id}
              style={styles.collectionCard}
              onPress={() => router.push(`/hadith/${collection.id}` as any)}
            >
              <LinearGradient
                colors={[collection.color + "20", collection.color + "08"]}
                style={styles.collectionGradient}
              >
                <View style={[styles.collectionIcon, { backgroundColor: collection.color + "20", borderColor: collection.color + "40" }]}>
                  <Text style={styles.collectionIconText}>{collection.icon}</Text>
                </View>
                <View style={styles.collectionInfo}>
                  <Text style={styles.collectionName}>{collection.name}</Text>
                  <Text style={styles.collectionCount}>{collection.count} Hadiths</Text>
                </View>
                <Text style={[styles.collectionArrow, { color: collection.color }]}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}

          {/* Islamic Calendar Note */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>📅 About Hadith Collections</Text>
            <Text style={styles.infoCardText}>
              These are the six major hadith collections (Kutub al-Sittah) considered most authentic by Sunni Muslims. Sahih Al-Bukhari and Sahih Muslim are considered the most reliable.
            </Text>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A1A" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    overflow: "hidden",
  },
  decorCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.15)",
    top: -60,
    right: -40,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#F0F0FF",
    paddingTop: 8,
    marginBottom: 12,
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: "#12122A",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: "#7C3AED",
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A4A6A",
  },
  tabBtnTextActive: {
    color: "#FFFFFF",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#8B8BB0",
    marginBottom: 4,
  },
  collectionCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  collectionGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  collectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  collectionIconText: { fontSize: 24 },
  collectionInfo: { flex: 1 },
  collectionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F0F0FF",
    marginBottom: 2,
  },
  collectionCount: {
    fontSize: 12,
    color: "#8B8BB0",
  },
  collectionArrow: {
    fontSize: 20,
    fontWeight: "700",
  },
  infoCard: {
    backgroundColor: "#12122A",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    gap: 8,
    marginTop: 4,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  infoCardText: {
    fontSize: 13,
    color: "#8B8BB0",
    lineHeight: 20,
  },
});
