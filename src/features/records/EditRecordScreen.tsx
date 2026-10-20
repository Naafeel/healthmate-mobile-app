import { router, useLocalSearchParams } from "expo-router";
import { AppScreen } from "@/components/AppScreen";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
import { RecordFormScreen } from "./RecordFormScreen";
export function EditRecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const number = Number(id);
  if (!/^\d+$/.test(id || "") || !Number.isSafeInteger(number) || number <= 0)
    return (
      <AppScreen tab={false}>
        <AppText>This record link is invalid.</AppText>
        <AppButton
          label="Return to Records"
          onPress={() => router.replace("/(tabs)/records")}
        />
      </AppScreen>
    );
  return <RecordFormScreen key={number} id={number} />;
}
