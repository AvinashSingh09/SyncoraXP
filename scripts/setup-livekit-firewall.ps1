$ErrorActionPreference = "Stop"

$localAddress = "192.168.0.195"
$remoteSubnet = "192.168.0.0/24"
$tcpRuleName = "VoiceMeet LiveKit LAN TCP"
$udpRuleName = "VoiceMeet LiveKit LAN UDP"

if (-not (Get-NetFirewallRule -DisplayName $tcpRuleName -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule `
    -DisplayName $tcpRuleName `
    -Description "VoiceMeet LiveKit signaling and ICE/TCP from the local LAN only" `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 7880, 7881 `
    -LocalAddress $localAddress `
    -RemoteAddress $remoteSubnet `
    -Profile Any | Out-Null
}

if (-not (Get-NetFirewallRule -DisplayName $udpRuleName -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule `
    -DisplayName $udpRuleName `
    -Description "VoiceMeet LiveKit WebRTC media from the local LAN only" `
    -Direction Inbound `
    -Action Allow `
    -Protocol UDP `
    -LocalPort 7882 `
    -LocalAddress $localAddress `
    -RemoteAddress $remoteSubnet `
    -Profile Any | Out-Null
}

Write-Host "VoiceMeet LiveKit firewall rules are configured."
