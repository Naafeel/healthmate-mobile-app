import { create } from 'zustand';
import { defaultPreferences, type Preferences } from '../domain/preferences/preferences';
import { SQLitePreferencesRepository } from '../data/repositories/SQLitePreferencesRepository';
import { getDatabase } from '../data/database/database';
import { serializeRepository } from '../data/database/access';
export const preferencesRepository=serializeRepository(new SQLitePreferencesRepository(getDatabase));
interface State { preferences:Preferences; loaded:boolean; busy:boolean; error:string|null; refresh():Promise<void>; save(p:Preferences):Promise<boolean> }
export const usePreferences=create<State>((set,get)=>({preferences:{...defaultPreferences},loaded:false,busy:false,error:null,
 refresh:async()=>{if(get().busy)return;set({busy:true});try{set({preferences:await preferencesRepository.get(),loaded:true,error:null});}catch{set({error:'Preferences could not be loaded. Please retry.'});}finally{set({busy:false});}},
 save:async(p)=>{if(get().busy||!get().loaded)return false;set({busy:true,error:null});try{set({preferences:await preferencesRepository.save(p)});return true;}catch{set({error:'Preferences could not be saved. Please retry.'});return false;}finally{set({busy:false});}}
}));
