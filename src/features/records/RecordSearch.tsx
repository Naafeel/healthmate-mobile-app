import { useState } from "react";
import { TextInput } from "react-native";
import { AppCard } from "@/components/AppCard";
import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { DateField } from "@/components/DateField";
import { MeasurementField } from "@/components/MeasurementField";
import { ActivityTagPicker } from "@/components/ActivityTagPicker";
import {
  emptyFilters,
  validateFilters,
  type RecordFilters,
} from "@/domain/records/search";
import { useTheme } from "@/theme/useTheme";
export function RecordSearch({
  onApply,
}: {
  onApply: (f: RecordFilters) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false),
    [draft, setDraft] = useState(emptyFilters),
    [error, setError] = useState("");
  return (
    <AppCard>
      <AppButton
        label={open ? "Hide advanced filters" : "Advanced search & filters"}
        variant="secondary"
        onPress={() => setOpen((v) => !v)}
      />
      {open && (
        <>
          <DateField
            label="Start date (inclusive)"
            value={draft.start}
            onChange={(start) => setDraft((d) => ({ ...d, start }))}
          />
          <DateField
            label="End date (inclusive)"
            value={draft.end}
            onChange={(end) => setDraft((d) => ({ ...d, end }))}
          />
          <AppButton
            label={
              draft.order === "newest"
                ? "Order: newest first"
                : "Order: oldest first"
            }
            variant="secondary"
            onPress={() =>
              setDraft((d) => ({
                ...d,
                order: d.order === "newest" ? "oldest" : "newest",
              }))
            }
          />
          {(["steps", "calories", "water"] as const).map((k) => (
            <MeasurementField
              key={k}
              label={`Minimum ${k}${k === "water" ? " (ml)" : k === "calories" ? " (kcal)" : ""}`}
              value={draft[k]}
              onChange={(v) => setDraft((d) => ({ ...d, [k]: v }))}
            />
          ))}
          <AppText variant="label">Search daily notes</AppText>
          <TextInput
            accessibilityLabel="Search daily notes"
            value={draft.keyword}
            maxLength={500}
            onChangeText={(keyword) => setDraft((d) => ({ ...d, keyword }))}
            style={{
              ...theme.typography.body,
              color: theme.colors.text,
              borderColor: theme.colors.border,
              borderWidth: 1,
              borderRadius: 12,
              padding: 16,
              minHeight: 52,
            }}
          />
          <AppText muted>
            All selected tags must match. Active filters combine with the exact
            date filter above.
          </AppText>
          <ActivityTagPicker
            selected={draft.tags}
            onChange={(tags) => setDraft((d) => ({ ...d, tags }))}
            label="Filter by activity tags"
          />
          {!!error && <AppText accessibilityRole="alert">{error}</AppText>}
          <AppButton
            label="Apply filters"
            onPress={() => {
              try {
                validateFilters(draft);
                onApply({ ...draft, tags: [...draft.tags] });
                setError("");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
        </>
      )}
      <AppButton
        label="Clear all filters"
        variant="secondary"
        onPress={() => {
          const next = emptyFilters();
          setDraft(next);
          onApply(next);
          setError("");
        }}
      />
    </AppCard>
  );
}
