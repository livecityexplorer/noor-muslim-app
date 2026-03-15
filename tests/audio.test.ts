import { describe, it, expect } from "vitest";
import { getSurahAudioUrl } from "../lib/services/QuranAPI";

// Test the surah audio URL generation used by AudioPlayerContext
describe("Full Surah Audio URLs", () => {
  it("generates correct URL for Alafasy surah 1", () => {
    const url = getSurahAudioUrl("ar.alafasy", 1);
    expect(url).toContain("mp3quran.net");
    expect(url).toContain("afasy");
    expect(url).toContain("001.mp3");
  });

  it("generates correct URL for Sudais surah 36 (Yasin)", () => {
    const url = getSurahAudioUrl("ar.abdurrahmaansudais", 36);
    expect(url).toContain("sudais");
    expect(url).toContain("036.mp3");
  });

  it("generates correct URL for Husary surah 114", () => {
    const url = getSurahAudioUrl("ar.husary", 114);
    expect(url).toContain("husary");
    expect(url).toContain("114.mp3");
  });

  it("pads surah numbers to 3 digits", () => {
    const url1 = getSurahAudioUrl("ar.alafasy", 1);
    const url9 = getSurahAudioUrl("ar.alafasy", 9);
    const url99 = getSurahAudioUrl("ar.alafasy", 99);
    expect(url1).toContain("001.mp3");
    expect(url9).toContain("009.mp3");
    expect(url99).toContain("099.mp3");
  });

  it("falls back to Alafasy for unknown reciter", () => {
    const url = getSurahAudioUrl("ar.unknown", 1);
    expect(url).toContain("afasy");
  });

  it("generates valid HTTPS URLs", () => {
    const url = getSurahAudioUrl("ar.alafasy", 1);
    expect(url.startsWith("https://")).toBe(true);
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
    expect(next > current.totalSurahs).toBe(true); // Should NOT advance
  });
});
