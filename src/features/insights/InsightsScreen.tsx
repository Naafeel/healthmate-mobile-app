import { AppScreen } from "@/components/AppScreen";
import { AppHeader } from "@/components/AppHeader";
import { AppText } from "@/components/AppText";
import { EmptyState } from "@/components/EmptyState";
export function InsightsScreen() {
  return (
    <AppScreen>
      <AppHeader eyebrow="SEE THE BIGGER PICTURE" title="Insights" />
      <AppText muted>Understand your wellbeing, one day at a time.</AppText>
      <EmptyState
        icon="bar-chart-outline"
        title="Patterns take a little time"
        description="Charts and trends will become available in a future update after you can record health data. There is nothing to analyse yet."
      />
      <AppText variant="caption" muted>
        Future insights will use your locally stored records.
      </AppText>
    </AppScreen>
  );
}
