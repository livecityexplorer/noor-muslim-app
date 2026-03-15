# Noor: Complete Muslim Companion — Design Plan

## Brand Identity
- **App Name:** Noor (نور) — Arabic for "Light"
- **Tagline:** Your Complete Muslim Companion
- **Theme:** Lightning / Electric Light — vibrant electric blues (#4FC3F7), deep purples (#7C3AED), electric pinks (#EC4899), and gold accents (#F59E0B)
- **Feel:** Spiritual yet modern, energetic yet serene. Like a beam of divine light.

## Color Palette
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| background | #0A0A1A | #0A0A1A | Deep midnight blue-black |
| surface | #12122A | #12122A | Card/elevated surfaces |
| primary | #7C3AED | #7C3AED | Electric purple — primary accent |
| secondary | #4FC3F7 | #4FC3F7 | Electric blue — secondary accent |
| accent | #EC4899 | #EC4899 | Electric pink — highlights |
| gold | #F59E0B | #F59E0B | Gold — Islamic accents |
| foreground | #F0F0FF | #F0F0FF | Primary text (near-white with blue tint) |
| muted | #8B8BB0 | #8B8BB0 | Secondary text |
| border | #2A2A4A | #2A2A4A | Borders/dividers |

## Screen List

### 1. Onboarding (3 slides)
- Slide 1: Welcome + App logo + tagline
- Slide 2: Location permission request (for prayer times)
- Slide 3: Notification permission request + language selection

### 2. Home (Tab 1)
- Greeting with current time
- Next prayer countdown card (prominent)
- Today's prayer times mini-list
- Daily Hadith card
- Quick access to Quran (last read surah)
- Islamic date display

### 3. Quran (Tab 2)
- Surah list screen with search
- Surah detail screen: Arabic text + translation side by side
- Audio player bar at bottom (persistent)
- Reciter selection sheet
- Translation language selection sheet
- Bookmark management

### 4. Prayer Times (Tab 3)
- Location display (auto-detected or manual)
- Today's 5 prayer times with countdown to next
- Adhan settings (per prayer)
- Calculation method selector
- Weekly prayer times view

### 5. Qibla (Tab 4)
- Animated compass dial
- Qibla direction arrow overlaid on compass
- Distance to Mecca display
- Calibration instructions
- Accuracy indicator

### 6. More (Tab 5)
- Hadith Library (collections browser)
- Dhikr Counter (Tasbih)
- Settings screen

### 7. Settings (from More tab)
- Language selection
- Reciter selection
- Adhan sound selection
- Prayer calculation method
- Notification preferences (per prayer toggle)
- Theme preferences
- About / App info

## Key User Flows

### Quran Playback Flow
User taps Quran tab → Surah list → Taps surah → Surah detail with Arabic + translation → Taps play button → Audio starts → Mini player appears at bottom → User locks phone → Lock screen shows media controls

### Prayer Time Notification Flow
App detects location on first launch → Calculates prayer times → Schedules local notifications for 10 min before each prayer → At prayer time, Adhan plays → User receives notification

### Qibla Flow
User taps Qibla tab → Location detected → Compass activates → Arrow points to Qibla → User rotates phone to align

### Dhikr Flow
User taps More → Dhikr Counter → Sets target (33/99/100) → Taps large button → Counter increments with haptic → Vibrates at target completion

## Navigation Structure
Bottom tab bar with 5 tabs:
1. **Home** (house icon)
2. **Quran** (book icon)
3. **Prayer** (mosque/crescent icon)
4. **Qibla** (compass icon)
5. **More** (grid/menu icon)

## Typography
- Arabic text: System default (Noto Naskh Arabic or device default)
- Latin text: System default (SF Pro on iOS, Roboto on Android)
- Header sizes: 28-32px bold
- Body: 16px regular, 1.5 line height
- Arabic Quran text: 22-26px, right-aligned

## Visual Design Elements
- Gradient headers on each screen (purple → blue)
- Subtle geometric Islamic pattern overlay (low opacity) on backgrounds
- Card components with glass-morphism effect (dark surface + border glow)
- Glowing accent borders on active elements
- Star/light particle effects on home screen
- Crescent moon + star motif in logo and accents
