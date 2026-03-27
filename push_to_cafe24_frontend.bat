@echo off
echo Building React Frontend...
cd "c:\Users\immju\OneDrive\바탕 화면\평가 위원 관리 자동화\frontend"
call npm run build

echo Uploading to Cafe24...
"C:\Program Files\PuTTY\pscp.exe" -hostkey "SHA256:IhXOiTplxKr8Bzn6Xk722jTiROHVXPehLhsPlCd6d8k" -batch -pw "lpc1393**@KLp3" "c:\Users\immju\OneDrive\바탕 화면\평가 위원 관리 자동화\frontend\dist\index.html" administrator@211.42.157.164:"/inetpub/wwwroot/im/"
"C:\Program Files\PuTTY\pscp.exe" -hostkey "SHA256:IhXOiTplxKr8Bzn6Xk722jTiROHVXPehLhsPlCd6d8k" -batch -pw "lpc1393**@KLp3" "c:\Users\immju\OneDrive\바탕 화면\평가 위원 관리 자동화\frontend\dist\vite.svg" administrator@211.42.157.164:"/inetpub/wwwroot/im/"
"C:\Program Files\PuTTY\pscp.exe" -hostkey "SHA256:IhXOiTplxKr8Bzn6Xk722jTiROHVXPehLhsPlCd6d8k" -r -batch -pw "lpc1393**@KLp3" "c:\Users\immju\OneDrive\바탕 화면\평가 위원 관리 자동화\frontend\dist\assets" administrator@211.42.157.164:"/inetpub/wwwroot/im/"

echo Upload Complete!
