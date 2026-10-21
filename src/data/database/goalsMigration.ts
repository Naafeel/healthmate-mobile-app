/** Migration v2 is additive; v1 health_records and its IDs are never rebuilt. */
export const createHealthGoalsSQL = `CREATE TABLE IF NOT EXISTS health_goals (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  steps_goal INTEGER CHECK (steps_goal IS NULL OR (typeof(steps_goal) = 'integer' AND steps_goal BETWEEN 1 AND 200000)),
  calories_goal INTEGER CHECK (calories_goal IS NULL OR (typeof(calories_goal) = 'integer' AND calories_goal BETWEEN 1 AND 20000)),
  water_goal INTEGER CHECK (water_goal IS NULL OR (typeof(water_goal) = 'integer' AND water_goal BETWEEN 1 AND 20000)),
  updated_at TEXT NOT NULL
);`;
