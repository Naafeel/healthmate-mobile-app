param([string]$SigningDirectory = (Join-Path $env:LOCALAPPDATA 'HealthMate\signing'))
$ErrorActionPreference = 'Stop'
$keyFile = Join-Path $SigningDirectory 'healthmate-release.p12'
$passwordFile = Join-Path $SigningDirectory 'password.dpapi'
if ((Test-Path -LiteralPath $keyFile) -or (Test-Path -LiteralPath $passwordFile)) {
    throw 'Signing material already exists. It will not be overwritten. Use the build script or restore the matching existing credentials.'
}
New-Item -ItemType Directory -Force $SigningDirectory | Out-Null
$account = [Security.Principal.WindowsIdentity]::GetCurrent().Name
& icacls.exe $SigningDirectory /inheritance:r /grant:r "${account}:(OI)(CI)F" '*S-1-5-18:(OI)(CI)F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not restrict signing-directory permissions.' }
$bytes = [Security.Cryptography.RandomNumberGenerator]::GetBytes(32)
$password = [Convert]::ToBase64String($bytes)
$env:HEALTHMATE_STORE_PASSWORD = $password
try {
    $keytool = Join-Path $env:JAVA_HOME 'bin\keytool.exe'
    & $keytool -genkeypair -storetype PKCS12 -keystore $keyFile -alias healthmate-release -keyalg RSA -keysize 3072 -sigalg SHA256withRSA -validity 10000 -dname 'CN=HealthMate Coursework Release, OU=Mobile Application Development, O=HealthMate' -storepass:env HEALTHMATE_STORE_PASSWORD -keypass:env HEALTHMATE_STORE_PASSWORD
    if ($LASTEXITCODE -ne 0) { throw 'Release key generation failed. Inspect the dedicated signing directory before retrying; no existing files are overwritten.' }
    ConvertTo-SecureString $password -AsPlainText -Force | ConvertFrom-SecureString | Set-Content -LiteralPath $passwordFile
    Write-Output 'Dedicated release key created. Password is protected with Windows DPAPI for the current Windows user. No secret is printed.'
} finally {
    Remove-Item Env:HEALTHMATE_STORE_PASSWORD -ErrorAction SilentlyContinue
    $password = $null
    [Array]::Clear($bytes,0,$bytes.Length)
}
