$ErrorActionPreference = 'Stop'
foreach ($port in 80, 443) {
    $name = "ArtGallery-Web-$port"
    if (Get-NetFirewallRule -Name $name -ErrorAction SilentlyContinue) {
        Set-NetFirewallRule -Name $name -Enabled True -Action Allow
    } else {
        New-NetFirewallRule -Name $name -DisplayName "Art Gallery TCP $port" -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow
    }
}
