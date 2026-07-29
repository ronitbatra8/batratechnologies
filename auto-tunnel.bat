@echo off
title Batra - Auto Tunnel Watcher
set PATH=%PATH%;C:\Users\batra\AppData\Local\Temp\node-fresh\node-v22.14.0-win-x64
echo ============================================
echo   BATRA TECHNOLOGIES - Auto Tunnel Watcher
echo ============================================
echo.
echo  This script:
echo   1. Keeps Cloudflare Tunnel running
echo   2. Detects when the tunnel URL changes
echo   3. Auto-updates Vercel env variable
echo   4. Triggers Vercel redeploy
echo.
echo  Log: tunnel-watch.log
echo ============================================
echo.
PowerShell -NoLogo -ExecutionPolicy Bypass -File "%~dp0auto-tunnel.ps1"
pause
