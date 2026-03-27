## 한눈에 보기

- visible brand를 `Tripass`로 변경함
- 홈 상단 헤더를 `워드마크 + 텍스트 링크 + 로그인 버튼` 구조로 정리함
- `내 취향`은 `여행 기록` 계열 표현으로 교체함
- 앱 제목, manifest, 아이콘 문자도 새 브랜드에 맞춤

## 변경 파일

- `src/lib/brand.ts`
- `src/components/trip-compass/experience-shell.tsx`
- `src/components/trip-compass/home/landing-page.tsx`
- `src/components/trip-compass/account-experience.tsx`
- `src/components/trip-compass/auth-experience.tsx`
- `src/components/trip-compass/destination-detail-experience.tsx`
- `src/app/layout.tsx`
- `src/app/manifest.ts`
- `src/app/icon.tsx`
- `src/app/apple-icon.tsx`
- `src/app/globals.css`
- `tests/e2e/smoke.spec.ts`

## 결과

- 홈 첫 화면 상단이 카드 더미처럼 보이지 않게 바뀜
- 로그인 버튼이 상단 헤더에서 바로 보임
- 브랜드명이 여행 서비스처럼 더 직접적으로 읽히도록 정리됨
