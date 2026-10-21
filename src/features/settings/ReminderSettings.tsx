import { useEffect, useState } from "react";
import { AppState, Linking } from "react-native";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
import { usePreferences } from "@/store/preferences";
import { syncReminder } from "@/data/reminders/nativeReminder";
export function ReminderSettings() {
  const state = usePreferences();
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  const p = state.preferences;
  async function refresh() {
    try {
      setStatus(await syncReminder());
    } catch {
      setStatus(
        "Reminder could not be scheduled. Retry or check Android settings.",
      );
    }
  }
  useEffect(() => {
    let active = true;
    void syncReminder()
      .then((message) => {
        if (active) setStatus(message);
      })
      .catch(() => {
        if (active) setStatus("Reminder could not be scheduled. Please retry.");
      });
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void refresh();
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, [p.reminderEnabled, p.reminderHour, p.reminderMinute, state.loaded]);
  async function update(next: typeof p, request = false) {
    if (busy || state.busy) return;
    setBusy(true);
    try {
      if (await state.save(next)) setStatus(await syncReminder(request));
    } catch {
      setStatus("Preference saved, but scheduling failed. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  const time =
    String(p.reminderHour).padStart(2, "0") +
    ":" +
    String(p.reminderMinute).padStart(2, "0");
  return (
    <AppCard>
      <AppText variant="heading" accessibilityRole="header">
        Daily Reminder
      </AppText>
      <AppText muted>
        Remind me to update my daily health record. Optional, offline, and off
        until you enable it.
      </AppText>
      <AppText>
        Daily local time: {time} ·{" "}
        {p.reminderEnabled ? "Enabled preference" : "Off"}
      </AppText>
      <AppButton
        label="Choose reminder time"
        variant="secondary"
        disabled={!state.loaded || state.busy || busy}
        onPress={() => {
          const value = new Date();
          value.setHours(p.reminderHour, p.reminderMinute, 0, 0);
          DateTimePickerAndroid.open({
            value,
            mode: "time",
            is24Hour: true,
            onValueChange: (_event, date) =>
              void update({
                ...p,
                reminderHour: date.getHours(),
                reminderMinute: date.getMinutes(),
              }),
          });
        }}
      />
      <AppButton
        label={
          p.reminderEnabled ? "Disable daily reminder" : "Enable daily reminder"
        }
        disabled={!state.loaded || state.busy || busy}
        onPress={() =>
          void update(
            { ...p, reminderEnabled: !p.reminderEnabled },
            !p.reminderEnabled,
          )
        }
      />
      <AppText accessibilityLiveRegion="polite">{status}</AppText>
      <AppButton
        label="Retry reminder scheduling"
        variant="secondary"
        disabled={busy || state.busy}
        onPress={() => void refresh()}
      />
      <AppButton
        label="Open Android notification settings"
        variant="secondary"
        onPress={() => void Linking.openSettings()}
      />
      <AppText variant="caption" muted>
        Android battery optimization, permission settings and force-stopping may
        delay or prevent delivery. This is a generic reminder, including days
        already logged.
      </AppText>
      {state.error && (
        <AppText accessibilityRole="alert">{state.error}</AppText>
      )}
    </AppCard>
  );
}
