@echo off
cd /d C:\inetpub\wwwroot\im\backend
echo [%DATE% %TIME%] Starting server... >> out.log
"C:\Program Files\nodejs\node.exe" server.js >> out.log 2>> err.log
