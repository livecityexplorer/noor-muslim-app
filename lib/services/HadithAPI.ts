const BASE_URL = "https://hadith.inapi.io/v1";
const FALLBACK_URL = "https://api.hadith.gading.dev";

export interface HadithCollection {
  id: string;
  name: string;
  hasBooks: boolean;
  hasChapters: boolean;
  collection: string;
  totalHadith: number;
}

export interface HadithItem {
  id: number;
  arab: string;
  id_text?: string;
  en_text?: string;
  collection: string;
  bookNumber?: string;
  chapterNumber?: string;
  hadithNumber: number;
}

export const HADITH_COLLECTIONS: HadithCollection[] = [
  { id: "bukhari", name: "Sahih Al-Bukhari", hasBooks: true, hasChapters: true, collection: "bukhari", totalHadith: 7563 },
  { id: "muslim", name: "Sahih Muslim", hasBooks: true, hasChapters: true, collection: "muslim", totalHadith: 5362 },
  { id: "abudawud", name: "Sunan Abu Dawud", hasBooks: true, hasChapters: true, collection: "abudawud", totalHadith: 5274 },
  { id: "tirmidhi", name: "Jami At-Tirmidhi", hasBooks: true, hasChapters: true, collection: "tirmidhi", totalHadith: 3956 },
  { id: "nasai", name: "Sunan An-Nasa'i", hasBooks: true, hasChapters: true, collection: "nasai", totalHadith: 5758 },
  { id: "ibnmajah", name: "Sunan Ibn Majah", hasBooks: true, hasChapters: true, collection: "ibnmajah", totalHadith: 4341 },
  { id: "malik", name: "Muwatta Malik", hasBooks: true, hasChapters: true, collection: "malik", totalHadith: 1857 },
  { id: "riyadussalihin", name: "Riyad As-Salihin", hasBooks: true, hasChapters: true, collection: "riyadussalihin", totalHadith: 1896 },
];

export async function fetchRandomHadith(): Promise<HadithItem | null> {
  try {
    const collection = HADITH_COLLECTIONS[Math.floor(Math.random() * 3)]; // Bukhari, Muslim, or Abu Dawud
    const randomNum = Math.floor(Math.random() * Math.min(collection.totalHadith, 500)) + 1;
    const response = await fetch(`${FALLBACK_URL}/hadith/${collection.id}?range=${randomNum}-${randomNum}`);
    const data = await response.json();
    if (data.code === 200 && data.data?.hadiths?.length > 0) {
      const h = data.data.hadiths[0];
      return {
        id: h.number,
        arab: h.arab || "",
        en_text: h.id || h.en || "",
        collection: collection.name,
        hadithNumber: h.number,
      };
    }
  } catch {}
  return null;
}

export async function fetchHadithFromCollection(
  collectionId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ hadiths: HadithItem[]; total: number }> {
  try {
    const start = (page - 1) * limit + 1;
    const end = start + limit - 1;
    const response = await fetch(`${FALLBACK_URL}/hadith/${collectionId}?range=${start}-${end}`);
    const data = await response.json();
    if (data.code === 200) {
      const hadiths: HadithItem[] = (data.data?.hadiths || []).map((h: any) => ({
        id: h.number,
        arab: h.arab || "",
        en_text: h.id || h.en || "",
        collection: collectionId,
        hadithNumber: h.number,
      }));
      return { hadiths, total: data.data?.total || 0 };
    }
  } catch {}
  return { hadiths: [], total: 0 };
}
