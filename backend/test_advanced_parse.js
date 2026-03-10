/**
 * 정교화된 파싱 알고리즘 테스트
 */

function isPossibleRRN(str) {
  const clean = str.replace(/[^\d]/g, '');
  if (clean.length !== 13) return false;

  const yy = parseInt(clean.substring(0, 2), 10);
  const mm = parseInt(clean.substring(2, 4), 10);
  const dd = parseInt(clean.substring(4, 6), 10);
  const genderCode = parseInt(clean.charAt(6), 10);

  if (mm < 1 || mm > 12) return false;
  
  const daysInMonth = [31, (yy % 4 === 0 && (yy % 100 !== 0 || yy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (dd < 1 || dd > daysInMonth[mm - 1]) return false;

  if (genderCode < 1 || genderCode > 8) return false;

  return true;
}

function parseAdvanced(text) {
  // 텍스트에서 숫자와 하이픈 연속된 덩어리들을 모두 찾기
  // 덩어리가 여러 개일 경우 각각 평가.
  const numberBlocks = text.match(/[\d\-\.\_]+/g) || [];
  
  let residentIdCandidate = null;
  let accountCandidates = [];

  // 각 블록들을 길이나 특성 기반으로 분류
  for (let block of numberBlocks) {
    // 문자열 양 끝의 특수문자 제거
    let cleanBlock = block.replace(/^[^\d]+|[^\d]+$/g, '');
    if (!cleanBlock || cleanBlock.replace(/[^\d]/g, '').length < 6) continue;

    const onlyDigits = cleanBlock.replace(/[^\d]/g, '');
    const hasHyphen = cleanBlock.includes('-');

    // 주민번호 유력 후보: 13자리이고 생년월일 형태 충족
    if (onlyDigits.length === 13 && isPossibleRRN(cleanBlock)) {
      // 이미 후보가 있다면? 하이픈이 있는쪽을 더 우선시할 수 있다.
      if (!residentIdCandidate) {
        residentIdCandidate = cleanBlock;
      } else {
        // 이미 찾았는데 또 나왔다면, 기존 것과 비교하여 하이픈이 있는 것을 RRN으로, 아니면 계좌로.
        if (hasHyphen) {
          accountCandidates.push(residentIdCandidate); // 기존 것을 계좌로
          residentIdCandidate = cleanBlock;
        } else {
          accountCandidates.push(cleanBlock);
        }
      }
    } else {
      // 13자리가 아니거나 생년월일 형식이 안 맞으면 무조건 계좌번호 후보
      // (전화번호 형태는 제외할 수 있으나 은행 정산정보에서는 전화번호가 계좌로 취급되지 않도록 필터링 필요)
      // 보통 연락처는 010-XXXX-XXXX 이므로 앞이 010이고 11자리인 경우 제외할 수 있음
      if (onlyDigits.length === 11 && onlyDigits.startsWith('010')) {
        continue;
      }
      accountCandidates.push(cleanBlock);
    }
  }

  // 계좌번호 취합
  // 계좌번호 후보 중에 '-'를 제외하고 남은 숫자들 위주로 조합할 수 있음.
  // 또는 가장 긴 것을 계좌로.
  let account = accountCandidates.map(c => c.replace(/[^\d\-]/g, '')).join(' / ');

  return {
    residentId: residentIdCandidate,
    account: account
  };
}

const testCases = [
  '문지운/국민/93770200612785/991230-1056312', // 정상 케이스
  '홍길동 123-456789-01-011 농협 800101-1234567', // 계좌에도 하이픈, 주민번호는 가짜체크섬
  '김철수 하나은행 1234567890123 9012122345678', // 전부 13자리 (하나는 계좌, 하나는 주민번호)
  '이영희 우체국 880808-2222222 010-1234-5678 123456-12-123456' // 연락처 포함
];

testCases.forEach(tc => {
  console.log(`\nInput: ${tc}`);
  console.log('Result:', parseAdvanced(tc));
});
