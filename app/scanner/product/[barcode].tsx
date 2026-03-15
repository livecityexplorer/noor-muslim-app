import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  Share,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import {
  fetchProductByBarcode,
  analyzeProduct,
  addToHistory,
  addToFavorites,
  removeFromFavorites,
  isFavorite,
  ProductAnalysis,
} from "@/lib/services/HalalScannerAPI";
import { HalalStatus, Ingredient } from "@/lib/data/halalIngredients";

// ─── Status Config ────────────────────────────────────────────────────────────

function getStatusConfig(status: HalalStatus) {
  return {
    halal: { bg: "#1B4332", text: "#4ADE80", label: "HALAL", icon: "✅", gradColors: ["#1B4332", "#0D2B1A"] as [string, string] },
    haram: { bg: "#450A0A", text: "#F87171", label: "HARAM", icon: "❌", gradColors: ["#450A0A", "#2D0707"] as [string, string] },
    mushbooh: { bg: "#431407", text: "#FB923C", label: "MUSHBOOH", icon: "⚠️", gradColors: ["#431407", "#2C0D05"] as [string, string] },
    unknown: { bg: "#1C1C2E", text: "#94A3B8", label: "UNKNOWN", icon: "❓", gradColors: ["#1C1C2E", "#0F0F1A"] as [string, string] },
  }[status];
}

// ─── Accordion ────────────────────────────────────────────────────────────────

function Accordion({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.accordion}>
      <Pressable
        style={({ pressed }) => [styles.accordionHeader, pressed && { opacity: 0.8 }]}
        onPress={() => setOpen((v) => !v)}
      >
        <Text style={styles.accordionIcon}>{icon}</Text>
        <Text style={styles.accordionTitle}>{title}</Text>
        <IconSymbol name={open ? "chevron.up" : "chevron.down"} size={18} color="#4ADE80" />
      </Pressable>
      {open && <View style={styles.accordionContent}>{children}</View>}
    </View>
  );
}

// ─── Ingredient Row ───────────────────────────────────────────────────────────

function IngredientRow({
  name,
  status,
  reason,
  matchedIngredient,
  onPress,
}: {
  name: string;
  status: HalalStatus;
  reason: string;
  matchedIngredient?: Ingredient;
  onPress?: () => void;
}) {
  const cfg = getStatusConfig(status);
  return (
    <Pressable
      style={({ pressed }) => [styles.ingredientRow, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      <View style={[styles.ingredientDot, { backgroundColor: cfg.text }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.ingredientName}>{name}</Text>
        <Text style={styles.ingredientReason} numberOfLines={2}>{reason}</Text>
      </View>
      <View style={[styles.ingredientBadge, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.ingredientBadgeText, { color: cfg.text }]}>{cfg.icon}</Text>
      </View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProductDetailScreen() {
  const { barcode } = useLocalSearchParams<{ barcode: string }>();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorite, setFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    if (!barcode) return;
    setLoading(true);
    setError(null);
    try {
      const product = await fetchProductByBarcode(barcode);
      if (!product) {
        setError("Product not found in the database.");
        setLoading(false);
        return;
      }
      const result = analyzeProduct(product);
      await addToHistory(result);
      setAnalysis(result);
      const fav = await isFavorite(barcode);
      setFavorite(fav);
    } catch {
      setError("Failed to load product. Please check your connection.");
    }
    setLoading(false);
  }, [barcode]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleToggleFavorite = async () => {
    if (!analysis) return;
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (favorite) {
      await removeFromFavorites(analysis.barcode);
      setFavorite(false);
    } else {
      await addToFavorites(analysis);
      setFavorite(true);
    }
  };

  const handleShare = async () => {
    if (!analysis) return;
    const cfg = getStatusConfig(analysis.overallStatus);
    await Share.share({
      message: `${cfg.icon} ${analysis.productName} (${analysis.brand})\nHalal Status: ${cfg.label}\n\n${analysis.summary}\n\nChecked with Noor - Muslim Companion App`,
    });
  };

  if (loading) {
    return (
      <ScreenContainer containerClassName="bg-[#0A0A1A]" safeAreaClassName="bg-[#0A0A1A]">
        <View style={styles.center}>
          <ActivityIndicator color="#4ADE80" size="large" />
          <Text style={styles.loadingText}>Analyzing product...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !analysis) {
    return (
      <ScreenContainer containerClassName="bg-[#0A0A1A]" safeAreaClassName="bg-[#0A0A1A]">
        <View style={styles.header}>
          <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorTitle}>Product Not Found</Text>
          <Text style={styles.errorBody}>{error || "This product could not be analyzed."}</Text>
          <Pressable style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]} onPress={loadProduct}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const cfg = getStatusConfig(analysis.overallStatus);
  const haramIngredients = analysis.ingredientAnalysis.filter((a) => a.status === "haram");
  const mushboohIngredients = analysis.ingredientAnalysis.filter((a) => a.status === "mushbooh");
  const halalIngredients = analysis.ingredientAnalysis.filter((a) => a.status === "halal");

  return (
    <ScreenContainer containerClassName="bg-[#0A0A1A]" safeAreaClassName="bg-[#0A0A1A]">
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.headerActions}>
          <Pressable style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]} onPress={handleToggleFavorite}>
            <IconSymbol name={favorite ? "heart.fill" : "bookmark"} size={22} color={favorite ? "#F87171" : "#94A3B8"} />
          </Pressable>
          <Pressable style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]} onPress={handleShare}>
            <IconSymbol name="square.and.arrow.up" size={22} color="#94A3B8" />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {analysis.imageUrl ? (
            <Image source={{ uri: analysis.imageUrl }} style={styles.productImage} resizeMode="contain" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={{ fontSize: 60 }}>🛒</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{analysis.productName}</Text>
          <Text style={styles.productBrand}>{analysis.brand}</Text>
          <View style={styles.barcodeRow}>
            <Text style={styles.barcodeLabel}>Barcode: </Text>
            <Text style={styles.barcodeValue}>{analysis.barcode}</Text>
          </View>
          {analysis.categories.length > 0 && (
            <View style={styles.categoriesRow}>
              {analysis.categories.slice(0, 3).map((cat) => (
                <View key={cat} style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{cat}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Status Card */}
        <LinearGradient colors={cfg.gradColors} style={styles.statusCard}>
          <View style={styles.statusCardHeader}>
            <Text style={styles.statusIcon}>{cfg.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusLabel, { color: cfg.text }]}>{cfg.label}</Text>
              <Text style={styles.statusConfidence}>
                {analysis.confidence === "certified" ? "✓ Halal Certified" :
                  analysis.confidence === "high" ? "High Confidence Analysis" :
                  analysis.confidence === "medium" ? "Medium Confidence — Verify Recommended" :
                  "Low Confidence — Manual Verification Required"}
              </Text>
            </View>
          </View>
          <Text style={styles.statusSummary}>{analysis.summary}</Text>
          {analysis.certifications.length > 0 && (
            <View style={styles.certRow}>
              {analysis.certifications.map((cert) => (
                <View key={cert} style={styles.certChip}>
                  <Text style={styles.certChipText}>✓ {cert}</Text>
                </View>
              ))}
            </View>
          )}
        </LinearGradient>

        {/* Accordions */}
        <View style={styles.accordions}>

          {/* Ingredient Analysis */}
          <Accordion title="Ingredient Analysis" icon="🔬" defaultOpen>
            {analysis.ingredientAnalysis.length === 0 ? (
              <Text style={styles.noDataText}>No ingredient data available for this product.</Text>
            ) : (
              <>
                {haramIngredients.length > 0 && (
                  <View style={styles.ingredientGroup}>
                    <Text style={styles.ingredientGroupTitle}>❌ Haram Ingredients</Text>
                    {haramIngredients.map((a, i) => (
                      <IngredientRow key={i} name={a.name} status={a.status} reason={a.reason} matchedIngredient={a.matchedIngredient}
                        onPress={a.matchedIngredient ? () => router.push(`/scanner/ingredient/${a.matchedIngredient!.id}` as any) : undefined}
                      />
                    ))}
                  </View>
                )}
                {mushboohIngredients.length > 0 && (
                  <View style={styles.ingredientGroup}>
                    <Text style={styles.ingredientGroupTitle}>⚠️ Doubtful Ingredients</Text>
                    {mushboohIngredients.map((a, i) => (
                      <IngredientRow key={i} name={a.name} status={a.status} reason={a.reason} matchedIngredient={a.matchedIngredient}
                        onPress={a.matchedIngredient ? () => router.push(`/scanner/ingredient/${a.matchedIngredient!.id}` as any) : undefined}
                      />
                    ))}
                  </View>
                )}
                {halalIngredients.length > 0 && (
                  <View style={styles.ingredientGroup}>
                    <Text style={styles.ingredientGroupTitle}>✅ Halal Ingredients ({halalIngredients.length})</Text>
                    {halalIngredients.slice(0, 5).map((a, i) => (
                      <IngredientRow key={i} name={a.name} status={a.status} reason={a.reason} />
                    ))}
                    {halalIngredients.length > 5 && (
                      <Text style={styles.moreText}>+{halalIngredients.length - 5} more Halal ingredients</Text>
                    )}
                  </View>
                )}
              </>
            )}
          </Accordion>

          {/* Islamic Rulings */}
          <Accordion title="Islamic Rulings" icon="📚">
            <Text style={styles.sectionText}>
              The determination of Halal status is based on the following Islamic principles:
            </Text>
            <View style={styles.ruleCard}>
              <Text style={styles.ruleTitle}>Quran 2:173</Text>
              <Text style={styles.ruleArabic}>إِنَّمَا حَرَّمَ عَلَيْكُمُ الْمَيْتَةَ وَالدَّمَ وَلَحْمَ الْخِنزِيرِ</Text>
              <Text style={styles.ruleTranslation}>"He has only forbidden to you dead animals, blood, the flesh of swine, and that which has been dedicated to other than Allah."</Text>
            </View>
            <View style={styles.ruleCard}>
              <Text style={styles.ruleTitle}>Hadith (Bukhari & Muslim)</Text>
              <Text style={styles.ruleTranslation}>"The halal is clear and the haram is clear, and between them are doubtful matters about which many people do not know. Whoever avoids doubtful matters clears himself in regard to his religion and his honor."</Text>
            </View>
            <View style={styles.principlesSection}>
              <Text style={styles.principlesTitle}>Key Principles Applied:</Text>
              <Text style={styles.principleItem}>• <Text style={styles.principleLabel}>Istihala:</Text> Transformation — does processing change the nature of a Haram substance?</Text>
              <Text style={styles.principleItem}>• <Text style={styles.principleLabel}>Istihlak:</Text> Consumption — is the Haram substance present in negligible quantities?</Text>
              <Text style={styles.principleItem}>• <Text style={styles.principleLabel}>Sadd al-dhara'i:</Text> Blocking means to harm — avoiding doubtful matters as a precaution.</Text>
            </View>
          </Accordion>

          {/* Scientific Context */}
          <Accordion title="Scientific Context" icon="🧪">
            <Text style={styles.sectionText}>
              Understanding how ingredients are derived helps Muslims make informed decisions about what they consume.
            </Text>
            {analysis.concerningIngredients.length > 0 ? (
              <View>
                <Text style={styles.sectionSubTitle}>Concerning Ingredients:</Text>
                {analysis.concerningIngredients.slice(0, 5).map((ing, i) => (
                  <View key={i} style={styles.scienceItem}>
                    <Text style={styles.scienceItemName}>{ing}</Text>
                    <Text style={styles.scienceItemDesc}>
                      This ingredient requires source verification. Animal-derived versions may not be Halal.
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataText}>No specific scientific concerns identified for this product's ingredients.</Text>
            )}
          </Accordion>

          {/* Why It Matters */}
          <Accordion title="Why It Matters" icon="💡">
            <View style={styles.whyCard}>
              <Text style={styles.whyTitle}>Spiritual Significance</Text>
              <Text style={styles.whyText}>Consuming Halal food is an act of worship. The Prophet ﷺ said: "O people, Allah is Good and He only accepts that which is good." (Muslim)</Text>
            </View>
            <View style={styles.whyCard}>
              <Text style={styles.whyTitle}>Your Body is an Amanah</Text>
              <Text style={styles.whyText}>Your body is a trust (amanah) from Allah. Nourishing it with Halal food is part of fulfilling that trust.</Text>
            </View>
            <View style={styles.whyCard}>
              <Text style={styles.whyTitle}>Duas Are Accepted</Text>
              <Text style={styles.whyText}>Consuming Halal food is a condition for the acceptance of duas. The Prophet ﷺ mentioned a man whose food and drink are Haram — "how can his supplication be answered?"</Text>
            </View>
          </Accordion>

          {/* Verification Steps */}
          <Accordion title="How to Verify" icon="📞">
            <Text style={styles.sectionText}>Steps to verify this product's Halal status yourself:</Text>
            <View style={styles.stepsList}>
              {[
                "Check the package for a Halal certification logo (IFANCA, HFA, MUI, JAKIM, MUIS)",
                "Look for the certification number and verify it on the certifying body's website",
                "Contact the manufacturer directly and ask about the source of specific ingredients",
                "Check if the product is listed on a trusted Halal product database",
                "When in doubt, choose a certified alternative",
              ].map((step, i) => (
                <View key={i} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </Accordion>

        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.8 }]}
            onPress={handleToggleFavorite}
          >
            <Text style={styles.primaryBtnText}>{favorite ? "❤️ Saved to Favorites" : "🔖 Save to Favorites"}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}
            onPress={handleShare}
          >
            <Text style={styles.secondaryBtnText}>📤 Share Analysis</Text>
          </Pressable>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ This analysis is for educational purposes only. Always verify with trusted scholars and certified Halal bodies. When in doubt, abstain.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, backgroundColor: "#0A0A1A" },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1E293B", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1E293B", alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingBottom: 120 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  loadingText: { color: "#94A3B8", marginTop: 16, fontSize: 14 },
  errorEmoji: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF", marginBottom: 8 },
  errorBody: { fontSize: 14, color: "#94A3B8", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  retryBtn: { backgroundColor: "#166534", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  retryBtnText: { color: "#FFFFFF", fontWeight: "700" },
  imageContainer: { height: 200, backgroundColor: "#111827", alignItems: "center", justifyContent: "center" },
  productImage: { width: "100%", height: 200 },
  imagePlaceholder: { alignItems: "center", justifyContent: "center", height: 200 },
  productInfo: { padding: 20 },
  productName: { fontSize: 22, fontWeight: "800", color: "#FFFFFF", lineHeight: 30 },
  productBrand: { fontSize: 15, color: "#94A3B8", marginTop: 4 },
  barcodeRow: { flexDirection: "row", marginTop: 8 },
  barcodeLabel: { fontSize: 13, color: "#64748B" },
  barcodeValue: { fontSize: 13, color: "#94A3B8", fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },
  categoriesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  categoryChip: { backgroundColor: "#1E293B", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  categoryChipText: { fontSize: 11, color: "#94A3B8", textTransform: "capitalize" },
  statusCard: { marginHorizontal: 20, borderRadius: 16, padding: 18, marginBottom: 8 },
  statusCardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  statusIcon: { fontSize: 36 },
  statusLabel: { fontSize: 22, fontWeight: "800" },
  statusConfidence: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  statusSummary: { fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 22 },
  certRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  certChip: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  certChipText: { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  accordions: { paddingHorizontal: 20, marginTop: 8, gap: 8 },
  accordion: { backgroundColor: "#111827", borderRadius: 14, overflow: "hidden" },
  accordionHeader: { flexDirection: "row", alignItems: "center", padding: 16, gap: 10 },
  accordionIcon: { fontSize: 18 },
  accordionTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  accordionContent: { paddingHorizontal: 16, paddingBottom: 16 },
  ingredientGroup: { marginBottom: 12 },
  ingredientGroupTitle: { fontSize: 13, fontWeight: "700", color: "#94A3B8", marginBottom: 8 },
  ingredientRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#1E293B" },
  ingredientDot: { width: 8, height: 8, borderRadius: 4 },
  ingredientName: { fontSize: 13, color: "#FFFFFF", fontWeight: "600" },
  ingredientReason: { fontSize: 11, color: "#64748B", marginTop: 2, lineHeight: 16 },
  ingredientBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  ingredientBadgeText: { fontSize: 14 },
  moreText: { fontSize: 12, color: "#4ADE80", marginTop: 8 },
  noDataText: { fontSize: 13, color: "#64748B", lineHeight: 20 },
  sectionText: { fontSize: 13, color: "#94A3B8", lineHeight: 20, marginBottom: 12 },
  sectionSubTitle: { fontSize: 13, fontWeight: "700", color: "#FFFFFF", marginBottom: 8 },
  ruleCard: { backgroundColor: "#0D2B1A", borderRadius: 10, padding: 14, marginBottom: 10 },
  ruleTitle: { fontSize: 12, fontWeight: "700", color: "#4ADE80", marginBottom: 6 },
  ruleArabic: { fontSize: 16, color: "#D1FAE5", textAlign: "right", lineHeight: 28, marginBottom: 8 },
  ruleTranslation: { fontSize: 13, color: "#94A3B8", lineHeight: 20, fontStyle: "italic" },
  principlesSection: { marginTop: 8 },
  principlesTitle: { fontSize: 13, fontWeight: "700", color: "#FFFFFF", marginBottom: 8 },
  principleItem: { fontSize: 13, color: "#94A3B8", lineHeight: 22 },
  principleLabel: { fontWeight: "700", color: "#CBD5E1" },
  scienceItem: { backgroundColor: "#1E293B", borderRadius: 10, padding: 12, marginBottom: 8 },
  scienceItemName: { fontSize: 13, fontWeight: "700", color: "#FFFFFF", marginBottom: 4 },
  scienceItemDesc: { fontSize: 12, color: "#94A3B8", lineHeight: 18 },
  whyCard: { backgroundColor: "#0D2B1A", borderRadius: 10, padding: 14, marginBottom: 10 },
  whyTitle: { fontSize: 13, fontWeight: "700", color: "#4ADE80", marginBottom: 6 },
  whyText: { fontSize: 13, color: "#94A3B8", lineHeight: 20 },
  stepsList: { gap: 10 },
  stepItem: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  stepNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#166534", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  stepNumberText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  stepText: { flex: 1, fontSize: 13, color: "#94A3B8", lineHeight: 20 },
  actionButtons: { paddingHorizontal: 20, marginTop: 20, gap: 10 },
  primaryBtn: { backgroundColor: "#166534", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  secondaryBtn: { backgroundColor: "#1E293B", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  secondaryBtnText: { color: "#94A3B8", fontWeight: "700", fontSize: 15 },
  disclaimer: { marginHorizontal: 20, marginTop: 16, backgroundColor: "#1C1917", borderRadius: 10, padding: 12 },
  disclaimerText: { fontSize: 11, color: "#78716C", lineHeight: 17, textAlign: "center" },
});
