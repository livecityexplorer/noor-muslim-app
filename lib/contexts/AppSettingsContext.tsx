import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export const RECITERS = [
  { id: "ar.alafasy", name: "Mishary Rashid Alafasy", identifier: "ar.alafasy" },
  { id: "ar.abdurrahmaansudais", name: "Abdul Rahman Al-Sudais", identifier: "ar.abdurrahmaansudais" },
  { id: "ar.husary", name: "Mahmoud Khalil Al-Husary", identifier: "ar.husary" },
  { id: "ar.minshawi", name: "Mohamed Siddiq Al-Minshawi", identifier: "ar.minshawi" },
  { id: "ar.saoodshuraym", name: "Saud Al-Shuraim", identifier: "ar.saoodshuraym" },
];

export const ADHAN_STYLES = [
  { id: "makkah", name: "Makkah Adhan", url: "https://www.islamicfinder.org/prayer-times/adhan/makkah.mp3" },
  { id: "madinah", name: "Madinah Adhan", url: "https://www.islamicfinder.org/prayer-times/adhan/madinah.mp3" },
  { id: "egypt", name: "Egyptian Adhan", url: "https://www.islamicfinder.org/prayer-times/adhan/egypt.mp3" },
];

export const CALCULATION_METHODS = [
  { id: 2, name: "Islamic Society of North America (ISNA)" },
  { id: 3, name: "Muslim World League (MWL)" },
  { id: 4, name: "Umm Al-Qura University, Makkah" },
  { id: 5, name: "Egyptian General Authority of Survey" },
  { id: 1, name: "University of Islamic Sciences, Karachi" },
  { id: 7, name: "Institute of Geophysics, University of Tehran" },
  { id: 8, name: "Gulf Region" },
  { id: 9, name: "Kuwait" },
  { id: 10, name: "Qatar" },
  { id: 11, name: "Majlis Ugama Islam Singapura, Singapore" },
  { id: 12, name: "Union Organization Islamic de France" },
  { id: 13, name: "Diyanet İşleri Başkanlığı, Turkey" },
  { id: 14, name: "Spiritual Administration of Muslims of Russia" },
];

export const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "fa", name: "Persian", nativeName: "فارسی" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "zh", name: "Chinese (Simplified)", nativeName: "中文(简体)" },
  { code: "zh-tw", name: "Chinese (Traditional)", nativeName: "中文(繁體)" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "no", name: "Norwegian", nativeName: "Norsk" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "cs", name: "Czech", nativeName: "Čeština" },
  { code: "sk", name: "Slovak", nativeName: "Slovenčina" },
  { code: "ro", name: "Romanian", nativeName: "Română" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά" },
  { code: "bg", name: "Bulgarian", nativeName: "Български" },
  { code: "hr", name: "Croatian", nativeName: "Hrvatski" },
  { code: "sr", name: "Serbian", nativeName: "Srpski" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська" },
  { code: "he", name: "Hebrew", nativeName: "עברית" },
  { code: "th", name: "Thai", nativeName: "ภาษาไทย" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "az", name: "Azerbaijani", nativeName: "Azərbaycan" },
  { code: "kk", name: "Kazakh", nativeName: "Қазақ" },
  { code: "uz", name: "Uzbek", nativeName: "Oʻzbek" },
  { code: "tg", name: "Tajik", nativeName: "Тоҷикӣ" },
  { code: "ky", name: "Kyrgyz", nativeName: "Кыргыз" },
  { code: "tk", name: "Turkmen", nativeName: "Türkmen" },
  { code: "sq", name: "Albanian", nativeName: "Shqip" },
  { code: "bs", name: "Bosnian", nativeName: "Bosanski" },
  { code: "mk", name: "Macedonian", nativeName: "Македонски" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
  { code: "ha", name: "Hausa", nativeName: "Hausa" },
  { code: "yo", name: "Yoruba", nativeName: "Yorùbá" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ" },
  { code: "so", name: "Somali", nativeName: "Soomaali" },
  { code: "ps", name: "Pashto", nativeName: "پښتو" },
  { code: "ku", name: "Kurdish", nativeName: "Kurdî" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "si", name: "Sinhala", nativeName: "සිංහල" },
  { code: "my", name: "Burmese", nativeName: "မြန်မာ" },
  { code: "km", name: "Khmer", nativeName: "ភាសាខ្មែរ" },
  { code: "lo", name: "Lao", nativeName: "ລາວ" },
  { code: "mn", name: "Mongolian", nativeName: "Монгол" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली" },
  { code: "tl", name: "Filipino", nativeName: "Filipino" },
  { code: "jv", name: "Javanese", nativeName: "Basa Jawa" },
  { code: "su", name: "Sundanese", nativeName: "Basa Sunda" },
  { code: "ceb", name: "Cebuano", nativeName: "Cebuano" },
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans" },
  { code: "eu", name: "Basque", nativeName: "Euskara" },
  { code: "ca", name: "Catalan", nativeName: "Català" },
  { code: "gl", name: "Galician", nativeName: "Galego" },
  { code: "lt", name: "Lithuanian", nativeName: "Lietuvių" },
  { code: "lv", name: "Latvian", nativeName: "Latviešu" },
  { code: "et", name: "Estonian", nativeName: "Eesti" },
  { code: "sl", name: "Slovenian", nativeName: "Slovenščina" },
  { code: "mt", name: "Maltese", nativeName: "Malti" },
  { code: "cy", name: "Welsh", nativeName: "Cymraeg" },
  { code: "ga", name: "Irish", nativeName: "Gaeilge" },
  { code: "is", name: "Icelandic", nativeName: "Íslenska" },
  { code: "lb", name: "Luxembourgish", nativeName: "Lëtzebuergesch" },
  { code: "be", name: "Belarusian", nativeName: "Беларуская" },
  { code: "hy", name: "Armenian", nativeName: "Հայերեն" },
  { code: "ka", name: "Georgian", nativeName: "ქართული" },
  { code: "az", name: "Azerbaijani", nativeName: "Azərbaycan" },
  { code: "tt", name: "Tatar", nativeName: "Татар" },
  { code: "ba", name: "Bashkir", nativeName: "Башҡорт" },
];

export interface NotificationSettings {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

export interface AppSettings {
  language: string;
  reciterId: string;
  adhanStyleId: string;
  calculationMethodId: number;
  notifications: NotificationSettings;
  onboardingCompleted: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  language: "en",
  reciterId: "ar.alafasy",
  adhanStyleId: "makkah",
  calculationMethodId: 3,
  notifications: {
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
  onboardingCompleted: false,
};

interface AppSettingsContextType {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  isLoading: boolean;
}

const AppSettingsContext = createContext<AppSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: async () => {},
  isLoading: true,
});

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("app_settings").then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem("app_settings", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AppSettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}
