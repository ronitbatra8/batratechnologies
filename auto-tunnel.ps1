param(
    [int]$Interval = 60,
    [string]$Backend = "http://localhost:5000"
)

# Single-instance guard
$LockFile = "E:\ronit\bca\e commerce\tunnel-watch.lock"
$Lock = [System.IO.File]::Open($LockFile, [System.IO.FileMode]::Create, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
Write-Host "Watcher lock acquired (single instance)"

$ErrorActionPreference = "Continue"
$LogFile = "E:\ronit\bca\e commerce\tunnel-watch.log"
$Vercel = "C:\Users\batra\AppData\Local\Temp\node-fresh\node-v22.14.0-win-x64\vercel.cmd"
$Cloudflared = "C:\Users\batra\AppData\Local\Temp\cloudflared.exe"
$ServerEnv = "E:\ronit\bca\e commerce\server\.env"
$Node = "C:\Users\batra\AppData\Local\Temp\node-fresh\node-v22.14.0-win-x64\node.exe"
$Pm2 = "C:\Users\batra\AppData\Local\Temp\node-fresh\node-v22.14.0-win-x64\node_modules\pm2\bin\pm2"
$Root = "E:\ronit\bca\e commerce"
$LastUrl = ""

function Log($Msg) { $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"; "$ts $Msg" | Out-File $LogFile -Append; Write-Host "$ts $Msg" }

function Get-Url {
    try {
        $resp = Invoke-WebRequest "http://127.0.0.1:20241/metrics" -UseBasicParsing -TimeoutSec 5
        $m = [regex]::Match($resp.Content, 'cloudflared_tunnel_user_hostnames_counts{userHostname="(https://[^"]+)"}')
        if ($m.Success) { return $m.Groups[1].Value }
    } catch {}
    return $null
}

function Ensure-Tunnel {
    $running = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
    if (-not $running) {
        Log "Starting cloudflared..."
        Start-Process -FilePath $Cloudflared -ArgumentList "tunnel", "--url", $Backend -WindowStyle Hidden -WorkingDirectory $Root | Out-Null
        Start-Sleep -Seconds 20
        Log "cloudflared started"
    }
}

function Update-ServerEnv($Url) {
    Log "Updating server .env TUNNEL_URL => $Url"
    $content = Get-Content $ServerEnv | Where-Object { $_ -notmatch '^TUNNEL_URL=' }
    $content += "TUNNEL_URL=$Url"
    $content | Set-Content $ServerEnv
    Log "Restarting backend via pm2..."
    $null = & $Node $Pm2 restart batra-backend 2>&1
    Start-Sleep -Seconds 8
}

function Update-Vercel($Url) {
    $api = "$Url/api"
    Log "Updating Vercel: NEXT_PUBLIC_API_URL = $api"
    try {
        $ErrorActionPreference = "Continue"
        $null = & $Vercel env rm NEXT_PUBLIC_API_URL production --yes 2>&1
        $null = $api | & $Vercel env add NEXT_PUBLIC_API_URL production --yes 2>&1
        Log "Vercel env updated"
    } catch { Log "WARN: Vercel env failed: $($_.Exception.Message)" }
    try {
        $null = & $Vercel deploy --prod 2>&1
        Log "Vercel redeploy triggered"
    } catch { Log "WARN: Vercel deploy failed: $($_.Exception.Message)" }
}

Log "=== Auto Tunnel Watcher Started (single instance) ==="
Log "Backend: $Backend"
Log "Interval: ${Interval}s"

while ($true) {
    Ensure-Tunnel
    $url = Get-Url
    if (-not $url) {
        Log "WARN: No tunnel URL yet"
    } elseif ($url -ne $LastUrl) {
        Log "URL changed to: $url"
        Update-ServerEnv $url
        Update-Vercel $url
        $LastUrl = $url
    } else {
        Log "OK: $url"
    }
    Start-Sleep $Interval
}
