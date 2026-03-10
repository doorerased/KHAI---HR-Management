const fs = require('fs');
const path = require('path');
const officeParser = require('officeparser');
const AdmZip = require('adm-zip');
const Tesseract = require('tesseract.js');

const filePath = path.join(__dirname, 'uploads', fs.readdirSync(path.join(__dirname, 'uploads'))[0]);
console.log('Testing file:', filePath);

async function testParse() {
  let rawData = await officeParser.parseOffice(filePath);
  let extractedText = typeof rawData === 'string' ? rawData : (rawData.toText ? rawData.toText() : JSON.stringify(rawData));
  console.log('[Text from officeParser, length]', extractedText.length);
  console.log('--- START TEXT ---');
  console.log(extractedText);
  console.log('--- END TEXT ---');

  if (extractedText.length < 50) {
    console.log('[FallBack] Trying to extract embedded images from Office file...');
    try {
      const zip = new AdmZip(filePath);
      const zipEntries = zip.getEntries();
      const images = zipEntries.filter(entry => entry.entryName.match(/media\/image.*\.(png|jpeg|jpg)$/i));
      
      console.log('Found images:', images.length);
      if (images.length > 0) {
        images.sort((a,b) => b.header.size - a.header.size);
        const largestImage = images[0];
        const imgBuffer = largestImage.getData();
        const tempImgPath = path.join(__dirname, `extracted-${Date.now()}.png`);
        fs.writeFileSync(tempImgPath, imgBuffer);
        
        console.log('Running Tesseract on extracted image from PPTX... file size:', imgBuffer.length);
        const ret = await Tesseract.recognize(tempImgPath, 'kor+eng');
        console.log('--- START OCR ---');
        console.log(ret.data.text);
        console.log('--- END OCR ---');
        
        extractedText += ' ' + ret.data.text;
        if (fs.existsSync(tempImgPath)) fs.unlinkSync(tempImgPath);
      }
    } catch (zipErr) {
      console.log('Failed to extract images from zip:', zipErr.message);
    }
  }

  // 파싱 함수
  const filename = path.basename(filePath);
  console.log("Original filename:", filename);
  const result = parseProfileText(extractedText, filename);
  console.log("\n[Extraction Result]");
  console.log(result);
}

function parseProfileText(text, filename) {
  let normalizedText = text
    .replace(/[\r\n]+/g, ' ')
    .replace(/이\s*름/g, '이름')
    .replace(/성\s*명/g, '이름')
    .replace(/생\s*년\s*월\s*일/g, '생년월일')
    .replace(/소\s*속\s*및\s*연\s*락\s*처/g, '소속및연락처')
    .replace(/전\s*문\s*분\s*야/g, '전문분야')
    .replace(/학\s*력/g, '학력');

  const emailRegex = /([a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const emailMatch = normalizedText.match(emailRegex);
  const email = emailMatch ? emailMatch[1].replace(/\s+/g, '') : '';

  const phoneRegex = /(01[016789][-\s.]?\d{3,4}[-\s.]?\d{4})/;
  const phoneMatch = normalizedText.match(phoneRegex);
  let phone = '';
  if (phoneMatch) {
    phone = phoneMatch[1].replace(/[\s.]+/g, '-');
    if (!phone.includes('-')) phone = phone.replace(/(01[016789])(\d{3,4})(\d{4})/, '$1-$2-$3');
  }

  const birthRegex = /((?:19|20)\d{2})[-.\s년]*(\d{1,2})[-.\s월]*(\d{1,2})[일]*/;
  const birthMatch = normalizedText.match(birthRegex);
  let birth = '';
  if (birthMatch) {
    const year = birthMatch[1];
    const month = birthMatch[2].padStart(2, '0');
    const day = birthMatch[3].padStart(2, '0');
    birth = `${year}.${month}.${day}`;
  }

  let name = '';
  // Fix decoding issues
  const decodedFileName = decodeURIComponent(escape(filename)); // fallback if it's messed up
  
  if (decodedFileName) {
    const filenameMatch = decodedFileName.match(/^([가-힣]{2,5})[_ ]/);
    if (filenameMatch) {
      name = filenameMatch[1];
    } else {
        const singleNameMatch = decodedFileName.match(/^([가-힣]{2,5})\./);
        if (singleNameMatch) name = singleNameMatch[1];
    }
  }

  if (!name) {
    const nameSectionMatch = normalizedText.match(/이름([\s\S]{1,40})/);
    if (nameSectionMatch) {
      const rawMatch = nameSectionMatch[1].match(/[가-힣]{2,5}/);
      if(rawMatch) {
        name = rawMatch[0];
      }
    }
  }

  return { name, birth, phone, email };
}

testParse();
