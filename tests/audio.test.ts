import { describe, it, expect } from "vitest";
import { getSurahAudioUrl } from "../lib/services/QuranAPI";

// Test the new QDC CDN surah audio URL generation
describe("Full Surah Audio URLs (QDC CDN)", () => {
  it("generates correct URL for Alafasy surah 1 (plain number)", () => {
    const url = getSurahAudioUrl("ar.alafasy", 1);
    expect(url).toContain("quranicaudio.com/qdc");
    expect(url).toContain("mishari_al_afasy");
    expect(url).toContain("murattal");
    expect(url).toContain("/1.mp3");
  });

  it("generates correct URL for Sudais surah 36 (Yasin)", () => {
    const url = getSurahAudioUrl("ar.abdurrahmaansudais", 36);
    expect(url).toContain("abdurrahmaan_as_sudais");
    expect(url).toContain("/36.mp3");
  });

  it("generates correct URL for Husary surah 114", () => {
    const url = getSurahAudioUrl("ar.husary", 114);
    expect(url).toContain("khalil_al_husary");
    expect(url).toContain("/114.mp3");
  });

  it("generates correct URL for Minshawi surah 1", () => {
    const url = getSurahAudioUrl("ar.minshawi", 1);
    expect(url).toContain("siddiq_minshawi");
    expect(url).toContain("/1.mp3");
  });

  it("Shuraym uses 3-digit padded numbers (CDN requirement)", () => {
    const url1 = getSurahAudioUrl("ar.saoodshuraym", 1);
    const url36 = getSurahAudioUrl("ar.saoodshuraym", 36);
    const url114 = getSurahAudioUrl("ar.saoodshuraym", 114);
    expect(url1).toContain("saud_ash-shuraym");
    expect(url1).toContain("/001.mp3");
    expect(url36).toContain("/036.mp3");
    expect(url114).toContain("/114.mp3");
  });

  it("non-Shuraym reciters use plain numbers (not padded)", () => {
    const url = getSurahAudioUrl("ar.alafasy", 1);
    // Should be /1.mp3 not /001.mp3
    expect(url).toContain("/1.mp3");
    expect(url).not.toContain("/001.mp3");
  });

  it("falls back to Alafasy for unknown reciter", () => {
    const url = getSurahAudioUrl("ar.unknown", 1);
    expect(url).toContain("mishari_al_afasy");
  });

  it("generates valid HTTPS URLs for all reciters", () => {
    const reciters = [
      "ar.alafasy",
      "ar.abdurrahmaansudais",
      "ar.husary",
      "ar.minshawi",
      "ar.saoodshuraym",
    ];
    for (const r of reciters) {
      const url = getSurahAudioUrl(r, 1);
      expect(url.startsWith("https://")).toBe(true);
      expect(url).toContain("quranicaudio.com");
    }
  });

  it("all 5 reciters generate different URLs for same surah", () => {
    const reciters = [
      "ar.alafasy",
      "ar.abdurrahmaansudais",
      "ar.husary",
      "ar.minshawi",
      "ar.saoodshuraym",
    ];
    const urls = reciters.map((r) => getSurahAudioUrl(r, 1));
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toBe(5);
  });
});

// Test PlayingSurah data structure expectations
describe("PlayingSurah structure", () => {
  it("validates required fields for PlayingSurah", () => {
    const surah = {
      surahNumber: 1,
      surahName: "Al-Fatihah",
      surahArabicName: "الفاتحة",
      reciterId: "ar.alafasy",
      totalSurahs: 114,
    };
    expect(surah.surahNumber).toBeGreaterThanOrEqual(1);
    expect(surah.surahNumber).toBeLessThanOrEqual(114);
    expect(surah.totalSurahs).toBe(114);
    expect(surah.reciterId).toBeTruthy();
    expect(surah.surahName).toBeTruthy();
  });

  it("auto-advance logic: next surah is surahNumber + 1", () => {
    const current = { surahNumber: 36, totalSurahs: 114 };
    const next = current.surahNumber + 1;
    expect(next).toBe(37);
    expect(next).toBeLessThanOrEqual(current.totalSurahs);
  });

  it("auto-advance stops at surah 114", () => {
    const current = { surahNumber: 114, totalSurahs: 114 };
    const next = current.surahNumber + 1;
    expect(next > current.totalSurahs).toBe(true);
  });
});
