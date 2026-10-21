import { useMemo, useRef, useState } from "react";
import { Share } from "react-native";
import { router } from "expo-router";
import { AppScreen } from "@/components/AppScreen";
import { AppHeader } from "@/components/AppHeader";
import { AppText } from "@/components/AppText";
import { AppCard } from "@/components/AppCard";
import { AppButton } from "@/components/AppButton";
import { useRecordOverview } from "@/hooks/useRecordOverview";
import { weeklySummary, shareSummary } from "@/domain/sharing/weeklySummary";
export function WeeklySummaryScreen() {
  const state = useRecordOverview();
  const [previous, setPrevious] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const lock = useRef(false);
  const result = useMemo(
    () => weeklySummary(state.records, state.today, previous),
    [state.records, state.today, previous],
  );
  async function share() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      setMessage(
        await shareSummary(result.text, async (text) => {
          const result = await Share.share({
            message: text,
            title: "HealthMate weekly summary",
          });
          return result.action === Share.dismissedAction
            ? "cancelled"
            : "closed";
        }),
      );
    } catch {
      setMessage("Summary sharing could not be opened. Please retry.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <AppScreen tab={false}>
      <AppHeader
        title="Weekly Summary"
        onBack={() =>
          router.canGoBack()
            ? router.back()
            : router.replace("/(tabs)/insights")
        }
      />
      <AppButton
        label={previous ? "Show This Week" : "Show Previous Week"}
        variant="secondary"
        disabled={busy}
        onPress={() => {
          setPrevious((p) => !p);
          setMessage("");
        }}
      />
      <AppText muted>
        Preview the exact text below before sharing. This summary contains
        personal activity information; choose recipients carefully. Profile
        details, notes and tags are excluded.
      </AppText>
      {!state.hasLoaded || state.error ? (
        <AppCard>
          <AppText>{state.error ?? "Loading saved records…"}</AppText>
          <AppButton label="Retry loading summary" onPress={state.retry} />
        </AppCard>
      ) : (
        <>
          <AppCard>
            <AppText selectable>{result.text}</AppText>
          </AppCard>
          <AppButton
            label="Share weekly summary"
            disabled={busy || state.loading || state.mutating}
            onPress={() => void share()}
          />
        </>
      )}
      {!!message && <AppText accessibilityRole="alert">{message}</AppText>}
    </AppScreen>
  );
}
