const { execSync } = require('child_process');
const plinkCmd = `"C:\\Program Files\\PuTTY\\plink.exe" -ssh -batch -hostkey "SHA256:IhXOiTplxKr8Bzn6Xk722jTiROHVXPehLhsPlCd6d8k" administrator@211.42.157.164 -pw "lpc1393**@KLp3" "schtasks /run /tn KHAI_Backend"`;
try {
  execSync(plinkCmd, { stdio: 'inherit' });
  console.log('STARTED!');
} catch(e) {
  console.log('FAIL: ' + e.message);
}
