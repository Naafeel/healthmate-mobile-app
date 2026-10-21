# Security and dependency review

Reviewed 21 October 2026 for the Android release milestone. Expo Doctor checks dependency/configuration health; it is not an npm security audit.

## npm advisories

`npm audit --json` reports **29 affected packages: 9 moderate and 20 high**, propagated from **three underlying advisories**. These are transitive dependencies; no direct application package was identified as the advisory root. No `npm audit fix --force` or incompatible Expo downgrade was applied.

| Advisory | Installed dependency / path | Scope and assessment | Compatible remediation |
| --- | --- | --- | --- |
| [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | braces 3.0.3 via Expo Metro → metro-file-map → micromatch | Stack exhaustion from crafted brace input; development/build file matching. Avoid untrusted project/build inputs. | Advisory has no patched release; registry latest was 3.0.3. Monitor upstream. |
| [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | node-forge 1.4.0 via Expo CLI / code-signing-certificates | RSA ASN.1 signature verification flaw in tooling. This local APK is signed by JDK/Android SDK tooling; no Expo OTA signature service is configured. | Advisory has no patched release; registry latest was 1.4.0. Monitor upstream. |
| [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | uuid 7.0.3 via @expo/config-plugins → xcode 3.0.1 (also propagated to expo-sharing) | Buffer bounds issue in v3/v5/v6 functions; Xcode configuration tooling, not an app feature. | Patched uuid 11.1.1 / 12.0.1 / 13.0.1 requires major upgrades. Do not force a major override into xcode's uuid 7 contract. |

The audit's suggested Expo 44 / React Native 0.72 / expo-sharing 14 downgrades do not match SDK 58 and would undermine compatibility. A newer major xcode package is not proof of a supported SDK 58 patch. Retain the compatible lockfile and report unresolved advisories. A package classified as a production npm dependency can still be build tooling; that classification alone does not establish inclusion in the APK runtime. This assessment reduces exposure for the offline APK but does not declare the project vulnerability-free.

## Application and release controls

- SQLite stays inside the standalone Android application's private storage. Expo Go uses a different package/sandbox; its database must not be cleared for standalone testing.
- Parameterized repository queries, boundary validation and database constraints remain in place. Invalid edit-route arrays are now rejected before a query instead of being accepted through JavaScript coercion.
- Records and goals have no cloud, analytics, ads, authentication, online synchronization or medical advice service. Backups are explicitly disabled for this release.
- Export is an explicit user action with confirmation. Only the selected CSV is exposed by the native sharing API. No recipient delivery is inferred from share-sheet dismissal. Cache removal remains scoped to HealthMate export files.
- Dedicated release credentials live outside the repository with restricted ACLs and a Windows DPAPI-protected local password. No signing secrets are hardcoded. Public signer certificate fingerprints are safe to record; private key/password material is not.
- Generated native files, APKs, keystores and local signing material are ignored by Git. Verify staged paths before each commit.

Final APK manifest, signing and runtime checks are recorded in [production verification](production-verification.md). Native offline tests cannot establish the absence of every vulnerability; these advisory limitations remain open for upstream fixes.

## Prompt 08A dependency and permission review

The new SDK-resolved packages are expo-notifications 58.1.5 and expo-document-picker 58.0.4. The audit after installation still reports 29 affected packages (9 moderate, 20 high), driven by the same braces, node-forge and uuid advisories described above. No audit-force fix or SDK downgrade was applied. No new advisory root was added by these features.

The notification feature uses local scheduling only, with no push token registration, server or health values in notification content. Android POST_NOTIFICATIONS is requested only after opt-in. SCHEDULE_EXACT_ALARM and USE_EXACT_ALARM are blocked; normal best-effort delivery is intentional. Broad storage permissions remain blocked. Backup selection uses the document picker, and sharing grants access to the selected file. Plain JSON backups are explicitly disclosed as readable personal data, not encrypted storage.

The original signing key was found intact outside Codex's redirected AppData namespace. A normal Windows process authenticated its DPAPI-protected password and verified certificate 82a0a426d562ff060fad55fcd6a97954ab845c270723915f43dfe90e50bcda5d. The alternative key inside the Codex package cache remains untouched. The release script now fails before prebuild if the expected original certificate is absent and verifies the APK certificate after assembly. Private keys/passwords were not copied into project source, logs or Git.
