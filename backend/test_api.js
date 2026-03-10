const fs = require('fs');

async function runTest() {
  try {
    const fileData = Buffer.from('테스트 내용입니다.', 'utf8');
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    
    let body = '';
    body += '--' + boundary + '\r\n';
    body += 'Content-Disposition: form-data; name="file"; filename="test.txt"\r\n';
    body += 'Content-Type: text/plain\r\n\r\n';
    
    const endBoundary = '\r\n--' + boundary + '--\r\n';
    
    const payload = Buffer.concat([
      Buffer.from(body, 'utf8'),
      fileData,
      Buffer.from(endBoundary, 'utf8')
    ]);

    console.log('Sending request...');
    const res = await fetch('http://localhost:3000/api/extract/profile', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: payload
    });

    console.log('Status: ', res.status);
    const text = await res.text();
    console.log('Response: ', text);
  } catch (err) {
    console.error('Error: ', err);
  }
}

runTest();
