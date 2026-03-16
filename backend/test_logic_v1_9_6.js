const titles = ['위원', '교수', '박사', '님', '대표', '강사', '연구원', '주무관', '사무관', '팀장', '과장', '성명', '이름'];
const skipWords = [
  '행정', '관리', '프로필', '파일', '위원', '평가', '전문가', '인적', 
  '사항', '이력서', '복사본', '전문', '역량'
];

function testParseName(text, filename) {
  let name = '';
  const strippedText = text.replace(/\s/g, '');

  // v1.9.6 로직 시뮬레이션
  if (filename) {
    const baseFilename = filename.split('.')[0];
    const parts = baseFilename.split(/[_\s\-()]+/);
    const firstPart = parts[0] ? parts[0].trim() : '';
    
    let cand = firstPart;
    for (let title of titles) {
      if (cand.endsWith(title)) cand = cand.substring(0, cand.length - title.length);
    }
    
    console.log(`[Test Debug] Filename: ${filename}, Cand: ${cand}`);

    if (cand.length >= 2 && cand.length <= 4 && /^[가-힣]+$/.test(cand) && !skipWords.some(word => cand.includes(word))) {
      name = cand;
      console.log(`[Test Success] Filename Prefix Adopted: ${name}`);
    }
  }
  return name;
}

const testCases = [
  { f: '강성일_프로필_HR.pptx', t: '이름 강 성 일 생년월일...' },
  { f: '김용환_프로필_HR.pptx', t: '이름 김 용 환 역량 전문...' },
  { f: '박성_프로필_HR.pptx', t: '성명: 박 성 전문분야...' },
  { f: '배석현_프로필_HR.pptx', t: '이름: 배석현...' }
];

testCases.forEach(tc => {
  const result = testParseName(tc.t, tc.f);
  console.log(`File: ${tc.f} => Result: ${result}`);
});
