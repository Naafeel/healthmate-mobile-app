import { useRef, useState } from "react";
import { Alert } from "react-native";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
import { localDate } from "@/domain/records/validation";
import { nativeRecordExport } from "@/data/export/nativeRecordExport";
import { exportRecords, type ExportFile } from "./exportRecords";
export function ExportRecordsCard() {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState<string | null>(null);
  const [temporary, setTemporary] = useState<ExportFile | null>(null);
  const running = useRef(false),
    confirming = useRef(false);
  async function proceed() {
    confirming.current = false;
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setMessage(null);
    try {
      temporary?.remove();
      setTemporary(null);
      const result = await exportRecords(nativeRecordExport, localDate());
      if (result.status === "empty")
        setMessage("There are no saved health records to export yet.");
      else if (result.status === "unavailable")
        setMessage(
          "File sharing is not available on this device. Your records remain saved in HealthMate.",
        );
      else {
        setTemporary(result.file);
        setMessage(
          `Sharing closed for ${result.count} saved ${result.count === 1 ? "record" : "records"}. If you cancelled, no destination was chosen. HealthMate cannot confirm whether another app saved the file.`,
        );
      }
    } catch {
      setMessage(
        "The export could not be prepared or shared. Your saved records are unchanged. Please try again.",
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  function confirm() {
    if (running.current || confirming.current) return;
    confirming.current = true;
    Alert.alert(
      "Export health records?",
      "The CSV includes all saved dates, steps, calories burned (kcal) and water (ml), oldest first. It excludes goals and database IDs. Choose a destination in Android's sharing screen. HealthMate does not upload your records. A temporary copy stays in app cache for sharing; you can remove it afterwards.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            confirming.current = false;
          },
        },
        { text: "Export CSV", onPress: () => void proceed() },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          confirming.current = false;
        },
      },
    );
  }
  return (
    <AppCard>
      <AppText variant="heading" accessibilityRole="header">
        Data Management
      </AppText>
      <AppText muted>
        Export your saved health records as a CSV file for your own records or a
        spreadsheet. You choose where to share it.
      </AppText>
      <AppButton
        label={busy ? "Preparing export…" : "Export Health Records"}
        icon="download-outline"
        disabled={busy}
        onPress={confirm}
      />
      {message && <AppText accessibilityLiveRegion="polite">{message}</AppText>}
      {temporary && (
        <AppButton
          label="Remove temporary export file"
          variant="secondary"
          disabled={busy}
          onPress={() => {
            try {
              temporary.remove();
              setTemporary(null);
              setMessage(
                "Temporary export file removed from HealthMate cache. Copies saved in other apps are managed by those apps.",
              );
            } catch {
              setMessage(
                "The temporary export could not be removed. Please try again.",
              );
            }
          }}
        />
      )}
      <AppText variant="caption" muted>
        Temporary export files become eligible for cleanup after one hour and
        are removed on the next app launch or export. No broad storage
        permission is required.
      </AppText>
    </AppCard>
  );
}
