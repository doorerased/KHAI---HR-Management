const officeParser = require('officeparser');
const path = require('path');
const fs = require('fs');

async function testRepro() {
    const filename = '박용성_행정학_프로필.pptx';
    const filePath = path.join(__dirname, 'uploads', filename);

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    console.log(`Testing file: ${filename} (${fs.statSync(filePath).size} bytes)`);
    const startTime = Date.now();

    try {
        console.log('Starting officeParser.parseOffice...');
        const rawData = await officeParser.parseOffice(filePath);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`Success! Duration: ${duration}s`);
        const extractedText = typeof rawData === 'string' ? rawData : JSON.stringify(rawData);
        console.log(`Extracted text length: ${extractedText.length}`);
        // console.log('Snippet:', extractedText.substring(0, 500));
    } catch (err) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`Failed! Duration: ${duration}s`);
        console.error('Error:', err);
    }
}

testRepro();
