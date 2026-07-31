param([switch]$NoGit)

$ErrorActionPreference = "Continue"
$Root = "E:\ronit\bca\e commerce"
$ServerEnv = "$Root\server\.env"
$LogFile = "$Root\startup.log"
$Node = "C:\Users\batra\AppData\Local\Temp\node-fresh\node-v22.14.0-win-x64\node.exe"
$Npm = "C:\Users\batra\AppData\Local\Temp\node-fresh\node-v22.14.0-win-x64\npm.cmd"
$Pm2 = "C:\Users\batra\AppData\Local\Temp\node-fresh\node-v22.14.0-win-x64\node_modules\pm2\bin\pm2"
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

function Set-VercelApiUrl($ApiUrl) {
    try {
        $ErrorActionPreference = "Continue"
        $null = & $Vercel env rm NEXT_PUBLIC_API_URL production --yes 2>&1
        $null = $ApiUrl | & $Vercel env add NEXT_PUBLIC_API_URL production --yes 2>&1
        Log "Vercel env set to $ApiUrl"
    } catch { Log "WARN: Vercel env update failed: $($_.Exception.Message)" }
}

Log "========== STARTING EVERYTHING (pm2 + cloudflare) =========="

# 1. Kill old processes (including any stray watchers)
Log "Killing old processes..."
Get-Process -Name "cloudflared","ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
$oldPm2 = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match "index\.js" }
foreach ($p in $oldPm2) { taskkill /F /PID $p.ProcessId 2>$null | Out-Null }
Start-Sleep -Seconds 2

# 2. Git push (auto-deploys frontend to Vercel)
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

# 3. Start backend with pm2 (auto-restart, never dies)
Log "Starting backend with pm2..."
& $Npm install pm2 -g 2>&1 | Out-Null
$null = & $Node $Pm2 delete batra-backend 2>&1
$null = & $Node $Pm2 start "$Root\ecosystem.config.js" 2>&1
$null = & $Node $Pm2 save 2>&1
Start-Sleep -Seconds 3
Log "Backend started with pm2 (auto-restart enabled)"

# 4. Start Cloudflare quick tunnel
Log "Starting Cloudflare tunnel..."
Start-Process -FilePath $Cloudflared -ArgumentList "tunnel", "--url", "http://localhost:5000" -WorkingDirectory $Root -WindowStyle Hidden | Out-Null

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
$api = "$url/api"

# 6. Update server .env with new URL
Log "Updating server .env..."
$content = Get-Content $ServerEnv | Where-Object { $_ -notmatch '^TUNNEL_URL=' }
$content += "TUNNEL_URL=$url"
$content | Set-Content $ServerEnv
Log "Server .env updated"

# 7. Restart backend so it picks up the URL
Log "Restarting backend..."
$null = & $Node $Pm2 restart batra-backend 2>&1
Start-Sleep -Seconds 3
Log "Backend restarted"

# 8. Update Vercel env + redeploy frontend
Log "Updating Vercel env + redeploying..."
Set-VercelApiUrl $api
Start-Sleep -Seconds 2
try {
    $null = & $Vercel deploy --prod 2>&1
    Log "Vercel redeploy triggered"
} catch { Log "WARN: redeploy failed: $($_.Exception.Message)" }

# 9. Verify API responds through tunnel
$ok = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 2
    try {
        $r = Invoke-WebRequest "$api/health" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) { $ok = $true; break }
    } catch {}
}
if ($ok) { Log "API responding: $api" }
else { Log "WARN: API not responding yet" }

# 10. Start auto-tunnel watcher (single instance) to keep tunnel alive + auto-fix frontend
Log "Starting auto-tunnel watcher..."
try {
    Start-Process -WorkingDirectory $Root -FilePath "powershell.exe" -ArgumentList "-NoProfile", "-File", "$Root\auto-tunnel.ps1" -WindowStyle Hidden | Out-Null
    Log "Auto-tunnel watcher started"
} catch { Log "WARN: watcher start failed: $($_.Exception.Message)" }

Log "========== ALL DONE =========="
Write-Host ""
Write-Host "Site: https://batratechnologies.vercel.app"
Write-Host "Tunnel: $url"
Write-Host "API: $api"
Write-Host ""
Read-Host "Press Enter to exit"
