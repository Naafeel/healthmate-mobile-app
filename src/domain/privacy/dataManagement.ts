export interface DataManagementPort {
  clear(all: boolean): Promise<void>;
  reload(): Promise<void>;
  cancelReminders(): Promise<void>;
  cleanTemporaryFiles(): Promise<void>;
}
export function validateDeletionConfirmation(
  all: boolean,
  confirmation: string,
) {
  if (confirmation !== (all ? "RESET" : "DELETE"))
    throw new Error("Confirmation does not match. No data changed.");
}
/** SQLite and Android cannot share a transaction: errors explicitly identify post-commit failures. */
export async function executeDataManagement(
  all: boolean,
  confirmation: string,
  port: DataManagementPort,
) {
  validateDeletionConfirmation(all, confirmation);
  try {
    await port.clear(all);
  } catch {
    throw new Error(
      "Deletion failed and was rolled back. Your data is unchanged.",
    );
  }
  try {
    await port.reload();
  } catch {
    throw new Error(
      "Data deletion committed, but screen reload failed. Restart HealthMate; if resetting, retry turning reminders off in Settings.",
    );
  }
  if (all) {
    const failures: string[] = [];
    try {
      await port.cancelReminders();
    } catch {
      failures.push(
        "Android reminder cancellation failed; retry turning reminders off in Settings",
      );
    }
    try {
      await port.cleanTemporaryFiles();
    } catch {
      failures.push(
        "temporary backup/export cleanup failed; retry removing temporary files in Privacy & Data",
      );
    }
    if (failures.length)
      throw new Error(
        "Local data was reset, but " +
          failures.join(". ") +
          ". Reset is not fully complete.",
      );
  }
  return all
    ? "All HealthMate data reset and own scheduled reminders cancelled. External backup copies remain unchanged."
    : "All health records, notes and tags deleted. Goals, profile and preferences preserved. External backups remain unchanged.";
}
