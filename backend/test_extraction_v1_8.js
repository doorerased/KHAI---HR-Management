
const BANK_MAP = {
  '국민': 'KB국민은행', '우리': '우리은행', '신한': '신한은행', '하나': '하나은행',
  '농협': 'NH농협은행', '기업': 'IBK기업은행', '수협': 'Sh수협은행', '카카오': '카카오뱅크',
  '토스': '토스뱅크', '케이': '케이뱅크', '우체국': '우체국', '새마을': '새마을금고', '신협': '신협',
  '제일': 'SC제일은행', '씨티': '한국씨티은행', '산업': 'KDB산업은행', '수출입': '한국수출입은행',
  '부산': 'BNK부산은행', '경남': 'BNK경남은행', '대구': 'DGB대구은행', '광주': '광주은행',
  '전북': '전북은행', '제주': '제주은행'
};

function isPossibleRRN(str) {
  const clean = str.replace(/[^\d]/g, '');
  if (clean.length !== 13) return false;

  const digits = clean.split('').map(Number);
  const yy = parseInt(clean.substring(0, 2), 10);
  const mm = parseInt(clean.substring(2, 4), 10);
  const dd = parseInt(clean.substring(4, 6), 10);
  const genderCode = digits[6];

  if (mm < 1 || mm > 12) return false;
  if (genderCode < 1 || genderCode > 8) return false;

  const fullYear = (genderCode === 1 || genderCode === 2 || genderCode === 5 || genderCode === 6) ? 1900 + yy : 2000 + yy;
  const daysInMonth = [31, (fullYear % 4 === 0 && (fullYear % 100 !== 0 || fullYear % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (dd < 1 || dd > daysInMonth[mm - 1]) return false;

  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += digits[i] * weights[i];
  const checkDigit = (11 - (sum % 11)) % 10;
  
  if (checkDigit === digits[12]) return true;

  if (str.includes('-')) {
    const parts = str.split('-');
    const cleanParts = parts.map(p => p.replace(/[^\d]/g, ''));
    if (cleanParts.length === 2 && cleanParts[0].length === 6 && cleanParts[1].length === 7) {
      return true;
    }
  }

  return false;
}

// 현재 문제의 로직 (backend/routes/extractor.js에서 복사)
function parseBankText_Legacy(text, dbNames = [], dbProfiles = []) {
  let normalizedText = text.replace(/[\/\,\|]/g, ' ');
  normalizedText = normalizedText.replace(/[\r\n\t]+/g, ' ').trim();
  const incomeCategory = (normalizedText.includes('기타 소득') || normalizedText.includes('기타')) ? '기타 소득' : '사업 소득';

  let residentId = '';
  let account = '';
  let bankName = '';
  let name = '';

  const rrnRegex = /(\d{6})[ \-\.]?(\d{7})/g;
  let rrnMatch;
  let residentIdRaw = null;
  while ((rrnMatch = rrnRegex.exec(normalizedText)) !== null) {
    if (isPossibleRRN(rrnMatch[0])) {
      residentId = rrnMatch[1] + '-' + rrnMatch[2];
      residentIdRaw = rrnMatch[0];
      break; 
    }
  }

  let textWithoutRrn = normalizedText;
  if (residentIdRaw) {
    textWithoutRrn = textWithoutRrn.split(residentIdRaw).join(' [RRN_MASKED] ');
  }

  const numberBlocks = textWithoutRrn.match(/[\d\-\.\_]+/g) || [];
  let accountCandidates = [];
  for (let block of numberBlocks) {
    let cleanBlock = block.replace(/^[^\d]+|[^\d]+$/g, '');
    if (!cleanBlock || cleanBlock === '-') continue;
    const onlyDigits = cleanBlock.replace(/[^\d]/g, '');
    if (onlyDigits.length < 6) continue;
    if (onlyDigits.length === 11 && onlyDigits.startsWith('010')) continue;
    accountCandidates.push(cleanBlock);
  }

  const bankKeys = Object.keys(BANK_MAP);
  for (const key of bankKeys) {
    if (textWithoutRrn.includes(key)) {
      bankName = BANK_MAP[key];
      break;
    }
  }

  const formattedAccounts = accountCandidates.map(c => c.replace(/[^\d\-]/g, '').replace(/^-+|-+$/g, '')).filter(c => c);
  if (formattedAccounts.length > 0) {
    account = formattedAccounts.join(' / ');
  }

  if (!name) {
    const potentialNames = normalizedText.match(/[가-힣]{2,4}/g) || [];
    const excludeWords = ['정보', '송부', '감사', '감사합니다', '드립니다', '입금', '바랍니다', '부탁', '계좌', '번호', '주민', '소득', '은행', '뱅크', '위원'];
    for (const word of potentialNames) {
      if (!excludeWords.some(ex => word.includes(ex)) && !bankKeys.some(kb => word.includes(kb))) {
        name = word;
        break;
      }
    }
  }

  return { name, residentId, bank: bankName, account };
}

// 개선된 로직 (V1.8 가안)
function parseBankText_V1_8(text, dbNames = [], dbProfiles = []) {
  let normalizedText = text.replace(/[\/\,\|]/g, ' ');
  normalizedText = normalizedText.replace(/[\r\n\t]+/g, ' ').trim();
  
  let residentId = '';
  let residentIdRaw = null;
  
  // 1. 주민번호 추출 및 마스킹
  const rrnRegex = /(\d{6})[ \-\.]?(\d{7})/g;
  let rrnMatch;
  while ((rrnMatch = rrnRegex.exec(normalizedText)) !== null) {
    if (isPossibleRRN(rrnMatch[0])) {
      residentId = rrnMatch[1] + '-' + rrnMatch[2];
      residentIdRaw = rrnMatch[0];
      break; 
    }
  }

  let textForAccount = normalizedText;
  if (residentIdRaw) {
    textForAccount = textForAccount.split(residentIdRaw).join(' [MASKED] ');
  }
  
  // 전화번호(010...) 제거하여 계좌번호 오인식 방지
  textForAccount = textForAccount.replace(/01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/g, ' [PHONE_MASKED] ');

  // 2. 계좌번호 추출 (통합 숫자 블록 인식)
  // 주민번호/전화번호 제외 후 남은 숫자+하이픈+공백 조각들을 하나로 합침
  // 단, 중간에 2자 이상의 한글이나 특수기호가 있으면 별개로 취급
  let account = '';
  const mergedNumbersMatch = textForAccount.match(/[\d\-\.\s]{4,}/g) || [];
  let longestDigits = '';
  
  for (let block of mergedNumbersMatch) {
    const clean = block.trim();
    const digitsOnly = clean.replace(/[^\d]/g, '');
    if (digitsOnly.length >= 6) {
      if (digitsOnly.length > longestDigits.length) {
        longestDigits = digitsOnly;
        account = clean.replace(/\s+/g, ' '); // 공백은 하나로 축소하여 보존
      }
    }
  }

  // 3. 은행명 추출
  let bankName = '';
  const bankKeys = Object.keys(BANK_MAP);
  for (const key of bankKeys) {
    if (normalizedText.includes(key)) {
      bankName = BANK_MAP[key];
      break;
    }
  }

  // 4. 이름 추출 (접미사 분리 필터 적용)
  let name = '';
  // 직함 접미사 목록
  const titles = ['위원', '교수', '박사', '님', '대표', '강사', '연구원', '주무관', '사무관', '팀장', '과장'];
  
  // 한글 2~5글자 블록 탐색
  const potentialNames = normalizedText.match(/[가-힣]{2,6}/g) || [];
  const excludeWords = ['정보', '송부', '감사', '감사합니다', '드립니다', '입금', '바랍니다', '부탁', '계좌', '번호', '주민', '소득', '은행', '뱅크'];
  
  for (let candidate of potentialNames) {
    let cleanName = candidate;
    
    // 접미사 제거 시도
    for (let title of titles) {
      if (cleanName.endsWith(title)) {
        cleanName = cleanName.substring(0, cleanName.length - title.length);
      }
    }
    
    // 최종 검증: 2~4자 한글이면서 불용어가 아니고 은행명이 아님
    if (cleanName.length >= 2 && cleanName.length <= 4 && 
        !excludeWords.some(ex => cleanName.includes(ex)) && 
        !bankKeys.some(kb => cleanName.includes(kb))) {
      name = cleanName;
      break;
    }
  }

  return { 
    name: name || '이름식별불가', 
    residentId: residentId || '주민번호식별불가', 
    bank: bankName || '은행식별불가', 
    account: account || '계좌식별불가' 
  };
}

// 테스트 케이스 실행
const testCases = [
  {
    input: "배석현위원 701120 1069610 카카오뱅크 3333 05 2594860 감사합니다",
    expected: { name: "배석현", residentId: "701120-1069610", bank: "카카오뱅크", account: "3333 05 2594860" }
  },
  {
    input: "김철수 교수님 농협 302-1234-5678-91 850101-1234567",
    expected: { name: "김철수", residentId: "850101-1234567", bank: "NH농협은행", account: "302-1234-5678-91" }
  },
  {
    input: "701120 1069610 3333 05 2594860", // 번호만 있는 경우
    expected: { name: "이름식별불가", residentId: "701120-1069610", bank: "은행식별불가", account: "3333 05 2594860" }
  }
];

console.log("=== Extraction Logic V1.8 Test ===");
testCases.forEach((tc, i) => {
  console.log(`\nTest Case ${i + 1}: ${tc.input}`);
  
  const legacy = parseBankText_Legacy(tc.input);
  const updated = parseBankText_V1_8(tc.input);
  
  console.log("[Legacy] ", legacy);
  console.log("[Updated]", updated);
  
  const isNameOk = updated.name === tc.expected.name;
  const isAccountOk = updated.account === tc.expected.account;
  const isRrnOk = updated.residentId === tc.expected.residentId;
  
  if (isNameOk && isAccountOk && isRrnOk) {
    console.log("Result: ✅ PASS");
  } else {
    console.log("Result: ❌ FAIL", 
      !isNameOk ? `(Name Expected: ${tc.expected.name})` : "",
      !isAccountOk ? `(Account Expected: ${tc.expected.account})` : "",
      !isRrnOk ? `(RRN Expected: ${tc.expected.residentId})` : ""
    );
  }
});
