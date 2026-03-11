---
description: 최신 코드를 GitHub에 푸시하여 Netlify와 Render.com에 자동 배포하는 워크플로우
---

수정된 모든 코드가 웹사이트에 즉시 반영되도록 다음 단계를 수행합니다.

// turbo-all
1. 현재 변경 사항을 Git 스테이지에 추가합니다.
   `git add .`
2. 반영된 내용을 설명하는 메시지와 함께 커밋합니다.
   `git commit -m "update: reflect latest changes to production"`
3. GitHub 저장소의 main 브랜치로 푸시합니다.
   `git push origin main`

이 작업이 완료되면 Netlify와 Render.com이 자동으로 새 버전을 빌드하여 약 1~2분 내에 실시간 사이트에 반영합니다.
