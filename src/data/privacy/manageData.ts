import { removeTemporaryBackups } from "../backup/nativeBackup";
import { removeTemporaryExports } from "../export/nativeRecordExport";
import {
  executeDataManagement,
  validateDeletionConfirmation,
} from "../../domain/privacy/dataManagement";
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
  validateDeletionConfirmation(all, confirmation);
  if (
    useDataMaintenance.getState().busy ||
    healthRecordStore.getState().mutating ||
    healthGoalStore.getState().saving ||
    usePreferences.getState().busy ||
    usePersonalization.getState().busy
  )
    throw new Error("Wait for the current change to finish.");
  useDataMaintenance.setState({ busy: true });
  try {
    return await executeDataManagement(all, confirmation, {
      clear: async () => {
        await databaseAccess(() =>
          new SQLiteDataManagementRepository(getDatabase).clear(all),
        );
      },
      reload: async () => {
        await databaseAccess(async () => {
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
          usePersonalization.setState({
            ...personal,
            loaded: true,
            error: null,
          });
          useDataMaintenance.setState((s) => ({ revision: s.revision + 1 }));
        });
      },
      cleanTemporaryFiles: async () => {
        removeTemporaryBackups();
        removeTemporaryExports();
      },
      cancelReminders: async () => {
        await syncReminder();
      },
    });
  } finally {
    useDataMaintenance.setState({ busy: false });
  }
}
