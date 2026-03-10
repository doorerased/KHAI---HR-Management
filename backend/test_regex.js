const text = `이  름    남 미 애    생 년 월 일    1968.07.16
소속 및 연락처    길버트 컨설팅 / 대표    010-3748-6806    nam157815@naver.com
전 문 분 야    공공기관 면접관/ 인사조직/ 채용/ 교육
학  력    한세대학교 사회복지학 박사 / 국민대학교 경영대학원 석사 /한세대학교 경영학과`;

function parseProfileText(text) {
  let normalizedText = text
    .replace(/[\r\n]+/g, ' ')
    .replace(/이\s*름/g, '이름')
    .replace(/성\s*명/g, '이름')
    .replace(/생\s*년\s*월\s*일/g, '생년월일')
    .replace(/소\s*속\s*및\s*연\s*락\s*처/g, '소속및연락처')
    .replace(/전\s*문\s*분\s*야/g, '전문분야')
    .replace(/학\s*력/g, '학력');

  console.log("Normalized text: ", normalizedText);

  // [A] 이메일: @를 포함하는 영문/숫자 조합
  const emailRegex = /([a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const emailMatch = normalizedText.match(emailRegex);
  const email = emailMatch ? emailMatch[1].replace(/\s+/g, '') : '';

  // [B] 전화번호: 010으로 시작하는 숫자 그룹
  const phoneRegex = /(01[016789][-\s.]?\d{3,4}[-\s.]?\d{4})/;
  const phoneMatch = normalizedText.match(phoneRegex);
  let phone = '';
  if (phoneMatch) {
    phone = phoneMatch[1].replace(/[\s.]+/g, '-');
    if (!phone.includes('-')) phone = phone.replace(/(01[016789])(\d{3,4})(\d{4})/, '$1-$2-$3');
  }

  // [C] 생년월일: YYYY.MM.DD 형태 (19/20으로 시작)
  const birthRegex = /((?:19|20)\d{2})[-.\s년]*(\d{1,2})[-.\s월]*(\d{1,2})[일]*/;
  const birthMatch = normalizedText.match(birthRegex);
  let birth = '';
  if (birthMatch) {
    const year = birthMatch[1];
    const month = birthMatch[2].padStart(2, '0');
    const day = birthMatch[3].padStart(2, '0');
    birth = `${year}.${month}.${day}`;
  }

  // [D] 좌표(순서) 기반 이름 추출
  let name = '';
  const nameSectionRegex = /이름([\s\S]*?)(?:생년|소속|나이|전문|직업|학력|주소)/;
  const nameSectionMatch = normalizedText.match(nameSectionRegex);
  
  if (nameSectionMatch) {
    const rawName = nameSectionMatch[1].replace(/[^가-힣a-zA-Z]/g, '');
    if (rawName.length >= 2) {
      name = rawName.substring(0, 5);
    }
  }

  // 한번 더 체크 (레이블: 값 형태 대비)
  if (!name) {
    const alternativeNameMatch = normalizedText.match(/(?:이\s*름|성\s*명)\s*[:|]?\s*([가-힣]{2,5})/);
    if(alternativeNameMatch) name = alternativeNameMatch[1];
  }

  return { name, birth, phone, email };
}

console.log(parseProfileText(text));
