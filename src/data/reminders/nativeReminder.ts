import {
  reconcileReminder,
  reminderId,
  type ReminderPort,
} from "../../domain/reminders/reconcileReminder";
import { usePreferences } from "../../store/preferences";
import { isRunningInExpoGo, requireOptionalNativeModule } from "expo";
let notifications: Promise<typeof import("expo-notifications")> | undefined;
async function loadNotifications() {
  if (
    isRunningInExpoGo() &&
    !requireOptionalNativeModule("ExpoTopicSubscriptionModule")
  )
    throw new Error(
      "Reminder scheduling and cancellation require the standalone HealthMate app; this Expo Go client lacks the required notification module. Native verification is pending.",
    );
  if (!notifications)
    notifications = import("expo-notifications").then((module) => {
      module.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
      return module;
    });
  return notifications;
}
const channelId = "healthmate-daily";
const port: ReminderPort = {
  permission: async (request) => {
    const Notifications = await loadNotifications();
    await Notifications.setNotificationChannelAsync(channelId, {
      name: "Daily activity reminder",
      importance: Notifications.AndroidImportance.DEFAULT,
      enableVibrate: false,
    });
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted && request && permission.canAskAgain)
      permission = await Notifications.requestPermissionsAsync();
    return permission.granted;
  },
  list: async () => {
    const Notifications = await loadNotifications();
    return (await Notifications.getAllScheduledNotificationsAsync()).map(
      (n) => ({
        id: n.identifier,
        hour: Number(n.content.data?.hour),
        minute: Number(n.content.data?.minute),
        zone: String(n.content.data?.zone ?? ""),
      }),
    );
  },
  cancel: async (id) =>
    (await loadNotifications()).cancelScheduledNotificationAsync(id),
  schedule: async (hour, minute, zone) => {
    const Notifications = await loadNotifications();
    await Notifications.scheduleNotificationAsync({
      identifier: reminderId,
      content: {
        title: "HealthMate",
        body: "A little care, every day. Remember to update your daily health record.",
        data: { hour, minute, zone },
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId,
        delivery: "bestEffort",
      },
    });
  },
};
let tail: Promise<unknown> = Promise.resolve();
export function syncReminder(request = false): Promise<string> {
  const run = async () => {
    const state = usePreferences.getState();
    if (!state.loaded) return "Loading reminder preferences…";
    const zone =
      Intl.DateTimeFormat().resolvedOptions().timeZone +
      ":" +
      new Date().getTimezoneOffset();
    return reconcileReminder(state.preferences, port, zone, request);
  };
  const next = tail.then(run, run);
  tail = next.catch(() => undefined);
  return next;
}
