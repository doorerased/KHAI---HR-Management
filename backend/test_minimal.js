/**
 * Multer + Express 호환성 최소 테스트
 * 가장 단순한 형태의 파일 업로드 서버와 테스트
 */
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

console.log('Multer version:', require('./node_modules/multer/package.json').version);
console.log('Express version:', require('./node_modules/express/package.json').version);

// multer 인스턴스 생성
const upload = multer({ dest: './uploads_test/' });

console.log('upload object keys:', Object.keys(upload));
console.log('upload.single:', typeof upload.single);
console.log('upload.array:', typeof upload.array);

const app = express();

// 간단한 파일 업로드 라우트
app.post('/test-upload', upload.single('file'), (req, res) => {
  console.log('Request received!');
  console.log('req.file:', req.file);
  console.log('req.body:', req.body);
  
  if (req.file) {
    // 업로드된 임시 파일 삭제
    try { fs.unlinkSync(req.file.path); } catch(e) {}
    res.json({ success: true, filename: req.file.originalname, size: req.file.size });
  } else {
    res.status(400).json({ error: 'No file uploaded' });
  }
});

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = 3999;
const server = app.listen(PORT, () => {
  console.log(`Test server on port ${PORT}`);
  
  // 자동 테스트: 실제 파일 업로드
  setTimeout(async () => {
    try {
      const testFilePath = path.join(__dirname, 'uploads', '김민균 프로필.pptx');
      if (!fs.existsSync(testFilePath)) {
        console.log('Test file not found!');
        server.close();
        return;
      }
      
      const fileBuffer = fs.readFileSync(testFilePath);
      const boundary = '----TestBoundary' + Date.now();
      
      let bodyParts = [];
      bodyParts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.pptx"\r\nContent-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation\r\n\r\n`
      ));
      bodyParts.push(fileBuffer);
      bodyParts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
      
      const body = Buffer.concat(bodyParts);
      
      console.log('\n--- Sending test request ---');
      const response = await fetch(`http://localhost:${PORT}/test-upload`, {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        body: body,
      });
      
      console.log('Response status:', response.status);
      const text = await response.text();
      console.log('Response body:', text);
      
    } catch (err) {
      console.error('Test error:', err);
    }
    
    server.close();
    process.exit(0);
  }, 500);
});
