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
& $PSCP -ssh -batch -hostkey $HostKey -pw $Password backend/routes/extractor.js "${ServerUser}@${ServerIP}:${RemoteBackendRoot}\routes\extractor.js"
& $PSCP -ssh -batch -hostkey $HostKey -pw $Password backend/server.js "${ServerUser}@${ServerIP}:${RemoteBackendRoot}\server.js"

# 4. 서버 프로세스 재시작 (PM2 이용)
Write-Host "`n[4/4] 서버 프로세스를 재시작합니다..." -ForegroundColor Yellow
$RestartCmd = "cd /d ${RemoteBackendRoot} && pm2 restart all || pm2 start server.js --name khai-backend"
& $PLINK -ssh -batch -hostkey $HostKey -pw $Password "${ServerUser}@${ServerIP}" $RestartCmd

Write-Host "`n✨ 모든 작업이 완료되었습니다! https://im.khai.re.kr 에서 확인하세요." -ForegroundColor Green
