import { router } from "expo-router";
import { AppScreen } from "@/components/AppScreen";
import { AppHeader } from "@/components/AppHeader";
import { AppText } from "@/components/AppText";
import { EmptyState } from "@/components/EmptyState";
export function AddRecordScreen() {
  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/dashboard");
  }
  return (
    <AppScreen tab={false}>
      <AppHeader title="Add Record" onBack={goBack} />
      <AppText muted>A dedicated space for your daily check-in.</AppText>
      <EmptyState
        icon="create-outline"
        title="Your next healthy step"
        description="The health entry form is coming in a later phase. You will be able to add and validate your daily health details here. Nothing can be entered or saved yet."
      />
    </AppScreen>
  );
}
