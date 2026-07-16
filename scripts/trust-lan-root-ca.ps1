$ErrorActionPreference = "Stop"

$certificatePath = Join-Path (Split-Path -Parent $PSScriptRoot) "certificates\voicemeet-lan-root-ca.crt"
$expectedThumbprint = "73A8557D3B92F4D876A91C05B84E47A6205D3797"
$certificate = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($certificatePath)

if ($certificate.Thumbprint -ne $expectedThumbprint) {
  throw "VoiceMeet root CA thumbprint mismatch. Refusing to trust the certificate."
}

Import-Certificate -FilePath $certificatePath -CertStoreLocation "Cert:\CurrentUser\Root" | Out-Null
$trusted = Get-ChildItem "Cert:\CurrentUser\Root\$expectedThumbprint" -ErrorAction Stop
Write-Host "Trusted $($trusted.Subject) for the current Windows user."
Write-Host "Thumbprint: $($trusted.Thumbprint)"
