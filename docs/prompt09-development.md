# Prompt 09 development and verification

## Baseline and release boundary

Inspected `main` at `e53d0ba` with a clean working tree and the expected Naafeel/healthmate-mobile-app GitHub origin. All 142 existing tests passed before changes. Runtime schema was v3. Expo ~58.0.16, React Native 0.88.0, TypeScript ~6.0.3, Zustand ^5.0.15 and the existing SDK-compatible SQLite, notifications, sharing, file system and document picker packages were retained. No dependency was added or downgraded.

App version remains 1.0.1, Android versionCode 2, package com.naafeel.healthmate. Signing scripts, config plugin and signing material are unchanged. No prebuild, Gradle build, signing script, EAS build, AAB/APK generation or APK installation was performed during Prompt 09. The existing signed release does not contain these new source features.

## Implemented features

| Feature | Behavior and principal files | Verification |
| --- | --- | --- |
| UI01 | About card retained; academic affiliation removed from SettingsScreen and public Expo description. | settings-ui.test.ts; source search; development UI inspection |
| F07 Achievements | Eight deterministic badges from distinct saved dates, longest logging run and current goals; locked/unlocked status and accessible progress. Settings opens achievements route. | achievements.test.ts; real-data integration tests; Expo Go rendering |
| F09 Search | Collapsible inclusive date range, exact date intersection, newest/oldest ordering, minimum measurements, case-insensitive note substring and all-selected-tag filtering. Clear restores default view. Memoized canonical-store selector; FlatList retained. | search.test.ts, including 20,000 distinct dates and live collection changes; native empty-results check |
| F10 Profile | Optional display name, birth year, cm height, kg weight, ml/L display preference. Local SQLite only; no BMI, diagnosis or account. Profile screen saves/clears with validation. | personalization.test.ts; expanded migrations/backup tests; Expo Go save/restart/clear |
| F11 Layout | Stable widget IDs; persistent visibility/order with accessible Up/Down controls and default reset. Goal Progress is independently movable; its bars are separate from the measurement cards, avoiding duplicated values. | personalization.test.ts; reopen/backup integration; Expo Go hide/reorder/restart/default restore |
| F12 Privacy | Existing backup/restore and CSV controls moved into Privacy & Data. Record-only deletion preserves settings. Full reset requires exact RESET plus a second native warning. Both offer Backup first and Cancel. | privacy.test.ts, data-management-flow.test.ts, maintenance-state.test.ts; native confirmation cancellation only |
| F13 Notes/tags | Optional multiline note, maximum 500 UTF-16 code units, and seven predefined multiple-selection tags. Create/edit/read/delete, search, backup and reset integration. | expanded-database.test.ts, expanded-integration.test.ts; dark-mode draft interaction, cancelled without saving |
| F14 Weekly sharing | Monday-start This Week/Previous Week preview; actual saved-day totals, averages and coverage. Current week ends at today for calculations. Plain-text Android share chooser; no automatic recipients. | weekly-summary.test.ts, timezone boundary tests; real Expo Go chooser opened and dismissed |

New routes live in src/app; domain calculations in src/domain; SQLite implementations in src/data; shared persistence state in src/store/personalization.ts. Four main tabs remain unchanged. New screens use existing theme components, safe areas, scrolling/keyboard support, accessible labels and Android Back fallbacks. ActivityTagPicker uses wrapping, minimum-48dp checkbox chips.

## Achievement semantics

Badges represent milestones currently supported by saved history, rather than permanent unlocks. No achievement table or invented unlock timestamps exist. Deleting/editing records or changing goals may lock a badge again. Zero-valued rows count as logged dates; duplicate dates count once; future dates do not contribute. Three/seven-day badges use the longest currently saved consecutive run, including runs across month/year boundaries. The existing current-streak today/yesterday grace definition remains unchanged.

Goal Achiever requires at least one configured goal and a saved row meeting every configured current goal. Hydration Goal requires a current water goal. Historical goal values are unavailable, and the UI explains that comparisons use current stored goals. These are tracking milestones, not medical achievements.

## Schema v4

Runtime initialization is src/data/database/expandedMigration.ts. It calls unchanged historical v1/v2/v3 migrations before adding v4 transactionally. Existing health_records and health_goals tables are not rebuilt.

- record_annotations: one optional note per record ID, length constraint, foreign key with ON DELETE CASCADE.
- record_tags: normalized record/tag associations; compound primary key prevents duplicates; supported-tag check; cascading foreign key.
- personal_profile: singleton validated JSON payload.
- dashboard_layout: singleton validated JSON payload.

PRAGMA foreign_keys=ON is enabled on every application connection before transactions, alongside WAL and busy timeout. Fresh v0 and historical v1/v2/v3 upgrades, repeated initialization, real close/reopen, migration failure rollback and rejection of future schema versions are tested. Migration version remains v4 after reset or restore.

SQLiteAnnotatedRecordRepository extends the existing numeric repository contract. Numeric record changes and annotation writes share one transaction. Reads hydrate canonical rows with notes/tags; Quick Water preserves them. The existing whole-operation database gate serializes repository calls. Backup snapshots and restores use raw repositories inside the gate, avoiding nested transactions or re-entering the gate.

## Profile and display semantics

All fields are optional. Name is at most 60 characters; birth year is 1900 through the current local year; height is 30–300 cm; weight is 1–700 kg. Finite numeric values are required. Empty fields store null (name stores an empty string). These are input bounds, not health recommendations.

Water remains integer milliliters in SQLite, forms, goals, Quick Water, analytics calculations, backups and CSV. Dashboard measurements/goal labels, recent records and Records honor ml/L display. Insights and the shared weekly text explicitly label canonical ml. Liter formatting preserves milliliter precision; it never writes converted or rounded values back. Appearance/reminders/goals keep their existing canonical sources.

Layout defaults contain steps, calories, water, goals, streak and quickWater. IDs are stable, duplicates reject, unknown future IDs are ignored safely, missing known IDs receive defaults. Hiding any section does not change saved data or analytics. Settings remains reachable even with every optional section hidden.

## Backup format v2 and compatibility

New runtime backups use format healthmate-backup, version 2, exportedAt, records, goals, preferences, profile and layout. Each logical record contains date/steps/calories/water/note/tags; storage IDs are not exported. Validation rejects unexpected/missing fields, unsupported versions, invalid dates, future activity, duplicate dates, unsafe measurements, invalid notes/tags/profile/layout and invalid preferences.

Version 1 from the existing v1.0.1 app remains supported. Full-replacement restoration of v1 uses empty notes/tags/profile and default dashboard layout. Preview explicitly explains these absent fields. Existing goals and appearance/reminder preferences come from that backup, rather than being invented. Version 2 backups require the expanded app and are not claimed to restore in the old released binary.

The existing 5 MB UTF-8 / 20,000-record safety bounds remain. Generated backups are checked against the import bound before a file is written, preventing an unrestorable oversized export. Validated annotation arrays are copied. Restore replaces all supported content in one BEGIN IMMEDIATE transaction, with rollback on failure. Only after commit are records/goals/preferences/profile/layout reloaded. Revision invalidation prevents old record/goal loads from restoring deleted data; keyed drafts refresh after maintenance. Reminders reconcile afterward, without transferring Android permission. Badges/search/Insights/weekly text derive again from the canonical rows.

CSV intentionally retains its existing four columns: date,steps,calories_burned_kcal,water_ml, oldest first, CRLF. Notes, tags and profile information are excluded to preserve compatibility and avoid adding free text to routine exports. Full JSON is the complete-data export. Existing CSV escaping/formula-protection tests remain passing.

## Destructive operations and external effects

SQLiteDataManagementRepository deletes records transactionally, relying on enforced cascades. Full reset additionally removes goal/profile/layout/preference rows; validated defaults are then read. It does not drop tables, change user_version, delete external files or clear Android application storage. Global maintenance state and mutation guards block repeated/competing writes. Pending record loads cannot resurrect prior rows.

Full reset attempts cancellation through the existing serialized reconciler, which filters HealthMate's own reminder IDs only. It also deletes only matching HealthMate JSON/CSV files in the app-owned temporary backup/export folders. User-saved files elsewhere remain untouched. Android scheduling and filesystem cleanup cannot participate in the SQLite transaction: failures after commit explicitly report partial completion, never a false rollback or complete reset. Cancellation and cache cleanup are both attempted even if one fails. Restart/retry instructions are included in the error.

No destructive QA was run against existing emulator/phone health records. All actual deletion/reset/failure-injection tests used disposable SQLite databases. Native dialogs were opened and cancelled, including the typed-RESET second confirmation.

## Automated checks

184 tests pass, preserving all original 142 tests. Added coverage includes real SQLite annotation CRUD/cascades, v0–v3 upgrades, reopen persistence, migration/restore/reset rollback, older-backup defaults, profile/layout validation, zero/missing/future semantics, 20,000-date search, Unicode/size bounds, sharing cancellation, timezone boundaries, maintenance write guards and stale refresh replacement.

- npm run typecheck: pass, application and test TypeScript.
- npm run lint: pass, no ESLint warnings.
- npm test: 184 passed, no skipped or failed tests.
- npx expo install --check: dependencies up to date.
- npx expo-doctor: 20/20 checks passed.
- git diff --check: pass. Git's LF/CRLF conversion notices are separate from lint and whitespace failures.

No new dependencies or native permissions were introduced. Existing audit limitations documented in security-review.md still apply; this assignment did not force-update the dependency tree.

## Development-mode evidence and limits

Pixel_10 emulator, existing SDK 58 Expo Go, Metro port 8087 through adb reverse. New JavaScript actually bundled and rendered; this is not verification of a new standalone binary. Existing development record values remained 8200 steps / 350 kcal / 2000 ml. No health row was created, edited or removed during these UI checks.

Verified: achievements rendering; optional profile save and persistence across Expo Go process restart; clearing synthetic profile values afterward; layout hide/reorder persistence, actual Goal Progress section ordering, and restoring defaults; weekly preview and Android chooser dismissal without delivery claim; advanced minimum-steps filter showing no matches; notes/tag draft controls in Dark Mode; Privacy information and deletion/reset warning cancellation. Profile and achievement views were visually checked in Dark Mode at 130% font size; the original 100% font and System appearance were restored afterward. Genuine screenshots are delivered separately, outside Git.

The installed Expo Go lacks ExpoTopicSubscriptionModule required by the package's eager public entry point. The notification adapter now loads lazily and checks that specific missing-client condition, preventing a route-wide startup failure. Compatible clients/standalone use the same actual scheduler; this client shows an explicit limitation. No native build was used to bypass it.

Deferred: standalone/physical-device regression, real reminder scheduling/delivery/reset cancellation with the lazy adapter, final Android file-picker backup roundtrip, full native destructive reset in a disposable installation, and complete TalkBack speech/gesture audit. The existing v1.0.1 owner's physical-device results do not establish verification of Prompt 09 code.

Prompt 09 source development completed. Final Android APK build intentionally not performed, as requested by the user.

The existing APK was read-only checked after development: SHA-256 B2AA8A8E803D982912B3A311CABF1310CA3283B4CAD86E8EB0D16646565D6237, unchanged from the verified v1.0.1 release. Signing/build scripts, plugin, package files and dependency lockfile have no Prompt 09 changes.
