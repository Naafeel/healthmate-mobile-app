import type { HealthRecord } from '../models/HealthRecord';
export const waterIncrements=[250,500,1000] as const;
export interface WaterIncrementRepository { incrementWater(date:string,amount:number):Promise<HealthRecord> }
export function waterPrefill(value:unknown):string { return typeof value==='string' && waterIncrements.some(n=>String(n)===value)?value:''; }
