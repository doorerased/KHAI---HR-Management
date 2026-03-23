const birthRegex = /((?:19|20)\d{2})[-.\s\ub144/:]*(\d{1,2})[-.\s\uc6d4/:]*(\d{1,2})[\uc77c]?/;

function normalizeText(text) {
  return text
    .normalize('NFC')
    .replace(/[\r\n\t\xa0\u200b]+/g, ' ')
    .replace(/\s+/g, ' ');
}

// 띄어쓰기가 없거나 깨진 텍스트를 파싱한다고 가정 
const pptxText = '조 현 면접관 Profile 기본인적사항 이 름 조 현(趙顯) 생년월일 1975년 2월 9일 소속 및 연락처 ㈜엘엔케이로직 코리아 HR사업본부/팀장 010-4535-6987 klausjooo@gmail.com 전문 분야 역량평가, 서류심사(정량,정성평가) 인사, 기획, 경영, 마케팅, 홍보, 교육 등 학 력 서울과학기술대학교 조형대학 학사 주요이력 • 現) ㈜엘엔케이로직 코리아 HR사업본부/팀장 (2007. 01 ~ 현재) • 現) 한국전문면접평가인증원 전문위원 (2023. 01 ~ 현재) • 前) ㈜유니콘기획 경영지원팀 /팀장 (2002. 01 ~ 2006. 10)';

const normalized = normalizeText(pptxText);
console.log('[Normalized Text]:', normalized);

const result = normalized.match(birthRegex);
console.log('\n[Match Result]:', result ? result[0] : 'null');
if (result) {
  const year = result[1];
  const month = result[2].padStart(2, '0');
  const day = result[3].padStart(2, '0');
  console.log(`Extracted Date: ${year}.${month}.${day}`);
}

