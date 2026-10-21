import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { recordRouteId } from "../src/domain/records/recordRoute";
const require = createRequire(import.meta.url);
const { configureReleaseGradle } =
  require("../plugins/withHealthMateRelease.cjs") as {
    configureReleaseGradle(source: string): string;
  };
test("R03 edit routes reject arrays and coercible invalid IDs before database access", () => {
  assert.equal(recordRouteId("17"),17);
  for (const value of [undefined, null, 17, ["17"], ["17","18"], "", "0", "-1", "1.5", "1e3", " 17 ", "9007199254740992", "17' OR 1=1"])
    assert.equal(recordRouteId(value),null);
});
test("R01 release identity, version, assets and privacy metadata remain explicit", () => {
  const config = JSON.parse(readFileSync("app.json", "utf8")).expo;
  assert.equal(config.name, "HealthMate");
  assert.equal(config.android.package, "com.naafeel.healthmate");
  assert.equal(config.version, "1.1.0");
  assert.equal(config.android.versionCode, 3);
  assert.equal(config.android.allowBackup, false);
  for (const file of [
    config.icon,
    config.android.adaptiveIcon.foregroundImage,
  ]) {
    assert.ok(existsSync(file));
    assert.equal(readFileSync(file).subarray(1, 4).toString(), "PNG");
  }
});
test("R02 repeated CNG signing configuration is idempotent and prevents debug fallback", () => {
  const template =
    "android { buildTypes { release { signingConfig signingConfigs.debug } } }\n";
  const once = configureReleaseGradle(template),
    twice = configureReleaseGradle(once);
  assert.equal(twice, once);
  assert.equal(
    (twice.match(/tasks.register\('validateHealthmateReleaseSigning'\)/g) ?? [])
      .length,
    1,
  );
  assert.ok(
    twice.indexOf(
      "android.buildTypes.release.signingConfig = android.signingConfigs.healthmateRelease",
    ) > twice.indexOf("signingConfigs.debug"),
  );
  assert.match(twice, /System.getenv\('HEALTHMATE_STORE_PASSWORD'\)/);
  assert.match(twice, /throw new GradleException/);
  assert.match(twice, /preReleaseBuild/);
  assert.doesNotMatch(twice, /storePassword\s+['"][^'"]+['"]/);
});
