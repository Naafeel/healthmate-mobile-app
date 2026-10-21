import type { DatabaseConnection } from "../database/connection";
import { SQLiteHealthRecordRepository } from "./SQLiteHealthRecordRepository";
import { validateAnnotations } from "../../domain/records/annotations";
import type {
  HealthRecord,
  CreateHealthRecord,
} from "../../domain/models/HealthRecord";
export class SQLiteAnnotatedRecordRepository extends SQLiteHealthRecordRepository {
  constructor(private connection: () => Promise<DatabaseConnection>) {
    super(connection);
  }
  private async hydrate(rows: HealthRecord[]) {
    const db = await this.connection();
    if (!rows.length) return rows;
    const notes = await db.getAllAsync<{ record_id: number; note: string }>(
      "SELECT record_id,note FROM record_annotations",
    );
    const tags = await db.getAllAsync<{ record_id: number; tag: string }>(
      "SELECT record_id,tag FROM record_tags ORDER BY tag",
    );
    const byId = new Map<number, string[]>();
    for (const t of tags)
      byId.set(t.record_id, [...(byId.get(t.record_id) ?? []), t.tag]);
    const noteMap = new Map(notes.map((n) => [n.record_id, n.note]));
    return rows.map((r) => ({
      ...r,
      ...validateAnnotations(noteMap.get(r.id) ?? "", byId.get(r.id) ?? []),
    }));
  }
  private async write(input: CreateHealthRecord, id?: number) {
    const annotations = validateAnnotations(input.note, input.tags);
    const db = await this.connection();
    await db.execAsync("BEGIN IMMEDIATE");
    try {
      const numeric = {
        date: input.date,
        steps: input.steps,
        calories: input.calories,
        water: input.water,
      };
      const row =
        id === undefined
          ? await super.createRecord(numeric)
          : await super.updateRecord(id, numeric);
      await db.runAsync("DELETE FROM record_tags WHERE record_id=?", row.id);
      await db.runAsync(
        "INSERT INTO record_annotations(record_id,note) VALUES(?,?) ON CONFLICT(record_id) DO UPDATE SET note=excluded.note",
        row.id,
        annotations.note,
      );
      for (const tag of annotations.tags)
        await db.runAsync(
          "INSERT INTO record_tags(record_id,tag) VALUES(?,?)",
          row.id,
          tag,
        );
      await db.execAsync("COMMIT");
      return { ...row, ...annotations };
    } catch (e) {
      await db.execAsync("ROLLBACK");
      throw e;
    }
  }
  createRecord(input: CreateHealthRecord) {
    return this.write(input);
  }
  updateRecord(id: number, input: CreateHealthRecord) {
    return this.write(input, id);
  }
  async getAllRecords() {
    return this.hydrate(await super.getAllRecords());
  }
  async getRecordById(id: number) {
    const row = await super.getRecordById(id);
    return row ? (await this.hydrate([row]))[0] : null;
  }
  async getRecordByDate(date: string) {
    const row = await super.getRecordByDate(date);
    return row ? (await this.hydrate([row]))[0] : null;
  }
  async getRecordsByDateRange(start: string, end: string) {
    return this.hydrate(await super.getRecordsByDateRange(start, end));
  }
  async incrementWater(date: string, amount: number) {
    const row = await super.incrementWater(date, amount);
    return (await this.hydrate([row]))[0];
  }
}
