# Prompt 08A implementation and verification

## Initial baseline

21 October 2026: repository root is the existing healthmate-mobile-app, branch main, origin https://github.com/Naafeel/healthmate-mobile-app.git. Initial HEAD e583d10; working tree clean. Baseline npm test: 99 passed, none failed/skipped. Existing v1.0.0 APK is preserved outside Git before any build output is replaced; SHA256 EDBF579F10526044F58313557766B60F688CB7A73110726E8A62D9775E966028. Existing release key is reused; no new signing identity is created. Only emulator-5554 is connected, so physical phone verification is user-reported for v1.0.0 and must be repeated manually for v1.0.1.

## B01 numeric input investigation

The common MeasurementField passed selectTextOnFocus with a true implicit value to Android TextInput. This deliberately selects content on focus and can select the first character during Android's initial focus/IME interaction. Both record and goal inputs use this same component. No controlled selection prop, autofocus or focus loop exists. Add drafts initialize synchronously once; edit inputs are hidden until their asynchronous load completes. Goal fields are disabled during loading, and an active draft takes precedence over later saved state. There is no evidence of delayed Add initialization replacing the first character.

Correction: explicitly set selectTextOnFocus=false, leaving selection/cursor management to Android. Users can move the cursor, long-press/select, or clear normally. No timer, refocus or forced cursor position was introduced. Goal draft updates now use functional setters so successive edits compose against the latest draft instead of a render-time snapshot. Record drafts already use functional setters. Validation and mutation guards are preserved.

Two regression tests inspect the actual TextInput AST/configuration and both form integration contracts. These prove the source selection policy and functional update path, not physical IME behavior. Android soft-keyboard and physical-phone outcomes are recorded separately below.

## Release blocker discovered before new features

The B01-only release build completed successfully in 5m 27s (581 tasks; 41 executed). However, `adb install -r` rejected it with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`: existing package signatures do not match. No uninstall or data clearing was attempted.

Public certificate SHA-256 fingerprints verified using SDK 37 apksigner:

- Preserved verified v1.0.0 APK: `82a0a426d562ff060fad55fcd6a97954ab845c270723915f43dfe90e50bcda5d`.
- B01 build using the currently available `%LOCALAPPDATA%/HealthMate/signing/healthmate-release.p12`: `2345a813099bca9d440f2b36dd29e882b447400f55054c5ad371d668b0a38c8f`.

The certificate subject names are identical, but their cryptographic identities differ. The documented signing directory contains only one keystore and its DPAPI password; no alternate key was found in the task's deliverable folders. No signing material was generated, overwritten, committed or exposed during this assignment. The original key cannot be recovered from an APK certificate.

Prompt 08A section 53 explicitly requires stopping if the existing signing credentials cannot be used. Restore/access the original keystore and matching securely stored password whose certificate matches the preserved APK. Do not send passwords through chat. Once available, configure the build to use that original signing directory, verify the fingerprint, then resume B01 soft-keyboard testing and the remaining features.

| Test ID | Scenario | Input | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| B01-source | Native selection policy | Shared MeasurementField | No automatic selection/refocus | Explicit false; no selection/focus overrides | Pass (source contract) |
| B01-draft | Goal state updates | Successive changes | Latest draft retained | Functional setters; record setter already functional | Pass (source contract) |
| B01-checks | Regression suite | Existing 99 + 2 new | All pass | 101 passed, 0 failed/skipped | Pass |
| B01-build | Existing local release workflow | Original build scripts, current local signing material | Native compilation | BUILD SUCCESSFUL | Pass (compilation only) |
| B01-upgrade | Install over original v1.0.0 | adb install -r | Same signing identity/data retained | Android rejected different signing certificate; existing app retained | Blocked |
| B01-IME | First-focus digits, edit, paste, refocus | 10000 / 7850 / 2500 | Exact values using soft keyboard | Patched APK cannot be installed as compatible update | Not executed |
| B01-phone | Physical first-focus behavior | User phone | No replaced digit | No authorized physical adb device connected | Not executed |
| F01–F06 | Approved expansion | Dark mode/reminders/water/backup/trends | Implement sequentially after B01 | Not started because signing blocker prevents required B01 verification | Blocked |

The selectTextOnFocus behavior is the source-level cause candidate supported by the reported highlighted digit; reproduction and confirmation on the affected phone remain pending. Source checks alone are not native keyboard proof. The intermediate B01 APK remains version 1.0.0/code 1 and is not the requested final 1.0.1 release. Emulator IME visibility was restored to its original value 0. No records/goals were intentionally changed.

## Prompt 08A source and automated checkpoint

The original key recovery supersedes the earlier signing-blocker section: the physical original key was located and independently authenticated. Codex's packaged AppData namespace contained a different key, explaining the previous rejected update. Development resumed from e227d3a without recreating B01 or changing either signing identity.

Implemented sequentially: F01 application-wide persisted Light/Dark/System; F02 local daily reminders; F03 atomic quick water; F04 complete JSON backup/restore; F06 calendar-aware comparisons. Documentation: feature-expansion-design.md. Automated checks after integration: 141 tests passed, including all prior 101; TypeScript and lint pass; dependencies match SDK 58; Expo Doctor 20/20. A test-only integration case initially passed record objects to the date-only streak function and accessed the wrong progress property; correcting the test to the existing APIs resolved it. A genuine water failure-feedback test caught an eager refresh clearing the error; refresh now occurs only on successful increments.

The new SQLite tests use disposable desktop databases, including an on-disk close/reopen round trip after water increments and restore. They verify rollback, migration safety, deterministic backup serialization, untrusted-input rejection, setting persistence, cross-feature derived state, timezone calculations and serialized database access. They do not claim Android-native bridge, picker, sharing or notification delivery proof.

## Final Prompt 08A Android verification — 21 October 2026

The final source includes the native-discovered water-limit presentation fix and the unused-permission cleanup. **142/142 tests pass (101 preserved + 41 new), zero failures/skips.** TypeScript, ESLint, Expo dependency check, Expo Doctor 20/20 and git diff --check pass. Desktop SQLite tests and Android results remain separate.

### Release artifact

- Package: com.naafeel.healthmate; versionName 1.0.1; versionCode 2.
- APK size: **57,179,484 bytes** (about 54.53 MiB).
- SHA-256: **B2AA8A8E803D982912B3A311CABF1310CA3283B4CAD86E8EB0D16646565D6237**.
- Signer certificate SHA-256: **82a0a426d562ff060fad55fcd6a97954ab845c270723915f43dfe90e50bcda5d**, identical to preserved v1.0.0. apksigner verifies APK Signature Scheme v2; RSA 3072. Minimum API 24, target 36, compile 37; arm64-v8a and x86_64.
- Original native output: android/app/build/outputs/apk/release/app-release.apk. A separate delivery copy is HealthMate-1.0.1-release.apk under the task outputs/releases directory, with a checksum text file. APKs and credentials are not committed.
- Final native assembly: BUILD SUCCESSFUL in 4m 23s, 581 tasks (generate-codegen stage separately succeeded in 24s). Original-certificate checks passed before compilation and after assembly. Earlier candidates were genuine build/test iterations; only the above checksum identifies the final deliverable.
- adb install -r succeeded; no uninstall or data clear was used. The old original APK remains preserved, checksum EDBF579F10526044F58313557766B60F688CB7A73110726E8A62D9775E966028.
- Final manifest retains INTERNET (framework default), RECEIVE_BOOT_COMPLETED, POST_NOTIFICATIONS, WAKE_LOCK and the app's non-exported dynamic-receiver permission. Unused badge, remote C2DM receive, install-referrer and ACCESS_NETWORK_STATE permissions were removed after actual APK inspection. Exact-alarm, recording, overlays and broad external storage permissions remain blocked. Notification permission is opt-in. Backup is disabled at the Android OS level.

### Native test matrix

Pixel_10 / emulator-5554, Android API 37.1, standalone package, no Expo Go or Metro. Wi-Fi and mobile data were disabled during the final regression. Screenshots under evidence/08a are actual native captures; earlier evidence directories retain their original Expo Go/release context.

| Test ID | Scenario | Input | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| QA01 | In-place upgrade | Original v1.0.0 → signed v1.0.1 | Keep original record/goals | 2026-10-21: 8500/420/2200; goals 10000/500/2500 retained | Pass |
| QA02 | First-focus Android input | Tap visible numeric keys 10000 in empty Add field | Exact 10000 | Exact value and screenshot; no injected text used for this sequence | Pass on emulator |
| QA03 | Clear/retype/refocus | Clear, tap 7850, blur/focus | Preserve 7850 | Exact field value after refocus | Pass on emulator |
| QA04 | Goal input | Clear water goal; tap visible 2500 keys | Exact 2500 | Exact value, saved with original other goals | Pass on emulator |
| QA05 | Appearance | Light, Dark, System; Android night yes/no | Theme all views and persist | Dark Settings/calendar/forms; System responds; restored Light updates immediately; Dark persists after restart | Pass for exercised screens |
| QA06 | Reminder denial | Enable and deny native prompt | Explain permission needed | Saved preference and permission-needed status; no delivery claim | Pass |
| QA07 | Reminder scheduling | Choose 15:50, grant permission, enable | One normal local alarm | Native permission dialog; channel and one inexact alarm verified | Pass |
| QA08 | Reminder delivery/tap | Candidate scheduled 15:50 | Observe actual notification and safe app launch | Appeared about 15:51 within OS window; native shade/log record; tap returned safely | Pass on signed 1.0.1 candidate |
| QA09 | Reminder disable/restore | Disable; restore disabled preference | Cancel own pending reminder | Off state retained through restore/restart; no unrelated cancellations | Pass |
| QA10 | Quick water | 2200 +250 +500 +1000 | 3950; preserve steps/calories | 3950, 8500/420 unchanged, goal 158% | Pass |
| QA11 | Water maximum | Temporarily 19750; +250; +250 | Accept 20000, reject overflow inline | 20000 retained; final APK shows inline error and keeps metrics visible | Pass |
| QA12 | Water cleanup | Edit only water back to 2200 | Retain original data | Original date, 8500 steps, 420 kcal, 2200 ml | Pass |
| QA13 | Backup confirmation/share | Confirm creation then Android Back | Real JSON and safe dismissal | Native file readback succeeded; chooser shows dated JSON; no recipient selected/delivery claimed | Pass |
| QA14 | Picker cancellation | Open Restore, Android Back | No database mutation | Safe return without restore | Pass |
| QA15 | Restore preview/cancel | Controlled JSON retaining original logical record/goals | Show scope, require confirmation | Count 1/date span/goals/theme/reminder/timestamp shown; confirmation Cancel leaves data | Pass |
| QA16 | Native restore | Confirm controlled fixture; theme light, reminder off | Commit and reload canonical state | Data restored and reloaded; original record/goals retained; Light appearance and off reminder applied | Pass |
| QA17 | Backup cleanup | New final-APK backup, dismiss, explicit cache removal | Remove app cache copy | Removal callback completes; native feedback captured | Pass within session |
| QA18 | Weekly missing comparison | Only original today record | Show missing previous data, not zero | 8500 current; previous Not recorded; coverage 1/3 vs 0/3 | Pass |
| QA19 | Saved-zero comparison | Create disposable October 14 0/0/0 through Calendar/Add | Previous saved zero is real data | 8500 vs 0; +8500; Increase from zero; percentage unavailable | Pass |
| QA20 | Monthly water | October 1–21 vs September 1–21 | Equal elapsed windows and real totals | 2200 ml; coverage 2/21 with temporary zero; previous 0/21 Not recorded | Pass |
| QA21 | Calendar/CRUD | Add October 14 from selection, Save/back; edit original water; delete temporary row | Correct prefill, return and validation | Existing forms and Calendar return work; delete Cancel then Delete tested | Pass |
| QA22 | Data cleanup | Delete only newly created October 14 | Keep original October 21 | Original remains; temporary zero removed | Pass |
| QA23 | Existing CSV | Confirm CSV, dismiss chooser, remove cache | Real saved rows and safe dismissal | Native chooser; one saved record reported after cleanup; removal feedback | Pass |
| QA24 | Large text | 130% Settings/calendar; 150% welcome | Readable scrollable views | Dark palette, correct Thursday alignment; welcome fits at 150% | Pass for shown views |
| QA25 | Narrow portrait | Density 540 (~320 dp), normal text | Reachable calendar via horizontal scrolling | Grid retains minimum touch width with visible horizontal overflow/scrollbar and instructions | Pass for exercised layout |

The controlled restore fixture was authored locally for native testing and retained the already observed original logical record/goals. It was **not claimed to be a recipient-saved copy of the app-generated backup**. Exact backup-generation/restore round trips and rollback are proven by real desktop SQLite tests; Android separately verifies native file generation/readback, chooser, document selection, preview, transaction execution and state reload. No receiving app was asked to save/upload a backup.

### Defects and investigation

- Native maximum-water testing exposed a mutation error being interpreted by Dashboard as a load error. Water actions now have separate inline error state; the dashboard remains ready with 20000 ml. W06 covers this regression. Restored state also clears stale water feedback.
- The first backup/notification/keyboard automation attempts occasionally targeted controls before route/dialog transitions settled or while clipped by the keyboard. Fresh screenshots/hierarchies, explicit scrolling and a retrying helper resolved the procedure. Such attempts are not successful test evidence. The wrongly framed early screenshots are labelled according to their actual content; later captures show verified values.
- Android display-density changes returned to the launcher; explicitly reopening the app allowed narrow-width checks. This was not reported as an application crash. Actual runtime error checks and final settings restoration are recorded below.

### Remaining testing limits

No physical adb phone was connected. The reported physical first-digit issue still needs retesting on that phone/keyboard. Paste/cursor-position interactions and every OEM keyboard were not comprehensively verified natively. Full TalkBack speech/reading-order testing, every screen at every font/width combination, arbitrary OEM notification behavior, overnight DST/timezone changes, reboot delivery, low-disk failures and hour-old cleanup expiry were not induced. Failure/rollback and timezone cases are covered deterministically where appropriate; automated adapters are not Android hardware proof. The no-today quick-water navigation branch has automated route/prefill coverage; native testing retained the original today record rather than deleting it to manufacture an empty day.
