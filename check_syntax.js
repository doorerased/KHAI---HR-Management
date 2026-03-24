const { execSync } = require('child_process');

function runPlink(cmd) {
  const plinkCmd = `"C:\\Program Files\\PuTTY\\plink.exe" -ssh -batch -hostkey "SHA256:IhXOiTplxKr8Bzn6Xk722jTiROHVXPehLhsPlCd6d8k" administrator@211.42.157.164 -pw "lpc1393**@KLp3" "${cmd}"`;
  try {
    const out = execSync(plinkCmd);
    console.log('OUTPUT:\n' + out.toString());
  } catch(e) {
    console.log('ERROR:\n' + (e.stdout ? e.stdout.toString() : e.message));
    console.log('STDERR:\n' + (e.stderr ? e.stderr.toString() : ''));
  }
}

console.log('Checking server.js syntax...');
runPlink('node -c C:\\inetpub\\wwwroot\\im\\backend\\server.js');

console.log('Checking extractor_final.js syntax...');
runPlink('node -c C:\\inetpub\\wwwroot\\im\\backend\\routes\\extractor_final.js');

console.log('Checking if node.exe is running...');
runPlink('tasklist /FI "IMAGENAME eq node.exe"');
