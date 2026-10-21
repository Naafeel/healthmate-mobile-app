import { BackupSettings } from "./BackupSettings";
import { useDataMaintenance } from "@/store/dataMaintenance";
import { ReminderSettings } from "./ReminderSettings";
import { AppearanceSettings } from "./AppearanceSettings";
import { AppScreen } from "@/components/AppScreen";
import { AppHeader } from "@/components/AppHeader";
import { AppText } from "@/components/AppText";
import { AppCard } from "@/components/AppCard";
import { GoalSettings } from "./GoalSettings";
import { ExportRecordsCard } from "@/features/export/ExportRecordsCard";
export function SettingsScreen() {
  const revision=useDataMaintenance(s=>s.revision);
  return (
    <AppScreen keyboard>
      <AppHeader eyebrow="MAKE IT YOURS" title="Settings" />
      <AppText muted>A thoughtful space for your health preferences.</AppText>
      <AppearanceSettings />
      <ReminderSettings />
      <GoalSettings key={revision} />
      <ExportRecordsCard />
      <BackupSettings />

      <AppCard>
        <AppText variant="eyebrow" muted>
          ABOUT HEALTHMATE
        </AppText>
        <AppText variant="heading">A little care. Every day.</AppText>
        <AppText muted>Personal Health & Wellness Tracker</AppText>
        <AppText variant="caption" muted>
          Kingston University / ESOFT{"\n"}Mobile Application Development
          coursework
        </AppText>
        <AppText variant="caption" muted>
          Version 1.0.0 · Local record management{"\n"}Health records are saved
          on this device. No cloud account or synchronization is used.
        </AppText>
      </AppCard>
    </AppScreen>
  );
}
