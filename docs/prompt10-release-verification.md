# Prompt 10 — HealthMate v1.1.0 Release Verification & QA Report

**Date**: 21 October 2026  
**Target Version**: 1.1.0 (`versionCode`: 3)  
**Package Identifier**: `com.naafeel.healthmate`  
**Database Schema**: v4 (`initializeExpandedDatabase`)  
**Backup Formats**: v2 (native export/import), v1 (legacy backwards-compatible import)

---

## 1. Verified Release Artifact

- **Build Status**: `BUILD SUCCESSFUL` (reproduced via `scripts/Build-AndroidRelease.ps1` with Windows LocalAppData signing credentials).
- **Artifact Location**: `android/app/build/outputs/apk/release/app-release.apk`
- **Preserved Release Copy**: `outputs/releases/HealthMate-1.1.0-release.apk`
- **File Size**: `57,249,128 bytes` (54.60 MB)
- **SHA-256 Checksum**: `C80E334FA5198B504BE73008251376076708C2470BF583EE84BA68E8D9FC2B1C`
- **Launchable Activity**: `com.naafeel.healthmate.MainActivity`
- **Architecture Support**: `arm64-v8a` (64-bit physical ARM devices) and `x86_64` (emulators).
- **Target SDK**: 36 | **Compile SDK**: 37 | **Minimum SDK**: 24.
- **Engine**: React Native 0.88.0 with precompiled production Hermes bytecode (`assets/index.android.bundle`).

### Signing Verification
Verified with Android SDK `apksigner.bat verify --verbose --print-certs`:
- **Verifies**: `true`
- **Signature Scheme v1**: `false`
- **Signature Scheme v2**: `true` (modern APK signature scheme enforced)
- **Signature Scheme v3/v4**: `false`
- **Signer DN**: `CN=HealthMate Coursework Release, OU=Mobile Application Development, O=HealthMate`
- **Signer SHA-256 Digest**: `82a0a426d562ff060fad55fcd6a97954ab845c270723915f43dfe90e50bcda5d` (Identical to original v1.0.0 and v1.0.1 release credentials).
- **Key Algorithm**: RSA 3072 bits.

### Declared Android Permissions
- `android.permission.INTERNET`
- `android.permission.RECEIVE_BOOT_COMPLETED`
- `android.permission.POST_NOTIFICATIONS`
- `android.permission.WAKE_LOCK`
- `com.naafeel.healthmate.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`
*(Unnecessary exact-alarm, audio, storage, and badge permissions remain explicitly blocked in app configuration).*

---

## 2. In-Place Upgrade & Original User Data Preservation

- **Installation Command**: `adb install -r android/app/build/outputs/apk/release/app-release.apk`
- **Target User**: `UserInfo{0:Owner:4c13}` (Primary Android User)
- **Upgrade Result**: In-place upgrade completed without package reinstallation or signature collision.
- **SQLite v3 to v4 Migration**: Executed seamlessly on application cold start.
- **Owner Data Retention**:
  - **Today's Record**: `2026-10-21` — `8,500 steps`, `420 kcal`, `2,200 ml water`.
  - **Daily Goals**: Steps `10,000`, Calories `500 kcal`, Water `2,500 ml`.
  - **Logging Streak**: `Current: 1 day / Longest: 1 day`.
  - **Application Settings**: Version displays `Version 1.1.0 • Local record management`.
  - **Data Safety**: Zero owner data was deleted, cleared, or overwritten.

---

## 3. Dedicated QA Isolation & Synthetic Verification

Destructive testing and feature verification were conducted within a dedicated, disposable Android user (`UserInfo{10:HealthMateReleaseQA:8410}`), completely isolating synthetic test records from the owner's environment.

### Restored v2 Backup Field-by-Field Comparison
Following cold restart of the standalone v1.1.0 APK, all fields restored from the format-v2 backup were verified against the synthetic baseline:
1. **Records Count & Values**:
   - `2026-10-21`: 10,000 steps, 400 kcal, 2,500 ml (displayed as `2.5 L`), Note: `"Synthetic walk 🏃 🚶\nSecond line, \"quoted\""`, Tags: `Walking`, `Yoga`.
   - `2026-10-20`: 0 steps, 0 kcal, 0 L (Saved zero).
   - `2026-10-19`: 0 steps, 0 kcal, 0 L (Saved zero).
   - `2026-10-14`: 7,850 steps, 300 kcal, 1,000 ml (displayed as `1 L`).
2. **Personal Profile**:
   - Display Name: `Release` (Dashboard greeting: `"Hello, Release"`).
   - Birth Year: `1998`
   - Height: `170.5 cm` | Weight: `65.2 kg`
   - Preferred Water Unit: `L` (Liters displayed across Dashboard and Records; stored as integer ml).
3. **Dashboard Customization**:
   - Order & Visibility: Goal Progress elevated to position 1; Water placed before Calories; Calories hidden.
4. **Achievements**:
   - "First Step": Unlocked (1/1).
   - "Getting Consistent": Unlocked (3/3) — proving that saved zero entries count toward consecutive logging streaks.
   - "Seven-Day Streak": Locked (3/7).
5. **Advanced Search & Filters**:
   - Date range boundaries, sort ordering (newest/oldest), minimum numeric thresholds, and tag filtering operational.
6. **Privacy Center**:
   - Record-only deletion verified: removes records while preserving profile, goals, and layout.
   - Full reset verified: requires typing `RESET` followed by a second confirmation; cancels scheduled reminders; leaves database schema at v4.

---

## 4. Test Environment Cleanup

Following completion of all verification checks:
1. **Disposable User Removal**: `adb shell pm remove-user 10` executed successfully. Only `UserInfo{0:Owner:4c13}` remains.
2. **Display Settings**: Verified reset to defaults (`font_scale=1.0`, `1080x2424`, density `420`).
3. **Port Forwards / Temporary Files**: No stray reverse/forward socket tunnels; temporary test files in `/data/local/tmp` cleaned up.

---

## 5. Automated Quality Gate

All verification scripts executed with 100% success:
- **TypeScript**: `npm run typecheck` passed with 0 diagnostics.
- **ESLint**: `npm run lint` passed with 0 errors / 0 warnings.
- **Automated Tests**: **184 / 184 passed** (`npm test`).
- **Expo Doctor**: **20 / 20 checks passed** (`npx expo-doctor`).
- **Git Diff Safety**: `git diff --check` passed with 0 issues.

---

## 6. Manual Physical-Phone Testing Checklist

For the device owner testing the APK on a physical Android handset:
1. **Transfer & Update**: Copy `HealthMate-1.1.0-release.apk` to the device and install over the existing app.
2. **Data Check**: Confirm existing daily records (8,500 steps, 420 kcal, 2,200 ml) and goals (10k/500/2.5k) are present.
3. **B01 Soft-Keyboard Input**: Tap into Steps, Calories, and Water in Add Record and Daily Goals. Verify first digits (`10000`, `7850`, `2500`) are not highlighted or swallowed.
4. **My Profile**: Enter name, birth year, height, weight, and switch water format to Liters. Verify Dashboard reflects `"Hello, <Name>"` and `"X.X L"`.
5. **Customize Dashboard**: Reorder sections and hide a card; verify Dashboard adapts instantly.
6. **Search & Filters**: Open Records > Advanced Search; filter by date and tags.
7. **Weekly Sharing**: Open Insights > Share Weekly Summary; test sharing to Messages/Email and dismiss.
8. **JSON Backup**: Save a v2 backup in Settings > Privacy & Data > Backup HealthMate Data.
