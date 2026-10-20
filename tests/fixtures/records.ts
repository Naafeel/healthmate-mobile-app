import type { CreateHealthRecord } from "../../src/domain/models/HealthRecord";
/** Test-only fixtures. Never imported by the app or automatically seeded. */
export const samples: CreateHealthRecord[] = [
  { date: "2024-02-29", steps: 7200, calories: 350, water: 1800 },
  { date: "2024-03-01", steps: 8400, calories: 420, water: 2100 },
  { date: "2024-03-02", steps: 0, calories: 0, water: 0 },
];
