@echo off
title Batra - Tunnel Watcher
set PATH=%PATH%;C:\Users\batra\AppData\Local\Temp\node-fresh\node-v22.14.0-win-x64
PowerShell -NoLogo -ExecutionPolicy Bypass -File "%~dp0auto-tunnel.ps1"
