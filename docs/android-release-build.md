# Android release build

## Reproducible local environment

Validated 21 October 2026: Windows 11, Node 24.15.0, npm 11.12.1, Expo 58.0.16, React Native 0.88.0, TypeScript 6.0.3. Android Studio and the Pixel_10 emulator are installed. The SDK 58 generated Android project uses Gradle 9.4.1, Android Gradle Plugin 9.2.1, Kotlin plugin 2.2.10, NDK 27.1.12297006, build tools 37.0.0, compile SDK 37, target SDK 36 and minimum SDK 24.

The selected JDK is Eclipse Temurin 25.0.4.1+1 LTS at `C:\Program Files\Eclipse Adoptium\jdk-25.0.4.101-hotspot`. Gradle 9.4.1 runs successfully on it; no global Java downgrade is needed. Gradle supports Java 25 from 9.1. AGP 9.2 requires at least JDK 17 and Gradle 9.4.1. Select another compatible local JDK only with `-JavaHome` or `HEALTHMATE_JAVA_HOME`.

References: [Gradle Java compatibility](https://docs.gradle.org/9.4.1/userguide/compatibility.html), [AGP 9.2 release notes](https://developer.android.com/build/releases/agp-9-2-0-release-notes), [Expo local production builds](https://docs.expo.dev/guides/local-app-production/), [Expo CNG](https://docs.expo.dev/workflow/continuous-native-generation/).

## Native generation and identity

The existing repository ignores `/android` and `/ios`. Keep that Continuous Native Generation policy. App configuration and `plugins/withHealthMateRelease.cjs` reproduce Android release configuration; do not hand-edit generated native files. Only Android is generated. The script uses `--no-clean` to preserve generated work and downloads between builds.

HealthMate uses the established `com.naafeel.healthmate` application ID, version `1.0.0`, versionCode `1`. Original cross icons follow the existing green HealthMate identity. Android backup is disabled because records are local personal data. No cloud, authentication, tracking or OTA service is configured.

## Signing material

Run `scripts/Initialize-ReleaseSigning.ps1` **once** for a new signing identity. It refuses to overwrite existing material. This machine already has the dedicated `healthmate-release` identity under `%LOCALAPPDATA%\HealthMate\signing`: a PKCS12 keystore and a Windows CurrentUser DPAPI-encrypted password. Folder ACLs restrict access to the current user and SYSTEM. The certificate uses RSA 3072/SHA256withRSA and a 10000-day validity. Credentials never belong in Git, logs, screenshots or the public report.

Preserve the original keystore and its actual password using a secure backup process before replacing the Windows account/profile or computer. The DPAPI file is tied to this Windows user/profile and is not a portable password backup. Losing the signing key prevents compatible signed updates. Do not regenerate the key for each build.

`Build-AndroidRelease.ps1` decrypts the password only into the build process environment and restores prior environment values in `finally`. The CNG plugin overrides the template's debug release signing and adds a mandatory credential validation task. A missing key/password fails the release build rather than silently falling back to the Android debug certificate.

## Commands

From the existing repository root in PowerShell:

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npx expo install --check
npx expo-doctor
npm run android:release
```

The release script runs:

```powershell
npx expo prebuild --platform android --no-install --no-clean
# inside android/
.\gradlew.bat --version
.\gradlew.bat :app:assembleRelease -PreactNativeArchitectures=arm64-v8a,x86_64 --max-workers=2 --no-daemon --console=plain
```

The APK is expected at `android/app/build/outputs/apk/release/app-release.apk`. It includes arm64-v8a for 64-bit ARM phones and x86_64 for this emulator; 32-bit-only devices are outside this build. A release APK is distinct from an AAB and must be verified with `apksigner verify --verbose --print-certs` before distribution. Use SDK `aapt dump badging` to check package/version and `Get-FileHash -Algorithm SHA256` to identify the artifact. Installation uses `adb install -r <apk>`; launch `adb shell am start -n com.naafeel.healthmate/.MainActivity`.

APK and keystore binaries are ignored and remain outside source control. The final artifact and verification results are recorded in [production verification](production-verification.md).

## Toolchain observations

The first build downloaded Gradle 9.4.1 and installed the licensed NDK through Android Gradle tooling. The first attempt stopped just as NDK installation completed; the subsequent build reused that installation. No unrelated software or global Java settings were changed. Existing HealthMate Metro processes were stopped after checking their repository-specific command lines to make standalone verification meaningful.

SDK-generated warnings reference `android.builtInKotlin=false`, `android.newDsl=false`, legacy variant APIs and a Kotlin catalog/plugin version difference. These are upstream compatibility warnings, not justification to independently upgrade AGP or Kotlin. Build outcome and any actual blockers are documented separately.

## Version 1.0.1 and Windows signing namespace

Version 1.0.1 uses code 2 and the same package and original signer. The usual LocalAppData signing path is redirected inside the packaged Codex process; simply spelling the same absolute path does not select the physical original key. The verified original key exists in ordinary Windows LocalAppData and the DPAPI password is usable from an ordinary Windows process. Do not regenerate either identity.

Run the following in an ordinary **PowerShell 7 window opened from Windows**, outside Codex's packaged process:

```powershell
Set-Location 'C:\Users\Naafeel\Downloads\Mobile App Development\Health Mate App\healthmate-mobile-app'
.\scripts\Build-AndroidRelease.ps1 `
  -JavaHome 'C:\Program Files\Eclipse Adoptium\jdk-25.0.4.101-hotspot' `
  -AndroidHome 'C:\Users\Naafeel\AppData\Local\Android\Sdk' `
  -SigningDirectory 'C:\Users\Naafeel\AppData\Local\HealthMate\signing'
```

The script verifies original certificate SHA-256 `82a0a426d562ff060fad55fcd6a97954ab845c270723915f43dfe90e50bcda5d` before prebuild. Missing/mismatched credentials stop immediately. The SDK apksigner result must match again after assembly, before any installation. No password is passed as a literal command argument. This milestone also generates codegen artifacts before applying the existing CMake workaround so a clean npm installation does not require previously generated codegen files. Cleanup destinations are checked against the project's node_modules or the known C:/HM/b/a staging path.

For this machine's automated run, a non-packaged process was started through Windows process management with the same explicit paths. The key was first verified independently through that context. This avoided changing or copying signing credentials. APK installation must use `adb install -r` and never uninstall/clear data to work around a signature mismatch.
