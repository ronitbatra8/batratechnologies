param(
    [int]$Interval = 60,
    [string]$Backend = "http://localhost:5000"
)

$LogFile = "E:\ronit\bca\e commerce\tunnel-watch.log"
$Vercel = "C:\Users\batra\AppData\Local\Temp\node-fresh\node-v22.14.0-win-x64\vercel.cmd"
$Cloudflared = "C:\Users\batra\AppData\Local\Temp\cloudflared.exe"
$ServerEnv = "E:\ronit\bca\e commerce\server\.env"
$NodeExe = "C:\Users\batra\AppData\Local\Temp\node-fresh\node-v22.14.0-win-x64\node.exe"
$ServerEntry = "E:\ronit\bca\e commerce\server\src\index.js"
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
        $p = Start-Process -PassThru -FilePath $Cloudflared -ArgumentList "tunnel", "--url", $Backend -WindowStyle Hidden -WorkingDirectory "E:\ronit\bca\e commerce"
        Log "cloudflared PID: $($p.Id)"
        Start-Sleep -Seconds 20
    }
}

function Update-ServerEnv($Url) {
    Log "Updating server .env TUNNEL_URL => $Url"
    $content = Get-Content $ServerEnv | Where-Object { $_ -notmatch '^TUNNEL_URL=' }
    $content += "TUNNEL_URL=$Url"
    $content | Set-Content $ServerEnv

    Log "Restarting backend server..."
    $nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne $pid }
    foreach ($p in $nodeProcs) {
        try { Stop-Process -Id $p.Id -Force } catch {}
    }
    Start-Sleep -Seconds 3
    $np = Start-Process -PassThru -FilePath $NodeExe -ArgumentList "`"$ServerEntry`"" -WindowStyle Hidden -WorkingDirectory "E:\ronit\bca\e commerce\server"
    Log "Backend restarted (PID: $($np.Id))"
    Start-Sleep -Seconds 8
}

function Update-Vercel($Url) {
    $api = "$Url/api"
    Log "Updating Vercel: NEXT_PUBLIC_API_URL = $api"
    & $Vercel env rm NEXT_PUBLIC_API_URL production --yes 2>&1 | Out-Null
    $api | & $Vercel env add NEXT_PUBLIC_API_URL production --yes 2>&1 | Out-Null
    Log "Triggering redeploy..."
    & $Vercel deploy --prod 2>&1 | Out-Null
    Log "Redeploy triggered"
}

Log "=== Auto Tunnel Watcher Started ==="
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
