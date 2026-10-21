export interface Profile {
  name: string;
  birthYear: number | null;
  height: number | null;
  weight: number | null;
  waterUnit: "ml" | "L";
}
export const emptyProfile: Profile = {
  name: "",
  birthYear: null,
  height: null,
  weight: null,
  waterUnit: "ml",
};
export function validateProfile(
  value: unknown,
  year = new Date().getFullYear(),
): Profile {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid profile.");
  const p = value as Profile;
  if (
    Object.keys(p).sort().join(",") !==
      "birthYear,height,name,waterUnit,weight" ||
    typeof p.name !== "string" ||
    p.name.length > 60 ||
    p.name.includes("\u0000")
  )
    throw new Error("Display name must be at most 60 characters.");
  if (
    p.birthYear !== null &&
    (!Number.isInteger(p.birthYear) || p.birthYear < 1900 || p.birthYear > year)
  )
    throw new Error(`Birth year must be 1900–${year}, or blank.`);
  for (const [key, min, max] of [
    ["height", 30, 300],
    ["weight", 1, 700],
  ] as const)
    if (
      p[key] !== null &&
      (typeof p[key] !== "number" ||
        !Number.isFinite(p[key]) ||
        p[key]! < min ||
        p[key]! > max)
    )
      throw new Error(
        `${key === "height" ? "Height" : "Weight"} must be ${min}–${max}, or blank.`,
      );
  if (p.waterUnit !== "ml" && p.waterUnit !== "L")
    throw new Error("Choose ml or L.");
  return { ...p, name: p.name.trim() };
}
export function displayWater(ml: number, unit: Profile["waterUnit"]) {
  return unit === "L"
    ? `${Number((ml / 1000).toFixed(3))} L`
    : `${ml.toLocaleString()} ml`;
}
