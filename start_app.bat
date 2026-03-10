@echo off
TITLE 평가 위원 관리 시스템 실행기
SETLOCAL

echo [1/3] 백엔드 서버를 시작합니다...
start "Backend Server" cmd /k "cd backend && node server.js"

echo [2/3] 프론트엔드 개발 서버를 시작합니다...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo [3/3] 브라우저를 엽니다...
timeout /t 5 /nobreak > nul
start http://localhost:5173/

echo.
echo 모든 서버가 실행되었습니다! 
echo 실행된 검은색 창(터미널)을 끄면 프로그램이 종료됩니다.
echo.
pause
