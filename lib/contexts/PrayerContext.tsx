import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

export interface PrayerTime {
  name: string;
  displayName: string;
  time: string; // "HH:MM" format
  timestamp: number; // Unix timestamp for today
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

export interface PrayerContextType {
  location: LocationData | null;
  prayerTimes: PrayerTime[];
  nextPrayer: PrayerTime | null;
  timeUntilNextPrayer: number; // seconds
  isLoading: boolean;
  error: string | null;
  setLocation: (loc: LocationData) => Promise<void>;
  refreshPrayerTimes: () => Promise<void>;
  islamicDate: string;
}

const PRAYER_NAMES: { key: string; display: string }[] = [
  { key: "Fajr", display: "Fajr" },
  { key: "Dhuhr", display: "Dhuhr" },
  { key: "Asr", display: "Asr" },
  { key: "Maghrib", display: "Maghrib" },
  { key: "Isha", display: "Isha" },
];

function parseTimeToTimestamp(timeStr: string): number {
  const now = new Date();
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  return date.getTime();
}

const PrayerContext = createContext<PrayerContextType>({
  location: null,
  prayerTimes: [],
  nextPrayer: null,
  timeUntilNextPrayer: 0,
  isLoading: false,
  error: null,
  setLocation: async () => {},
  refreshPrayerTimes: async () => {},
  islamicDate: "",
});

export function PrayerProvider({ children, calculationMethod = 3 }: { children: React.ReactNode; calculationMethod?: number }) {
  const [location, setLocationState] = useState<LocationData | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [islamicDate, setIslamicDate] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("prayer_location").then((stored) => {
      if (stored) {
        try {
          const loc = JSON.parse(stored);
          setLocationState(loc);
        } catch {}
      }
    });
  }, []);

  const fetchPrayerTimes = useCallback(async (loc: LocationData) => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date();
      const dateStr = `${today.getDate().toString().padStart(2, "0")}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getFullYear()}`;
      const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${loc.latitude}&longitude=${loc.longitude}&method=${calculationMethod}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.code === 200) {
        const timings = data.data.timings;
        const times: PrayerTime[] = PRAYER_NAMES.map(({ key, display }) => ({
          name: key,
          displayName: display,
          time: timings[key],
          timestamp: parseTimeToTimestamp(timings[key]),
        }));
        setPrayerTimes(times);
        // Islamic date
        const hijri = data.data.date?.hijri;
        if (hijri) {
          setIslamicDate(`${hijri.day} ${hijri.month?.en} ${hijri.year} AH`);
        }
      } else {
        setError("Failed to fetch prayer times");
      }
    } catch (e) {
      setError("Network error. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, [calculationMethod]);

  useEffect(() => {
    if (location) {
      fetchPrayerTimes(location);
    }
  }, [location, fetchPrayerTimes]);

  // Update countdown timer
  useEffect(() => {
    if (prayerTimes.length === 0) return;
    const updateNext = () => {
      const now = Date.now();
      const upcoming = prayerTimes.find((p) => p.timestamp > now);
      if (upcoming) {
        setNextPrayer(upcoming);
        setTimeUntilNext(Math.floor((upcoming.timestamp - now) / 1000));
      } else {
        // All prayers passed, next is Fajr tomorrow
        setNextPrayer({ ...prayerTimes[0], displayName: "Fajr (Tomorrow)" });
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [h, m] = prayerTimes[0].time.split(":").map(Number);
        tomorrow.setHours(h, m, 0, 0);
        setTimeUntilNext(Math.floor((tomorrow.getTime() - now) / 1000));
      }
    };
    updateNext();
    timerRef.current = setInterval(updateNext, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [prayerTimes]);

  const setLocation = useCallback(async (loc: LocationData) => {
    setLocationState(loc);
    await AsyncStorage.setItem("prayer_location", JSON.stringify(loc));
  }, []);

  const refreshPrayerTimes = useCallback(async () => {
    if (location) await fetchPrayerTimes(location);
  }, [location, fetchPrayerTimes]);

  return (
    <PrayerContext.Provider
      value={{
        location,
        prayerTimes,
        nextPrayer,
        timeUntilNextPrayer: timeUntilNext,
        isLoading,
        error,
        setLocation,
        refreshPrayerTimes,
        islamicDate,
      }}
    >
      {children}
    </PrayerContext.Provider>
  );
}

export function usePrayerContext() {
  return useContext(PrayerContext);
}
