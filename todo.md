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
- [x] Fix audio stopping when screen is locked or app is in background (iOS UIBackgroundModes + Android foreground service)

## Lock Screen Media Controls
- [x] Show Now Playing info on iOS lock screen / Control Center (surah name, reciter, artwork)
- [x] Show playback notification on Android with play/pause/skip controls
- [x] Interactive lock screen controls: play, pause, previous surah, next surah
- [x] Update Now Playing metadata when surah changes

## Halal Food Scanner Tab
- [x] Halal ingredient database (50+ ingredients with Islamic rulings)
- [x] Open Food Facts API service with analysis engine
- [x] Scanner Home screen with quick actions, recent scans, daily insights
- [x] Barcode scanner screen (camera + manual entry)
- [x] Product search screen with filters
- [x] Product detail screen with ingredient analysis and Islamic rulings accordions
- [x] Scan history screen with timeline and filters
- [x] Favorites screen (saved products)
- [x] Ingredient database browser (A-Z, E-numbers, categories)
- [x] Learn section with 5 modules and accordion lessons
- [x] Scanner settings (via app Settings screen)
- [x] Add Scanner tab to bottom navigation
- [x] Add scanner icon to icon-symbol.tsx

## Camera Barcode Scanner
- [x] Install expo-camera package
- [x] Add camera permission to app.config.ts
- [x] Rewrite scan.tsx with live camera viewfinder and real-time barcode detection
- [x] Scanning overlay UI: corner brackets, laser line animation, torch toggle
- [x] Auto-navigate to product detail on successful scan
- [x] Manual barcode entry fallback (keep existing)
- [x] Handle camera permission denied gracefully

## Adhan & Prayer Notifications Fix
- [x] Fix Adhan audio playing at prayer time in background/locked screen via local notification sound
- [x] Use CDN audio URLs for Adhan notifications (no bundling required)
- [x] 10-minute before prayer reminder notifications with dedicated per-prayer messages
- [x] Unique reminder message for each of the 5 prayers (Fajr, Dhuhr, Asr, Maghrib, Isha)
- [x] Schedule both reminder + Adhan notifications when prayer times are fetched
- [x] Cancel and reschedule notifications when settings change


## Adhan & Quran Background Audio Fixes
- [x] Download custom Adhan file from Google Drive
- [x] Remove all other Adhan style options (keep only custom one)
- [x] Bundle Adhan audio file in app.config.ts as notification sound
- [x] Update NotificationService to use bundled Adhan audio
- [x] Test Adhan notification at prayer time (locked/backgrounded)
- [x] Install expo-av for better audio playback (ExoPlayer alternative)
- [x] AudioPlayerContext already uses expo-audio with background playback support
- [x] Lock screen media controls for Quran audio already implemented via setActiveForLockScreen
- [x] MiniPlayer UI already shows lock screen controls
- [x] All 28 tests pass

## Bug Fixes
- [x] Fix Adhan preview in Prayer screen — plays wrong audio (Quran instead of Adhan)

## Scanner UI Redesign
- [x] Redesign Scanner home screen cards with better graphics and compact layout
- [x] Improve card styling: icons, gradients, spacing
- [x] Make cards more visually appealing and less elongated
- [x] Fix card layout — horizontal design matching Learn Halal cards (icon + title + description + chevron)
## Adhan Playback Issues
- [x] Fix Adhan not playing at prayer times
- [x] Configure Adhan audio for offline use (bundle locally)
- [x] Ensure Adhan plays even when app is in background

## Adhan APK Build Issues
- [x] Fix Adhan audio not playing in APK at prayer times
- [x] Fix Adhan preview not working in APK build
- [x] Ensure Adhan audio is properly bundled and accessible offline in APK

## Adhan Preview Audio Issue
- [x] Fix Adhan preview audio — no sound coming out when user tries to preview
- [x] Verify audio file is loading correctly
- [x] Ensure audio volume and playback settings are correct

## Adhan APK Audio - Critical Issues
- [x] Fix Adhan audio in APK build — use require() for all platforms for proper bundling
- [x] Add stop button to control Adhan playback when it's playing
- [x] Test Adhan notification audio at prayer times in APK
