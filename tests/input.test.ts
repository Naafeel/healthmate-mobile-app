import { test } from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
import { readFileSync } from "node:fs";

test("B01 shared numeric input leaves Android selection native and never selects on focus", () => {
  const source = ts.createSourceFile(
    "MeasurementField.tsx",
    readFileSync("src/components/MeasurementField.tsx", "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const props = new Map<string, ts.JsxAttribute>();
  function visit(node: ts.Node) {
    if (
      ts.isJsxSelfClosingElement(node) &&
      node.tagName.getText(source) === "TextInput"
    )
      for (const prop of node.attributes.properties)
        if (ts.isJsxAttribute(prop)) props.set(prop.name.getText(source), prop);
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.equal(
    props.get("selectTextOnFocus")?.initializer?.getText(source),
    "{false}",
  );
  for (const name of ["selection", "onSelectionChange", "onFocus", "autoFocus"])
    assert.equal(props.has(name), false);
  assert.equal(props.get("value")?.initializer?.getText(source), "{value}");
  assert.equal(
    props.get("onChangeText")?.initializer?.getText(source),
    "{onChange}",
  );
});

test("B01 record and goal forms use the same unmodified text field and functional draft updates", () => {
  const form = readFileSync("src/features/records/useRecordForm.ts", "utf8");
  assert.match(
    form,
    /setFields\(\(f\) => \(\{ \.\.\.f, \[field\]: value \}\)\)/,
  );
  const goals = readFileSync("src/features/settings/GoalSettings.tsx", "utf8");
  assert.match(goals, /setDraft\(\(previous\) =>/);
  assert.match(
    readFileSync("src/features/records/RecordFormScreen.tsx", "utf8"),
    /<MeasurementField/,
  );
  assert.match(goals, /<MeasurementField/);
});
