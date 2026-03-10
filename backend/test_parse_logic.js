const fs = require('fs');
const extractor = require('./routes/extractor.js'); // Cannot directly require internal functions easily.

// copy parseBankText
const BANK_MAP = {
  '국민': 'KB국민은행', '우리': '우리은행', '신한': '신한은행', '하나': '하나은행',
  '농협': 'NH농협은행', '기업': 'IBK기업은행', '수협': 'Sh수협은행', '카카오': '카카오뱅크',
  '토스': '토스뱅크', '케이': '케이뱅크', '우체국': '우체국', '새마을': '새마을금고', '신협': '신협',
  '제일': 'SC제일은행', '씨티': '한국씨티은행', '산업': 'KDB산업은행', '수출입': '한국수출입은행',
  '부산': 'BNK부산은행', '경남': 'BNK경남은행', '대구': 'DGB대구은행', '광주': '광주은행',
  '전북': '전북은행', '제주': '제주은행'
};

function isValidDate(dateStr) {
  const y = parseInt(dateStr.substring(0, 2), 10);
  const m = parseInt(dateStr.substring(2, 4), 10);
  const d = parseInt(dateStr.substring(4, 6), 10);
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  return true;
}

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
  if (checksum !== parseInt(rrn.charAt(12), 10)) return false;

  return true;
}

function parseBankText(text, dbNames = [], dbProfiles = []) {
  // 1. 전처리
  const normalizedText = text.replace(/[\r\n]+/g, ' ').trim();
  const incomeCategory = (normalizedText.includes('기타 소득') || normalizedText.includes('기타')) ? '기타 소득' : '사업 소득';

  let residentId = '';
  let account = '';
  let bankName = '';
  let name = '';
  let rrnRawTexts = [];
  let validRrnsCount = 0;

  // 2. 주민등록번호 탐색 (구분 기호형, 공백 구분형, 단일 배열형 모두 포괄)
  const rrnRegex = /(?:^|[^\d])(\d{6})[\s\-\/\.\_]*(\d{7})(?=[^\d]|$)/g;
  let matches = [];
  let match;
  while ((match = rrnRegex.exec(normalizedText)) !== null) {
    // exec 결과에서 앞뒤 비숫자 텍스트는 제외하고 숫자와 기호 부분만 원문으로 간주
    const actualRaw = match[0].match(/(\d{6})[\s\-\/\.\_]*(\d{7})/)[0];
    matches.push({
      raw: actualRaw, 
      clean: match[1] + match[2],
      part1: match[1],
      part2: match[2]
    });
  }

  console.log('RRN matches before validation:', matches);
  const validRrns = matches.filter(m => validateRRN(m.clean));
  console.log('RRN matches after validation:', validRrns);
  validRrnsCount = validRrns.length;

  if (validRrnsCount === 1) {
    residentId = `${validRrns[0].part1}-${validRrns[0].part2}`;
    rrnRawTexts.push(validRrns[0].raw);
  } else if (validRrnsCount > 1) {
    // 2개 이상일 때 DB 대조
    let matchedProfileRrn = null;
    
    for (const r of validRrns) {
      const birthYYMMDD = r.part1;
      const isMatch = dbProfiles.some(p => {
        if (!p.birth) return false;
        const normalizedBirth = p.birth.replace(/[^0-9]/g, ''); 
        return normalizedBirth.length >= 6 && normalizedBirth.endsWith(birthYYMMDD);
      });

      if (isMatch) {
        matchedProfileRrn = r;
        break;
      }
    }

    if (matchedProfileRrn) {
      residentId = `${matchedProfileRrn.part1}-${matchedProfileRrn.part2}`;
      rrnRawTexts.push(matchedProfileRrn.raw);
    } else {
      residentId = `[중복/오류 확인 필요] ${validRrns.map(v => v.part1 + '-' + v.part2).join(', ')}`;
      validRrns.forEach(v => rrnRawTexts.push(v.raw));
    }
  }

  // 3. 찾은 주민번호 원문 텍스트에서 제거
  let textWithoutRrn = normalizedText;
  rrnRawTexts.forEach(rawText => {
    // 정규식 특수문자 이스케이프
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    textWithoutRrn = textWithoutRrn.replace(new RegExp(escapeRegExp(rawText), 'g'), ' ');
  });

  // 4. 이름 탐색 (보관함 대조 최우선)
  for (const dbName of dbNames) {
    if (dbName && normalizedText.includes(dbName)) {
      name = dbName;
      break;
    }
  }

  // 5. 은행명 탐색
  const bankKeys = Object.keys(BANK_MAP);
  for (const key of bankKeys) {
    if (textWithoutRrn.includes(key)) {
      bankName = BANK_MAP[key];
      break;
    }
  }

  // 6. 계좌번호 탐색 (숫자와 기호(-, 공백) 뭉치 추출)
  // 계좌번호 단일화 원칙에 따라 주민번호를 제외한 텍스트에서 모든 숫자 및 하이픈 뭉치를 계좌번호로 편입
  const accountCandidateText = textWithoutRrn.replace(/[^\d\-]/g, '').trim(); 
  if (accountCandidateText.length > 0) {
    // 앞뒤 불필요한 하이픈 제거
    account = accountCandidateText.replace(/^-+|-+$/g, '');
  }

  // 7. 이름 최종 백업
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

  return {
    name: name || '이름식별불가',
    residentId: residentId || (validRrnsCount === 0 && account ? '주민번호식별불가' : '주민번호식별불가'),
    bank: bankName || '은행식별불가',
    account: account || '계좌식별불가',
    incomeCategory
  };
}

const input = '문지운/국민/93770200612785/991230-1056312';
console.log(parseBankText(input));

