import { RecordFormScreen } from "./RecordFormScreen";
import { router, useLocalSearchParams } from "expo-router";
import { resolveAddDate } from "@/domain/calendar/dates";
import { localDate } from "@/domain/records/validation";
import { AppScreen } from "@/components/AppScreen";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
export function AddRecordScreen() {
  const params = useLocalSearchParams<{
    date?: string | string[];
    returnTo?: string | string[];
  }>();
  const date = resolveAddDate(params.date, localDate());
  if (date === null)
    return (
      <AppScreen tab={false}>
        <AppText accessibilityRole="alert">
          This record date link is invalid or in the future.
        </AppText>
        <AppButton
          label="Return to Records"
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/(tabs)/records")
          }
        />
      </AppScreen>
    );
  return (
    <RecordFormScreen
      key={date}
      initialDate={date}
      returnToCalendar={params.returnTo === "calendar"}
    />
  );
}
