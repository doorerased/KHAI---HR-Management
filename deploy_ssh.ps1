# Cafe24 서버 자동 배포 스크립트
# SSH를 통해 서버에 접속하고 명령어를 실행합니다.

param(
    [string]$Command = "whoami"
)

$server = "administrator@211.42.157.164"

# SSH 명령어 실행 (비밀번호 프롬프트가 나타나면 수동 입력 필요)
ssh -o StrictHostKeyChecking=no $server $Command
