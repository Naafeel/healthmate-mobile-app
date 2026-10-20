import { router } from "expo-router";
import { AppScreen } from "@/components/AppScreen";
import { AppHeader } from "@/components/AppHeader";
import { AppText } from "@/components/AppText";
import { AppCard } from "@/components/AppCard";
import { AppButton } from "@/components/AppButton";
import { EmptyState } from "@/components/EmptyState";

export function DashboardScreen() {
  const date = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
  return (
    <AppScreen>
      <AppHeader eyebrow="YOUR DAILY CHECK-IN" title="Dashboard" />
      <AppCard>
        <AppText variant="heading">Welcome to your day</AppText>
        <AppText muted>{date}</AppText>
        <AppText muted>A little care. Every day.</AppText>
        <AppButton
          label="Add Record"
          icon="add"
          onPress={() => router.push("/add-record")}
          accessibilityHint="Opens the upcoming health entry screen"
        />
      </AppCard>
      <AppText variant="heading" accessibilityRole="header">
        Today’s overview
      </AppText>
      <EmptyState
        icon="heart-outline"
        title="Make room for your wellbeing"
        description="Your daily summaries will live here once health tracking is available. No records or statistics are available yet."
      />
      <AppCard>
        <AppText variant="eyebrow" muted>
          LOOKING AHEAD
        </AppText>
        <AppText variant="heading">Small steps, a clearer picture</AppText>
        <AppText muted>
          Activity, hydration and wellbeing summaries are planned for a later
          update.
        </AppText>
      </AppCard>
    </AppScreen>
  );
}
