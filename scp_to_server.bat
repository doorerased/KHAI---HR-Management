@echo off
"C:\Program Files\PuTTY\pscp.exe" -batch -pw "lpc1393**@KLp3" "c:\Users\immju\OneDrive\바탕 화면\평가 위원 관리 자동화\backend\routes\extractor_final.js" administrator@211.42.157.164:"/inetpub/wwwroot/im/backend/routes/"
"C:\Program Files\PuTTY\pscp.exe" -batch -pw "lpc1393**@KLp3" "c:\Users\immju\OneDrive\바탕 화면\평가 위원 관리 자동화\backend\server.js" administrator@211.42.157.164:"/inetpub/wwwroot/im/backend/"
"C:\Program Files\PuTTY\plink.exe" -ssh -batch -hostkey "SHA256:IhXOiTplxKr8Bzn6Xk722jTiROHVXPehLhsPlCd6d8k" administrator@211.42.157.164 -pw "lpc1393**@KLp3" "taskkill /f /im node.exe && schtasks /run /tn KHAI_Backend"
