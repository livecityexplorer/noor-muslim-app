import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useAudioPlayer as useExpoAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getSurahAudioUrl } from "@/lib/services/QuranAPI";
import { RECITERS } from "@/lib/contexts/AppSettingsContext";

// App logo used as lock screen artwork
const ARTWORK_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663439098309/PwZqfFHUutxrDZYiC93bM3/noor-icon-ctYX2bjwmJFumB7xz9TDZ9.png";

export interface PlayingSurah {
  surahNumber: number;
  surahName: string;
  surahArabicName: string;
  reciterId: string;
  totalSurahs: number;
}

export interface AudioPlayerContextType {
  currentSurah: PlayingSurah | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  playSurah: (surah: PlayingSurah) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrev: () => void;
  seekTo: (seconds: number) => void;
  stop: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType>({
  currentSurah: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  isLoading: false,
  playSurah: () => {},
  togglePlayPause: () => {},
  playNext: () => {},
  playPrev: () => {},
  seekTo: () => {},
  stop: () => {},
});

function getReciterName(reciterId: string): string {
  return RECITERS.find((r) => r.id === reciterId)?.name ?? "Quran Recitation";
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSurah, setCurrentSurah] = useState<PlayingSurah | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs to avoid stale closures
  const currentSurahRef = useRef<PlayingSurah | null>(null);
  const hasAutoAdvancedRef = useRef(false);
  const pendingPlayRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    currentSurahRef.current = currentSurah;
  }, [currentSurah]);

  // Single persistent player — lifecycle managed by useAudioPlayer
  const player = useExpoAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  // ─── Audio Mode: background + silent mode ──────────────────────────────────
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "duckOthers",
      interruptionModeAndroid: "duckOthers",
    }).catch(() => {});
  }, []);

  // ─── Lock Screen Controls ──────────────────────────────────────────────────
  // Activate lock screen controls with surah metadata whenever currentSurah changes
  useEffect(() => {
    if (!currentSurah) {
      // Clear lock screen when nothing is playing
      try {
        player.clearLockScreenControls();
      } catch {}
      return;
    }

    const reciterName = getReciterName(currentSurah.reciterId);
    const metadata = {
      title: currentSurah.surahName,
      artist: reciterName,
      albumTitle: "The Holy Quran — القرآن الكريم",
      artworkUrl: ARTWORK_URL,
    };

    try {
      // setActiveForLockScreen registers this player as the Now Playing source
      // and shows play/pause + prev/next on iOS Control Center & Android notification
      player.setActiveForLockScreen(true, metadata, {
        showSeekForward: false,
        showSeekBackward: false,
      });
    } catch {}
  }, [currentSurah?.surahNumber, currentSurah?.reciterId]);

  // ─── Update lock screen metadata when surah name resolves ─────────────────
  // (surahName may be updated after initial load with the real name from the API)
  useEffect(() => {
    if (!currentSurah?.surahName) return;
    try {
      player.updateLockScreenMetadata({
        title: currentSurah.surahName,
        artist: getReciterName(currentSurah.reciterId),
        albumTitle: "The Holy Quran — القرآن الكريم",
        artworkUrl: ARTWORK_URL,
      });
    } catch {}
  }, [currentSurah?.surahName]);

  // ─── Auto-start when audio loads ──────────────────────────────────────────
  useEffect(() => {
    if (!status) return;
    if (pendingPlayRef.current && status.duration > 0 && !status.playing) {
      pendingPlayRef.current = false;
      setIsLoading(false);
      player.play();
    }
  }, [status?.duration]);

  // ─── Auto-advance to next surah ───────────────────────────────────────────
  useEffect(() => {
    if (!status) return;
    if (status.didJustFinish && currentSurahRef.current && !hasAutoAdvancedRef.current) {
      hasAutoAdvancedRef.current = true;
      const surah = currentSurahRef.current;
      const nextNum = surah.surahNumber + 1;
      if (nextNum <= surah.totalSurahs) {
        setTimeout(() => {
          hasAutoAdvancedRef.current = false;
          loadAndPlay({
            ...surah,
            surahNumber: nextNum,
            surahName: `Surah ${nextNum}`,
            surahArabicName: "",
          });
        }, 1000);
      } else {
        // Finished all 114 surahs
        try { player.clearLockScreenControls(); } catch {}
        setCurrentSurah(null);
        hasAutoAdvancedRef.current = false;
      }
    }
  }, [status?.didJustFinish]);

  // ─── Core playback actions ─────────────────────────────────────────────────
  const loadAndPlay = useCallback(
    (surah: PlayingSurah) => {
      hasAutoAdvancedRef.current = false;
      pendingPlayRef.current = true;
      setIsLoading(true);
      setCurrentSurah(surah);
      const url = getSurahAudioUrl(surah.reciterId, surah.surahNumber);
      player.replace({ uri: url });
      AsyncStorage.setItem("last_played_surah", JSON.stringify(surah)).catch(() => {});
    },
    [player]
  );

  const playSurah = useCallback(
    (surah: PlayingSurah) => {
      loadAndPlay(surah);
    },
    [loadAndPlay]
  );

  const togglePlayPause = useCallback(() => {
    if (!currentSurahRef.current) return;
    if (status?.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, status?.playing]);

  const playNext = useCallback(() => {
    const surah = currentSurahRef.current;
    if (!surah) return;
    const nextNum = surah.surahNumber + 1;
    if (nextNum <= surah.totalSurahs) {
      loadAndPlay({
        ...surah,
        surahNumber: nextNum,
        surahName: `Surah ${nextNum}`,
        surahArabicName: "",
      });
    }
  }, [loadAndPlay]);

  const playPrev = useCallback(() => {
    const surah = currentSurahRef.current;
    if (!surah) return;
    const prevNum = surah.surahNumber - 1;
    if (prevNum >= 1) {
      loadAndPlay({
        ...surah,
        surahNumber: prevNum,
        surahName: `Surah ${prevNum}`,
        surahArabicName: "",
      });
    }
  }, [loadAndPlay]);

  const seekTo = useCallback(
    (seconds: number) => {
      player.seekTo(seconds);
    },
    [player]
  );

  const stop = useCallback(() => {
    try { player.clearLockScreenControls(); } catch {}
    player.pause();
    try { player.replace({ uri: "" }); } catch {}
    setCurrentSurah(null);
    setIsLoading(false);
    pendingPlayRef.current = false;
    hasAutoAdvancedRef.current = false;
  }, [player]);

  const isPlaying = status?.playing ?? false;
  const currentTime = status?.currentTime ?? 0;
  const duration = status?.duration ?? 0;

  return (
    <AudioPlayerContext.Provider
      value={{
        currentSurah,
        isPlaying,
        currentTime,
        duration,
        isLoading,
        playSurah,
        togglePlayPause,
        playNext,
        playPrev,
        seekTo,
        stop,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  return useContext(AudioPlayerContext);
}
