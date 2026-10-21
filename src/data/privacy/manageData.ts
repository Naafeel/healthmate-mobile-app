import { databaseAccess } from "../database/access";
import { getDatabase } from "../database/database";
import { SQLiteDataManagementRepository } from "./SQLiteDataManagementRepository";
import { SQLiteAnnotatedRecordRepository } from "../repositories/SQLiteAnnotatedRecordRepository";
import { SQLiteHealthGoalRepository } from "../repositories/SQLiteHealthGoalRepository";
import { SQLitePreferencesRepository } from "../repositories/SQLitePreferencesRepository";
import { SQLitePersonalizationRepository } from "../repositories/SQLitePersonalizationRepository";
import { healthRecordStore } from "../../store/healthRecords";
import { healthGoalStore } from "../../store/healthGoals";
import { usePreferences } from "../../store/preferences";
import { usePersonalization } from "../../store/personalization";
import { useDataMaintenance } from "../../store/dataMaintenance";
import { syncReminder } from "../reminders/nativeReminder";
export async function manageData(all: boolean, confirmation: string) {
  if (confirmation !== (all ? "RESET" : "DELETE"))
    throw new Error("Confirmation does not match. No data changed.");
  if (
    useDataMaintenance.getState().busy ||
    healthRecordStore.getState().mutating ||
    healthGoalStore.getState().saving ||
    usePreferences.getState().busy ||
    usePersonalization.getState().busy
  )
    throw new Error("Wait for the current change to finish.");
  useDataMaintenance.setState({ busy: true });
  let committed = false;
  try {
    await databaseAccess(async () => {
      await new SQLiteDataManagementRepository(getDatabase).clear(all);
      committed = true;
      const rows = await new SQLiteAnnotatedRecordRepository(
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
      healthRecordStore.getState().replaceFromStorage(rows);
      healthGoalStore.getState().replaceFromStorage(goals);
      usePreferences.setState({ preferences, loaded: true, error: null });
      usePersonalization.setState({ ...personal, loaded: true, error: null });
      useDataMaintenance.setState((s) => ({ revision: s.revision + 1 }));
    });
    if (all) {
      try {
        await syncReminder();
      } catch {
        throw new Error(
          "Local data was reset, but Android reminder cancellation failed. Open Reminder settings and retry turning reminders off. Reset is not fully complete.",
        );
      }
    }
    return all
      ? "All HealthMate data reset and own scheduled reminders cancelled. External backup copies remain unchanged."
      : "All health records, notes and tags deleted. Goals, profile and preferences preserved. External backups remain unchanged.";
  } catch (e) {
    if (committed)
      throw new Error(
        e instanceof Error && e.message.includes("cancellation failed")
          ? e.message
          : "Data deletion committed, but screen reload failed. Restart HealthMate; if resetting, retry turning reminders off in Settings.",
      );
    throw new Error(
      "Deletion failed and was rolled back. Your data is unchanged.",
    );
  } finally {
    useDataMaintenance.setState({ busy: false });
  }
}
