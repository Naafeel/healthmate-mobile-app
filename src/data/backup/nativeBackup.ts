import { usePersonalization } from "../../store/personalization";
import { SQLitePersonalizationRepository } from "../repositories/SQLitePersonalizationRepository";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import {
  maxBackupBytes,
  serializeBackup,
  parseBackup,
  type HealthBackup,
} from "../../domain/backup/backup";
import { localDate } from "../../domain/records/validation";
import { getDatabase } from "../database/database";
import { databaseAccess } from "../database/access";
import { SQLiteBackupRepository } from "./SQLiteBackupRepository";
import { SQLiteAnnotatedRecordRepository } from "../repositories/SQLiteAnnotatedRecordRepository";
import { SQLiteHealthGoalRepository } from "../repositories/SQLiteHealthGoalRepository";
import { SQLitePreferencesRepository } from "../repositories/SQLitePreferencesRepository";
import { healthRecordStore } from "../../store/healthRecords";
import { healthGoalStore } from "../../store/healthGoals";
import { usePreferences } from "../../store/preferences";
import { useDataMaintenance } from "../../store/dataMaintenance";
import { syncReminder } from "../reminders/nativeReminder";
const repo = new SQLiteBackupRepository(getDatabase);
const folder = () => new Directory(Paths.cache, "healthmate-backups");
export function removeTemporaryBackups() {
  const dir = folder();
  if (!dir.exists) return;
  for (const file of dir.list())
    if (
      file instanceof File &&
      /^healthmate-backup-\d{4}-\d{2}-\d{2}\.json$/.test(file.name)
    )
      file.delete();
}
export function cleanExpiredBackups() {
  const dir = folder();
  if (!dir.exists) return;
  for (const f of dir.list())
    if (
      f instanceof File &&
      /^healthmate-backup-.*\.json$/.test(f.name) &&
      (f.lastModified ?? 0) < Date.now() - 3600000
    )
      f.delete();
}
export async function shareBackup() {
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Android sharing is unavailable.");
  const backup = await databaseAccess(() => repo.snapshot());
  cleanExpiredBackups();
  const dir = folder();
  dir.create({ idempotent: true, intermediates: true });
  const file = new File(dir, "healthmate-backup-" + localDate() + ".json");
  try {
    const text = serializeBackup(backup);
    file.create({ overwrite: true });
    await file.write(text);
    if ((await file.text()) !== text)
      throw new Error("Backup file verification failed.");
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json",
      dialogTitle: "Save HealthMate backup",
    });
    return {
      remove: () => {
        if (file.exists) file.delete();
      },
    };
  } catch (e) {
    if (file.exists) file.delete();
    throw e;
  }
}
export async function pickBackup(): Promise<HealthBackup | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/json"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const file = new File(asset.uri);
  try {
    if (!asset.name.toLowerCase().endsWith(".json"))
      throw new Error("Choose a JSON HealthMate backup.");
    if ((asset.size ?? file.size) > maxBackupBytes)
      throw new Error("Backup exceeds the 5 MB limit.");
    return parseBackup(await file.text());
  } finally {
    if (file.exists && file.uri.startsWith(Paths.cache.uri)) file.delete();
  }
}
export async function restoreBackup(backup: HealthBackup) {
  if (
    useDataMaintenance.getState().busy ||
    healthRecordStore.getState().mutating ||
    healthGoalStore.getState().saving ||
    usePreferences.getState().busy ||
    usePersonalization.getState().busy
  )
    throw new Error("Please wait for the current save before restoring.");
  useDataMaintenance.setState({ busy: true });
  let committed = false;
  try {
    await databaseAccess(async () => {
      await repo.restore(backup);
      committed = true;
      const records = await new SQLiteAnnotatedRecordRepository(
        getDatabase,
      ).getAllRecords();
      const goals = await new SQLiteHealthGoalRepository(
        getDatabase,
      ).getGoals();
      const preferences = await new SQLitePreferencesRepository(
        getDatabase,
      ).get();
      const personal = await new SQLitePersonalizationRepository(
        getDatabase,
      ).get();
      usePersonalization.setState({ ...personal, loaded: true, error: null });
      healthRecordStore.getState().replaceFromStorage(records);
      healthGoalStore.getState().replaceFromStorage(goals);
      usePreferences.setState({ preferences, loaded: true, error: null });
      useDataMaintenance.setState((s) => ({ revision: s.revision + 1 }));
    });
    let reminder: string;
    try {
      reminder = await syncReminder();
    } catch {
      reminder = "Reminder scheduling failed. Retry in Settings.";
    }
    return "Data restored and reloaded. " + reminder;
  } catch {
    throw new Error(
      committed
        ? "Data was restored, but screen reload failed. Restart HealthMate to reload it."
        : "Restore failed. The database transaction was rolled back; your existing data is unchanged.",
    );
  } finally {
    useDataMaintenance.setState({ busy: false });
  }
}
