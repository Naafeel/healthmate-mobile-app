import type { DatabaseConnection } from '../database/connection';
import { defaultPreferences, validatePreferences, type Preferences } from '../../domain/preferences/preferences';
export class SQLitePreferencesRepository {
 constructor(private readonly database:()=>Promise<DatabaseConnection>){}
 async get():Promise<Preferences>{const db=await this.database();const row=await db.getFirstAsync<{theme:Preferences['theme'];reminderEnabled:number;reminderHour:number;reminderMinute:number}>('SELECT theme, reminder_enabled AS reminderEnabled, reminder_hour AS reminderHour, reminder_minute AS reminderMinute FROM app_preferences WHERE id=1');if(!row)return {...defaultPreferences};const p={...row,reminderEnabled:row.reminderEnabled===1};validatePreferences(p);return p;}
 async save(p:Preferences){validatePreferences(p);const db=await this.database();await writePreferences(db,p);return {...p};}
}
export async function writePreferences(db: DatabaseConnection,p:Preferences){validatePreferences(p);await db.runAsync('INSERT INTO app_preferences(id,theme,reminder_enabled,reminder_hour,reminder_minute) VALUES(1,?,?,?,?) ON CONFLICT(id) DO UPDATE SET theme=excluded.theme, reminder_enabled=excluded.reminder_enabled, reminder_hour=excluded.reminder_hour, reminder_minute=excluded.reminder_minute',p.theme,p.reminderEnabled?1:0,p.reminderHour,p.reminderMinute);}
