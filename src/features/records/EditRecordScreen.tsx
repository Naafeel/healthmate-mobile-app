import { router, useLocalSearchParams } from "expo-router";
import { AppScreen } from "@/components/AppScreen";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
import { RecordFormScreen } from "./RecordFormScreen";
import { recordRouteId } from "@/domain/records/recordRoute";
export function EditRecordScreen() {
  const { id, returnTo } = useLocalSearchParams<{
    id: string | string[];
    returnTo?: string | string[];
  }>();
  const number = recordRouteId(id);
  if (number === null)
    return (
      <AppScreen tab={false}>
        <AppText accessibilityRole="alert">
          This record link is invalid.
        </AppText>
        <AppButton
          label="Return to Records"
          onPress={() => router.replace("/(tabs)/records")}
        />
      </AppScreen>
    );
  return (
    <RecordFormScreen
      key={number}
      id={number}
      returnToCalendar={returnTo === "calendar"}
    />
  );
}
