# HealthMate

Personal Health & Wellness Tracker for Kingston University / ESOFT Mobile Application Development coursework.

## Status

Functional daily dashboard and local record management completed. Implemented: the welcome/navigation foundation, validated Add/Edit daily record form, SQLite create/read/update/delete, exact-date filtering, shared Zustand state, loading/error/success states, native delete confirmation, an SQLite-backed daily dashboard with smart Add/Edit Today and real recent activity, and automated tests. Android persistence was verified after a full Expo Go restart.

SQLite is implemented provisionally with expo-sqlite while lecturer clarification about the coursework's Flutter-specific sqflite wording is pending. Flutter remains prohibited. No cloud account or backend is used.

Implemented in Prompt 05: persistent optional daily goals, Dashboard progress, and weekly/monthly Insights for saved activity. Prompt 08A adds the appearance, local reminder, quick-water, backup/restore and comparison features described below.

## Stack

React Native with Expo SDK 58, React 19, TypeScript strict mode, Expo Router, and npm. Android is the target. The dependency lockfile pins exact installed versions. Architecture: feature-based, MVVM-inspired, with Repository Pattern. No paid service, backend, hosting, or account is required for core functionality.

## Prerequisites

- Node.js 24 LTS and npm (use the major in .nvmrc).
- Git.
- Android Studio with an Android SDK, platform-tools, and a configured emulator; or an Android device with a compatible Expo Go client.
- SDK 58 is in an Expo Go transition period as of 20 October 2026. Use the matching Android client from https://expo.dev/go rather than assuming the Play Store client supports SDK 58.
- Native release compilation is validated with Temurin JDK 25.0.4.1, Gradle 9.4.1 and AGP 9.2.1. Use the documented original signing identity and Windows build workflow; do not regenerate keys.

Official setup: https://docs.expo.dev/get-started/create-a-project/ and https://docs.expo.dev/workflow/android-studio-emulator/.

## Install and run (PowerShell)

Run inside the existing repository; do not create a nested app directory:

```powershell
Set-Location 'C:\Users\Naafeel\Downloads\Mobile App Development\Health Mate App\healthmate-mobile-app'
npm ci
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator"
npm run android
```

Start the Pixel_10 emulator from Android Studio Device Manager first, or allow Expo to select/start an emulator. If Expo Go installation is offered, use the SDK-compatible client. For a physical device, use npm start and scan the QR code with compatible Expo Go; the computer and phone must be reachable on the same network. No EAS account or paid build service is required.

The welcome screen opens first. Tap Get Started to enter Dashboard; use the bottom tabs to visit Records, Insights, and Settings. Add Record opens the working daily form. Records supports editing, confirmed deletion and exact-date filtering. Android Back retraces visited tabs and returns to welcome. If localhost fails in Expo Go, use the default LAN connection; verification used npx expo start --android --lan --port 8082. Prompt 03 used port 8083 because 8081 and 8082 were already occupied.

## Quality checks

```powershell
npm run typecheck
npm run lint
npx expo-doctor
npx expo install --check
npm test
```

See docs/verification.md for initialization history and docs/ui-verification.md for the UI/navigation checks. A successful bundle is not proof that Android rendered the application. Run npm test for 142 validation, real desktop SQLite, state, lifecycle, settings, backup, water, reminder and analytics tests, including all previous 101 tests. See docs/crud-verification.md, docs/dashboard-verification.md and docs/goals-insights-verification.md for separate Android checks.

## Structure

```text
src/
  app/                  # Root stack, (tabs), add-record, welcome
  components/           # Reusable UI primitives and health icon
  features/             # Welcome, dashboard, records, insights, settings
  theme/                # Design tokens
  domain/               # Record model, contracts and validation
  data/                 # SQLite connection, migrations and repository
  store/                # Shared Zustand record state
tests/                  # Node tests and test-only sample fixtures
docs/                   # Architecture and verification notes
app.json                # HealthMate display name and Expo metadata
eslint.config.js
package.json
package-lock.json
tsconfig.json
```

See docs/architecture.md and docs/database-design.md for implemented data flow, schema, migrations and repository responsibilities.

## Version control

This application lives directly in the existing healthmate-mobile-app Git repository. Generated native folders, dependencies, Metro output, local credentials, and Expo cache are ignored. Commit genuine completed changes progressively; never commit secrets or patient data.

## UI and navigation evidence

See [UI design](docs/ui-design.md), [architecture](docs/architecture.md), and [verification](docs/ui-verification.md). Genuine Pixel 10 screenshots are in docs/evidence/.

## Records and testing

Daily fields: date, steps walked, calories burned (kcal), and water intake (ml). One summary per date; zero is allowed. Dates default to the local calendar day and future dates are blocked. Whole-number limits are 200,000 steps, 20,000 kcal, and 20,000 ml. Duplicate dates offer editing instead of overwriting.

All records are stored in healthmate.db on the device. New databases contain no seeded records. Test fixtures in tests/fixtures/records.ts are only inserted into temporary test databases by npm test. Do not clear Expo Go app data or uninstall it if you want to retain its development databases. Back up coursework evidence separately.

Use Node 24 LTS for npm test: it uses Node's test runner and built-in SQLite through a small async adapter. This proves the production SQL against real SQLite, while Android testing separately checks Expo SQLite. See [database design](docs/database-design.md) and [CRUD verification](docs/crud-verification.md).

If Expo Go reports a missing native module immediately after installing dependencies, fully close and reopen the matching Expo Go client. This resolved the initial SQLite loading error on Pixel_10; no downgrade or storage substitution was used.

## Functional dashboard

Dashboard reads the same SQLite-backed Zustand list as Records. Today’s Overview shows the single local-date summary: saved steps, calories burned in kcal, and water in ml. Missing today is an unrecorded state; a saved 0/0/0 row displays real zeros. No activity is estimated or summed across days. Add Today opens the existing Add form; Edit Today opens the existing saved ID. Recent Activity shows up to three real dates, newest first, with View All Records navigation.

Dashboard refreshes on focus, foreground return and the next local midnight, with timer/subscription cleanup. Initial loading and load failure are distinct from an empty database; Retry reuses the shared store. See [dashboard design](docs/dashboard-design.md) and [dashboard verification](docs/dashboard-verification.md). No new packages or schema migrations were needed for Prompt 04.

## Personal goals and Insights

Settings now saves optional positive daily targets for steps, calories burned (kcal) and water (ml). Blank fields disable individual goals; Clear changes take effect when Save goals is pressed. No targets are recommended or preconfigured. SQLite schema v2 adds a singleton health_goals table transactionally without rebuilding health_records.

Dashboard displays actual saved daily values alongside current goals and rounded percentages, including values above 100%; only bar fill is capped. Missing today remains unrecorded. Insights provides Monday–Sunday weeks and calendar months, metric selection, previous/next navigation, recorded-day totals/averages/count/highest, and a horizontally scrollable daily chart. Missing, saved zero and future dates remain distinct. Historical charts do not reuse today's goals.

See [goals and Insights design](docs/goals-insights-design.md) and [verification with Android evidence](docs/goals-insights-verification.md). No new packages were added. Prompt 05 development uses port 8085 when earlier Metro servers occupy 8081–8084: `npx expo start --android --lan --port 8085`.

## Calendar, logging streaks and CSV export

Records → Calendar View opens a Monday-first monthly activity grid. Select a saved date to edit its existing record, or an empty past/current date to add through the same form with that date prefilled. Future dates explain why logging is unavailable. Back and calendar-origin Save return predictably to the existing screen.

Dashboard now displays Current and Longest Logging Streak. These count consecutive dates with saved entries, including zeros; missing days break a run, while yesterday keeps the current run active until today is logged. They do not measure health or goal achievement.

Settings → Data Management → Export Health Records explains the exported columns and asks you to confirm Export CSV before opening Android sharing. The UTF-8 CSV contains actual saved records, oldest first, with date, steps, calories_burned_kcal and water_ml. Cancelling is safe. HealthMate cannot confirm whether another app saves the file. Remove temporary export file deletes the app-cache copy; hour-old files are eligible for cleanup on a later launch/export.

SDK-compatible expo-file-system and expo-sharing support local file creation/sharing without a backend or broad storage permissions. See [calendar, streaks and export design](docs/calendar-streaks-export-design.md) and [verification and evidence](docs/calendar-streaks-export-verification.md), including the dependency audit caveat. Schema v2 is unchanged. Prompt 06 uses `npx expo start --android --lan --port 8086` when earlier Metro ports are occupied.

## Version 1.0.1 feature expansion

Implemented: persistent Light/Dark/System appearance, opt-in local daily reminders, atomic Dashboard quick water additions, complete versioned JSON backup/restore with preview and transactional replacement, and weekly/monthly previous-period comparisons. Schema v3 adds preferences without rebuilding existing records/goals. Backups contain readable personal data and must be saved privately. Reminders are best effort and require opt-in Android permission.

The shared numeric input no longer selects text automatically on focus. The owner confirmed the released fix on their physical phone before Prompt 09. New source changes still require later physical-device regression testing.

Use `npm test` for the expanded suite; original tests remain preserved. See [feature architecture](docs/feature-expansion-design.md), [verification](docs/feature-expansion-verification.md), and [release procedure](docs/android-release-build.md). The original release key is recovered; Windows packaged-app AppData redirection must not select the alternate Codex key. The release script verifies the original certificate before any native build and verifies the final APK again.

## Prompt 09 source expansion (not yet released)

Source now includes Achievements, advanced date/value/note/tag search, optional local My Profile, persistent Dashboard customization, Privacy & Data management, daily notes/activity tags and weekly summary sharing. Settings About retains product details without the academic attribution. Four tabs and the existing offline architecture are preserved.

Runtime schema v4 is additive and preserves v1.0.1 data. Complete JSON backups now use version 2, while version 1 restores remain supported with clearly previewed defaults for new fields. CSV retains its original four numeric/date columns; notes/tags/profile are available through complete JSON instead. Water remains stored/edited in ml; profile display preferences do not change canonical measurements.

`npm test` currently passes 184 tests, including all previous 142. See [Prompt 09 architecture, semantics and verification](docs/prompt09-development.md) for implementation files, migrations, privacy confirmations, backup compatibility and actual Expo Go testing limits.

The app metadata remains version 1.0.1 / Android code 2. No APK was built, signed or installed during Prompt 09. The existing signed release remains unchanged and does not contain the new source features. A separate release authorization and native verification are required. Notification functionality is explicitly unavailable in an older Expo Go client lacking the required module; this does not justify rebuilding an APK during this assignment.
