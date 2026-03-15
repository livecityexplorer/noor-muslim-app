import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import { getSurahAudioUrl } from "@/lib/services/QuranAPI";

export interface PlayingSurah {
  surahNumber: number;
  surahName: string;
  surahArabicName: string;
  reciterId: string;
  totalSurahs: number; // 114
}

export interface AudioPlayerContextType {
  /** Currently loaded surah info, or null if nothing loaded */
  currentSurah: PlayingSurah | null;
  /** Whether audio is actively playing */
  isPlaying: boolean;
  /** Current playback position in seconds */
  currentTime: number;
  /** Total duration in seconds (0 if unknown) */
  duration: number;
  /** Whether audio is loading/buffering */
  isLoading: boolean;
  /** Play a specific surah (replaces current) */
  playSurah: (surah: PlayingSurah) => Promise<void>;
  /** Toggle play/pause */
  togglePlayPause: () => void;
  /** Skip to next surah */
  playNext: () => void;
  /** Go to previous surah */
  playPrev: () => void;
  /** Seek to a position in seconds */
  seekTo: (seconds: number) => void;
  /** Stop and unload audio */
  stop: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType>({
  currentSurah: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  isLoading: false,
  playSurah: async () => {},
  togglePlayPause: () => {},
  playNext: () => {},
  playPrev: () => {},
  seekTo: () => {},
  stop: () => {},
});

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSurah, setCurrentSurah] = useState<PlayingSurah | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // We use a ref for the player so we can access it in callbacks without stale closure issues
  const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const currentSurahRef = useRef<PlayingSurah | null>(null);
  const isPlayingRef = useRef(false);
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    currentSurahRef.current = currentSurah;
  }, [currentSurah]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Set up audio mode for background playback on mount
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      // On iOS, this enables background audio (requires UIBackgroundModes: ["audio"] in app.config)
      // On Android, audio continues in background by default
    }).catch(() => {});

    return () => {
      // Cleanup on unmount
      stopStatusPolling();
      playerRef.current?.remove();
      playerRef.current = null;
    };
  }, []);

  const stopStatusPolling = () => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
  };

  const startStatusPolling = (player: ReturnType<typeof createAudioPlayer>) => {
    stopStatusPolling();
    statusIntervalRef.current = setInterval(() => {
      try {
        const time = player.currentTime ?? 0;
        const dur = player.duration ?? 0;
        setCurrentTime(time);
        if (dur > 0) setDuration(dur);

        // Detect when playback finishes (currentTime near duration)
        if (dur > 0 && time >= dur - 0.5 && isPlayingRef.current) {
          // Auto-advance to next surah
          handleAutoAdvance();
        }
      } catch {
        // Player may have been removed
        stopStatusPolling();
      }
    }, 500);
  };

  const handleAutoAdvance = useCallback(() => {
    const surah = currentSurahRef.current;
    if (!surah) return;
    const nextNum = surah.surahNumber + 1;
    if (nextNum <= surah.totalSurahs) {
      const nextSurah: PlayingSurah = {
        ...surah,
        surahNumber: nextNum,
        surahName: `Surah ${nextNum}`,
        surahArabicName: "",
      };
      // Small delay to avoid rapid fire
      setTimeout(() => {
        playSurahInternal(nextSurah);
      }, 800);
    } else {
      // Finished all surahs
      setIsPlaying(false);
      isPlayingRef.current = false;
      stopStatusPolling();
    }
  }, []);

  const playSurahInternal = useCallback(async (surah: PlayingSurah) => {
    try {
      setIsLoading(true);
      setCurrentTime(0);
      setDuration(0);

      // Remove existing player
      stopStatusPolling();
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }

      const url = getSurahAudioUrl(surah.reciterId, surah.surahNumber);
      const player = createAudioPlayer({ uri: url });
      playerRef.current = player;

      // Start playing
      player.play();
      setCurrentSurah(surah);
      setIsPlaying(true);
      isPlayingRef.current = true;
      setIsLoading(false);

      // Start polling for status
      startStatusPolling(player);

      // Persist last played surah
      AsyncStorage.setItem("last_played_surah", JSON.stringify(surah)).catch(() => {});
    } catch (e) {
      setIsLoading(false);
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  }, []);

  const playSurah = useCallback(async (surah: PlayingSurah) => {
    await playSurahInternal(surah);
  }, [playSurahInternal]);

  const togglePlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (isPlayingRef.current) {
      player.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
    } else {
      player.play();
      setIsPlaying(true);
      isPlayingRef.current = true;
    }
  }, []);

  const playNext = useCallback(() => {
    const surah = currentSurahRef.current;
    if (!surah) return;
    const nextNum = surah.surahNumber + 1;
    if (nextNum <= surah.totalSurahs) {
      playSurahInternal({
        ...surah,
        surahNumber: nextNum,
        surahName: `Surah ${nextNum}`,
        surahArabicName: "",
      });
    }
  }, [playSurahInternal]);

  const playPrev = useCallback(() => {
    const surah = currentSurahRef.current;
    if (!surah) return;
    const prevNum = surah.surahNumber - 1;
    if (prevNum >= 1) {
      playSurahInternal({
        ...surah,
        surahNumber: prevNum,
        surahName: `Surah ${prevNum}`,
        surahArabicName: "",
      });
    }
  }, [playSurahInternal]);

  const seekTo = useCallback((seconds: number) => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(seconds);
    setCurrentTime(seconds);
  }, []);

  const stop = useCallback(() => {
    stopStatusPolling();
    if (playerRef.current) {
      playerRef.current.remove();
      playerRef.current = null;
    }
    setCurrentSurah(null);
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentTime(0);
    setDuration(0);
  }, []);

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
