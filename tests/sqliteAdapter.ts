import { DatabaseSync } from "node:sqlite";
import type { DatabaseConnection } from "../src/data/database/connection";
/** Executes the production migration and repository SQL against actual SQLite, without Expo mocks. */
export function sqliteAdapter(file = ":memory:") {
  const native = new DatabaseSync(file);
  const db: DatabaseConnection = {
    execAsync: async (sql) => {
      native.exec(sql);
    },
    runAsync: async (sql, ...params) => {
      const result = native.prepare(sql).run(...params);
      return {
        changes: Number(result.changes),
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
    getFirstAsync: async <T>(sql: string, ...params: (string | number)[]) =>
      ((row) => (row ? ({ ...row } as T) : null))(
        native.prepare(sql).get(...params),
      ),
    getAllAsync: async <T>(sql: string, ...params: (string | number)[]) =>
      native
        .prepare(sql)
        .all(...params)
        .map((row) => ({ ...row })) as T[],
  };
  return { db, close: () => native.close() };
}
