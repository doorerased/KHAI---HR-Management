@echo off
setlocal
set "SERVER_DIR=%~dp0"
cd /d "%SERVER_DIR%"

:loop
echo [%DATE% %TIME%] Starting server in %SERVER_DIR%... >> server_start.log
"C:\Program Files\nodejs\node.exe" --max-old-space-size=3072 server.js >> out.log 2>> err.log
echo [%DATE% %TIME%] Server stopped with exit code %ERRORLEVEL%. Restarting in 5 seconds... >> server_start.log
timeout /t 5
goto loop
