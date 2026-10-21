import { create } from 'zustand';
export const useDataMaintenance=create<{busy:boolean;revision:number}>(()=>({busy:false,revision:0}));
