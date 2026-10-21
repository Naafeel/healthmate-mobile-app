# HealthMate

Personal Health & Wellness Tracker for Kingston University / ESOFT Mobile Application Development coursework.

## Status

Functional daily dashboard and local record management completed. Implemented: the welcome/navigation foundation, validated Add/Edit daily record form, SQLite create/read/update/delete, exact-date filtering, shared Zustand state, loading/error/success states, native delete confirmation, an SQLite-backed daily dashboard with smart Add/Edit Today and real recent activity, and automated tests. Android persistence was verified after a full Expo Go restart.

SQLite is implemented provisionally with expo-sqlite while lecturer clarification about the coursework's Flutter-specific sqflite wording is pending. Flutter remains prohibited. No cloud account or backend is used.

Planned: Insights charts, analytics, personal goals, and later wellness features. These are not implemented.

## Stack

React Native with Expo SDK 58, React 19, TypeScript strict mode, Expo Router, and npm. Android is the target. The dependency lockfile pins exact installed versions. Architecture: feature-based, MVVM-inspired, with Repository Pattern. No paid service, backend, hosting, or account is required for core functionality.

## Prerequisites

- Node.js 24 LTS and npm (use the major in .nvmrc).
- Git.
- Android Studio with an Android SDK, platform-tools, and a configured emulator; or an Android device with a compatible Expo Go client.
- SDK 58 is in an Expo Go transition period as of 20 October 2026. Use the matching Android client from https://expo.dev/go rather than assuming the Play Store client supports SDK 58.
- Java is not needed to run JavaScript in Expo Go. Native compilation, if introduced later, requires the JDK supported by that SDK's Android build toolchain; the locally installed JDK 25 has not been validated for native builds.

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

See docs/verification.md for initialization history and docs/ui-verification.md for the UI/navigation checks. A successful bundle is not proof that Android rendered the application. Run npm test for 46 validation, real desktop SQLite, state, dashboard, formatting, and lifecycle tests. See docs/crud-verification.md and docs/dashboard-verification.md for the separate Android checks.

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
