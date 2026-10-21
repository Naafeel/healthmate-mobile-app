import { create } from "zustand";
import { getDatabase } from "../data/database/database";
import { serializeRepository } from "../data/database/access";
import { SQLitePersonalizationRepository } from "../data/repositories/SQLitePersonalizationRepository";
import { emptyProfile, type Profile } from "../domain/profile/profile";
import { defaultLayout, type Widget } from "../domain/dashboard/layout";
import { useDataMaintenance } from "./dataMaintenance";
export const personalizationRepository = serializeRepository(
  new SQLitePersonalizationRepository(getDatabase),
);
interface State {
  profile: Profile;
  layout: Widget[];
  loaded: boolean;
  busy: boolean;
  error: string | null;
  refresh(): Promise<void>;
  saveProfile(p: Profile): Promise<boolean>;
  saveLayout(l: Widget[]): Promise<boolean>;
}
export const usePersonalization = create<State>((set, get) => ({
  profile: { ...emptyProfile },
  layout: defaultLayout(),
  loaded: false,
  busy: false,
  error: null,
  refresh: async () => {
    if (get().busy) return;
    set({ busy: true });
    try {
      set({
        ...(await personalizationRepository.get()),
        loaded: true,
        error: null,
      });
    } catch {
      set({
        error:
          "Personal preferences could not be loaded. Retry before editing.",
      });
    } finally {
      set({ busy: false });
    }
  },
  saveProfile: async (p) => {
    if (get().busy || !get().loaded || useDataMaintenance.getState().busy)
      return false;
    set({ busy: true, error: null });
    try {
      set({ profile: await personalizationRepository.saveProfile(p) });
      return true;
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Profile could not be saved.",
      });
      return false;
    } finally {
      set({ busy: false });
    }
  },
  saveLayout: async (l) => {
    if (get().busy || !get().loaded || useDataMaintenance.getState().busy)
      return false;
    set({ busy: true, error: null });
    try {
      set({ layout: await personalizationRepository.saveLayout(l) });
      return true;
    } catch {
      set({ error: "Dashboard layout could not be saved." });
      return false;
    } finally {
      set({ busy: false });
    }
  },
}));
