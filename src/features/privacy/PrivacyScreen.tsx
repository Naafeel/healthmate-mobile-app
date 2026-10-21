import { useRef, useState } from "react";
import { Alert, TextInput } from "react-native";
import { router } from "expo-router";
import { AppScreen } from "@/components/AppScreen";
import { AppHeader } from "@/components/AppHeader";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
import { BackupSettings } from "@/features/settings/BackupSettings";
import { ExportRecordsCard } from "@/features/export/ExportRecordsCard";
import { manageData } from "@/data/privacy/manageData";
import { useDataMaintenance } from "@/store/dataMaintenance";
import { useTheme } from "@/theme/useTheme";
export function PrivacyScreen() {
  const theme = useTheme();
  const busy = useDataMaintenance((s) => s.busy);
  const [typed, setTyped] = useState(""),
    [message, setMessage] = useState("");
  const lock = useRef(false);
  const dialog = useRef(false);
  async function execute(all: boolean) {
    if (lock.current) return;
    lock.current = true;
    try {
      setMessage(await manageData(all, all ? typed : "DELETE"));
      if (all) setTyped("");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      lock.current = false;
    }
  }
  function confirm(all: boolean) {
    if (lock.current || busy || dialog.current) return;
    if (all && typed !== "RESET") {
      setMessage("Type RESET exactly before confirming a complete reset.");
      return;
    }
    dialog.current = true;
    Alert.alert(
      all ? "Reset all HealthMate data?" : "Delete all health records?",
      all
        ? "Permanently deletes daily records, notes, tags, goals, profile, dashboard layout, appearance and reminder preferences. Own scheduled reminders will be cancelled. This cannot be undone. External backups and shared files remain unchanged. Create a backup first if needed."
        : "Permanently deletes every daily record and its notes/tags. Goals, profile, theme, layout and reminders are preserved. This cannot be undone. External backups remain unchanged. Create a backup first if needed.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            dialog.current = false;
          },
        },
        {
          text: "Backup first",
          onPress: () => {
            dialog.current = false;
            setMessage(
              "No data deleted. Use Backup HealthMate Data above, save it privately, then return to the deletion action.",
            );
          },
        },
        {
          text: all ? "Reset all data" : "Delete records",
          style: "destructive",
          onPress: () => {
            dialog.current = false;
            void execute(all);
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          dialog.current = false;
        },
      },
    );
  }
  return (
    <AppScreen tab={false} keyboard>
      <AppHeader
        title="Privacy & Data"
        onBack={() =>
          router.canGoBack()
            ? router.back()
            : router.replace("/(tabs)/settings")
        }
      />
      <AppCard>
        <AppText variant="heading">Your information stays local</AppText>
        <AppText>
          Health records, notes, tags, profile, goals and preferences are stored
          on this device. HealthMate needs no account and implements no cloud
          synchronization. Android system backup is disabled for the standalone
          app.
        </AppText>
        <AppText>
          JSON backups are not encrypted and may contain personal health
          information. Sharing apps and externally saved files are outside
          HealthMate’s control. Deleting in-app data does not erase those
          copies. Reminder messages do not include your measurements or notes.
        </AppText>
      </AppCard>
      <BackupSettings />
      <ExportRecordsCard />
      <AppCard>
        <AppText variant="heading">Delete health records</AppText>
        <AppText muted>
          Deletes daily records, notes and tags only. Keeps your profile, goals
          and preferences. Create a backup above before deleting.
        </AppText>
        <AppButton
          label="Clear all health records"
          variant="secondary"
          disabled={busy}
          onPress={() => confirm(false)}
        />
      </AppCard>
      <AppCard>
        <AppText variant="heading">Reset all HealthMate data</AppText>
        <AppText muted>
          Irreversible. Deletes records, profile, goals and all application
          preferences, and cancels HealthMate’s own scheduled reminders.
          External copies remain. Create a backup above first.
        </AppText>
        <TextInput
          accessibilityLabel="Type RESET to confirm full reset"
          placeholder="Type RESET"
          placeholderTextColor={theme.colors.muted}
          value={typed}
          onChangeText={setTyped}
          editable={!busy}
          autoCapitalize="characters"
          autoCorrect={false}
          style={{
            ...theme.typography.body,
            color: theme.colors.text,
            borderColor: theme.colors.border,
            borderWidth: 1,
            padding: 16,
            borderRadius: 12,
            minHeight: 52,
          }}
        />
        <AppButton
          label="Reset all HealthMate data"
          variant="secondary"
          disabled={busy || typed !== "RESET"}
          onPress={() => confirm(true)}
        />
      </AppCard>
      {!!message && (
        <AppText accessibilityRole="alert" accessibilityLiveRegion="polite">
          {message}
        </AppText>
      )}
    </AppScreen>
  );
}
