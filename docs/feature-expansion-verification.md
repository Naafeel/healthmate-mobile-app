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
