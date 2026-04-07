/**
 * NotificationService — Adhan & Prayer Reminder Notifications
 *
 * Architecture:
 * - Two notification types per prayer (when enabled):
 *   1. REMINDER  — 10 min before prayer time, unique message per prayer
 *   2. ADHAN     — exactly at prayer time, plays custom bundled Adhan audio
 *
 * - Audio: Uses bundled adhan_custom.mp3 from assets/sounds/
 *   Bundled via expo-notifications plugin in app.config.ts
 *   Works in native builds (APK/IPA) — not in Expo Go
 *
 * - Android 8+ requires a NotificationChannel per notification type.
 *
 * - Background / locked screen: expo-notifications fires the OS-level notification
 *   which plays the audio natively — no app process needed.
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { PrayerTime } from "../contexts/PrayerContext";
import type { NotificationSettings } from "../contexts/AppSettingsContext";

// ─── Notification handler (foreground display) ───────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Android channel IDs ──────────────────────────────────────────────────────
const CHANNEL_ADHAN = "adhan";
const CHANNEL_REMINDER = "prayer-reminders";

// ─── Per-prayer reminder messages ────────────────────────────────────────────
const PRAYER_REMINDERS: Record<string, { emoji: string; title: string; body: string }> = {
  Fajr: {
    emoji: "🌙",
    title: "Fajr Prayer in 10 Minutes",
    body: "Rise and greet the dawn with prayer. The Prophet ﷺ said: 'The two rak'ahs of Fajr are better than the world and all it contains.' — Muslim",
  },
  Dhuhr: {
    emoji: "☀️",
    title: "Dhuhr Prayer in 10 Minutes",
    body: "Pause your day and remember Allah. 'Verily, the prayer is enjoined on the believers at fixed hours.' — Quran 4:103",
  },
  Asr: {
    emoji: "🌤️",
    title: "Asr Prayer in 10 Minutes",
    body: "Guard your Asr prayer. The Prophet ﷺ said: 'Whoever misses the Asr prayer, it is as if he has lost his family and property.' — Bukhari",
  },
  Maghrib: {
    emoji: "🌅",
    title: "Maghrib Prayer in 10 Minutes",
    body: "The day draws to a close — stand before your Lord. 'And glorify the praises of your Lord before the rising of the sun and before its setting.' — Quran 50:39",
  },
  Isha: {
    emoji: "🌙",
    title: "Isha Prayer in 10 Minutes",
    body: "End your day in gratitude and prayer. 'Whoever prays Isha in congregation, it is as if he has prayed half the night.' — Muslim",
  },
};

// ─── Adhan notification content per prayer ────────────────────────────────────
const ADHAN_CONTENT: Record<string, { title: string; body: string }> = {
  Fajr: {
    title: "🌙 Fajr — الصلاة خير من النوم",
    body: "Prayer is better than sleep. Allahu Akbar! Come to prayer, come to success.",
  },
  Dhuhr: {
    title: "☀️ Dhuhr — حي على الصلاة",
    body: "Allahu Akbar! It is time for Dhuhr prayer. Come to prayer, come to success.",
  },
  Asr: {
    title: "🌤️ Asr — حي على الفلاح",
    body: "Allahu Akbar! It is time for Asr prayer. Come to prayer, come to success.",
  },
  Maghrib: {
    title: "🌅 Maghrib — الله أكبر",
    body: "Allahu Akbar! The sun has set. It is time for Maghrib prayer.",
  },
  Isha: {
    title: "🌙 Isha — الله أكبر",
    body: "Allahu Akbar! The night begins. It is time for Isha prayer.",
  },
};

// ─── Setup Android channels ───────────────────────────────────────────────────
async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== "android") return;

  // Adhan channel — MAX importance, plays audio at prayer time
  await Notifications.setNotificationChannelAsync(CHANNEL_ADHAN, {
    name: "Adhan (Call to Prayer)",
    description: "Plays Adhan sound at each prayer time",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 200, 500, 200, 500],
    lightColor: "#F59E0B",
    enableLights: true,
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
    sound: "adhan_custom.mp3",
  });

  // Reminder channel — HIGH importance, 10 min before prayer
  await Notifications.setNotificationChannelAsync(CHANNEL_REMINDER, {
    name: "Prayer Reminders (10 min before)",
    description: "Reminds you 10 minutes before each prayer time",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 100, 250],
    lightColor: "#7C3AED",
    enableLights: true,
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

// ─── Request permissions ──────────────────────────────────────────────────────
export async function requestNotificationPermissions(): Promise<boolean> {
  await setupAndroidChannels();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowCriticalAlerts: false,
      provideAppNotificationSettings: false,
    },
  });
  return status === "granted";
}

// ─── Schedule all prayer notifications ───────────────────────────────────────
export async function schedulePrayerNotifications(
  prayerTimes: PrayerTime[],
  notificationSettings: NotificationSettings
): Promise<void> {
  // Cancel all previously scheduled prayer notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Ensure Android channels exist (idempotent)
  await setupAndroidChannels();

  const prayerKeyMap: Record<string, keyof NotificationSettings> = {
    Fajr: "fajr",
    Dhuhr: "dhuhr",
    Asr: "asr",
    Maghrib: "maghrib",
    Isha: "isha",
  };

  const now = Date.now();

  for (const prayer of prayerTimes) {
    const settingKey = prayerKeyMap[prayer.name];
    if (!settingKey || !notificationSettings[settingKey]) continue;

    const reminder = PRAYER_REMINDERS[prayer.name];
    const adhan = ADHAN_CONTENT[prayer.name];
    if (!reminder || !adhan) continue;

    // ── 1. Reminder: 10 minutes before prayer ──────────────────────────────
    const reminderTimestamp = prayer.timestamp - 10 * 60 * 1000;
    if (reminderTimestamp > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: `reminder_${prayer.name}_${prayer.timestamp}`,
        content: {
          title: `${reminder.emoji} ${reminder.title}`,
          body: reminder.body,
          data: { type: "prayer_reminder", prayer: prayer.name, timestamp: prayer.timestamp },
          sound: "default",
          color: "#7C3AED",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(reminderTimestamp),
          ...(Platform.OS === "android" ? { channelId: CHANNEL_REMINDER } : {}),
        },
      });
    }

    // ── 2. Adhan: exactly at prayer time ──────────────────────────────────
    const adhanTimestamp = prayer.timestamp;
    if (adhanTimestamp > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: `adhan_${prayer.name}_${prayer.timestamp}`,
        content: {
          title: adhan.title,
          body: adhan.body,
          data: { type: "adhan", prayer: prayer.name, timestamp: prayer.timestamp },
          sound: "adhan_custom.mp3",
          color: "#F59E0B",
          badge: 1,
          priority: "high",
          vibrate: [0, 500, 200, 500, 200, 500],
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(adhanTimestamp),
          ...(Platform.OS === "android" ? { channelId: CHANNEL_ADHAN } : {}),
        },
      });
    }
  }
}

// ─── Cancel all prayer notifications ─────────────────────────────────────────
export async function cancelAllPrayerNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Get count of scheduled notifications (for debugging) ────────────────────
export async function getScheduledNotificationCount(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}
