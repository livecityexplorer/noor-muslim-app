const BASE_URL = "https://api.alquran.cloud/v1";

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  numberInSurah: number;
  text: string;
  audio?: string;
  audioSecondary?: string[];
  page?: number;
  juz?: number;
}

export interface AyahWithTranslation {
  arabic: Ayah;
  translation: Ayah;
}

export interface SurahDetail {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
  ayahs: AyahWithTranslation[];
}

let surahListCache: Surah[] | null = null;

export async function fetchSurahList(): Promise<Surah[]> {
  if (surahListCache) return surahListCache;
  const response = await fetch(`${BASE_URL}/surah`);
  const data = await response.json();
  if (data.code === 200) {
    surahListCache = data.data as Surah[];
    return surahListCache;
  }
  throw new Error("Failed to fetch surah list");
}

export async function fetchSurahWithTranslation(
  surahNumber: number,
  translationEdition: string = "en.sahih",
  reciterEdition: string = "ar.alafasy"
): Promise<SurahDetail> {
  const [arabicRes, translationRes] = await Promise.all([
    fetch(`${BASE_URL}/surah/${surahNumber}/${reciterEdition}`),
    fetch(`${BASE_URL}/surah/${surahNumber}/${translationEdition}`),
  ]);

  const [arabicData, translationData] = await Promise.all([
    arabicRes.json(),
    translationRes.json(),
  ]);

  if (arabicData.code !== 200 || translationData.code !== 200) {
    throw new Error("Failed to fetch surah");
  }

  const arabicAyahs: Ayah[] = arabicData.data.ayahs;
  const translationAyahs: Ayah[] = translationData.data.ayahs;

  const ayahs: AyahWithTranslation[] = arabicAyahs.map((arabic, i) => ({
    arabic,
    translation: translationAyahs[i],
  }));

  return {
    number: arabicData.data.number,
    name: arabicData.data.name,
    englishName: arabicData.data.englishName,
    englishNameTranslation: arabicData.data.englishNameTranslation,
    numberOfAyahs: arabicData.data.numberOfAyahs,
    revelationType: arabicData.data.revelationType,
    ayahs,
  };
}

export function getAudioUrl(reciterId: string, surahNumber: string | number, ayahNumber: string | number): string {
  const paddedSurah = String(surahNumber).padStart(3, "0");
  const paddedAyah = String(ayahNumber).padStart(3, "0");
  // Use EveryAyah CDN for high quality audio
  return `https://everyayah.com/data/${getEveryAyahReciter(reciterId)}/${paddedSurah}${paddedAyah}.mp3`;
}

export function getSurahAudioUrl(reciterId: string, surahNumber: number): string {
  // Use quranicaudio.com QDC CDN for full surah audio
  // Verified working CDN paths as of 2026:
  // - Most reciters: plain number (1.mp3, 36.mp3, 114.mp3)
  // - Shuraym: 3-digit padded (001.mp3, 036.mp3, 114.mp3)
  const { slug, padded } = getQDCReciter(reciterId);
  const surahStr = padded
    ? String(surahNumber).padStart(3, "0")
    : String(surahNumber);
  return `https://download.quranicaudio.com/qdc/${slug}/murattal/${surahStr}.mp3`;
}

function getQDCReciter(reciterId: string): { slug: string; padded: boolean } {
  // Verified working paths on download.quranicaudio.com/qdc/{slug}/murattal/{num}.mp3
  const map: Record<string, { slug: string; padded: boolean }> = {
    "ar.alafasy": { slug: "mishari_al_afasy", padded: false },
    "ar.abdurrahmaansudais": { slug: "abdurrahmaan_as_sudais", padded: false },
    "ar.husary": { slug: "khalil_al_husary", padded: false },
    "ar.minshawi": { slug: "siddiq_minshawi", padded: false },
    "ar.saoodshuraym": { slug: "saud_ash-shuraym", padded: true },
  };
  return map[reciterId] ?? { slug: "mishari_al_afasy", padded: false };
}

function getEveryAyahReciter(reciterId: string): string {
  const map: Record<string, string> = {
    "ar.alafasy": "Alafasy_128kbps",
    "ar.abdurrahmaansudais": "Abdurrahmaan_As-Sudais_192kbps",
    "ar.husary": "Husary_128kbps",
    "ar.minshawi": "Minshawy_Murattal_128kbps",
    "ar.saoodshuraym": "Saud_ash-Shuraym_128kbps",
  };
  return map[reciterId] || "Alafasy_128kbps";
}

function getMP3QuranReciter(reciterId: string): string {
  const map: Record<string, string> = {
    "ar.alafasy": "afasy",
    "ar.abdurrahmaansudais": "sudais",
    "ar.husary": "husary",
    "ar.minshawi": "minshawi",
    "ar.saoodshuraym": "shuraym",
  };
  return map[reciterId] || "afasy";
}

export function getTranslationEdition(languageCode: string): string {
  const map: Record<string, string> = {
    en: "en.sahih",
    ar: "ar.muyassar",
    fr: "fr.hamidullah",
    de: "de.bubenheim",
    es: "es.asad",
    tr: "tr.diyanet",
    ur: "ur.jalandhry",
    id: "id.indonesian",
    ms: "ms.basmeih",
    bn: "bn.bengali",
    hi: "hi.hindi",
    fa: "fa.makarem",
    ru: "ru.kuliev",
    zh: "zh.majian",
    nl: "nl.keyzer",
    sv: "sv.bernstrom",
    no: "no.berg",
    pt: "pt.elhayek",
    it: "it.piccardo",
    ko: "ko.korean",
    ja: "ja.japanese",
    pl: "pl.bielawskiego",
    cs: "cs.hrbek",
    ro: "ro.grigore",
    sq: "sq.nahi",
    bs: "bs.korkut",
    ml: "ml.abdulhameed",
    ta: "ta.tamil",
    te: "te.telugu",
    gu: "gu.omari",
    az: "az.mammadaliyev",
    sw: "sw.barwani",
    am: "am.sadiq",
    ha: "ha.gumi",
    so: "so.abduh",
    tl: "tl.filipino",
    th: "th.thai",
    vi: "vi.nguyenvi",
    my: "my.myanmar",
    km: "km.cambodian",
    uz: "uz.sodik",
    kk: "kk.altai",
    ky: "ky.khalilova",
    tg: "tg.ayati",
    bg: "bg.theophanov",
    mk: "mk.bosniak",
    he: "he.israeli",
    si: "si.nooruddin",
    ne: "ne.nepali",
    mn: "mn.mongolian",
    af: "af.afrikaans",
    eu: "eu.basque",
    ca: "ca.catalan",
    gl: "gl.galician",
    cy: "cy.welsh",
    ga: "ga.irish",
    is: "is.icelandic",
    lt: "lt.lithuanian",
    lv: "lv.latvian",
    et: "et.estonian",
    sl: "sl.slovenian",
    sk: "sk.slovak",
    hr: "hr.mlivo",
    hu: "hu.szorentei",
    el: "el.efendi",
    uk: "uk.mikhalenko",
    be: "be.belarusian",
    hy: "hy.armenian",
    ka: "ka.georgian",
    tt: "tt.tatar",
  };
  return map[languageCode] || "en.sahih";
}
