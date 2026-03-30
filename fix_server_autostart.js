const { execSync } = require('child_process');

function runPlink(cmd) {
  const plinkCmd = `"C:\\Program Files\\PuTTY\\plink.exe" -ssh -batch -hostkey "SHA256:IhXOiTplxKr8Bzn6Xk722jTiROHVXPehLhsPlCd6d8k" administrator@211.42.157.164 -pw "lpc1393**@KLp3" "${cmd}"`;
  try {
    execSync(plinkCmd, { stdio: 'inherit' });
  } catch (e) {
    console.log('(Warning: command returned non-zero, continuing...)');
  }
}

console.log('[1/4] 기존 KHAI_Backend 작업 삭제...');
runPlink('schtasks /delete /tn KHAI_Backend /f');

console.log('[2/4] 서버 시작 시 자동 실행되도록 재등록...');
runPlink('schtasks /create /tn KHAI_Backend /tr C:\\\\inetpub\\\\wwwroot\\\\im\\\\backend\\\\start_server.bat /sc onstart /ru SYSTEM /rl highest /f');

console.log('[3/4] Node.js 프로세스 확인...');
runPlink('tasklist /fi "imagename eq node.exe"');

console.log('[4/4] 지금 바로 서버 시작...');
runPlink('schtasks /run /tn KHAI_Backend');

console.log('\\n완료! 이제 서버가 재부팅되어도 자동으로 Node.js가 실행됩니다.');
