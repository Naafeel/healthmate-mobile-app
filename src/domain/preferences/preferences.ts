export type ThemeMode = 'light' | 'dark' | 'system';
export interface Preferences { theme: ThemeMode; reminderEnabled: boolean; reminderHour: number; reminderMinute: number }
export const defaultPreferences: Preferences = { theme: 'system', reminderEnabled: false, reminderHour: 20, reminderMinute: 0 };
export function validatePreferences(value: unknown): asserts value is Preferences {
 if(!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid preferences.');
 const p=value as Preferences;
 if(Object.keys(p).sort().join(',') !== 'reminderEnabled,reminderHour,reminderMinute,theme' || !['light','dark','system'].includes(p.theme) || typeof p.reminderEnabled !== 'boolean' || !Number.isInteger(p.reminderHour) || p.reminderHour<0 || p.reminderHour>23 || !Number.isInteger(p.reminderMinute) || p.reminderMinute<0 || p.reminderMinute>59) throw new Error('Invalid appearance or reminder preferences.');
}
export function resolveTheme(mode: ThemeMode, system: string | null | undefined): 'light' | 'dark' { return mode === 'system' ? system === 'dark' ? 'dark' : 'light' : mode; }
