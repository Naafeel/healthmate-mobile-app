import { validateRecordInput, localDate } from '../records/validation';
import { validateGoals } from '../goals/validation';
import { validatePreferences, type Preferences } from '../preferences/preferences';
import type { CreateHealthRecord } from '../models/HealthRecord';
import type { GoalValues } from '../models/HealthGoals';
export const maxBackupBytes=5*1024*1024, maxBackupRecords=20000;
export interface HealthBackup {format:'healthmate-backup';version:1;exportedAt:string;records:CreateHealthRecord[];goals:GoalValues;preferences:Preferences}
function keys(value:unknown,expected:string[]){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!==expected.sort().join(','))throw new Error('Backup contains missing or unexpected fields.');}
export function validateBackup(value:unknown,today=localDate()):HealthBackup{
 keys(value,['format','version','exportedAt','records','goals','preferences']);const b=value as HealthBackup;
 if(b.format!=='healthmate-backup'||b.version!==1)throw new Error('Unsupported HealthMate backup format or version.');
 if(typeof b.exportedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(b.exportedAt)||!Number.isFinite(Date.parse(b.exportedAt))||new Date(b.exportedAt).toISOString()!==b.exportedAt)throw new Error('Invalid backup creation timestamp.');
 if(!Array.isArray(b.records)||b.records.length>maxBackupRecords)throw new Error('Backup record count is invalid or too large.');
 const dates=new Set<string>();for(const r of b.records){keys(r,['date','steps','calories','water']);validateRecordInput(r);if(r.date>today)throw new Error("Backup contains future activity.");if(dates.has(r.date))throw new Error('Backup contains duplicate dates.');dates.add(r.date);}
 keys(b.goals,['steps','calories','water']);validateGoals(b.goals);validatePreferences(b.preferences);
 return {format:'healthmate-backup',version:1,exportedAt:b.exportedAt,records:b.records.map(r=>({...r})).sort((a,b)=>a.date.localeCompare(b.date)),goals:{...b.goals},preferences:{...b.preferences}};
}
export function parseBackup(text:string,today=localDate()){if(new TextEncoder().encode(text).byteLength>maxBackupBytes)throw new Error('Backup exceeds the 5 MB limit.');let value:unknown;try{value=JSON.parse(text);}catch{throw new Error('This file is not valid JSON.');}return validateBackup(value,today);}
