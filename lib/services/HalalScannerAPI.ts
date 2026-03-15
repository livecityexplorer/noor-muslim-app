import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  HalalStatus,
  HARAM_KEYWORDS,
  MUSHBOOH_KEYWORDS,
  HALAL_KEYWORDS,
  INGREDIENT_DATABASE,
  Ingredient,
} from "@/lib/data/halalIngredients";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  brands: string;
  image_url?: string;
  image_front_url?: string;
  ingredients_text?: string;
  ingredients_text_en?: string;
  categories?: string;
  categories_tags?: string[];
  nutriments?: Record<string, number>;
  allergens_tags?: string[];
  labels_tags?: string[];
  stores?: string;
  countries?: string;
  quantity?: string;
}

export interface IngredientAnalysis {
  name: string;
  status: HalalStatus;
  reason: string;
  matchedIngredient?: Ingredient;
}

export interface ProductAnalysis {
  barcode: string;
  productName: string;
  brand: string;
  imageUrl?: string;
  overallStatus: HalalStatus;
  confidence: "certified" | "high" | "medium" | "low";
  summary: string;
  ingredients: string[];
  ingredientAnalysis: IngredientAnalysis[];
  concerningIngredients: string[];
  categories: string[];
  certifications: string[];
  rawProduct?: OpenFoodFactsProduct;
  analyzedAt: number;
}

export interface ScanHistoryItem {
  id: string;
  barcode: string;
  productName: string;
  brand: string;
  imageUrl?: string;
  overallStatus: HalalStatus;
  summary: string;
  scannedAt: number;
}

export interface FavoriteItem extends ScanHistoryItem {
  note?: string;
  collection?: string;
  savedAt: number;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  HISTORY: "halal_scan_history",
  FAVORITES: "halal_favorites",
  PRODUCT_CACHE: "halal_product_cache",
  SETTINGS: "halal_scanner_settings",
};

// ─── Open Food Facts API ──────────────────────────────────────────────────────

const OFF_BASE = "https://world.openfoodfacts.org/api/v2";
const OFF_SEARCH = "https://world.openfoodfacts.org/cgi/search.pl";

export async function fetchProductByBarcode(barcode: string): Promise<OpenFoodFactsProduct | null> {
  // Check cache first
  try {
    const cacheRaw = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCT_CACHE);
    const cache: Record<string, { product: OpenFoodFactsProduct; cachedAt: number }> = cacheRaw
      ? JSON.parse(cacheRaw)
      : {};
    const cached = cache[barcode];
    if (cached && Date.now() - cached.cachedAt < 7 * 24 * 60 * 60 * 1000) {
      return cached.product;
    }
  } catch {
    // ignore cache errors
  }

  try {
    const res = await fetch(
      `${OFF_BASE}/product/${barcode}?fields=code,product_name,brands,image_url,image_front_url,ingredients_text,ingredients_text_en,categories,categories_tags,allergens_tags,labels_tags,stores,quantity`,
      { headers: { "User-Agent": "NoorApp/1.0 (halal-scanner)" } }
    );
    const json = await res.json();
    if (json.status === 1 && json.product) {
      const product = json.product as OpenFoodFactsProduct;
      // Save to cache
      try {
        const cacheRaw = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCT_CACHE);
        const cache: Record<string, { product: OpenFoodFactsProduct; cachedAt: number }> = cacheRaw
          ? JSON.parse(cacheRaw)
          : {};
        cache[barcode] = { product, cachedAt: Date.now() };
        // Keep cache under 200 entries
        const keys = Object.keys(cache);
        if (keys.length > 200) {
          const oldest = keys.sort((a, b) => cache[a].cachedAt - cache[b].cachedAt)[0];
          delete cache[oldest];
        }
        await AsyncStorage.setItem(STORAGE_KEYS.PRODUCT_CACHE, JSON.stringify(cache));
      } catch {
        // ignore
      }
      return product;
    }
    return null;
  } catch {
    return null;
  }
}

export async function searchProducts(
  query: string,
  page = 1
): Promise<OpenFoodFactsProduct[]> {
  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: "1",
      action: "process",
      json: "1",
      page: String(page),
      page_size: "20",
      fields: "code,product_name,brands,image_front_url,ingredients_text,categories_tags,labels_tags",
    });
    const res = await fetch(`${OFF_SEARCH}?${params}`, {
      headers: { "User-Agent": "NoorApp/1.0 (halal-scanner)" },
    });
    const json = await res.json();
    return (json.products as OpenFoodFactsProduct[]) || [];
  } catch {
    return [];
  }
}

// ─── Halal Analysis Engine ────────────────────────────────────────────────────

function normalizeIngredient(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim();
}

function analyzeIngredientText(ingredientText: string): IngredientAnalysis[] {
  const results: IngredientAnalysis[] = [];
  // Split by comma, semicolon, or parentheses
  const parts = ingredientText
    .split(/[,;()[\]]/)
    .map((p) => p.trim())
    .filter((p) => p.length > 2);

  for (const part of parts) {
    const normalized = normalizeIngredient(part);
    if (!normalized) continue;

    // Check against ingredient database
    const dbMatch = INGREDIENT_DATABASE.find(
      (ing) =>
        normalized.includes(ing.name.toLowerCase()) ||
        ing.otherNames.some((n) => normalized.includes(n.toLowerCase())) ||
        ing.eNumbers.some((e) => normalized.includes(e.toLowerCase()))
    );

    if (dbMatch) {
      results.push({
        name: part.trim(),
        status: dbMatch.status,
        reason: dbMatch.shortDescription,
        matchedIngredient: dbMatch,
      });
      continue;
    }

    // Check Haram keywords
    const haramMatch = HARAM_KEYWORDS.find((kw) => normalized.includes(kw));
    if (haramMatch) {
      results.push({
        name: part.trim(),
        status: "haram",
        reason: `Contains '${haramMatch}' which is prohibited in Islam.`,
      });
      continue;
    }

    // Check Mushbooh keywords
    const mushboohMatch = MUSHBOOH_KEYWORDS.find((kw) => normalized.includes(kw));
    if (mushboohMatch) {
      results.push({
        name: part.trim(),
        status: "mushbooh",
        reason: `Contains '${mushboohMatch}' — source needs verification.`,
      });
      continue;
    }

    // Check Halal keywords
    const halalMatch = HALAL_KEYWORDS.find((kw) => normalized.includes(kw));
    if (halalMatch) {
      results.push({
        name: part.trim(),
        status: "halal",
        reason: "Plant-based or synthetic ingredient.",
      });
      continue;
    }

    // Unknown
    results.push({
      name: part.trim(),
      status: "unknown",
      reason: "Source not determined. Verify with manufacturer.",
    });
  }

  return results;
}

function determineOverallStatus(
  analyses: IngredientAnalysis[],
  labels: string[]
): { status: HalalStatus; confidence: ProductAnalysis["confidence"] } {
  // Check for Halal certification labels
  const halalCertified = labels.some(
    (l) =>
      l.includes("halal") ||
      l.includes("ifanca") ||
      l.includes("hfa") ||
      l.includes("mui") ||
      l.includes("jakim")
  );
  if (halalCertified) {
    return { status: "halal", confidence: "certified" };
  }

  // Check for any Haram ingredients
  const hasHaram = analyses.some((a) => a.status === "haram");
  if (hasHaram) {
    return { status: "haram", confidence: "high" };
  }

  // Check for Mushbooh
  const hasMushbooh = analyses.some((a) => a.status === "mushbooh");
  if (hasMushbooh) {
    return { status: "mushbooh", confidence: "medium" };
  }

  // Check for Unknown
  const hasUnknown = analyses.some((a) => a.status === "unknown");
  if (hasUnknown) {
    return { status: "mushbooh", confidence: "low" };
  }

  // All known Halal
  if (analyses.length > 0) {
    return { status: "halal", confidence: "high" };
  }

  return { status: "unknown", confidence: "low" };
}

function buildSummary(
  status: HalalStatus,
  analyses: IngredientAnalysis[],
  productName: string
): string {
  const concerning = analyses.filter((a) => a.status === "haram" || a.status === "mushbooh");

  if (status === "halal") {
    return `${productName} appears to contain Halal ingredients. No prohibited substances were detected in the ingredient list.`;
  }
  if (status === "haram") {
    const haramItems = concerning.filter((a) => a.status === "haram").map((a) => a.name);
    return `${productName} contains Haram ingredients: ${haramItems.slice(0, 3).join(", ")}. This product is not permissible for Muslims.`;
  }
  if (status === "mushbooh") {
    const doubtful = concerning.map((a) => a.name);
    return `${productName} contains doubtful (Mushbooh) ingredients: ${doubtful.slice(0, 3).join(", ")}. Source verification is required before consuming.`;
  }
  return `${productName} could not be fully analyzed. Please check the ingredient list manually or contact the manufacturer.`;
}

export function analyzeProduct(product: OpenFoodFactsProduct): ProductAnalysis {
  const ingredientText =
    product.ingredients_text_en || product.ingredients_text || "";
  const ingredientAnalysis = ingredientText
    ? analyzeIngredientText(ingredientText)
    : [];

  const labels = product.labels_tags || [];
  const { status, confidence } = determineOverallStatus(ingredientAnalysis, labels);

  const ingredients = ingredientText
    .split(/[,;]/)
    .map((i) => i.trim())
    .filter((i) => i.length > 1)
    .slice(0, 50);

  const concerningIngredients = ingredientAnalysis
    .filter((a) => a.status === "haram" || a.status === "mushbooh")
    .map((a) => a.name);

  const certifications = labels
    .filter((l) => l.includes("halal") || l.includes("organic") || l.includes("kosher"))
    .map((l) => l.replace("en:", "").replace(/-/g, " "));

  const categories = (product.categories_tags || [])
    .filter((c) => c.startsWith("en:"))
    .map((c) => c.replace("en:", "").replace(/-/g, " "))
    .slice(0, 5);

  const productName = product.product_name || "Unknown Product";
  const summary = buildSummary(status, ingredientAnalysis, productName);

  return {
    barcode: product.code,
    productName,
    brand: product.brands || "Unknown Brand",
    imageUrl: product.image_front_url || product.image_url,
    overallStatus: status,
    confidence,
    summary,
    ingredients,
    ingredientAnalysis,
    concerningIngredients,
    categories,
    certifications,
    rawProduct: product,
    analyzedAt: Date.now(),
  };
}

// ─── History Management ───────────────────────────────────────────────────────

export async function getScanHistory(): Promise<ScanHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addToHistory(analysis: ProductAnalysis): Promise<void> {
  try {
    const history = await getScanHistory();
    const item: ScanHistoryItem = {
      id: `${analysis.barcode}_${Date.now()}`,
      barcode: analysis.barcode,
      productName: analysis.productName,
      brand: analysis.brand,
      imageUrl: analysis.imageUrl,
      overallStatus: analysis.overallStatus,
      summary: analysis.summary,
      scannedAt: Date.now(),
    };
    // Remove duplicates (same barcode)
    const filtered = history.filter((h) => h.barcode !== analysis.barcode);
    const updated = [item, ...filtered].slice(0, 500);
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY);
}

export async function removeFromHistory(id: string): Promise<void> {
  const history = await getScanHistory();
  const updated = history.filter((h) => h.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
}

// ─── Favorites Management ─────────────────────────────────────────────────────

export async function getFavorites(): Promise<FavoriteItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addToFavorites(
  analysis: ProductAnalysis,
  note?: string,
  collection?: string
): Promise<void> {
  const favorites = await getFavorites();
  const item: FavoriteItem = {
    id: analysis.barcode,
    barcode: analysis.barcode,
    productName: analysis.productName,
    brand: analysis.brand,
    imageUrl: analysis.imageUrl,
    overallStatus: analysis.overallStatus,
    summary: analysis.summary,
    scannedAt: analysis.analyzedAt,
    note,
    collection,
    savedAt: Date.now(),
  };
  const filtered = favorites.filter((f) => f.id !== analysis.barcode);
  await AsyncStorage.setItem(
    STORAGE_KEYS.FAVORITES,
    JSON.stringify([item, ...filtered])
  );
}

export async function removeFromFavorites(barcode: string): Promise<void> {
  const favorites = await getFavorites();
  const updated = favorites.filter((f) => f.barcode !== barcode);
  await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
}

export async function isFavorite(barcode: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some((f) => f.barcode === barcode);
}

// ─── Scanner Settings ─────────────────────────────────────────────────────────

export interface ScannerSettings {
  autoSaveHistory: boolean;
  scanSound: boolean;
  vibrationOnScan: boolean;
  showImages: boolean;
  learningLevel: "beginner" | "intermediate" | "advanced";
  showArabicText: boolean;
  showScholarlyRefs: boolean;
  ingredientOfDayEnabled: boolean;
}

export const DEFAULT_SCANNER_SETTINGS: ScannerSettings = {
  autoSaveHistory: true,
  scanSound: true,
  vibrationOnScan: true,
  showImages: true,
  learningLevel: "beginner",
  showArabicText: true,
  showScholarlyRefs: false,
  ingredientOfDayEnabled: true,
};

export async function getScannerSettings(): Promise<ScannerSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SCANNER_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SCANNER_SETTINGS;
  } catch {
    return DEFAULT_SCANNER_SETTINGS;
  }
}

export async function saveScannerSettings(settings: Partial<ScannerSettings>): Promise<void> {
  const current = await getScannerSettings();
  await AsyncStorage.setItem(
    STORAGE_KEYS.SETTINGS,
    JSON.stringify({ ...current, ...settings })
  );
}
