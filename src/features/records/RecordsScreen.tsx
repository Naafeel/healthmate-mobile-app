import { router } from "expo-router";
import { AppScreen } from "@/components/AppScreen";
import { AppHeader } from "@/components/AppHeader";
import { AppText } from "@/components/AppText";
import { AppCard } from "@/components/AppCard";
import { AppButton } from "@/components/AppButton";
import { EmptyState } from "@/components/EmptyState";
export function RecordsScreen() {
  return (
    <AppScreen>
      <AppHeader eyebrow="YOUR HEALTH JOURNAL" title="Records" />
      <AppText muted>A space for your everyday health history.</AppText>
      <AppCard>
        <AppText variant="label">Find records by date</AppText>
        <AppText variant="caption" muted>
          Planned · Date search and filtering will be available with record
          history.
        </AppText>
      </AppCard>
      <EmptyState
        icon="reader-outline"
        title="Your story starts here"
        description="There are no health records to show. Record creation and your history will become available in the next implementation phase."
      />
      <AppButton
        label="Add Record"
        icon="add"
        onPress={() => router.push("/add-record")}
        accessibilityHint="Opens the upcoming health entry screen"
      />
    </AppScreen>
  );
}
