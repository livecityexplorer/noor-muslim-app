import { describe, it, expect } from "vitest";
import { getAudioUrl, getSurahAudioUrl, getTranslationEdition } from "../lib/services/QuranAPI";
import { HADITH_COLLECTIONS } from "../lib/services/HadithAPI";
import { RECITERS, CALCULATION_METHODS, ADHAN_STYLES, LANGUAGES } from "../lib/contexts/AppSettingsContext";

describe("QuranAPI", () => {
  it("generates correct audio URL for Alafasy", () => {
    const url = getAudioUrl("ar.alafasy", 1, 1);
    expect(url).toContain("everyayah.com");
    expect(url).toContain("Alafasy_128kbps");
    expect(url).toContain("001001.mp3");
  });

  it("generates correct surah audio URL", () => {
    const url = getSurahAudioUrl("ar.alafasy", 1);
    // Updated to use quranicaudio.com QDC CDN (mp3quran.net was returning 404)
    expect(url).toContain("quranicaudio.com");
    expect(url).toContain("mishari_al_afasy");
    expect(url).toContain("/1.mp3");
  });

  it("pads surah and ayah numbers correctly", () => {
    const url = getAudioUrl("ar.alafasy", 2, 255);
    expect(url).toContain("002255.mp3");
  });

  it("returns correct translation edition for English", () => {
    expect(getTranslationEdition("en")).toBe("en.sahih");
  });

  it("returns correct translation edition for Urdu", () => {
    expect(getTranslationEdition("ur")).toBe("ur.jalandhry");
  });

  it("returns English fallback for unknown language", () => {
    expect(getTranslationEdition("xx")).toBe("en.sahih");
  });
});

describe("HadithAPI", () => {
  it("has 8 hadith collections", () => {
    expect(HADITH_COLLECTIONS.length).toBe(8);
  });

  it("includes Bukhari collection", () => {
    const bukhari = HADITH_COLLECTIONS.find((c) => c.id === "bukhari");
    expect(bukhari).toBeDefined();
    expect(bukhari?.totalHadith).toBe(7563);
  });

  it("all collections have required fields", () => {
    for (const col of HADITH_COLLECTIONS) {
      expect(col.id).toBeTruthy();
      expect(col.name).toBeTruthy();
      expect(col.totalHadith).toBeGreaterThan(0);
    }
  });
});

describe("AppSettingsContext", () => {
  it("has at least 5 reciters", () => {
    expect(RECITERS.length).toBeGreaterThanOrEqual(5);
  });

  it("all reciters have id, name, identifier", () => {
    for (const r of RECITERS) {
      expect(r.id).toBeTruthy();
      expect(r.name).toBeTruthy();
      expect(r.identifier).toBeTruthy();
    }
  });

  it("has at least 10 calculation methods", () => {
    expect(CALCULATION_METHODS.length).toBeGreaterThanOrEqual(10);
  });

  it("all calculation methods have numeric id", () => {
    for (const m of CALCULATION_METHODS) {
      expect(typeof m.id).toBe("number");
      expect(m.name).toBeTruthy();
    }
  });

  it("has 3 adhan styles", () => {
    expect(ADHAN_STYLES.length).toBe(3);
  });

  it("has many language options", () => {
    expect(LANGUAGES.length).toBeGreaterThan(50);
  });

  it("English is the first language", () => {
    expect(LANGUAGES[0].code).toBe("en");
  });
});
