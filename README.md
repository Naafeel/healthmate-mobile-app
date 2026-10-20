# HealthMate

Personal Health & Wellness Tracker for Kingston University / ESOFT Mobile Application Development coursework.

## Status

Initialization phase only. Implemented: Expo Router navigation shell, responsive HealthMate welcome screen with a local health icon, shared design tokens, strict TypeScript, and Expo-compatible ESLint. There is no dashboard or data collection yet.

Planned: health records, validated forms, CRUD, search/filtering, Zustand state, local SQLite via expo-sqlite (subject to lecturer confirmation), tests, and technical documentation. These features are not implemented. Flutter is prohibited.

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

Only the welcome screen should appear. There are no record forms or functional dashboard controls.

## Quality checks

```powershell
npm run typecheck
npm run lint
npx expo-doctor
npx expo install --check
```

See docs/verification.md for the initialization checks and their limits. A successful bundle is not proof that Android rendered the application. Automated feature tests will be added with actual behaviors in later phases.

## Structure

```text
src/
  app/                  # Router layout and initial route
  components/           # Reusable HealthIcon
  features/welcome/     # Welcome screen
  theme/                # Design tokens
docs/                   # Architecture and verification notes
app.json                # HealthMate display name and Expo metadata
eslint.config.js
package.json
package-lock.json
tsconfig.json
```

See docs/architecture.md for the planned domain, repository, database, hooks, store, and utility responsibilities. Those folders will be added when used.

## Version control

This application lives directly in the existing healthmate-mobile-app Git repository. Generated native folders, dependencies, Metro output, local credentials, and Expo cache are ignored. Commit genuine completed changes progressively; never commit secrets or patient data.
