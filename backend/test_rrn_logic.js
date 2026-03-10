const rrn = '9912301056312';
function validateRRN(rrn) {
  if (rrn.length !== 13) return false;

  const yy = parseInt(rrn.substring(0, 2), 10);
  const mm = parseInt(rrn.substring(2, 4), 10);
  const dd = parseInt(rrn.substring(4, 6), 10);
  const genderCode = parseInt(rrn.charAt(6), 10);

  if (mm < 1 || mm > 12) return false;
  
  // 간단한 날짜 유효성
  const daysInMonth = [31, (yy % 4 === 0 && (yy % 100 !== 0 || yy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (dd < 1 || dd > daysInMonth[mm - 1]) return false;

  // 세기 및 성별 코드 검증 (1~8)
  if (genderCode < 1 || genderCode > 8) return false;

  // 체크섬 검증
  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(rrn.charAt(i), 10) * weights[i];
  }
  const checksum = (11 - (sum % 11)) % 10;
  console.log(`Expected checksum: ${checksum}, Actual: ${parseInt(rrn.charAt(12), 10)}`)
  if (checksum !== parseInt(rrn.charAt(12), 10)) return false;

  return true;
}

console.log('validateRRN:', validateRRN(rrn));

const text = '문지운/국민/93770200612785/991230-1056312';
const rrnRegex = /(?:^|[^\d])(\d{6})[\s\-\/\.\_]*(\d{7})(?=[^\d]|$)/g;
let matches = [];
let match;
while ((match = rrnRegex.exec(text)) !== null) {
  const actualRaw = match[0].match(/(\d{6})[\s\-\/\.\_]*(\d{7})/)[0];
  console.log('Matched RRN part:', actualRaw);
}
