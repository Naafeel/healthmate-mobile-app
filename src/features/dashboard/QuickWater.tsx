import { router } from "expo-router";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
import { useHealthRecords, healthRecordStore } from "@/store/healthRecords";
import { waterIncrements } from "@/domain/records/quickWater";
export function QuickWater({ today }: { today: string }) {
  const record = useHealthRecords((s) =>
    s.records.find((r) => r.date === today),
  );
  const busy = useHealthRecords((s) => s.mutating),
    error = useHealthRecords((s) => s.error),
    success = useHealthRecords((s) => s.success);
  return (
    <AppCard>
      <AppText variant="heading" accessibilityRole="header">
        Quick Add Water
      </AppText>
      <AppText muted>
        {record
          ? "Add to today’s saved water. Steps and calories stay unchanged."
          : "Start today’s record with water prefilled, then enter your steps and calories."}
      </AppText>
      {waterIncrements.map((amount) => (
        <AppButton
          key={amount}
          label={
            record ? "+" + amount + " ml" : "Start today with " + amount + " ml"
          }
          accessibilityLabel={
            "Add " + amount + " millilitres of water for today"
          }
          variant="secondary"
          disabled={busy}
          onPress={() => {
            if (record)
              void healthRecordStore.getState().addWater(today, amount);
            else
              router.push({
                pathname: "/add-record",
                params: { date: today, water: String(amount) },
              });
          }}
        />
      ))}
      {success && <AppText accessibilityLiveRegion="polite">{success}</AppText>}
      {error && <AppText accessibilityRole="alert">{error}</AppText>}
    </AppCard>
  );
}
