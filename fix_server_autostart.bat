@echo off
TITLE 원격 서버 자동 시작 설정
echo.
echo ============================================
echo  원격 서버 Node.js 자동 시작 설정
echo ============================================
echo.

echo [1/4] 원격 서버에 연결 중...
echo.

echo [2/4] 기존 KHAI_Backend 작업 삭제 중...
"C:\Program Files\PuTTY\plink.exe" -ssh -batch -hostkey SHA256:IhXOiTplxKr8Bzn6Xk722jTiROHVXPehLhsPlCd6d8k administrator@211.42.157.164 -pw "lpc1393**@KLp3" "schtasks /delete /tn KHAI_Backend /f"

echo [3/4] 서버 시작 시 자동 실행되도록 재등록 중...
"C:\Program Files\PuTTY\plink.exe" -ssh -batch -hostkey SHA256:IhXOiTplxKr8Bzn6Xk722jTiROHVXPehLhsPlCd6d8k administrator@211.42.157.164 -pw "lpc1393**@KLp3" "schtasks /create /tn KHAI_Backend /tr \"C:\inetpub\wwwroot\im\backend\start_server.bat\" /sc onstart /ru SYSTEM /rl highest /f"

echo [4/4] 지금 바로 서버 시작...
"C:\Program Files\PuTTY\plink.exe" -ssh -batch -hostkey SHA256:IhXOiTplxKr8Bzn6Xk722jTiROHVXPehLhsPlCd6d8k administrator@211.42.157.164 -pw "lpc1393**@KLp3" "schtasks /run /tn KHAI_Backend"

echo.
echo ============================================
echo  완료! 이제 서버가 재부팅되어도 자동으로 시작됩니다.
echo ============================================
echo.
pause
