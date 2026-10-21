param(
    [string]$JavaHome = $(if ($env:HEALTHMATE_JAVA_HOME) { $env:HEALTHMATE_JAVA_HOME } else { $env:JAVA_HOME }),
    [string]$AndroidHome = $(if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA 'Android\Sdk' }),
    [string]$SigningDirectory = (Join-Path $env:LOCALAPPDATA 'HealthMate\signing'),
    [string]$Architectures = 'arm64-v8a,x86_64'
)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
if (!(Test-Path -LiteralPath (Join-Path $JavaHome 'bin\java.exe'))) { throw 'Select a compatible JDK with -JavaHome or HEALTHMATE_JAVA_HOME.' }
if (!(Test-Path -LiteralPath $AndroidHome)) { throw 'Android SDK missing. Select -AndroidHome.' }
$keyFile = Join-Path $SigningDirectory 'healthmate-release.p12'
$passwordFile = Join-Path $SigningDirectory 'password.dpapi'
if (!(Test-Path -LiteralPath $keyFile) -or !(Test-Path -LiteralPath $passwordFile)) { throw 'Run scripts/Initialize-ReleaseSigning.ps1 once, or restore the matching signing material.' }
$names = @('JAVA_HOME','ANDROID_HOME','NODE_ENV','HEALTHMATE_KEYSTORE','HEALTHMATE_STORE_PASSWORD','HEALTHMATE_KEY_PASSWORD','HEALTHMATE_KEY_ALIAS')
$previous = @{}
foreach ($name in $names) { $previous[$name] = [Environment]::GetEnvironmentVariable($name,'Process') }
try {
    $env:JAVA_HOME = $JavaHome
    $env:ANDROID_HOME = $AndroidHome
    $env:NODE_ENV = 'production'
    $env:HEALTHMATE_KEYSTORE = $keyFile
    $secure = (Get-Content -Raw -LiteralPath $passwordFile).Trim() | ConvertTo-SecureString
    $env:HEALTHMATE_STORE_PASSWORD = [Net.NetworkCredential]::new('', $secure).Password
    $env:HEALTHMATE_KEY_PASSWORD = $env:HEALTHMATE_STORE_PASSWORD
    $env:HEALTHMATE_KEY_ALIAS = 'healthmate-release'
    Push-Location $root
    try {
        & npx.cmd expo prebuild --platform android --no-install --no-clean
        if ($LASTEXITCODE -ne 0) { throw 'Android prebuild failed.' }
        & (Join-Path $PSScriptRoot 'Apply-AndroidCMakeWorkaround.ps1') -Root $root
        Push-Location (Join-Path $root 'android')
        try {
            & .\gradlew.bat --version
            if ($LASTEXITCODE -ne 0) { throw 'Gradle/JDK verification failed.' }
            & .\gradlew.bat :app:assembleRelease "-PreactNativeArchitectures=$Architectures" --max-workers=2 --no-daemon --console=plain
            if ($LASTEXITCODE -ne 0) { throw 'Release build failed. No valid release artifact is claimed.' }
        } finally { Pop-Location }
    } finally { Pop-Location }
} finally {
    foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name,$previous[$name],'Process') }
}
