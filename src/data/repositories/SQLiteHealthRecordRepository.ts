import type {
  HealthRecord,
  CreateHealthRecord,
  UpdateHealthRecord,
} from "../../domain/models/HealthRecord";
import type { HealthRecordRepository } from "../../domain/repositories/HealthRecordRepository";
import { RecordError } from "../../domain/records/recordErrors";
import {
  isCalendarDate,
  validateId,
  validateRecordInput,
} from "../../domain/records/validation";
import type { DatabaseConnection } from "../database/connection";
const columns = "id, date, steps, calories, water";
export class SQLiteHealthRecordRepository implements HealthRecordRepository {
  constructor(private readonly database: () => Promise<DatabaseConnection>) {}
  private async safely<T>(
    work: (db: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    try {
      return await work(await this.database());
    } catch (error) {
      if (error instanceof RecordError) throw error;
      throw new RecordError(
        "storage",
        "HealthMate could not read or save the device database. Please try again.",
      );
    }
  }
  private date(date: string) {
    if (!isCalendarDate(date))
      throw new RecordError("validation", "Use a valid YYYY-MM-DD date.");
  }
  private async writeError(
    db: DatabaseConnection,
    date: string,
    error: unknown,
  ): Promise<never> {
    // UNIQUE remains the final arbiter if another writer passes the preflight check.
    if (
      error instanceof Error &&
      /UNIQUE constraint failed: health_records.date/.test(error.message)
    ) {
      const existing = await db.getFirstAsync<HealthRecord>(
        "SELECT " + columns + " FROM health_records WHERE date = ?",
        date,
      );
      throw new RecordError(
        "duplicate",
        "A daily record already exists for " +
          date +
          ". Edit that record instead.",
        existing?.id,
      );
    }
    throw error;
  }
  createRecord(input: CreateHealthRecord) {
    validateRecordInput(input);
    return this.safely(async (db) => {
      let id: number;
      try {
        id = (
          await db.runAsync(
            "INSERT INTO health_records (date, steps, calories, water) VALUES (?, ?, ?, ?)",
            input.date,
            input.steps,
            input.calories,
            input.water,
          )
        ).lastInsertRowId;
      } catch (error) {
        return this.writeError(db, input.date, error);
      }
      return { id, ...input };
    });
  }
  incrementWater(date: string, amount: number) {
    this.date(date);
    if (![250, 500, 1000].includes(amount))
      throw new RecordError("validation", "Choose 250, 500 or 1000 ml.");
    return this.safely(async (db) => {
      const row = await db.getFirstAsync<HealthRecord>(
        "UPDATE health_records SET water=water+? WHERE date=? AND water<=? RETURNING id,date,steps,calories,water",
        amount,
        date,
        20000 - amount,
      );
      if (!row)
        throw new RecordError(
          "validation",
          "Water was not added. The daily record may be missing, or this amount would exceed 20,000 ml. Refresh and check the record.",
        );
      return row;
    });
  }
  getAllRecords() {
    return this.safely((db) =>
      db.getAllAsync<HealthRecord>(
        "SELECT " +
          columns +
          " FROM health_records ORDER BY date DESC, id DESC",
      ),
    );
  }
  getRecordById(id: number) {
    validateId(id);
    return this.safely((db) =>
      db.getFirstAsync<HealthRecord>(
        "SELECT " + columns + " FROM health_records WHERE id = ?",
        id,
      ),
    );
  }
  getRecordByDate(date: string) {
    this.date(date);
    return this.safely((db) =>
      db.getFirstAsync<HealthRecord>(
        "SELECT " + columns + " FROM health_records WHERE date = ?",
        date,
      ),
    );
  }
  updateRecord(id: number, input: UpdateHealthRecord) {
    validateId(id);
    validateRecordInput(input);
    return this.safely(async (db) => {
      try {
        const result = await db.runAsync(
          "UPDATE health_records SET date = ?, steps = ?, calories = ?, water = ? WHERE id = ?",
          input.date,
          input.steps,
          input.calories,
          input.water,
          id,
        );
        if (!result.changes)
          throw new RecordError(
            "missing",
            "This record no longer exists. Return to Records and refresh.",
          );
      } catch (error) {
        return this.writeError(db, input.date, error);
      }
      return { id, ...input };
    });
  }
  deleteRecord(id: number) {
    validateId(id);
    return this.safely(async (db) => {
      const result = await db.runAsync(
        "DELETE FROM health_records WHERE id = ?",
        id,
      );
      if (!result.changes)
        throw new RecordError(
          "missing",
          "This record has already been removed. Refresh the list.",
        );
    });
  }
  getRecordsByDateRange(start: string, end: string) {
    this.date(start);
    this.date(end);
    if (start > end)
      throw new RecordError(
        "validation",
        "The start date must be before the end date.",
      );
    return this.safely((db) =>
      db.getAllAsync<HealthRecord>(
        "SELECT " +
          columns +
          " FROM health_records WHERE date BETWEEN ? AND ? ORDER BY date DESC",
        start,
        end,
      ),
    );
  }
}
