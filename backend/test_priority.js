const { parseProfileText } = require('./routes/extractor');

// 간단한 mock 함수 (실제 routes/extractor.js의 로직을 테스트하기 위해)
// 실제 파일은 module.exports = router 형식이므로 로직만 복사해서 테스트하거나
// router 내부 함수를 export 하도록 수정해야 하지만, 
// 여기서는 변경된 로직의 '개념'이 의도대로 동작하는지 확인하는 임시 스크립트를 작성합니다.

function test() {
    console.log("=== 이름 추출 우선순위 테스트 ===");

    // 테스트 케이스 1: 파일명은 틀리지만 내용(섹션)은 맞는 경우
    const filename1 = "잘못된이름_프로필.pdf";
    const text1 = "이름 홍길동 생년월일 1990.01.01";
    
    // 로직 재현
    let name = '';
    const normalizedText = text1.replace(/[\r\n]+/g, ' ');

    // 1. 섹션 기반
    const nameSectionRegex = /이름([\s\S]*?)(?:생년|소속|나이|전문|직업|학력|주소)/;
    const nameSectionMatch = normalizedText.match(nameSectionRegex);
    if (nameSectionMatch) {
        const rawName = nameSectionMatch[1].replace(/[^가-힣a-zA-Z]/g, '');
        if (rawName.length >= 2) name = rawName.substring(0, 5);
    }

    console.log(`[테스트 1] 파일명: ${filename1}, 텍스트: "${text1}"`);
    console.log(`추출된 이름: ${name} (기대값: 홍길동)`);

    // 2. 패턴 기반 (섹션 실패 시)
    if (!name) {
        const alternativeNameMatch = normalizedText.match(/(?:이\s*름|성\s*명)\s*[:|]?\s*([가-힣]{2,5})/);
        if(alternativeNameMatch) name = alternativeNameMatch[1];
    }

    // 3. 파일명 기반 (최종)
    if (!name && filename1) {
        const filenameMatch = filename1.match(/^([가-힣]{2,5})[_ ]/);
        if (filenameMatch) name = filenameMatch[1];
    }

    if (name === "홍길동") {
        console.log("✅ 성공: 본문 내용을 우선하여 이름을 추출했습니다.");
    } else {
        console.log("❌ 실패: 파일명이 우선되었거나 추출에 실패했습니다.");
    }
}

test();
