import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { PrayerTime } from "../contexts/PrayerContext";
import type { NotificationSettings } from "../contexts/AppSettingsContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("prayer-reminders", {
      name: "Prayer Reminders",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#7C3AED",
      sound: "default",
    });
    await Notifications.setNotificationChannelAsync("adhan", {
      name: "Adhan",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: "#F59E0B",
      sound: "default",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function schedulePrayerNotifications(
  prayerTimes: PrayerTime[],
  notificationSettings: NotificationSettings
): Promise<void> {
  // Cancel existing prayer notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  const prayerKeyMap: Record<string, keyof NotificationSettings> = {
    Fajr: "fajr",
    Dhuhr: "dhuhr",
    Asr: "asr",
    Maghrib: "maghrib",
    Isha: "isha",
  };

  const prayerEmojis: Record<string, string> = {
    Fajr: "🌙",
    Dhuhr: "☀️",
    Asr: "🌤️",
    Maghrib: "🌅",
    Isha: "🌙",
  };

  for (const prayer of prayerTimes) {
    const settingKey = prayerKeyMap[prayer.name];
    if (!settingKey || !notificationSettings[settingKey]) continue;

    // Schedule 10 minutes before prayer
    const reminderTime = new Date(prayer.timestamp - 10 * 60 * 1000);
    if (reminderTime > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${prayerEmojis[prayer.name] || "🕌"} ${prayer.displayName} in 10 minutes`,
          body: `Time to prepare for ${prayer.displayName} prayer at ${prayer.time}`,
          data: { type: "prayer_reminder", prayer: prayer.name },
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderTime,
        },
      });
    }

    // Schedule notification at prayer time
    const prayerTime = new Date(prayer.timestamp);
    if (prayerTime > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${prayerEmojis[prayer.name] || "🕌"} ${prayer.displayName} Time`,
          body: `It's time for ${prayer.displayName} prayer. Allahu Akbar!`,
          data: { type: "adhan", prayer: prayer.name },
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: prayerTime,
        },
      });
    }
  }
}
