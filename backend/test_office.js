const PptxGenJS = require('pptxgenjs');
const officeParser = require('officeparser');
const fs = require('fs');

async function runTest() {
  const pptx = new PptxGenJS();
  let slide = pptx.addSlide();
  
  // 프로필과 유사하게 텍스트 추가
  slide.addText([
    { text: '면접관 Profile\n', options: { fontSize: 24, bold: true } },
    { text: '이름: 김테스트\n' },
    { text: '소속 및 연락처: 길버트 컨설팅 / 대표\t010-1234-5678\ttest@naver.com\n' },
    { text: '생년월일: 1980.05.15\n' },
    { text: '전문분야: 공공기관 면접\n' }
  ], { x: 1, y: 1, w: 8, h: 4 });

  const filename = '테스트_한글파일.pptx';
  await pptx.writeFile({ fileName: filename });
  console.log(`[1] Created ${filename}`);

  try {
    const rawData = await officeParser.parseOffice(filename);
    const extractedText = typeof rawData === 'string' ? rawData : (rawData?.toText ? rawData.toText() : JSON.stringify(rawData));
    console.log('[2] Extracted Text:');
    console.log(extractedText);

    // 파싱 함수 테스트
    console.log('\n[3] Apply Regex Logic');
    let normalizedText = extractedText
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
    console.log(' - Email:', email);
    
    // 전화번호
    const phoneRegex = /(01[016789][-\s.]?\d{3,4}[-\s.]?\d{4})/;
    const phoneMatch = normalizedText.match(phoneRegex);
    let phone = '';
    if (phoneMatch) {
      phone = phoneMatch[1].replace(/[\s.]+/g, '-');
      if (!phone.includes('-')) phone = phone.replace(/(01[016789])(\d{3,4})(\d{4})/, '$1-$2-$3');
    }
    console.log(' - Phone:', phone);
    
    // 생년월일
    const birthRegex = /((?:19|20)\d{2})[-.\s년]*(\d{1,2})[-.\s월]*(\d{1,2})[일]*/;
    const birthMatch = normalizedText.match(birthRegex);
    let birth = '';
    if (birthMatch) {
      birth = `${birthMatch[1]}.${birthMatch[2].padStart(2, '0')}.${birthMatch[3].padStart(2, '0')}`;
    }
    console.log(' - Birth:', birth);

    // 이름
    let name = '';
    const nameSectionRegex = /이름([\s\S]*?)(?:생년|소속|나이|전문|직업|학력|주소)/;
    const nameSectionMatch = normalizedText.match(nameSectionRegex);
    if (nameSectionMatch) {
      const rawName = nameSectionMatch[1].replace(/[^가-힣a-zA-Z]/g, '');
      if (rawName.length >= 2) name = rawName.substring(0, 5);
    }
    if (!name) {
      const alternativeNameMatch = normalizedText.match(/(?:이\s*름|성\s*명)\s*[:|]?\s*([가-힣]{2,5})/);
      if(alternativeNameMatch) name = alternativeNameMatch[1];
    }
    console.log(' - Name:', name);
    
    fs.unlinkSync(filename);
  } catch(e) {
    console.error('Test Failed:', e);
  }
}

runTest();
