# Standalone Android production verification

Completed 21 October 2026 for the HealthMate Android Release & Production QA milestone (Prompt 07).

## 1. Verified Release Artifact

- **Build Status**: SUCCESS (`BUILD SUCCESSFUL in 7m 4s`, 581 tasks: 411 executed, 170 up-to-date)
- **Artifact Path**: `android/app/build/outputs/apk/release/app-release.apk`
- **File Size**: 56,458,687 bytes (53.84 MB)
- **SHA-256 Checksum**: `EDBF579F10526044F58313557766B60F688CB7A73110726E8A62D9775E966028`
- **Package Identifier**: `com.naafeel.healthmate` (verified via `aapt dump badging`)
- **Version**: `versionName='1.0.0'`
- **Version Code**: `versionCode='1'`
- **Target SDK**: 36 (Compile SDK: 37, Min SDK: 24)
- **Launchable Activity**: `com.naafeel.healthmate.MainActivity`
- **Architectures**: `arm64-v8a`, `x86_64`

### Signing verification

Verified using Android SDK `apksigner.bat verify --verbose --print-certs`:
- **Verifies**: `true`
- **Signature Scheme v1**: `false`
- **Signature Scheme v2**: `true` (enforced modern APK signature)
- **Signature Scheme v3**: `false`
- **Signature Scheme v4**: `false`
- **Signer DN**: `CN=HealthMate Coursework Release, OU=Mobile Application Development, O=HealthMate`
- **Signer Key**: RSA 3072 bits
- **Signer Digest**: SHA-256 (`82a0a426d562ff060fad55fcd6a97954ab845c270723915f43dfe90e50bcda5d`)
- **Signing Credential Security**: The PKCS12 keystore is stored outside the workspace at `%LOCALAPPDATA%\HealthMate\signing\healthmate-release.p12` with ACLs restricted to the current user and SYSTEM. The password is encrypted with Windows DPAPI. Zero secrets or keys are stored in Git.

---

## 2. Standalone Android Installation

- **Target Device**: Android Emulator `emulator-5554` (`Pixel 10`, `sdk_gphone16k_x86_64`, Android 16/VanillaIceCream API 36/37)
- **Installation Command**: `adb install -r android/app/build/outputs/apk/release/app-release.apk`
- **Outcome**: `Success`
- **Independence from Expo Go**: Verified standalone installation. The application runs under `com.naafeel.healthmate`, completely isolated from Expo Go (`host.exp.exponent`). Pre-existing Expo Go databases were neither touched nor cleared.

---

## 3. Offline Operation

- **Metro Status**: Stopped. All Metro and Node development packager processes were verified terminated.
- **Network Independence**: The standalone application operates 100% offline. Hermes bytecode and JavaScript bundles are embedded directly inside the APK assets (`assets/index.android.bundle`).
- **Telemetry / Remote Services**: Zero cloud analytics, zero ads, zero remote telemetry, and zero OTA update services are configured.

---

## 4. End-to-End Functional Verification & SQLite CRUD

All verification was conducted interactively on the standalone release build on the Pixel 10 emulator:

1. **Launch & Onboarding**:
   - Clean launch displaying the welcome screen ("Welcome to HealthMate", "Personal Health & Wellness Tracker").
   - Tapping "Get Started" navigates smoothly into the main Dashboard.
   - *Evidence*: `docs/evidence/release/01-launch.png`

2. **Empty Dashboard State**:
   - Initial state displays current date (`Wednesday, October 21, 2026`).
   - "No activity recorded today" with call-to-action buttons for setting goals and adding records.
   - Logging streak displays `Current: 0 days`.
   - *Evidence*: `docs/evidence/release/02-dashboard-empty.png`

3. **Daily Health Goals**:
   - Navigated to Settings > Daily health goals.
   - Inputted targets:
     - Steps walked target: `10,000` steps
     - Calories burned target: `500` kcal
     - Water intake target: `2,500` ml
   - Tapped "Save goals". Values persisted immediately into SQLite.
   - *Evidence*: `docs/evidence/release/03-goals-set.png`

4. **Add Today's Record (CRUD)**:
   - Navigated to "Add Record" from Dashboard.
   - Automatically selected today's date (`2026-10-21`).
   - Inputted test measurements:
     - Steps: `8,500`
     - Calories burned: `420` kcal
     - Water intake: `2,200` ml
   - *Evidence*: `docs/evidence/release/04-record-created.png`

5. **Updated Dashboard & Progress Tracking**:
   - Saved record redirected and refreshed the Dashboard:
     - Steps: `8,500 steps` / `Goal: 10,000 steps` (85% progress)
     - Calories: `420 kcal` / `Goal: 500 kcal` (84% progress)
     - Water: `2,200 ml` / `Goal: 2,500 ml` (88% progress)
     - Logging streak incremented to `Current: 1 day`, `Longest: 1 day`.
   - *Evidence*: `docs/evidence/release/05-dashboard-updated.png`

6. **Records Journal & History**:
   - Records tab displays saved entry for `2026-10-21`.
   - Date filtering and Edit Record actions are accessible and verified.
   - *Evidence*: `docs/evidence/release/06-records-list.png`

7. **Analytics & Insights**:
   - Insights tab reflects weekly and monthly analytics.
   - Steps summary: 1 recorded day, total 8,500 steps, average 8,500 steps.
   - Period navigation and metric breakdown toggles operate smoothly.
   - *Evidence*: `docs/evidence/release/07-insights.png`

8. **Activity Calendar & Logging Streaks**:
   - Activity Calendar renders October 2026 grid.
   - Date 21 is marked as today (`21 T`) with a checkmark indicating saved activity.
   - Future dates (22–31) are locked and protected from invalid logging.
   - *Evidence*: `docs/evidence/release/08-calendar-streaks.png`

9. **CSV Export & Native Android Sharing**:
   - Triggered "Export Health Records" from Settings.
   - Confirmation dialog explained export scope and temporary cache retention.
   - Confirmed "EXPORT CSV": generated `healthmate-records-2026-10-21.csv`.
   - Native Android system share sheet popped up with sharing intents (Drive, Gmail, Quick Share).
   - Dismissed cleanly via Android Back key.
   - *Evidence*: `docs/evidence/release/09-export.png`

10. **Cold Restart & SQLite Persistence**:
    - Terminated the running application via `adb shell am force-stop com.naafeel.healthmate`.
    - Relaunched via `adb shell am start -n com.naafeel.healthmate/.MainActivity`.
    - Verified all goals (10k steps, 500 kcal, 2.5k ml) and records (8.5k steps, 420 kcal, 2.2k ml) remained 100% intact from SQLite storage.
    - Zero data loss or corruption.
    - *Evidence*: `docs/evidence/release/10-persistence-relaunch.png`

11. **Android System Back Navigation**:
    - Tested Android Back key across all screens (Calendar -> Records, Edit Record -> Records, Add Record -> Dashboard, Share Sheet -> Settings).
    - No crashes, blank states, or memory leaks observed.

12. **Native Runtime Logs**:
    - Inspected Android logcat filtered for `ReactNative:E`, `ReactNativeJS:E`, and `AndroidRuntime:E`.
    - 0 unhandled exceptions, 0 runtime crashes, 0 fatal signals.

---

## 5. Accessibility & Responsive Verification

- **Large Font Scaling**: Tested system font scaling at 1.3x (`adb shell settings put system font_scale 1.3`). Screen layout adapted dynamically without text clipping, button distortion, or layout breakage. Reset cleanly to 1.0.
  - *Evidence*: `docs/evidence/release/11-accessibility-largefont.png`
- **Touch Targets**: All interactive elements exceed 48x48dp minimum touch target size.
- **Color Contrast**: Complies with WCAG AA (>= 4.5:1) using high-contrast slate `#1E293B` on mint `#F4F8F7` backgrounds.
- Detailed audit documented in [accessibility.md](accessibility.md).

---

## 6. Screenshot Evidence Directory

| File | Description |
| --- | --- |
| `docs/evidence/release/01-launch.png` | Welcome / Onboarding initial screen |
| `docs/evidence/release/02-dashboard-empty.png` | Clean empty state on Dashboard |
| `docs/evidence/release/03-goals-set.png` | Saved daily health goals (steps, calories, water) |
| `docs/evidence/release/04-record-created.png` | Add Record input form with test values |
| `docs/evidence/release/05-dashboard-updated.png` | Updated Dashboard with progress bars and streak |
| `docs/evidence/release/06-records-list.png` | Records journal displaying saved entry |
| `docs/evidence/release/07-insights.png` | Insights tab with weekly metrics and averages |
| `docs/evidence/release/08-calendar-streaks.png` | Activity Calendar grid with checked today & locked future |
| `docs/evidence/release/09-export.png` | Native Android share sheet with generated CSV |
| `docs/evidence/release/10-persistence-relaunch.png` | Cold relaunch verifying complete SQLite persistence |
| `docs/evidence/release/11-accessibility-largefont.png` | Large font scaling (1.3x) layout verification |
