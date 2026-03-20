@echo off
cd /d C:\inetpub\wwwroot\im\backend
echo [%DATE% %TIME%] Starting server... >> out.log
"C:\Program Files\nodejs\node.exe" --max-old-space-size=4096 server.js >> out.log 2>> err.log
