import { AppScreen } from "@/components/AppScreen";
import { AppHeader } from "@/components/AppHeader";
import { AppText } from "@/components/AppText";
import { AppCard } from "@/components/AppCard";
export function SettingsScreen() {
  return (
    <AppScreen>
      <AppHeader eyebrow="MAKE IT YOURS" title="Settings" />
      <AppText muted>A thoughtful space for your health preferences.</AppText>
      <AppCard>
        <AppText variant="heading" accessibilityRole="header">
          Daily health goals
        </AppText>
        <AppText muted>
          Planned · Personal goals will be introduced alongside health tracking.
        </AppText>
      </AppCard>
      <AppCard>
        <AppText variant="heading" accessibilityRole="header">
          Application preferences
        </AppText>
        <AppText muted>
          Planned · Preferences will appear here when supported. HealthMate
          currently uses a calm, light appearance.
        </AppText>
      </AppCard>
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
          Version 1.0.0 · UI foundation{"\n"}Local health tracking is planned.
          No health data is collected in this version.
        </AppText>
      </AppCard>
    </AppScreen>
  );
}
