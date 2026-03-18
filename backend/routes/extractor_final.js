// [v1.9.9] Profile & Bank Extractor Router
const express = require('express');
const multer = require('multer');

const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const anyText = require('any-text');
const officeParser = require('officeparser');
const AdmZip = require('adm-zip');

const router = express.Router();

// 임시 업로드 폴더 생성
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir) },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'temp_upload_' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 20 * 1024 * 1024 } });

// 타임아웃 래퍼 함수 (밀리초 단위) - 사용자 요청에 따라 기본 1분(60000ms) 적용
function withTimeout(promise, ms = 60000, label = '작업') {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} 시간이 초과되었습니다. (제한: ${ms/1000}초)`));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

/**
 * 프로필 텍스트 분석 로직
 * 종료 조건: 예외 발생 시 또는 미검출 시 '추출불가' 반환하여 무한 루프 방지
 */
function parseProfileText(text, filename) {
  try {
    if (!text || typeof text !== 'string') return { name: '추출불가', birth: '추출불가', phone: '추출불가', email: '추출불가' };
    
    // 과도한 텍스트 길이 제한 (정규식 성능 보호 및 이벤트 루프 점유 방지)
    const safeText = text.substring(0, 50000); 

    let normalizedText = safeText
      .replace(/[\r\n]+/g, ' ')
      .replace(/\uc774\s*\ub984/g, '\uc774\ub984')
      .replace(/\uc131\s*\uba명/g, '\uc774\ub984')
      .replace(/\uc0dd\s*\ub144\s*\uc6d4\s*\uc77c/g, '\uc0dd\ub144\uc6d4\uc77c')
      .replace(/\uc18c\s*\uc18d\s*\ubc0f\s*\uc5f0\s*\ub77d\uc12d/g, '\uc18c\uc18d\ubc0f\uc5f0\ub77d\uc12d')
      .replace(/\uc884\s*\ubb38\s*\ubd84\s*\uc57c/g, '\uc884\ubb38\ubd84\uc57c')
      .replace(/\ud559\s*\ub825/g, '\ud559\ub825');

    // 1. 이메일 추출
    const emailRegex = /([a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const emailMatch = normalizedText.match(emailRegex);
    const email = emailMatch ? emailMatch[1].replace(/\s+/g, '') : '추출불가';

    // 2. 전화번호 추출
    const phoneRegex = /(01[016789][-\s.]?\d{3,4}[-\s.]?\d{4})/;
    const phoneMatch = normalizedText.match(phoneRegex);
    let phone = '추출불가';
    if (phoneMatch) {
      phone = phoneMatch[1].replace(/[\s.]+/g, '-');
      if (!phone.includes('-')) phone = phone.replace(/(01[016789])(\d{3,4})(\d{4})/, '$1-$2-$3');
    }

    // 3. 생년월일 추출
    const birthRegex = /((?:19|20)\d{2})[-.\s\ub144]*(\d{1,2})[-.\s\uc6d4]*(\d{1,2})[\uc77c]*/;
    const birthMatch = normalizedText.match(birthRegex);
    let birth = '추출불가';
    if (birthMatch) {
      const year = birthMatch[1];
      const month = birthMatch[2].padStart(2, '0');
      const day = birthMatch[3].padStart(2, '0');
      birth = `${year}.${month}.${day}`;
    }

    let name = '';
    const titles = ['위원', '교수', '박사', '님', '대표', '강사', '연구원', '주무관', '사무관', '팀장', '과장', '성명', '이름'];
    const skipWords = ['행정', '관리', '프로필', '파일', '위원', '파일', '전문가', '인적', '사항', '이력서', '복사본', '전문', '역량', '평가', '설명'];

    // 4. 이름 추출 (파일명 우선)
    if (filename) {
      const baseFilename = filename.split('.')[0];
      const parts = baseFilename.split(/[_\s\-()]+/);
      const firstPart = parts[0] ? parts[0].trim() : '';
      let cand = firstPart;
      for (let title of titles) {
        if (cand.endsWith(title)) cand = cand.substring(0, cand.length - title.length);
      }
      if (cand.length >= 2 && cand.length <= 4 && /^[가-힣]+$/.test(cand) && !skipWords.some(word => cand.includes(word))) {
        name = cand;
      }
    }

    // 5. 이름 추출 (섹션 기반)
    if (!name) {
      const nameSectionRegex = /(?:\uc774\s*\ub984|\uc131\s*\uba85)\s*[:|]?\s*([가-힣\s]{2,10})(?:\s|\uc0dd\ub144|\uc18c\uc18d|\ub098\uc774|\uc884\ubb38|\uc9c1\uc5c5|\ud559\ub825|\uc81c\uc804|\uc5f0\ub77d|\uc774\uba54|\uacbd\ub825|\uc804\uacf5|\ud559\uc704|$)/;
      const nameSectionMatch = normalizedText.match(nameSectionRegex);
      if (nameSectionMatch) {
        let rawName = nameSectionMatch[1].trim().replace(/\s/g, '');
        for (let title of titles) {
          if (rawName.endsWith(title)) rawName = rawName.substring(0, rawName.length - title.length);
        }
        if (rawName.length >= 2 && rawName.length <= 5 && !skipWords.some(word => rawName.includes(word))) {
          name = rawName;
        }
      }
    }

    return { 
      name: name || '추출불가', 
      birth: birth || '추출불가', 
      phone: phone || '추출불가', 
      email: email || '추출불가' 
    };
  } catch (err) {
    console.error('[parseProfileText Error] Exception:', err.message);
    return { name: '추출불가', birth: '추출불가', phone: '추출불가', email: '추출불가' };
  }
}

router.post('/profile', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  let filePath = '';
  try {
    if (!req.file) return res.status(400).json({ error: '업로드된 파일이 없습니다.' });

    const decodedName = req.body.realFilename || req.file.originalname;
    filePath = req.file.path;
    const mimeType = req.file.mimetype;
    let extractedText = '';

    console.log(`[Profile Extractor] START: ${decodedName} (${mimeType})`);

    try {
      const lowerPath = filePath.toLowerCase();
      // 1분(60초) 타임아웃 적용
      if (mimeType.startsWith('image/')) {
        console.log('Running Tesseract OCR...');
        const ret = await withTimeout(Tesseract.recognize(filePath, 'kor+eng'), 60000, 'OCR 분석');
        extractedText = ret.data.text;
      } else if (lowerPath.endsWith('.pptx') || lowerPath.endsWith('.docx') || lowerPath.endsWith('.xlsx') || mimeType.includes('presentation')) {
        console.log('Running officeParser...');
        const rawData = await withTimeout(officeParser.parseOffice(filePath), 60000, '오피스 파일 분석');
        extractedText = typeof rawData === 'string' ? rawData : (rawData?.toText ? rawData.toText() : JSON.stringify(rawData));
      } else {
        console.log('Running anyText...');
        extractedText = await withTimeout(anyText.getText(filePath), 60000, '텍스트 추출');
      }
      console.log(`[Profile Extractor] Text extracted (${extractedText.length} chars)`);
    } catch (parseError) {
      console.error(`[Profile Extractor] Parsing TIMEOUT/ERROR for ${decodedName}:`, parseError.message);
      // 타임아웃 발생 시 '식별불가'로 즉시 결과 반환 (무한 루프 방지)
      return res.json({
        success: true,
        message: `파일 분석 중 시간이 초과되었거나 오류가 발생했습니다: ${parseError.message}`,
        data: [{ id: req.file.filename, name: '식별불가', birth: '식별불가', phone: '식별불가', email: '식별불가' }]
      });
    }

    const parsedData = parseProfileText(extractedText, decodedName);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Profile Extractor] DONE in ${duration}s: ${parsedData.name}`);
    
    res.json({
      success: true,
      message: '파일 분석이 완료되었습니다.',
      data: [{
        id: req.file.filename,
        name: parsedData.name,
        birth: parsedData.birth,
        phone: parsedData.phone,
        email: parsedData.email,
      }]
    });
  } catch (error) {
    console.error('[Profile Extractor] Unexpected Error:', error);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  } finally {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});

const BANK_MAP = {
  '국민': 'KB국민은행', '우리': '우리은행', '신한': '신한은행', '하나': '하나은행',
  '농협': 'NH농협은행', '기업': 'IBK기업은행', '수협': 'Sh수협은행', '카카오': '카카오뱅크',
  '토스': '토스뱅크', '케이': '케이뱅크', '우체국': '우체국', '새마을': '새마을금고', '신협': '신협',
  '제일': 'SC제일은행', '씨티': '한국씨티은행', '산업': 'KDB산업은행', '수출입': '한국수출입은행',
  '부산': 'BNK부산은행', '경남': 'BNK경남은행', '대구': 'DGB대구은행', '광주': '광주은행',
  '전북': '전북은행', '제주': '제주은행'
};

function isPossibleRRN(str) {
  try {
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
    return (checkDigit === digits[12]);
  } catch (e) { return false; }
}

function parseBankText(text, dbNames = [], dbProfiles = []) {
  try {
    if (!text || typeof text !== 'string') return { name: '이름식별불가', residentId: '주민번호식별불가', bank: '은행식별불가', account: '계좌식별불가', incomeCategory: '사업 소득' };

    const safeText = text.substring(0, 20000); 

    let normalizedText = safeText.replace(/[\/\,\|]/g, ' ').replace(/[\r\n\t]+/g, ' ').trim();
    const incomeCategory = (normalizedText.includes('기타 소득') || normalizedText.includes('기타')) ? '기타 소득' : '사업 소득';

    let residentId = '주민번호식별불가';
    let account = '계좌식별불가';
    let bankName = '은행식별불가';
    let name = '이름식별불가';

    const rrnRegex = /(\d{6})[ \-\.]?(\d{7})/g;
    let rrnMatch;
    let residentIdRaw = null;

    let guardCount = 0;
    while ((rrnMatch = rrnRegex.exec(normalizedText)) !== null && guardCount < 10) {
      guardCount++;
      if (isPossibleRRN(rrnMatch[0])) {
        residentId = rrnMatch[1] + '-' + rrnMatch[2];
        residentIdRaw = rrnMatch[0];
        break; 
      }
    }

    let textForAccount = normalizedText;
    if (residentIdRaw) {
      textForAccount = textForAccount.replace(residentIdRaw, ' [MASKED_RRN] ');
    }
    textForAccount = textForAccount.replace(/01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/g, ' [MASKED_PHONE] ');

    const mergedNumbersMatch = textForAccount.match(/[\d\-\.\s]{4,}/g) || [];
    let longestDigits = '';
    
    for (let block of mergedNumbersMatch) {
      const clean = block.trim();
      const digitsOnly = clean.replace(/[^\d]/g, '');
      if (digitsOnly.length >= 6) {
        if (digitsOnly.length >= longestDigits.length) {
          longestDigits = digitsOnly;
          account = clean.replace(/\s+/g, ' '); 
        }
      }
    }

    let bestNameMatch = '';
    const rrnBirth = (residentId !== '주민번호식별불가') ? residentId.substring(0, 6) : '';

    if (dbProfiles && Array.isArray(dbProfiles)) {
      for (const profile of dbProfiles) {
        if (!profile.name || profile.name.length < 2) continue;
        if (normalizedText.includes(profile.name)) {
          if (rrnBirth && profile.birth && profile.birth !== '추출불가') {
            const profileBirth = profile.birth.replace(/[^\d]/g, '').substring(2);
            if (rrnBirth === profileBirth) {
              name = profile.name;
              bestNameMatch = name;
              break;
            }
          }
          if (!bestNameMatch) bestNameMatch = profile.name;
        }
      }
    }
    
    if (bestNameMatch) name = bestNameMatch;

    const bankKeys = Object.keys(BANK_MAP);
    for (const key of bankKeys) {
      if (normalizedText.includes(key)) {
        bankName = BANK_MAP[key];
        break;
      }
    }

    if (name === '이름식별불가') {
      const titles = ['위원', '교수', '박사', '님', '대표', '강사', '연구원', '주무관', '사무관', '팀장', '과장', '성명', '이름'];
      const potentialNames = normalizedText.match(/[가-힣]{2,6}/g) || [];
      const excludeWords = ['정보', '송부', '감사', '감사합니다', '드립니다', '입금', '바랍니다', '부탁', '계좌', '번호', '주민', '소득', '은행', '뱅크'];
      
      for (let candidate of potentialNames) {
        let cleanName = candidate;
        for (let title of titles) {
          if (cleanName.endsWith(title)) cleanName = cleanName.substring(0, cleanName.length - title.length);
        }
        if (cleanName.length >= 2 && cleanName.length <= 4 && !excludeWords.some(ex => cleanName.includes(ex)) && !bankKeys.some(kb => cleanName.includes(kb))) {
          name = cleanName;
          break;
        }
      }
    }

    return { name, residentId, isValidRRN: residentId !== '주민번호식별불가', bank: bankName, account, incomeCategory };
  } catch (err) {
    console.error('[parseBankText Error] Exception:', err.message);
    return { name: '이름식별불가', residentId: '주민번호식별불가', bank: '은행식별불가', account: '계좌식별불가', incomeCategory: '사업 소득' };
  }
}

router.post('/bank', (req, res) => {
  try {
    const { text, dbNames, masterDbNames, dbProfiles } = req.body;
    if (!text || typeof text !== 'string') return res.status(400).json({ error: '분석할 텍스트가 필요합니다.' });

    console.log(`[Bank Extractor] Received analysis request. (Length: ${text.length})`);
    const extracted = parseBankText(text, dbNames || masterDbNames || [], dbProfiles || []);

    res.json({
      success: true,
      message: '입금 정보 추출이 완료되었습니다.',
      data: [{
         id: `bank_${Date.now()}`,
         name: extracted.name,
         residentId: extracted.residentId,
         isValidRRN: extracted.isValidRRN,
         bank: extracted.bank,
         account: extracted.account,
         incomeCategory: extracted.incomeCategory
      }]
    });
  } catch (error) {
    console.error('[Bank Extractor] Error:', error);
    res.status(500).json({ error: '텍스트 분석 중 서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
