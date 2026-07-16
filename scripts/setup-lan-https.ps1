param(
  [Parameter(Mandatory = $true)]
  [string]$LanIp,
  [string]$CertificatePassword = "voicemeet-lan-dev"
)

$ErrorActionPreference = "Stop"

$parsedIp = $null
if (-not [System.Net.IPAddress]::TryParse($LanIp, [ref]$parsedIp)) {
  throw "LanIp must be a valid IPv4 or IPv6 address."
}

$opensslCommand = Get-Command openssl -ErrorAction SilentlyContinue
$opensslCandidates = @(
  if ($opensslCommand) { $opensslCommand.Source }
  "C:\Program Files\Git\usr\bin\openssl.exe"
  "C:\Program Files\Git\mingw64\bin\openssl.exe"
)
$openssl = $opensslCandidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $openssl) {
  throw "OpenSSL was not found. Install Git for Windows or OpenSSL, then run this script again."
}

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$certificateDirectory = Join-Path $workspaceRoot "certificates"
$rootKeyPath = Join-Path $certificateDirectory "voicemeet-lan-root-ca.key"
$rootCertificatePath = Join-Path $certificateDirectory "voicemeet-lan-root-ca.crt"
$serverKeyPath = Join-Path $certificateDirectory "voicemeet-lan-dev.key"
$serverRequestPath = Join-Path $certificateDirectory "voicemeet-lan-dev.csr"
$serverCertificatePath = Join-Path $certificateDirectory "voicemeet-lan-dev.crt"
$serverExtensionsPath = Join-Path $certificateDirectory "voicemeet-lan-dev.ext"
$pfxPath = Join-Path $certificateDirectory "voicemeet-lan-dev.pfx"

New-Item -ItemType Directory -Path $certificateDirectory -Force | Out-Null

function Invoke-OpenSsl {
  & $openssl @args
  if ($LASTEXITCODE -ne 0) {
    throw "OpenSSL failed with exit code $LASTEXITCODE."
  }
}

if (-not (Test-Path $rootKeyPath) -or -not (Test-Path $rootCertificatePath)) {
  Invoke-OpenSsl genrsa -out $rootKeyPath 3072
  Invoke-OpenSsl req -x509 -new -key $rootKeyPath -sha256 -days 1825 `
    -out $rootCertificatePath `
    -subj "/CN=VoiceMeet LAN Development Root CA" `
    -addext "basicConstraints=critical,CA:TRUE,pathlen:0" `
    -addext "keyUsage=critical,keyCertSign,cRLSign" `
    -addext "subjectKeyIdentifier=hash"
}

$computerName = $env:COMPUTERNAME
@"
authorityKeyIdentifier=keyid,issuer
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=DNS:localhost,DNS:$computerName,IP:$LanIp
"@ | Set-Content -Path $serverExtensionsPath -Encoding ascii

Invoke-OpenSsl genrsa -out $serverKeyPath 2048
Invoke-OpenSsl req -new -key $serverKeyPath -out $serverRequestPath -subj "/CN=$LanIp"
Invoke-OpenSsl x509 -req -in $serverRequestPath `
  -CA $rootCertificatePath `
  -CAkey $rootKeyPath `
  -CAcreateserial `
  -out $serverCertificatePath `
  -days 825 `
  -sha256 `
  -extfile $serverExtensionsPath
Invoke-OpenSsl pkcs12 -export `
  -out $pfxPath `
  -inkey $serverKeyPath `
  -in $serverCertificatePath `
  -certfile $rootCertificatePath `
  -name "VoiceMeet LAN HTTPS" `
  -passout "pass:$CertificatePassword"

Write-Host "LAN HTTPS certificate created for $LanIp."
Write-Host "Install this public CA as a trusted root on this PC and every test device:"
Write-Host $rootCertificatePath
Write-Host "Keep these private files only on the development PC:"
Write-Host $rootKeyPath
Write-Host $pfxPath
Write-Host "After trusting the public CA, start VoiceMeet with: pnpm dev:lan"
Write-Host "Open: https://${LanIp}:5173"
