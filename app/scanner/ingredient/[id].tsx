import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { INGREDIENT_DATABASE, HalalStatus } from "@/lib/data/halalIngredients";

function getStatusConfig(status: HalalStatus) {
  return {
    halal: { gradColors: ["#1B4332", "#0D2B1A"] as [string, string], text: "#4ADE80", label: "HALAL", icon: "✅", description: "This ingredient is permissible for Muslims to consume." },
    haram: { gradColors: ["#450A0A", "#2D0707"] as [string, string], text: "#F87171", label: "HARAM", icon: "❌", description: "This ingredient is prohibited for Muslims to consume." },
    mushbooh: { gradColors: ["#431407", "#2C0D05"] as [string, string], text: "#FB923C", label: "MUSHBOOH", icon: "⚠️", description: "This ingredient is doubtful. Its source needs verification before consuming." },
    unknown: { gradColors: ["#1C1C2E", "#0F0F1A"] as [string, string], text: "#94A3B8", label: "UNKNOWN", icon: "❓", description: "The Halal status of this ingredient could not be determined." },
  }[status];
}

export default function IngredientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const ingredient = INGREDIENT_DATABASE.find((i) => i.id === id);

  if (!ingredient) {
    return (
      <ScreenContainer containerClassName="bg-[#0A0A1A]" safeAreaClassName="bg-[#0A0A1A]">
        <View style={styles.header}>
          <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Ingredient Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.notFoundEmoji}>🔍</Text>
          <Text style={styles.notFoundTitle}>Ingredient Not Found</Text>
          <Pressable style={({ pressed }) => [styles.backToListBtn, pressed && { opacity: 0.8 }]} onPress={() => router.back()}>
            <Text style={styles.backToListBtnText}>Back to Ingredient Guide</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const cfg = getStatusConfig(ingredient.status);

  return (
    <ScreenContainer containerClassName="bg-[#0A0A1A]" safeAreaClassName="bg-[#0A0A1A]">
      <View style={styles.header}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Ingredient Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <LinearGradient colors={cfg.gradColors} style={styles.statusBanner}>
          <Text style={styles.statusIcon}>{cfg.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusLabel, { color: cfg.text }]}>{cfg.label}</Text>
            <Text style={styles.statusDesc}>{cfg.description}</Text>
          </View>
        </LinearGradient>

        {/* Name & E-Numbers */}
        <View style={styles.section}>
          <Text style={styles.ingredientName}>{ingredient.name}</Text>
          <Text style={styles.ingredientCategory}>{ingredient.category}</Text>
          {ingredient.eNumbers.length > 0 && (
            <View style={styles.eNumbersRow}>
              {ingredient.eNumbers.map((e) => (
                <View key={e} style={styles.eNumberChip}>
                  <Text style={styles.eNumberChipText}>{e}</Text>
                </View>
              ))}
            </View>
          )}
          {ingredient.otherNames.length > 0 && (
            <View style={styles.altNamesRow}>
              <Text style={styles.altNamesLabel}>Also known as: </Text>
              <Text style={styles.altNamesValue}>{ingredient.otherNames.join(", ")}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 What is it?</Text>
          <Text style={styles.cardText}>{ingredient.whatIsIt}</Text>
        </View>

        {/* Source */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔬 Source</Text>
          <Text style={styles.cardText}>{ingredient.sourceDetails}</Text>
        </View>

        {/* Islamic Ruling */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📖 Islamic Ruling</Text>
          <Text style={styles.cardText}>{ingredient.islamicRuling}</Text>
        </View>

        {/* How to Identify */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔍 How to Identify</Text>
          <Text style={styles.cardText}>{ingredient.howToIdentify}</Text>
        </View>

        {/* Alternatives */}
        {ingredient.alternatives.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>✅ Halal Alternatives</Text>
            {ingredient.alternatives.map((alt, i) => (
              <View key={i} style={styles.altItem}>
                <View style={styles.altDot} />
                <Text style={styles.altText}>{alt.name} ({alt.source})</Text>
              </View>
            ))}
          </View>
        )}

        {/* Common Products */}
        {ingredient.commonProducts.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🛒 Commonly Found In</Text>
            <View style={styles.tagsRow}>
              {ingredient.commonProducts.map((p, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{p}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Scholarly Opinions */}
        {ingredient.scholarlyOpinions && ingredient.scholarlyOpinions.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📚 Scholarly Opinions</Text>
            {ingredient.scholarlyOpinions.map((op, i) => (
              <View key={i} style={styles.opinionItem}>
                <Text style={styles.opinionSchool}>{op.school}</Text>
                <Text style={styles.refText}>{op.opinion}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Why It Matters */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💡 Why It Matters</Text>
          <Text style={styles.cardText}>{ingredient.whyItMatters}</Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ This information is for educational purposes. Always verify with trusted scholars and certified Halal bodies.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1E293B", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  notFoundEmoji: { fontSize: 48, marginBottom: 16 },
  notFoundTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF", marginBottom: 20 },
  backToListBtn: { backgroundColor: "#166534", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  backToListBtnText: { color: "#FFFFFF", fontWeight: "700" },
  content: { paddingBottom: 120 },
  statusBanner: { flexDirection: "row", alignItems: "center", gap: 14, margin: 20, borderRadius: 16, padding: 18 },
  statusIcon: { fontSize: 36 },
  statusLabel: { fontSize: 20, fontWeight: "800" },
  statusDesc: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4, lineHeight: 18 },
  section: { paddingHorizontal: 20, marginBottom: 8 },
  ingredientName: { fontSize: 24, fontWeight: "800", color: "#FFFFFF" },
  ingredientCategory: { fontSize: 14, color: "#94A3B8", marginTop: 4, textTransform: "capitalize" },
  eNumbersRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  eNumberChip: { backgroundColor: "#0D2B1A", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  eNumberChipText: { fontSize: 13, color: "#4ADE80", fontWeight: "700" },
  altNamesRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  altNamesLabel: { fontSize: 12, color: "#64748B" },
  altNamesValue: { fontSize: 12, color: "#94A3B8", flex: 1 },
  card: { backgroundColor: "#111827", borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginBottom: 10 },
  cardText: { fontSize: 13, color: "#94A3B8", lineHeight: 22 },
  altItem: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  altDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ADE80" },
  altText: { fontSize: 13, color: "#94A3B8" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { backgroundColor: "#1E293B", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, color: "#94A3B8" },
  refText: { fontSize: 12, color: "#64748B", lineHeight: 20, marginBottom: 4 },
  disclaimer: { marginHorizontal: 20, marginTop: 8, backgroundColor: "#1C1917", borderRadius: 10, padding: 12 },
  disclaimerText: { fontSize: 11, color: "#78716C", lineHeight: 17, textAlign: "center" },
  opinionItem: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1E293B" },
  opinionSchool: { fontSize: 12, fontWeight: "700", color: "#4ADE80", marginBottom: 4 },
});
