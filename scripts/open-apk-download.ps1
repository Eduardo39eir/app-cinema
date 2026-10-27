$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$route = Get-NetRoute -DestinationPrefix '0.0.0.0/0' -AddressFamily IPv4 | Sort-Object RouteMetric | Select-Object -First 1
$ip = Get-NetIPAddress -InterfaceIndex $route.InterfaceIndex -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1 -ExpandProperty IPAddress
if (!$ip) { throw 'Não foi encontrado um endereço de rede local.' }
$url = "http://${ip}:8787"
$listener = Get-NetTCPConnection -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue
if (!$listener) {
    $nodePath = (Get-Command node.exe).Source
    Start-Process -FilePath $nodePath -ArgumentList @('scripts/serve-apk.mjs', $ip) -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectRoot 'apk-download.log') -RedirectStandardError (Join-Path $projectRoot 'apk-download-error.log') | Out-Null
    Start-Sleep -Seconds 2
}
Start-Process $url
Write-Output "Baixar no celular: $url"
