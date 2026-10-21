import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { ExportDependencies } from "../../features/export/exportRecords";
import { healthRecordRepository } from "../../store/healthRecords";
const folder = () => new Directory(Paths.cache, "healthmate-exports");
/** Clean only our own cache files, never the database or other applications' files. */
export function removeTemporaryExports() {
  const dir = folder();
  if (!dir.exists) return;
  for (const file of dir.list())
    if (
      file instanceof File &&
      /^healthmate-records-\d{4}-\d{2}-\d{2}\.csv$/.test(file.name)
    )
      file.delete();
}
export function cleanExpiredExports() {
  const directory = folder();
  if (!directory.exists) return;
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const entry of directory.list())
    if (
      entry instanceof File &&
      /^healthmate-records-\d{4}-\d{2}-\d{2}\.csv$/.test(entry.name) &&
      (entry.lastModified ?? 0) < cutoff
    )
      entry.delete();
}
export const nativeRecordExport: ExportDependencies = {
  getRecords: () => healthRecordRepository.getAllRecords(),
  isAvailable: () => Sharing.isAvailableAsync(),
  writeFile: async (name, content) => {
    cleanExpiredExports();
    const directory = folder();
    directory.create({ idempotent: true, intermediates: true });
    const file = new File(directory, name);
    try {
      file.create({ overwrite: true });
      await file.write(content);
      // Verify the native UTF-8 file before offering it to another application.
      if ((await file.text()) !== content)
        throw new Error("CSV file verification failed.");
    } catch (error) {
      if (file.exists) file.delete();
      throw error;
    }
    return {
      uri: file.uri,
      remove: () => {
        if (file.exists) file.delete();
      },
    };
  },
  shareFile: (uri) =>
    Sharing.shareAsync(uri, {
      mimeType: "text/csv",
      UTI: "public.comma-separated-values-text",
      dialogTitle: "Export HealthMate records",
    }),
};
