@echo off
"C:\Program Files\PuTTY\plink.exe" -ssh -batch -hostkey "SHA256:IhXOiTplxKr8Bzn6Xk722jTiROHVXPehLhsPlCd6d8k" administrator@211.42.157.164 -pw "lpc1393**@KLp3" "cd C:\inetpub\wwwroot\im && git pull origin main && taskkill /f /im node.exe && schtasks /run /tn KHAI_Backend"
