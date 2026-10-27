$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $projectRoot
$toolsRoot = Join-Path $projectRoot '.android-tools'
$jdk = Get-ChildItem (Join-Path $toolsRoot 'java') -Directory | Select-Object -First 1
if (!$jdk) { throw 'JDK local não encontrado em .android-tools/java.' }
$env:JAVA_HOME = $jdk.FullName
$env:ANDROID_HOME = Join-Path $toolsRoot 'sdk'
$env:GRADLE_USER_HOME = Join-Path $toolsRoot 'gradle-cache'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
# Use a full path: Windows AF_UNIX fails with this machine's 8.3 TEMP alias.
$socketTemp = Join-Path $toolsRoot 'tmp'
New-Item -ItemType Directory -Force $socketTemp | Out-Null
$env:JAVA_TOOL_OPTIONS = "$env:JAVA_TOOL_OPTIONS -Djdk.net.unixdomain.tmpdir=$socketTemp"
$sdkPath = $env:ANDROID_HOME.Replace('\', '/')
Set-Content -LiteralPath 'android/local.properties' -Value "sdk.dir=$sdkPath" -Encoding ascii

$signingRoot = Join-Path $projectRoot '.android-signing'
New-Item -ItemType Directory -Force $signingRoot | Out-Null
$keyPath = Join-Path $signingRoot 'cine-release.jks'
$propsPath = Join-Path $signingRoot 'release.properties'
if (!(Test-Path -LiteralPath $keyPath)) {
    if (Test-Path -LiteralPath $propsPath) { throw 'Propriedades de assinatura existentes sem chave. Restaure a chave antes de continuar.' }
    $random = New-Object byte[] 32
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($random)
    $rng.Dispose()
    $env:CINE_SIGNING_PASSWORD = [Convert]::ToBase64String($random)
    try {
        & "$env:JAVA_HOME/bin/keytool.exe" -genkeypair -keystore $keyPath -storetype JKS -alias cine -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=Cine,OU=Aplicativo local,O=Cine,C=BR' -storepass:env CINE_SIGNING_PASSWORD -keypass:env CINE_SIGNING_PASSWORD
        if ($LASTEXITCODE -ne 0) { throw 'Não foi possível gerar a chave de assinatura.' }
        "storePassword=$env:CINE_SIGNING_PASSWORD`nkeyPassword=$env:CINE_SIGNING_PASSWORD" | Set-Content -LiteralPath $propsPath -Encoding ascii
    } finally {
        Remove-Item Env:CINE_SIGNING_PASSWORD -ErrorAction SilentlyContinue
    }
}
if (!(Test-Path -LiteralPath $propsPath)) { throw 'Propriedades da assinatura não encontradas. Restaure .android-signing.' }

& npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar o aplicativo web.' }
& npx.cmd cap sync android
if ($LASTEXITCODE -ne 0) { throw 'Falha ao sincronizar o projeto Android.' }
Push-Location android
try {
    & .\gradlew.bat --no-daemon assembleRelease --console=plain
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar o APK.' }
} finally { Pop-Location }

$apk = Join-Path $projectRoot 'android/app/build/outputs/apk/release/app-release.apk'
$buildTools = Get-ChildItem (Join-Path $env:ANDROID_HOME 'build-tools') -Directory | Sort-Object Name -Descending | Select-Object -First 1
& (Join-Path $buildTools.FullName 'apksigner.bat') verify --verbose $apk
if ($LASTEXITCODE -ne 0) { throw 'A assinatura do APK não passou na verificação.' }
New-Item -ItemType Directory -Force downloads | Out-Null
$version = (Get-Content package.json -Raw | ConvertFrom-Json).version
$apkName = "Cine-$version.apk"
Copy-Item -LiteralPath $apk -Destination (Join-Path 'downloads' $apkName) -Force
$hash = (Get-FileHash (Join-Path 'downloads' $apkName) -Algorithm SHA256).Hash.ToLower()
"$hash  $apkName" | Set-Content "downloads/Cine-$version.sha256.txt" -Encoding ascii
Write-Output "APK assinado e verificado: downloads/$apkName"
