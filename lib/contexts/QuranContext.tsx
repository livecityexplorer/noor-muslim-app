import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface Bookmark {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  savedAt: number;
}

export interface LastRead {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
}

interface QuranContextType {
  bookmarks: Bookmark[];
  lastRead: LastRead | null;
  addBookmark: (bookmark: Bookmark) => Promise<void>;
  removeBookmark: (surahNumber: number, ayahNumber: number) => Promise<void>;
  isBookmarked: (surahNumber: number, ayahNumber: number) => boolean;
  setLastRead: (lastRead: LastRead) => Promise<void>;
}

const QuranContext = createContext<QuranContextType>({
  bookmarks: [],
  lastRead: null,
  addBookmark: async () => {},
  removeBookmark: async () => {},
  isBookmarked: () => false,
  setLastRead: async () => {},
});

export function QuranProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [lastRead, setLastReadState] = useState<LastRead | null>(null);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("quran_bookmarks"),
      AsyncStorage.getItem("quran_last_read"),
    ]).then(([bm, lr]) => {
      if (bm) {
        try { setBookmarks(JSON.parse(bm)); } catch {}
      }
      if (lr) {
        try { setLastReadState(JSON.parse(lr)); } catch {}
      }
    });
  }, []);

  const addBookmark = useCallback(async (bookmark: Bookmark) => {
    setBookmarks((prev) => {
      const filtered = prev.filter(
        (b) => !(b.surahNumber === bookmark.surahNumber && b.ayahNumber === bookmark.ayahNumber)
      );
      const next = [bookmark, ...filtered];
      AsyncStorage.setItem("quran_bookmarks", JSON.stringify(next));
      return next;
    });
  }, []);

  const removeBookmark = useCallback(async (surahNumber: number, ayahNumber: number) => {
    setBookmarks((prev) => {
      const next = prev.filter(
        (b) => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber)
      );
      AsyncStorage.setItem("quran_bookmarks", JSON.stringify(next));
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (surahNumber: number, ayahNumber: number) =>
      bookmarks.some((b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber),
    [bookmarks]
  );

  const setLastRead = useCallback(async (lr: LastRead) => {
    setLastReadState(lr);
    await AsyncStorage.setItem("quran_last_read", JSON.stringify(lr));
  }, []);

  return (
    <QuranContext.Provider value={{ bookmarks, lastRead, addBookmark, removeBookmark, isBookmarked, setLastRead }}>
      {children}
    </QuranContext.Provider>
  );
}

export function useQuranContext() {
  return useContext(QuranContext);
}
