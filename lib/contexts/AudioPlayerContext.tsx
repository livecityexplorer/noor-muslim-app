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

  // Create a single persistent player instance (empty source initially)
  // useAudioPlayer manages its lifecycle automatically
  const player = useExpoAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  // Set up background audio mode on mount
  // shouldPlayInBackground: true → audio continues when screen locks or app backgrounds
  // playsInSilentMode: true → audio plays even when iOS silent/ringer switch is off
  // interruptionMode: 'duckOthers' → lower other audio (calls, etc.) instead of stopping
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
      interruptionModeAndroid: 'duckOthers',
    }).catch(() => {});
  }, []);

  // When status changes to loaded and we have a pending play, start playing
  useEffect(() => {
    if (!status) return;
    // When audio finishes loading (duration becomes available) and we want to play
    if (pendingPlayRef.current && status.duration > 0 && !status.playing) {
      pendingPlayRef.current = false;
      setIsLoading(false);
      player.play();
    }
  }, [status?.duration]);

  // Auto-advance to next surah when current one finishes
  useEffect(() => {
    if (!status) return;
    if (status.didJustFinish && currentSurahRef.current && !hasAutoAdvancedRef.current) {
      hasAutoAdvancedRef.current = true;
      const surah = currentSurahRef.current;
      const nextNum = surah.surahNumber + 1;
      if (nextNum <= surah.totalSurahs) {
        setTimeout(() => {
          hasAutoAdvancedRef.current = false;
          const nextSurah: PlayingSurah = {
            ...surah,
            surahNumber: nextNum,
            surahName: `Surah ${nextNum}`,
            surahArabicName: "",
          };
          loadAndPlay(nextSurah);
        }, 1000);
      } else {
        // Finished all surahs
        setCurrentSurah(null);
        hasAutoAdvancedRef.current = false;
      }
    }
  }, [status?.didJustFinish]);

  const loadAndPlay = useCallback((surah: PlayingSurah) => {
    hasAutoAdvancedRef.current = false;
    pendingPlayRef.current = true;
    setIsLoading(true);
    setCurrentSurah(surah);
    const url = getSurahAudioUrl(surah.reciterId, surah.surahNumber);
    // Use player.replace() to load a new source without creating a new player
    player.replace({ uri: url });
    // Persist last played surah
    AsyncStorage.setItem("last_played_surah", JSON.stringify(surah)).catch(() => {});
  }, [player]);

  const playSurah = useCallback((surah: PlayingSurah) => {
    loadAndPlay(surah);
  }, [loadAndPlay]);

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

  const seekTo = useCallback((seconds: number) => {
    player.seekTo(seconds);
  }, [player]);

  const stop = useCallback(() => {
    player.pause();
    // Replace with null/empty to unload
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
