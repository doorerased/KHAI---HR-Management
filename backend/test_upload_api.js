/**
 * 실제 파일 업로드를 시뮬레이션하여 /api/extract/profile 엔드포인트를 테스트합니다.
 * uploads 디렉토리에 있는 실제 PPTX 파일을 사용합니다.
 */
const fs = require('fs');
const path = require('path');

async function testUpload() {
  const testFiles = [
    '김민균 프로필.pptx',
    '이행주_산업경영공학_프로필.pptx',
    '박용성_행정학_프로필.pptx',
  ];

  for (const filename of testFiles) {
    const filePath = path.join(__dirname, 'uploads', filename);
    if (!fs.existsSync(filePath)) {
      console.log(`[SKIP] File not found: ${filename}`);
      continue;
    }

    console.log(`\n--- Testing: ${filename} ---`);
    const startTime = Date.now();

    try {
      const fileBuffer = fs.readFileSync(filePath);
      
      // FormData를 수동으로 구성 (Node.js 18+ fetch 사용)
      const boundary = '----FormBoundary' + Math.random().toString(36).substr(2);
      
      const ext = path.extname(filename).substring(1);
      let bodyParts = [];
      
      // file 필드
      bodyParts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="safe_upload.${ext}"\r\nContent-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation\r\n\r\n`
      ));
      bodyParts.push(fileBuffer);
      bodyParts.push(Buffer.from('\r\n'));
      
      // realFilename 필드
      bodyParts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="realFilename"\r\n\r\n${filename}\r\n`
      ));
      
      // 종료 boundary
      bodyParts.push(Buffer.from(`--${boundary}--\r\n`));
      
      const body = Buffer.concat(bodyParts);

      const response = await fetch('http://localhost:3000/api/extract/profile', {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: body,
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`  Status: ${response.status} (${duration}s)`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          const d = result.data[0];
          console.log(`  Result: name=${d.name}, birth=${d.birth}, phone=${d.phone}, email=${d.email}`);
        } else {
          console.log(`  Response:`, JSON.stringify(result));
        }
      } else {
        const text = await response.text();
        console.log(`  ERROR Response: ${text.substring(0, 500)}`);
      }
    } catch (err) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`  EXCEPTION (${duration}s): ${err.message}`);
    }
  }
  
  console.log('\n--- All tests completed ---');
}

testUpload();
