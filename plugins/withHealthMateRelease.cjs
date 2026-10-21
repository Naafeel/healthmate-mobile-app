const { withAppBuildGradle } = require("expo/config-plugins");
const start = "// healthmate-release-signing:start";
const end = "// healthmate-release-signing:end";
function configureReleaseGradle(source) {
  const clean = source.replace(
    /\n?\/\/ healthmate-release-signing:start[\s\S]*?\/\/ healthmate-release-signing:end\n?/g,
    "",
  );
  return (
    clean +
    `
${start}
// Credentials exist only in the build process environment, never in this file.
def hmStore = System.getenv('HEALTHMATE_KEYSTORE')
def hmStorePass = System.getenv('HEALTHMATE_STORE_PASSWORD')
def hmKeyPass = System.getenv('HEALTHMATE_KEY_PASSWORD')
def hmAlias = System.getenv('HEALTHMATE_KEY_ALIAS')
android.signingConfigs.create('healthmateRelease') {
    if (hmStore) storeFile file(hmStore)
    storePassword hmStorePass
    keyAlias hmAlias
    keyPassword hmKeyPass
}
android.buildTypes.release.signingConfig = android.signingConfigs.healthmateRelease
tasks.register('validateHealthmateReleaseSigning') {
    doLast {
        if (!hmStore || !hmStorePass || !hmKeyPass || !hmAlias || !file(hmStore).exists()) {
            throw new GradleException('Release signing credentials are missing. Run scripts/Build-AndroidRelease.ps1; debug signing is not a release fallback.')
        }
    }
}
tasks.matching { it.name == 'preReleaseBuild' }.configureEach {
    dependsOn('validateHealthmateReleaseSigning')
}

// Windows path length workaround: keep C++ staging directory ultra-short and sync codegen sources
try {
    def cxxBase = new File('C:/HM/b/a')
    cxxBase.mkdirs()
    android.externalNativeBuild.cmake.buildStagingDirectory = cxxBase
} catch (Exception ignored) {}

tasks.matching { it.name.startsWith("configureCMake") || it.name.startsWith("buildCMake") }.configureEach {
    doFirst {
        def rootDir = project.rootDir.parentFile
        def syncDirs = [
            [new File(rootDir, "node_modules/react-native-reanimated/android/build/generated/source/codegen/jni"),
             new File(rootDir, "node_modules/react-native-reanimated/Common/NativeView/cg")],
            [new File(rootDir, "node_modules/react-native-screens/android/build/generated/source/codegen/jni"),
             new File(rootDir, "node_modules/react-native-screens/android/src/main/jni/cg")],
            [new File(rootDir, "node_modules/react-native-safe-area-context/android/build/generated/source/codegen/jni"),
             new File(rootDir, "node_modules/react-native-safe-area-context/android/src/main/jni/cg")],
            [new File(rootDir, "node_modules/react-native-gesture-handler/android/build/generated/source/codegen/jni"),
             new File(rootDir, "node_modules/react-native-gesture-handler/android/cg")]
        ]
        syncDirs.each { pair ->
            def src = pair[0]
            def dest = pair[1]
            if (src.exists()) {
                project.delete(dest)
                project.copy {
                    from src
                    into dest
                }
            }
        }
    }
}
${end}
`
  );
}
module.exports = function withHealthMateRelease(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== "groovy")
      throw new Error(
        "HealthMate release plugin expects the SDK 58 Groovy template.",
      );
    mod.modResults.contents = configureReleaseGradle(mod.modResults.contents);
    return mod;
  });
};
module.exports.configureReleaseGradle = configureReleaseGradle;
