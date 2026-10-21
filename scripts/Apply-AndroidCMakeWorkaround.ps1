param(
    [string]$Root = (Split-Path $PSScriptRoot -Parent)
)
$ErrorActionPreference = 'Stop'

function Assert-HealthMateBuildPath($path) {
    $resolved = [IO.Path]::GetFullPath($path).TrimEnd('\')
    $modules = [IO.Path]::GetFullPath((Join-Path $Root 'node_modules')).TrimEnd('\')
    if (!$resolved.StartsWith($modules + '\',[StringComparison]::OrdinalIgnoreCase) -and $resolved -ne 'C:\HM\b\a') { throw 'Refusing cleanup outside HealthMate native build paths.' }
}
function Sync-DirectoryContents($src, $dest) {
    Assert-HealthMateBuildPath $dest
    if (Test-Path $src) {
        if (Test-Path $dest) { Remove-Item -Path $dest -Recurse -Force }
        New-Item -ItemType Directory -Path $dest -Force | Out-Null
        Copy-Item -Path "$src\*" -Destination $dest -Recurse -Force
    }
}

# Ensure short staging directory exists
New-Item -ItemType Directory -Path "C:\HM\b\a" -Force | Out-Null

# 1. react-native-screens
$screensDir = Join-Path $Root 'node_modules/react-native-screens'
if (Test-Path $screensDir) {
    if (Test-Path (Join-Path $screensDir 'cpp')) {
        Copy-Item -Path (Join-Path $screensDir 'cpp') -Destination (Join-Path $screensDir 'android/cpp') -Recurse -Force
    }
    $screensCMake = Join-Path $screensDir 'android/CMakeLists.txt'
    if (Test-Path $screensCMake) {
        $c = Get-Content $screensCMake -Raw
        $c = $c.Replace('../cpp/', 'cpp/').Replace('../cpp', 'cpp')
        if ($c -notmatch 'CMAKE_SUPPRESS_REGENERATION') {
            $c = "cmake_minimum_required(VERSION 3.9.0)`nset(CMAKE_SUPPRESS_REGENERATION ON)`n" + ($c -replace 'cmake_minimum_required\(VERSION [0-9.]+\)\s*', '')
        }
        $c = $c -replace 'set\(CMAKE_OBJECT_PATH_MAX [0-9]+\)\r?\n?', ''
        Set-Content -Path $screensCMake -Value $c -NoNewline
    }
    if (Test-Path (Join-Path $screensDir 'common/cpp')) {
        Copy-Item -Path (Join-Path $screensDir 'common/cpp') -Destination (Join-Path $screensDir 'android/src/main/jni/common_cpp') -Recurse -Force
    }
    $codegenSrc = Join-Path $screensDir 'android/build/generated/source/codegen/jni'
    Sync-DirectoryContents $codegenSrc (Join-Path $screensDir 'android/src/main/jni/cg')
    $screensJniCMake = Join-Path $screensDir 'android/src/main/jni/CMakeLists.txt'
    if (Test-Path $screensJniCMake) {
        $c = Get-Content $screensJniCMake -Raw
        $c = $c.Replace('${LIB_ANDROID_DIR}/../common/cpp', '${CMAKE_CURRENT_SOURCE_DIR}/common_cpp')
        $c = $c.Replace('${LIB_ANDROID_DIR}/build/generated/source/codegen/jni', '${CMAKE_CURRENT_SOURCE_DIR}/cg')
        if ($c -notmatch 'CMAKE_SUPPRESS_REGENERATION') {
            $c = "cmake_minimum_required(VERSION 3.13)`nset(CMAKE_SUPPRESS_REGENERATION ON)`n" + ($c -replace 'cmake_minimum_required\(VERSION [0-9.]+\)\s*', '')
        }
        $c = $c -replace 'set\(CMAKE_OBJECT_PATH_MAX [0-9]+\)\r?\n?', ''
        Set-Content -Path $screensJniCMake -Value $c -NoNewline
    }
    $screensCodegenCMake = Join-Path $screensDir 'android/build/generated/source/codegen/jni/CMakeLists.txt'
    if (Test-Path $screensCodegenCMake) {
        $c = Get-Content $screensCodegenCMake -Raw
        $c = $c.Replace('CONFIGURE_DEPENDS ', '')
        if ($c -notmatch 'CMAKE_SUPPRESS_REGENERATION') {
            $c = "cmake_minimum_required(VERSION 3.13)`nset(CMAKE_SUPPRESS_REGENERATION ON)`n" + ($c -replace 'cmake_minimum_required\(VERSION [0-9.]+\)\s*', '')
        }
        Set-Content -Path $screensCodegenCMake -Value $c -NoNewline
    }
}

# 2. react-native-worklets
$workletsDir = Join-Path $Root 'node_modules/react-native-worklets'
if (Test-Path $workletsDir) {
    if (Test-Path (Join-Path $workletsDir 'Common')) {
        Copy-Item -Path (Join-Path $workletsDir 'Common') -Destination (Join-Path $workletsDir 'android/Common') -Recurse -Force
    }
    $workletsCMake = Join-Path $workletsDir 'android/CMakeLists.txt'
    if (Test-Path $workletsCMake) {
        $c = Get-Content $workletsCMake -Raw
        $c = $c.Replace('${CMAKE_SOURCE_DIR}/../Common/cpp', '${CMAKE_SOURCE_DIR}/Common/cpp')
        if ($c -notmatch 'CMAKE_SUPPRESS_REGENERATION') {
            $c = "project(Worklets)`ncmake_minimum_required(VERSION 3.16)`nset(CMAKE_SUPPRESS_REGENERATION ON)`n" + ($c -replace 'project\(Worklets\)\s*cmake_minimum_required\(VERSION [0-9.]+\)\s*', '')
        }
        $c = $c -replace 'set\(CMAKE_OBJECT_PATH_MAX [0-9]+\)\r?\n?', ''
        Set-Content -Path $workletsCMake -Value $c -NoNewline
    }
    $workletsCodegenCMake = Join-Path $workletsDir 'android/build/generated/source/codegen/jni/CMakeLists.txt'
    if (Test-Path $workletsCodegenCMake) {
        $c = Get-Content $workletsCodegenCMake -Raw
        $c = $c.Replace('CONFIGURE_DEPENDS ', '')
        if ($c -notmatch 'CMAKE_SUPPRESS_REGENERATION') {
            $c = "cmake_minimum_required(VERSION 3.13)`nset(CMAKE_SUPPRESS_REGENERATION ON)`n" + ($c -replace 'cmake_minimum_required\(VERSION [0-9.]+\)\s*', '')
        }
        Set-Content -Path $workletsCodegenCMake -Value $c -NoNewline
    }
}

# 3. react-native-reanimated
$reanimatedDir = Join-Path $Root 'node_modules/react-native-reanimated'
if (Test-Path $reanimatedDir) {
    if (Test-Path (Join-Path $reanimatedDir 'Common')) {
        Copy-Item -Path (Join-Path $reanimatedDir 'Common') -Destination (Join-Path $reanimatedDir 'android/Common') -Recurse -Force
    }
    $reanimatedCMake = Join-Path $reanimatedDir 'android/CMakeLists.txt'
    if (Test-Path $reanimatedCMake) {
        $c = Get-Content $reanimatedCMake -Raw
        $c = $c.Replace('${CMAKE_SOURCE_DIR}/../Common/cpp', '${CMAKE_SOURCE_DIR}/Common/cpp')
        $c = $c.Replace('${CMAKE_SOURCE_DIR}/../Common/NativeView', '${CMAKE_SOURCE_DIR}/Common/NativeView')
        if ($c -notmatch 'CMAKE_SUPPRESS_REGENERATION') {
            $c = "project(Reanimated)`ncmake_minimum_required(VERSION 3.16)`nset(CMAKE_SUPPRESS_REGENERATION ON)`n" + ($c -replace 'project\(Reanimated\)\s*cmake_minimum_required\(VERSION [0-9.]+\)\s*', '')
        }
        $c = $c -replace 'set\(CMAKE_OBJECT_PATH_MAX [0-9]+\)\r?\n?', ''
        Set-Content -Path $reanimatedCMake -Value $c -NoNewline
    }
    # Reanimated Common/NativeView autolinked build
    $reanimatedCodegen = Join-Path $reanimatedDir 'android/build/generated/source/codegen/jni'
    Sync-DirectoryContents $reanimatedCodegen (Join-Path $reanimatedDir 'Common/NativeView/cg')
    $reanimatedNativeViewCMake = Join-Path $reanimatedDir 'Common/NativeView/CMakeLists.txt'
    if (Test-Path $reanimatedNativeViewCMake) {
        $c = Get-Content $reanimatedNativeViewCMake -Raw
        $c = $c.Replace('${ANDROID_DIR}/build/generated/source/codegen/jni', '${CMAKE_CURRENT_SOURCE_DIR}/cg')
        if ($c -notmatch 'CMAKE_SUPPRESS_REGENERATION') {
            $c = "cmake_minimum_required(VERSION 3.13)`nset(CMAKE_SUPPRESS_REGENERATION ON)`n" + ($c -replace 'cmake_minimum_required\(VERSION [0-9.]+\)\s*', '')
        }
        $c = $c -replace 'set\(CMAKE_OBJECT_PATH_MAX [0-9]+\)\r?\n?', ''
        Set-Content -Path $reanimatedNativeViewCMake -Value $c -NoNewline
    }
}

# 4. react-native-safe-area-context
$safeAreaDir = Join-Path $Root 'node_modules/react-native-safe-area-context'
if (Test-Path $safeAreaDir) {
    if (Test-Path (Join-Path $safeAreaDir 'common/cpp')) {
        Copy-Item -Path (Join-Path $safeAreaDir 'common/cpp') -Destination (Join-Path $safeAreaDir 'android/src/main/jni/common_cpp') -Recurse -Force
    }
    $codegenSrc = Join-Path $safeAreaDir 'android/build/generated/source/codegen/jni'
    Sync-DirectoryContents $codegenSrc (Join-Path $safeAreaDir 'android/src/main/jni/cg')
    $safeAreaCMake = Join-Path $safeAreaDir 'android/src/main/jni/CMakeLists.txt'
    if (Test-Path $safeAreaCMake) {
        $c = Get-Content $safeAreaCMake -Raw
        $c = $c.Replace('${LIB_ANDROID_DIR}/../common/cpp', '${CMAKE_CURRENT_SOURCE_DIR}/common_cpp')
        $c = $c.Replace('${LIB_ANDROID_DIR}/build/generated/source/codegen/jni', '${CMAKE_CURRENT_SOURCE_DIR}/cg')
        if ($c -notmatch 'CMAKE_SUPPRESS_REGENERATION') {
            $c = "cmake_minimum_required(VERSION 3.13)`nset(CMAKE_SUPPRESS_REGENERATION ON)`n" + ($c -replace 'cmake_minimum_required\(VERSION [0-9.]+\)\s*', '')
        }
        $c = $c -replace 'set\(CMAKE_OBJECT_PATH_MAX [0-9]+\)\r?\n?', ''
        Set-Content -Path $safeAreaCMake -Value $c -NoNewline
    }
}

# 5. react-native-gesture-handler
$ghDir = Join-Path $Root 'node_modules/react-native-gesture-handler'
if (Test-Path $ghDir) {
    Sync-DirectoryContents (Join-Path $ghDir 'shared') (Join-Path $ghDir 'android/shared')
    Sync-DirectoryContents (Join-Path $ghDir 'shared/runtime') (Join-Path $ghDir 'android/src/main/jni/runtime')
    $ghCodegen = Join-Path $ghDir 'android/build/generated/source/codegen/jni'
    Sync-DirectoryContents $ghCodegen (Join-Path $ghDir 'android/cg')
    $ghCMake1 = Join-Path $ghDir 'android/CMakeLists.txt'
    if (Test-Path $ghCMake1) {
        $c = Get-Content $ghCMake1 -Raw
        $c = $c.Replace('CONFIGURE_DEPENDS ', '').Replace('../shared/shadowNodes', 'shared/shadowNodes')
        $c = $c.Replace('./build/generated/source/codegen/jni', './cg')
        if ($c -notmatch 'CMAKE_SUPPRESS_REGENERATION') {
            $c = "cmake_minimum_required(VERSION 3.13)`nset(CMAKE_SUPPRESS_REGENERATION ON)`n" + ($c -replace 'cmake_minimum_required\(VERSION [0-9.]+\)\s*', '')
        }
        $c = $c -replace 'set\(CMAKE_OBJECT_PATH_MAX [0-9]+\)\r?\n?', ''
        Set-Content -Path $ghCMake1 -Value $c -NoNewline
    }
    $ghCMake2 = Join-Path $ghDir 'android/src/main/jni/CMakeLists.txt'
    if (Test-Path $ghCMake2) {
        $c = Get-Content $ghCMake2 -Raw
        $c = $c.Replace('CONFIGURE_DEPENDS ', '')
        $c = $c.Replace('file(GLOB_RECURSE gesture_handler_SRCS ./*.cpp)', 'file(GLOB gesture_handler_SRCS ./*.cpp)')
        $c = $c.Replace('"${RNGH_DIR}/shared/runtime/*.cpp"', '"${CMAKE_CURRENT_SOURCE_DIR}/runtime/*.cpp"')
        $c = $c.Replace('"${RNGH_DIR}/shared/runtime"', '"${CMAKE_CURRENT_SOURCE_DIR}/runtime"')
        $c = $c.Replace('"${CMAKE_CURRENT_SOURCE_DIR}/shared/runtime/*.cpp"', '"${CMAKE_CURRENT_SOURCE_DIR}/runtime/*.cpp"')
        $c = $c.Replace('"${CMAKE_CURRENT_SOURCE_DIR}/shared/runtime"', '"${CMAKE_CURRENT_SOURCE_DIR}/runtime"')
        if ($c -notmatch 'CMAKE_SUPPRESS_REGENERATION') {
            $c = "project(GestureHandler)`ncmake_minimum_required(VERSION 3.9.0)`nset(CMAKE_SUPPRESS_REGENERATION ON)`n" + ($c -replace 'project\(GestureHandler\)\s*cmake_minimum_required\(VERSION [0-9.]+\)\s*', '')
        }
        $c = $c -replace 'set\(CMAKE_OBJECT_PATH_MAX [0-9]+\)\r?\n?', ''
        Set-Content -Path $ghCMake2 -Value $c -NoNewline
    }
}

# 6. @react-native-community/datetimepicker
$dtDir = Join-Path $Root 'node_modules/@react-native-community/datetimepicker'
if (Test-Path $dtDir) {
    $dtCodegenCMake = Join-Path $dtDir 'android/build/generated/source/codegen/jni/CMakeLists.txt'
    if (Test-Path $dtCodegenCMake) {
        $c = Get-Content $dtCodegenCMake -Raw
        $c = $c.Replace('CONFIGURE_DEPENDS ', '')
        if ($c -notmatch 'CMAKE_SUPPRESS_REGENERATION') {
            $c = "cmake_minimum_required(VERSION 3.13)`nset(CMAKE_SUPPRESS_REGENERATION ON)`n" + ($c -replace 'cmake_minimum_required\(VERSION [0-9.]+\)\s*', '')
        }
        Set-Content -Path $dtCodegenCMake -Value $c -NoNewline
    }
}

# 7. expo-modules-core
$emcDir = Join-Path $Root 'node_modules/expo-modules-core'
if (Test-Path $emcDir) {
    if (Test-Path (Join-Path $emcDir 'common/cpp')) {
        Copy-Item -Path (Join-Path $emcDir 'common/cpp') -Destination (Join-Path $emcDir 'android/common_cpp') -Recurse -Force
    }
    $emcVariables = Join-Path $emcDir 'android/cmake/variables.cmake'
    if (Test-Path $emcVariables) {
        $c = Get-Content $emcVariables -Raw
        $c = $c.Replace('${CMAKE_SOURCE_DIR}/../common/cpp', '${CMAKE_SOURCE_DIR}/common_cpp')
        Set-Content -Path $emcVariables -Value $c -NoNewline
    }
    $emcCMake = Join-Path $emcDir 'android/CMakeLists.txt'
    if (Test-Path $emcCMake) {
        $c = Get-Content $emcCMake -Raw
        if ($c -notmatch 'CMAKE_SUPPRESS_REGENERATION') {
            $c = "cmake_minimum_required(VERSION 3.16)`nset(CMAKE_SUPPRESS_REGENERATION ON)`n" + ($c -replace 'cmake_minimum_required\(VERSION [0-9.]+\)\s*', '')
            Set-Content -Path $emcCMake -Value $c -NoNewline
        }
    }
    $emcBuildGradle = Join-Path $emcDir 'android/build.gradle'
    if (Test-Path $emcBuildGradle) {
        $bg = Get-Content $emcBuildGradle -Raw
        if ($bg -notmatch 'stripConfigureDepends') {
            $hook = @"
def unpackExpoModulesV2Cpp = tasks.register("unpackExpoModulesV2Cpp", Sync) {
  it.from(project.provider { zipTree(configurations.expoModulesV2Cpp.singleFile) })
  it.into(expoModulesV2CppDir)
  doLast {
    fileTree(expoModulesV2CppDir).matching { include "**/*.cmake", "**/CMakeLists.txt" }.each { f ->
      f.text = f.text.replace("CONFIGURE_DEPENDS", "")
    }
  }
}
// stripConfigureDepends hook
"@
            $bg = $bg -replace 'def unpackExpoModulesV2Cpp = tasks\.register\("unpackExpoModulesV2Cpp", Sync\) \{[\s\S]*?it\.into\(expoModulesV2CppDir\)[\s\S]*?\}', $hook
            Set-Content -Path $emcBuildGradle -Value $bg -NoNewline
        }
    }
    $v2Dir = Join-Path $emcDir 'android/build/expo-modules-v2-cpp'
    if (Test-Path $v2Dir) {
        Get-ChildItem -Path $v2Dir -Include '*.cmake','CMakeLists.txt' -Recurse | ForEach-Object {
            $content = Get-Content $_.FullName -Raw
            if ($content -match 'CONFIGURE_DEPENDS') {
                $content = $content.Replace('CONFIGURE_DEPENDS', '')
                Set-Content -Path $_.FullName -Value $content -NoNewline
            }
        }
    }
}

# 8. expo-sqlite
$sqliteDir = Join-Path $Root 'node_modules/expo-sqlite'
if (Test-Path $sqliteDir) {
    $sqliteCMake = Join-Path $sqliteDir 'android/CMakeLists.txt'
    if (Test-Path $sqliteCMake) {
        $c = Get-Content $sqliteCMake -Raw
        if ($c -notmatch 'CMAKE_SUPPRESS_REGENERATION') {
            $c = "cmake_minimum_required(VERSION 3.4.1)`nset(CMAKE_SUPPRESS_REGENERATION ON)`n" + ($c -replace 'cmake_minimum_required\(VERSION [0-9.]+\)\s*', '')
            Set-Content -Path $sqliteCMake -Value $c -NoNewline
        }
    }
}

# Clean existing .cxx folders
Get-ChildItem -Path (Join-Path $Root 'node_modules') -Filter ".cxx" -Recurse -Directory -Hidden -ErrorAction SilentlyContinue | ForEach-Object { Assert-HealthMateBuildPath $_.FullName; Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }
Assert-HealthMateBuildPath "C:\HM\b\a"
Remove-Item -LiteralPath "C:\HM\b\a" -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path "C:\HM\b\a" -Force | Out-Null

Write-Host "Android CMake workarounds applied successfully."
