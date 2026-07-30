param([switch]$NoGit)

$ErrorActionPreference = "Stop"
$Root = "E:\ronit\bca\e commerce"
$ServerEnv = "$Root\server\.env"
$LogFile = "$Root\startup.log"
$Node = "C:\Users\batra\AppData\Local\Temp\node\node-v22.14.0-win-x64\node.exe"
$NodeFresh = "C:\Users\batra\AppData\Local\Temp\node-fresh\node-v22.14.0-win-x64\node.exe"
$Cloudflared = "C:\Users\batra\AppData\Local\Temp\cloudflared.exe"
$Vercel = "C:\Users\batra\AppData\Local\Temp\node-fresh\node-v22.14.0-win-x64\vercel.cmd"
$Git = "C:\Program Files\Git\bin\git.exe"

function Log($Msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts $Msg" | Out-File $LogFile -Append
    Write-Host "$ts $Msg"
}

function Get-TunnelUrl {
    try {
        $resp = Invoke-WebRequest "http://127.0.0.1:20241/metrics" -UseBasicParsing -TimeoutSec 5
        $m = [regex]::Match($resp.Content, 'cloudflared_tunnel_user_hostnames_counts{userHostname="(https://[^"]+)"}')
        if ($m.Success) { return $m.Groups[1].Value }
    } catch {}
    return $null
}

Log "========== STARTING EVERYTHING =========="

# 1. Kill old processes
Log "Killing old processes..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 2. Git push
if (-not $NoGit) {
    Log "Pushing to Git..."
    try {
        Push-Location $Root
        & $Git add -A
        & $Git commit -m "auto: update $(Get-Date -Format 'yyyy-MM-dd HH:mm')" --allow-empty
        & $Git push
        Pop-Location
        Log "Git push done"
    } catch { Log "WARN: Git push failed: $_" }
}

# 3. Start backend
Log "Starting backend server..."
$np = Start-Process -PassThru -FilePath $Node -ArgumentList "src/index.js" -WorkingDirectory "$Root\server"
Start-Sleep -Seconds 3
if (-not $np.HasExited) { Log "Backend running (PID: $($np.Id))" }
else { Log "ERROR: Backend failed to start"; exit 1 }

# 4. Start Cloudflare tunnel
Log "Starting Cloudflare tunnel..."
$cfp = Start-Process -PassThru -FilePath $Cloudflared -ArgumentList "tunnel", "--url", "http://localhost:5000" -WorkingDirectory $Root -WindowStyle Hidden
Start-Sleep -Seconds 8
$cf = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if ($cf) { Log "cloudflared running (PID: $($cf[0].Id))" }
else { Log "ERROR: cloudflared failed to start"; exit 1 }

# 5. Wait for tunnel URL
Log "Waiting for tunnel URL..."
$url = $null
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    $url = Get-TunnelUrl
    if ($url) { break }
}
if (-not $url) { Log "ERROR: No tunnel URL after 60s"; exit 1 }
Log "Tunnel URL: $url"

# 6. Update server .env
Log "Updating server .env..."
$content = Get-Content $ServerEnv | Where-Object { $_ -notmatch '^TUNNEL_URL=' }
$content += "TUNNEL_URL=$url"
$content | Set-Content $ServerEnv
Log "Server .env updated"

# 7. Restart backend to pick up new env
Log "Restarting backend with new TUNNEL_URL..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
$np = Start-Process -PassThru -FilePath $Node -ArgumentList "src/index.js" -WorkingDirectory "$Root\server"
Start-Sleep -Seconds 3
Log "Backend restarted (PID: $($np.Id))"

# 8. Update Vercel env
Log "Updating Vercel env..."
$api = "$url/api"
& $Vercel env rm NEXT_PUBLIC_API_URL production --yes 2>&1 | Out-Null
$api | & $Vercel env add NEXT_PUBLIC_API_URL production --yes 2>&1 | Out-Null
Log "Vercel env updated: $api"

# 9. Redeploy to Vercel
Log "Redeploying to Vercel..."
& $Vercel deploy --prod 2>&1 | Out-Null
Log "Vercel redeploy triggered"

# 10. Start auto-tunnel watcher in background
Log "Starting auto-tunnel watcher..."
Start-Process -WorkingDirectory $Root -FilePath "powershell.exe" -ArgumentList "-NoExit", "-File", "auto-tunnel.ps1" -WindowStyle Hidden
Log "Auto-tunnel watcher started"

Log "========== ALL DONE =========="
Log "URL: $url"
Write-Host ""
Write-Host "Site: https://batratechnologies.vercel.app"
Write-Host "Tunnel: $url"
Write-Host "API: $api"
Write-Host ""
Read-Host "Press Enter to exit"
