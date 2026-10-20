import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isCalendarDate,
  localDate,
  validateRecordForm,
  validateRecordInput,
} from "../src/domain/records/validation";
const base = { date: "2024-02-29", steps: "0", calories: "300", water: "1500" };
test("V01 valid whole numbers and zero", () =>
  assert.deepEqual(validateRecordForm(base, "2024-03-01").input, {
    date: base.date,
    steps: 0,
    calories: 300,
    water: 1500,
  }));
for (const [i, value] of [
  "",
  "-1",
  "1.5",
  "NaN",
  "Infinity",
  "abc",
  "1e3",
  "9007199254740992",
  "200001",
].entries())
  test("V02-" + i + " rejects invalid numeric " + JSON.stringify(value), () =>
    assert.ok(
      validateRecordForm({ ...base, steps: value }, "2024-03-01").errors.steps,
    ),
  );
test("V03 all measurements are required and reject negatives", () => {
  for (const field of ["steps", "calories", "water"]) {
    assert.ok(
      Object.keys(validateRecordForm({ ...base, [field]: "" }).errors).includes(
        field,
      ),
    );
    assert.ok(
      Object.keys(
        validateRecordForm({ ...base, [field]: "-1" }).errors,
      ).includes(field),
    );
  }
});
test("V04 leap years and exact date syntax", () => {
  for (const date of [
    "2023-02-29",
    "1900-02-29",
    "2024-04-31",
    "2024-13-01",
    "2024-00-01",
    "2024-01-00",
    "0000-01-01",
    "2024-2-01",
    "invalid",
    "",
  ])
    assert.equal(isCalendarDate(date), false, date);
  for (const date of ["2000-02-29", "2024-02-29", "2024-12-31"])
    assert.equal(isCalendarDate(date), true, date);
});
test("V05 required and future dates", () => {
  assert.ok(validateRecordForm({ ...base, date: "" }).errors.date);
  assert.ok(
    validateRecordForm({ ...base, date: "2024-03-02" }, "2024-03-01").errors
      .date,
  );
});
test("V06 local calendar day does not use UTC conversion", () => {
  const date = new Date(2024, 1, 29, 0, 5);
  assert.equal(localDate(date), "2024-02-29");
});
test("V07 data boundary rejects NaN, unsafe values and strings", () => {
  for (const steps of [
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
    "4",
    -1,
    0.5,
  ])
    assert.throws(() =>
      validateRecordInput({
        date: base.date,
        steps: steps as number,
        calories: 1,
        water: 1,
      }),
    );
});
