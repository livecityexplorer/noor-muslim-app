# Noor Muslim App - TODO

## Setup & Configuration
- [x] Install required packages (expo-location, expo-sensors, expo-linear-gradient, etc.)
- [x] Configure theme with lightning color palette
- [x] Configure app.config.ts with background audio, location permissions
- [x] Set up tab navigation (5 tabs: Home, Quran, Prayer, Qibla, More)
- [x] Add all icon mappings to icon-symbol.tsx

## Onboarding
- [x] Onboarding screen with 3 slides
- [x] Location permission request slide
- [x] Notification permission request slide
- [x] Language selection on onboarding
- [x] Persist onboarding completion state

## Context & State Management
- [x] AppSettingsContext (language, reciter, adhan, calc method, notifications)
- [x] QuranContext (current surah, ayah, bookmarks, last read)
- [x] PrayerContext (location, prayer times, countdown)
- [x] AsyncStorage persistence for all settings

## Home Screen
- [x] Greeting with current time and Islamic date
- [x] Next prayer countdown card (live countdown)
- [x] Today's prayer times mini-list
- [x] Daily Hadith card
- [x] Quick access to last read Quran surah

## Quran Section
- [x] Surah list screen with search (using Al-Quran Cloud API)
- [x] Surah detail screen with Arabic text (Uthmani)
- [x] Translation display alongside Arabic
- [x] Ayah-by-ayah navigation
- [x] Bookmarking system
- [x] Audio player with play/pause per ayah
- [x] Reciter selection (5 reciters from API)
- [x] Translation language selection (60+ languages)

## Prayer Times Section
- [x] Auto-detect location with expo-location
- [x] Manual location entry fallback
- [x] Prayer times calculation using Aladhan API
- [x] Display 5 daily prayer times
- [x] Countdown to next prayer
- [x] Calculation method selection (12 methods)
- [x] Adhan audio preview playback
- [x] Local notifications for each prayer
- [x] Per-prayer notification toggle
- [x] Adhan style selection

## Qibla Compass
- [x] Install expo-sensors for magnetometer
- [x] Compass dial UI with SVG
- [x] Qibla direction calculation from coordinates
- [x] Animated compass needle
- [x] Distance to Mecca display
- [x] Calibration instructions
- [x] Accuracy indicator

## Hadith Section
- [x] Hadith API integration (hadith.gading.dev)
- [x] Collections browser (Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah)
- [x] Daily/random Hadith display on home screen
- [x] Arabic + translation display
- [x] Paginated hadith list per collection

## Dhikr Counter (Tasbih)
- [x] 7 preset dhikr phrases with Arabic text
- [x] Large tap counter button with animation
- [x] Current count display
- [x] Reset button
- [x] Target count setting (preset + custom)
- [x] Haptic feedback on tap
- [x] Completion celebration at target
- [x] Persist count across sessions (daily reset)
- [x] Session summary

## Settings Screen
- [x] Language selection (searchable list)
- [x] Reciter selection
- [x] Adhan sound selection
- [x] Prayer calculation method
- [x] Notification preferences per prayer
- [x] About / App info section

## Branding & Polish
- [x] Generate app logo (golden crescent + star)
- [x] Update app.config.ts with branding
- [x] Lightning gradient theme throughout app
- [x] Islamic geometric pattern overlays
- [x] Smooth animations and transitions
- [x] 16 unit tests passing
- [x] Final checkpoint and delivery

## Audio Upgrade (Full Surah Playback)
- [x] Create global AudioPlayerContext for surah-level playback
- [x] Background audio: continues when screen is locked (playsInSilentMode, background mode)
- [x] Full surah audio from mp3quran CDN (single file per surah)
- [x] Auto-advance: play next surah when current finishes
- [x] Persistent MiniPlayer bar above tab bar (visible on all screens)
- [x] MiniPlayer: surah name, play/pause, prev/next surah buttons
- [x] MiniPlayer: tap to expand to full player
- [x] Update Quran surah list: tap surah → plays full surah audio
- [x] Update Quran detail screen: play button plays full surah, not per-ayah
- [x] Lock screen / notification media controls (expo-audio background mode)

## Bug Fixes
- [x] Fix Quran audio not playing (AudioPlayerContext / expo-audio API issue)
