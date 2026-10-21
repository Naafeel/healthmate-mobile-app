import type { DatabaseConnection } from '../database/connection';
import { validateBackup, type HealthBackup } from '../../domain/backup/backup';
import type { CreateHealthRecord } from '../../domain/models/HealthRecord';
import { SQLiteHealthGoalRepository } from '../repositories/SQLiteHealthGoalRepository';
import { SQLitePreferencesRepository,writePreferences } from '../repositories/SQLitePreferencesRepository';
export class SQLiteBackupRepository {
 constructor(private readonly database:()=>Promise<DatabaseConnection>){}
 async snapshot():Promise<HealthBackup>{const db=await this.database();await db.execAsync('BEGIN');try{const records=await db.getAllAsync<CreateHealthRecord>('SELECT date,steps,calories,water FROM health_records ORDER BY date');const goals=await new SQLiteHealthGoalRepository(async()=>db).getGoals();const preferences=await new SQLitePreferencesRepository(async()=>db).get();const backup=validateBackup({format:'healthmate-backup',version:1,exportedAt:new Date().toISOString(),records,goals:{steps:goals.steps,calories:goals.calories,water:goals.water},preferences});await db.execAsync('COMMIT');return backup;}catch(e){await db.execAsync('ROLLBACK');throw e;}}
 async restore(input:unknown){const b=validateBackup(input);const db=await this.database();await db.execAsync('BEGIN IMMEDIATE');try{await db.runAsync('DELETE FROM health_records');for(const r of b.records)await db.runAsync('INSERT INTO health_records(date,steps,calories,water) VALUES(?,?,?,?)',r.date,r.steps,r.calories,r.water);await new SQLiteHealthGoalRepository(async()=>db).saveGoals(b.goals);await writePreferences(db,b.preferences);await db.execAsync('COMMIT');}catch(e){await db.execAsync('ROLLBACK');throw e;}}
}
