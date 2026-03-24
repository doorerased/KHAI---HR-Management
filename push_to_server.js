const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

function runPlink(cmd) {
  const plinkCmd = `"C:\\Program Files\\PuTTY\\plink.exe" -ssh -batch -hostkey "SHA256:IhXOiTplxKr8Bzn6Xk722jTiROHVXPehLhsPlCd6d8k" administrator@211.42.157.164 -pw "lpc1393**@KLp3" "${cmd}"`;
  execSync(plinkCmd, { stdio: 'inherit' });
}

function uploadFileChunked(localPath, remotePath) {
  const content = fs.readFileSync(localPath, 'utf8');
  const base64Content = Buffer.from(content, 'utf8').toString('base64');
  
  const b64RemotePath = remotePath + '.b64';
  
  console.log(`Clearing old file at ${b64RemotePath}...`);
  runPlink(`powershell -Command "if(Test-Path '${b64RemotePath}') { Remove-Item '${b64RemotePath}' }"`);
  
  const chunkSize = 3000;
  for (let i = 0; i < base64Content.length; i += chunkSize) {
    const chunk = base64Content.substring(i, i + chunkSize);
    console.log(`Writing chunk ${i} to ${i + chunkSize} / ${base64Content.length}...`);
    runPlink(`powershell -Command "Add-Content -Path '${b64RemotePath}' -Value '${chunk}' -NoNewline"`);
  }
  
  console.log(`Decoding base64 to target file ${remotePath}...`);
  runPlink(`powershell -Command "[IO.File]::WriteAllText('${remotePath}', [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String((Get-Content '${b64RemotePath}' -Raw))))"`);
  
  console.log(`Cleaning up base64 temp file...`);
  runPlink(`powershell -Command "Remove-Item '${b64RemotePath}'"`);
  
  console.log(`Successfully uploaded ${localPath} to ${remotePath}`);
}

try {
  uploadFileChunked(
    path.join(__dirname, 'backend', 'routes', 'extractor_final.js'),
    'C:\\inetpub\\wwwroot\\im\\backend\\routes\\extractor_final.js'
  );

  uploadFileChunked(
    path.join(__dirname, 'backend', 'server.js'),
    'C:\\inetpub\\wwwroot\\im\\backend\\server.js'
  );

  console.log('Restarting node process via Task Scheduler...');
  runPlink('taskkill /f /im node.exe && schtasks /run /tn KHAI_Backend');
  console.log('Restart triggered successfully!');
} catch (e) {
  console.error('An error occurred during deployment:', e.message);
}
