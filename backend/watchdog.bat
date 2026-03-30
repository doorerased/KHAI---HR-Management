@echo off
tasklist /fi "imagename eq node.exe" 2>nul | find /i "node.exe" >nul
if errorlevel 1 (
  echo [%DATE% %TIME%] Node.js not found. Restarting... >> C:\inetpub\wwwroot\im\backend\watchdog.log
  schtasks /run /tn KHAI_Backend
)
