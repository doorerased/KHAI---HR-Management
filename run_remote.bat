@echo off
REM Cafe24 서버 원격 명령 실행 스크립트
REM 사용법: run_remote.bat "명령어"
"C:\Program Files\PuTTY\plink.exe" -ssh -batch -hostkey "SHA256:IhXOiTplxKr8Bzn6Xk722jTiROHVXPehLhsPlCd6d8k" administrator@211.42.157.164 -pw "lpc1393**@KLp3" %*
