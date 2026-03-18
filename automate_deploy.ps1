# Cafe24 운영 서버(im.khai.re.kr) 자동 배포 스크립트
# 사용법: .\automate_deploy.ps1

$ServerUser = "administrator"
$ServerIP = "211.42.157.164"
$Password = "lpc1393**@KLp3"
$HostKey = "SHA256:IhXOiTplxKr8Bzn6Xk722jTiROHVXPehLhsPlCd6d8k"

$RemoteWebRoot = "C:\inetpub\wwwroot\im"
$RemoteBackendRoot = "C:\inetpub\wwwroot\im\backend"

$PSCP = "C:\Program Files\PuTTY\pscp.exe"
$PLINK = "C:\Program Files\PuTTY\plink.exe"

Write-Host "🚀 배포 프로세스를 시작합니다..." -ForegroundColor Cyan

# 1. 프론트엔드 빌드
Write-Host "`n[1/4] 프론트엔드 빌드 중..." -ForegroundColor Yellow
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ 빌드 실패! 배포를 중단합니다."
    exit
}
Set-Location ..

# 2. 프론트엔드 업로드 (dist 폴더 및 web.config)
Write-Host "`n[2/4] 빌드된 파일을 서버로 전송 중..." -ForegroundColor Yellow
& $PSCP -ssh -batch -hostkey $HostKey -pw $Password -r frontend/dist/* "${ServerUser}@${ServerIP}:${RemoteWebRoot}"
& $PSCP -ssh -batch -hostkey $HostKey -pw $Password web.config "${ServerUser}@${ServerIP}:${RemoteWebRoot}\web.config"

# 3. 백엔드 파일 업로드 (수정된 로직 반영)
Write-Host "`n[3/4] 백엔드 로직 업데이트 중..." -ForegroundColor Yellow
# 안정적인 업데이트를 위해 기존 노드 프로세스 강제 종료
& $PLINK -ssh -batch -hostkey $HostKey -pw $Password "${ServerUser}@${ServerIP}" "taskkill /F /IM node.exe /T 2>nul"
& $PSCP -ssh -batch -hostkey $HostKey -pw $Password backend/routes/extractor_final.js "${ServerUser}@${ServerIP}:${RemoteBackendRoot}\routes\extractor_final.js"
& $PSCP -ssh -batch -hostkey $HostKey -pw $Password backend/server.js "${ServerUser}@${ServerIP}:${RemoteBackendRoot}\server.js"
& $PSCP -ssh -batch -hostkey $HostKey -pw $Password backend/start_server.bat "${ServerUser}@${ServerIP}:${RemoteBackendRoot}\start_server.bat"
& $PSCP -ssh -batch -hostkey $HostKey -pw $Password backend/launcher.bat "${ServerUser}@${ServerIP}:${RemoteBackendRoot}\launcher.bat"

# 4. 서버 프로세스 재시작 (작업 스케줄러를 이용한 백그라운드 영구 상주)
Write-Host "[4/4] 서버 프로세스를 작업 스케줄러를 통해 재시작합니다..." -ForegroundColor Yellow
& $PLINK -ssh -batch -hostkey $HostKey -pw $Password "${ServerUser}@${ServerIP}" "cd /d ${RemoteBackendRoot} && launcher.bat"

Write-Host "`n✨ 모든 작업이 완료되었습니다! https://im.khai.re.kr 에서 확인하세요." -ForegroundColor Green
