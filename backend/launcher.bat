@echo off
rem Remove existing task if any
schtasks /delete /tn "KHAI_Backend" /f 2>nul
rem Create a new task that runs our start_server.bat
rem Use a dummy time that won't trigger automatically but allows manual run
schtasks /create /tn "KHAI_Backend" /tr "C:\inetpub\wwwroot\im\backend\start_server.bat" /sc once /st 00:00 /rl highest /f
rem Start it immediately
schtasks /run /tn "KHAI_Backend"
echo Task registered and started.
