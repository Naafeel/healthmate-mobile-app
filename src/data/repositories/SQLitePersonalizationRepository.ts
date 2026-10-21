import type { DatabaseConnection } from "../database/connection";
import {
  emptyProfile,
  validateProfile,
  type Profile,
} from "../../domain/profile/profile";
import {
  defaultLayout,
  validateLayout,
  type Widget,
} from "../../domain/dashboard/layout";
export class SQLitePersonalizationRepository {
  constructor(private database: () => Promise<DatabaseConnection>) {}
  async get() {
    const db = await this.database();
    const p = await db.getFirstAsync<{ payload: string }>(
      "SELECT payload FROM personal_profile WHERE id=1",
    );
    const l = await db.getFirstAsync<{ payload: string }>(
      "SELECT payload FROM dashboard_layout WHERE id=1",
    );
    return {
      profile: p ? validateProfile(JSON.parse(p.payload)) : { ...emptyProfile },
      layout: l ? validateLayout(JSON.parse(l.payload)) : defaultLayout(),
    };
  }
  async saveProfile(profile: Profile) {
    const p = validateProfile(profile);
    await (
      await this.database()
    ).runAsync(
      "INSERT INTO personal_profile(id,payload) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
      JSON.stringify(p),
    );
    return p;
  }
  async saveLayout(layout: Widget[]) {
    const l = validateLayout(layout);
    await (
      await this.database()
    ).runAsync(
      "INSERT INTO dashboard_layout(id,payload) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
      JSON.stringify(l),
    );
    return l;
  }
}
