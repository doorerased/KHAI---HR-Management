@echo off
rem Remove existing task if any
schtasks /delete /tn "KHAI_Backend" /f 2>nul
rem Create a new task that runs our start_server.bat
rem 서버 시작 시 자동으로 백엔드를 실행
schtasks /create /tn "KHAI_Backend" /tr "C:\inetpub\wwwroot\im\backend\start_server.bat" /sc onstart /ru SYSTEM /rl highest /f
rem Start it immediately
schtasks /run /tn "KHAI_Backend"
echo Task registered and started.
