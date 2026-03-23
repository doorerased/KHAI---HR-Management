// 고도화된 정규식 (NFC 정규화 포함)
const birthRegex = /((?:19|20)\d{2})[-.\s\ub144/:]*(\d{1,2})[-.\s\uc6d4/:]*(\d{1,2})[\uc77c]?/;

function normalizeText(text) {
  return text
    .normalize('NFC')
    .replace(/[\r\n\t\xa0\u200b]+/g, ' ')
    .replace(/\s+/g, ' ');
}

const samples = [
  '1975년 2월 9일', // 한 자리 숫자
  '1975년 2월 9일'.normalize('NFD'), // NFD (Mac)
  '1980 : 05 : 15', // 콜론 구분자
  '1980/05/15', // 슬래시 구분자
  '1980. 05. 15.',
  '1983-1-1' // 하이픈 + 한 자리 숫자
];
samples.forEach(s => {
  const normalized = normalizeText(s); // 정규화 적용
  const match = normalized.match(birthRegex);
  if (match) {
    console.log(`Input: ${s}`);
    console.log(`  Match: ${match[0]}`);
    console.log(`  Year: ${match[1]}, Month: ${match[2]}, Day: ${match[3]}`);
  } else {
    console.log(`No match for: ${s}`);
  }
});
