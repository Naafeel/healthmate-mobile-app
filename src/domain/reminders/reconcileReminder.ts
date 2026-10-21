import type { Preferences } from '../preferences/preferences';
export const reminderId='healthmate-daily-reminder';
export interface ScheduledReminder { id:string; hour:number; minute:number; zone:string }
export interface ReminderPort { permission(request:boolean):Promise<boolean>; list():Promise<ScheduledReminder[]>; cancel(id:string):Promise<void>; schedule(hour:number,minute:number,zone:string):Promise<void> }
/** Invoked serially by the native adapter. Never cancels notifications belonging to another feature. */
export async function reconcileReminder(p:Preferences,port:ReminderPort,zone:string,request=false):Promise<string>{
 const own=(await port.list()).filter(n=>n.id===reminderId||n.id.startsWith(reminderId+'-'));
 if(!p.reminderEnabled){for(const n of own)await port.cancel(n.id);return 'Reminders are off.';}
 if(!(await port.permission(request))){for(const n of own)await port.cancel(n.id);return 'Reminder preference saved. Notification permission is needed; open Android settings or enable again.';}
 if(own.length===1&&own[0].hour===p.reminderHour&&own[0].minute===p.reminderMinute&&own[0].zone===zone)return 'Daily reminder scheduled. Android may delay delivery.';
 for(const n of own)await port.cancel(n.id);
 await port.schedule(p.reminderHour,p.reminderMinute,zone);
 return 'Daily reminder scheduled. Android may delay delivery.';
}
