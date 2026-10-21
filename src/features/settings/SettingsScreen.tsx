import { router } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { useDataMaintenance } from "@/store/dataMaintenance";
import { ReminderSettings } from "./ReminderSettings";
import { AppearanceSettings } from "./AppearanceSettings";
import { AppScreen } from "@/components/AppScreen";
import { AppHeader } from "@/components/AppHeader";
import { AppText } from "@/components/AppText";
import { AppCard } from "@/components/AppCard";
import { GoalSettings } from "./GoalSettings";
export function SettingsScreen() {
  const revision = useDataMaintenance((s) => s.revision);
  return (
    <AppScreen keyboard>
      <AppHeader eyebrow="MAKE IT YOURS" title="Settings" />
      <AppText muted>A thoughtful space for your health preferences.</AppText>
      <AppButton
        label="Achievements"
        variant="secondary"
        onPress={() => router.push("/achievements")}
      />
      <AppButton
        label="My Profile"
        variant="secondary"
        onPress={() => router.push("/profile")}
      />
      <AppButton
        label="Customize Dashboard"
        variant="secondary"
        onPress={() => router.push("/dashboard-layout")}
      />
      <AppearanceSettings />
      <ReminderSettings />
      <GoalSettings key={revision} />
      <AppButton
        label="Privacy & Data Management"
        variant="secondary"
        onPress={() => router.push("/privacy")}
      />

      <AppCard>
        <AppText variant="eyebrow" muted>
          ABOUT HEALTHMATE
        </AppText>
        <AppText variant="heading">A little care. Every day.</AppText>
        <AppText muted>Personal Health & Wellness Tracker</AppText>
        <AppText variant="caption" muted>
          Version 1.1.0 · Local record management{"\n"}Health records are saved
          on this device. No cloud account or synchronization is used.
        </AppText>
      </AppCard>
    </AppScreen>
  );
}
