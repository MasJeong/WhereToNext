# SooGo 이슈 해결 기록

이 문서는 반복해서 발생할 수 있는 문제와 검증된 해결 방법을 누적하는 운영 기록입니다.
AI와 사람이 다음 작업 전에 먼저 읽고, 이미 해결된 패턴을 재사용할 수 있도록 유지합니다.

## 기록 원칙

- 실제로 재현하거나 확인한 문제만 기록합니다.
- 추측이나 미확인 원인은 적지 않습니다.
- 해결 후에는 어떤 방식으로 검증했는지 함께 남깁니다.
- 같은 문제가 다시 발생하면 먼저 이 문서를 확인합니다.

## 작성 템플릿

```md
### YYYY-MM-DD - 짧은 이슈 제목
- 증상: 사용자가 본 현상 또는 에러 메시지
- 원인: 확인된 원인
- 해결: 적용한 해결 방법
- 검증: 재현, 테스트, 빌드 등 확인 방법
- 참고 파일: 관련 파일 경로
```

## 기록 목록

### 2026-03-29 - 로그인 후에도 상단에서 `로그인됨`이 한눈에 드러나지 않던 문제
- 증상: 로그인 뒤 헤더가 `내 여행 기록`과 `로그아웃`만 보여, 다른 플랫폼들처럼 현재 계정 상태가 직관적으로 느껴지지 않았음.
- 원인: 헤더 액션이 상태를 표현하는 `프로필 cluster` 없이 링크/버튼 조합만 두고 있어, 로그인 성공 여부를 읽어야만 이해할 수 있었음.
- 해결: Booking/Airbnb 계열의 우측 프로필 cluster 패턴과 Material top app bar 계정 액션 방향을 참고해, 로그인 후에는 이름 이니셜, 사용자 이름, `로그인됨` 상태 라벨을 묶은 profile chip을 노출하고 `로그아웃`은 보조 액션으로 내렸음.
- 검증: `npx eslint src/components/trip-compass/shell-auth-nav.tsx tests/e2e/auth/social-login.spec.ts`, `npm run build`, `npx playwright test tests/e2e/auth/social-login.spec.ts -g "mock google login redirects to account" --project=chromium`
- 참고 파일: `src/components/trip-compass/shell-auth-nav.tsx`, `tests/e2e/auth/social-login.spec.ts`, `https://m3.material.io/components/top-app-bar/overview`

### 2026-03-29 - 여행 기록이 일회성 등록에 가깝고 수정 진입이 없어 다시 다듬기 어려웠던 문제
- 증상: 여행 기록을 한 번 저장한 뒤에는 리스트에서 바로 수정할 수 없었고, 기록 추가도 step은 있었지만 빠른 날짜 제안이나 자동 진행이 없어 손이 많이 갔음.
- 원인: `/account/history/new`가 생성 전용 플로우로만 설계되어 있었고, 리스트 카드에는 삭제만 있고 수정 진입이 없었음. step 입력도 모든 단계를 같은 강도로 다뤄 등록 속도를 더 줄이지 못했음.
- 해결: Polarsteps의 `steps can be edited after publishing` 패턴과 Apple Journal의 `journaling suggestions` 패턴을 참고해, 리스트 카드에 `수정` 액션을 추가하고 `/account/history/[historyId]/edit` 화면으로 이어지게 했음. step 화면에는 빠른 목적지 선택, 빠른 날짜 제안, rating 자동 진행, 메모 제안 문구를 더해 등록 부담을 줄였음.
- 검증: `npx eslint src/components/trip-compass/account-history-create-experience.tsx src/components/trip-compass/account-experience.tsx 'src/app/account/history/[historyId]/edit/page.tsx' src/lib/profile/service.ts src/lib/test-ids.ts tests/e2e/recommendation-flow.spec.ts`, `npx vitest run tests/unit/auth/account-schema.spec.ts tests/unit/domain/recommendation-query.spec.ts`, `npm run build`, `npx playwright test tests/e2e/recommendation-flow.spec.ts -g "lets users edit an existing trip history entry from the list|allows social sign-in, trip history save, and personalized recommendations" --project=chromium`
- 참고 파일: `src/components/trip-compass/account-history-create-experience.tsx`, `src/components/trip-compass/account-experience.tsx`, `src/app/account/history/[historyId]/edit/page.tsx`, `tests/e2e/recommendation-flow.spec.ts`, `https://support.polarsteps.com/article/71-what-are-steps-and-how-do-i-add-or-edit-them`, `https://apps.apple.com/us/app/journal/id6447391597`

### 2026-03-29 - 여행 기록 화면이 입력과 조회, 저장한 추천이 한 화면에 섞여 첫 행동이 늦어지던 문제
- 증상: 계정 화면에서 취향 설정, 새 기록 입력, 저장한 추천, 기존 기록이 한 번에 보여 무엇을 먼저 해야 하는지 판단이 늦었고, 기록 입력도 한 화면에 길게 늘어져 모바일에서 부담이 컸음.
- 원인: 기존 `account-experience`가 프로필 관리 화면 성격과 기록 작성 화면 성격을 함께 안고 있었고, 여행 기록 생성도 긴 단일 폼으로 묶여 있었음. 기록 데이터에는 사진과 메모 필드도 없어 회고용 UI 확장이 어려웠음.
- 해결: 계정 메인을 `여행 기록 리스트 / 저장한 추천 / 추천 모드` 탭 구조로 재설계하고, `기록 추가`는 `/account/history/new` 별도 step 화면으로 분리했음. 여행 기록 계약과 저장소에 `memo`, `image`를 추가하고, 대표 이미지 1장 업로드를 카드 UI와 함께 저장할 수 있게 맞췄음.
- 검증: `npm run lint`, `npm run test:unit`, `npm run build`, `npm run test:e2e`
- 참고 파일: `src/components/trip-compass/account-experience.tsx`, `src/components/trip-compass/account-history-create-experience.tsx`, `src/app/account/page.tsx`, `src/app/account/history/new/page.tsx`, `src/lib/domain/contracts.ts`, `src/lib/profile/service.ts`, `src/lib/db/schema.ts`, `drizzle/0005_sweet_spacker_dave.sql`

### 2026-03-29 - 로그인 후에도 헤더가 계속 `로그인`으로 보여 현재 상태와 행동이 어긋나던 문제
- 증상: Google/Kakao/Apple 소셜 로그인으로 계정 화면까지 들어간 뒤에도 상단 헤더 CTA가 계속 `로그인`으로 남아 있어, 이미 로그인된 상태인지 한눈에 알기 어려웠음.
- 원인: 상단 `ExperienceShell`이 서버 렌더 기준의 정적 네비게이션만 가지고 있었고, 클라이언트 세션을 조회해 헤더 액션을 바꾸는 단계가 없었음.
- 해결: 헤더 인증 액션을 `ShellAuthNav` 클라이언트 컴포넌트로 분리하고 `/api/auth/session` 결과에 따라 비로그인 시 `로그인`, 로그인 시 `로그아웃`과 `내 여행 기록`을 보여주도록 정리했음.
- 검증: `npx eslint src/components/trip-compass/experience-shell.tsx src/components/trip-compass/shell-auth-nav.tsx tests/e2e/auth/social-login.spec.ts`, `npm run build`, `npx playwright test tests/e2e/auth/social-login.spec.ts -g "mock google login redirects to account" --project=chromium`
- 참고 파일: `src/components/trip-compass/experience-shell.tsx`, `src/components/trip-compass/shell-auth-nav.tsx`, `tests/e2e/auth/social-login.spec.ts`

### 2026-03-29 - 결과 페이지 우측 정보 컬럼이 카드와 설명이 많아 한눈에 결정하기 어려운 문제
- 증상: YouTube 카드 옆 우측 컬럼에서 라벨, 큰 제목, 한 줄 추천 이유, 설명문, 3개 fact 카드, CTA 제목과 버튼이 연속으로 쌓여 첫 판단 전에 읽어야 할 양이 많았음.
- 원인: 정보의 품질은 좋았지만, `설명용 구조`와 `결정용 구조`가 분리되지 않아 우측 컬럼이 좋은 정보 과잉 상태였음.
- 해결: 토스가 공식적으로 강조하는 `쉽고 간편한 경험`, `복잡한 문제를 단순하게`, `핵심 행동 우선` 방향을 참고해 우측 컬럼에서 라벨을 덜고, 설명문을 2줄로 줄이고, fact를 카드 3개 대신 행 3개로 바꾸고, CTA는 2개를 우선 노출하도록 정리했음. YouTube 카드 영역은 유지했음.
- 검증: `npx eslint src/components/trip-compass/home/result-page.tsx src/components/trip-compass/home-experience.tsx tests/e2e/recommendation-flow.spec.ts`, `npm run build`, `npx playwright test tests/e2e/recommendation-flow.spec.ts -g "shows the lead summary and primary actions on the lead card|shows a social video block only for the lead recommendation|keeps recommendation results visible when social video is unavailable" --project=chromium`
- 참고 파일: `src/components/trip-compass/home/result-page.tsx`, `src/components/trip-compass/home-experience.tsx`, `https://toss.im/tossfeed/article/toss-public-services-data%3Fsrsltid%3DAfmBOorIDJg7kqzOAsVeuz8eDYYc0DmQ40WoLoJnzNLYN7DDZCAf3H5S`, `https://brand.toss.im/article/brand-story`

### 2026-03-29 - 결과 페이지에서 `자연` 분류어가 추상적으로 보여 구매 판단 속도를 늦추던 문제
- 증상: 결과 페이지 태그와 요약 카드에서 `자연`이 반복되었지만, 실제로는 사용자가 기대하는 장면이 `하이킹`, `해변`, `바깥 풍경`, `야외 일정`처럼 더 구체적이라 첫 판단이 추상적으로 읽혔음.
- 원인: 내부 vibe taxonomy의 `nature` 값을 결과 페이지에도 그대로 노출해, 탐색용 데이터 분류와 사용자-facing 구매 언어가 분리되지 않았음.
- 해결: 주요 여행/경험 플랫폼이 `nature`보다 `Outdoor Activities`, `Nature and outdoors`처럼 활동과 장면 중심 표현을 쓰는 점을 참고해, 결과 페이지 범위에서는 `nature`를 `아웃도어`로 번역하고 필터 설명도 `해변·풍경` 중심으로 정리했음. YouTube 카드 영역은 유지했음.
- 검증: `npx eslint src/lib/trip-compass/presentation.ts src/components/trip-compass/home-experience.tsx`, `npx vitest run tests/unit/domain/recommendation-query.spec.ts`, `npm run build`
- 참고 파일: `src/lib/trip-compass/presentation.ts`, `src/components/trip-compass/home-experience.tsx`, `https://www.tripadvisor.com/Attractions-g804484-Activities-c61-Petrovac_Budva_Municipality.html`, `https://www.getyourguide.com/california-l560/outdoor-activities-tc1093/`, `https://www.airbnb.com/new-york-ny/things-to-do/nature-and-outdoors`

### 2026-03-28 - 결과 페이지의 대표 이미지가 핵심 판단보다 먼저 보이던 문제
- 증상: 추천 결과 첫 화면에서 좌측 대표 이미지가 시선을 먼저 가져가고, 실제로 가장 중요한 YouTube 영상과 추천 이유는 한 단계 뒤에 읽혀 첫 인상이 분산됐음.
- 원인: 기존 `ResultPage`가 이미지 중심 hero와 텍스트 설명을 나누는 구조였고, 소셜 비디오 패널은 텍스트 컬럼 아래 보조 블록처럼 배치돼 있었음.
- 해결: 결과 상단을 `영상 좌측 / 텍스트 우측` 퍼널로 재구성하고, 소셜 비디오 카드를 대표 콘텐츠로 승격했다. 우측 정보는 도시명, 한 줄 추천 이유, 태그, 결정 카드 순서로 정리했다.
- 검증: `npx eslint src/components/trip-compass/home/result-page.tsx src/components/trip-compass/home-experience.tsx src/components/trip-compass/social-video-panel.tsx`, `npm run test:unit`, `npm run build`, `npx playwright test tests/e2e/recommendation-flow.spec.ts --config .playwright-existing-4010.config.cjs --project=chromium`
- 참고 파일: `src/components/trip-compass/home/result-page.tsx`, `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/social-video-panel.tsx`

### 2026-03-28 - 추천 결과 social video 선택 기준이 문서마다 흩어져 혼동됨
- 증상: social-video 계획을 읽을 때 YouTube-first, 한국어/한국인 업로드 우선, short-form 우선, 일반 영상 fallback 허용, fail-soft 동작이 한 곳에 모여 있지 않아 구현 기준이 흔들릴 수 있었음.
- 원인: 기능 계획과 환경 예시, README가 아직 social-video 전용 키와 선택 정책을 함께 설명하지 않았음.
- 해결: `social-video-results` 계획을 기준으로 README, `.env.example`, 그리고 visible audit trail을 추가해 YouTube-first / 한국어 우선 / short-form 선호 / fallback 허용 / fail-soft 정책을 한 번에 확인할 수 있게 정리했음.
- 검증: `README.md`, `.env.example`, `memory/2026-03-28-social-video-results/*` 반영 확인
- 참고 파일: `README.md`, `.env.example`, `memory/2026-03-28-social-video-results/plan.md`, `memory/2026-03-28-social-video-results/changes.md`, `memory/2026-03-28-social-video-results/verification.md`

### 2026-03-27 - 홈 헤더가 카드형으로 보여 여행 플랫폼 인상이 약함
- 증상: 홈 상단에서 `내 취향`, `추천 우선` 같은 pill/card 요소와 원형 로고가 함께 보이면서 여행 플랫폼 헤더보다 도구형 UI처럼 읽혔음.
- 원인: `ExperienceShell` topbar가 브랜드, 상태, 이동 링크를 모두 pill 성격의 요소로 표현하고 있었고, visible brand 이름도 여행 서비스 카테고리를 바로 떠올리기 어려웠음.
- 해결: `Tripadvisor`, `Trip.com`, `Triple`의 상단 구조를 참고해 홈 헤더를 워드마크 + 텍스트 링크 + 로그인 버튼 중심으로 재정리했음. visible brand는 최종적으로 `떠나볼래?`로 맞췄고, 시스템용 짧은 이름은 `떠나볼래`로 분리해 홈/메타/manifest/title에 반영했음. `내 취향`은 사용자-facing 문맥에서 `여행 기록` 계열 표현으로 정리했음. 글자형 임시 로고는 헤더와 앱 아이콘 모두에서 나침반/핀 계열 심볼로 교체했음.
- 검증: `npm run lint`, `npm run test:unit`, `npm run build`, `npx playwright test tests/e2e/smoke.spec.ts --project=chromium`
- 참고 파일: `src/lib/brand.ts`, `src/components/trip-compass/experience-shell.tsx`, `src/components/trip-compass/account-experience.tsx`, `src/components/trip-compass/auth-experience.tsx`, `src/components/trip-compass/destination-detail-experience.tsx`, `src/app/layout.tsx`, `src/app/manifest.ts`, `tests/e2e/smoke.spec.ts`

### 2026-03-27 - 홈 첫 화면의 브랜드 블루 존재감 부족
- 증상: 전역 토큰을 블루 계열로 바꾼 뒤에도 홈 첫 화면은 거의 흰색으로만 보여 브랜드 컬러가 잘 느껴지지 않았음.
- 원인: 실제 첫 화면은 `landing-page.tsx`의 단순 카피, 중립적인 `hero-animation.tsx`, 작은 CTA 중심이라 블루 토큰이 화면 면적에서 거의 드러나지 않았음.
- 해결: 레이아웃은 유지한 채 랜딩 상단에 브랜드 배지와 신뢰 스트립을 추가하고, CTA를 블루 그라데이션과 그림자 중심으로 강화했음. `hero-animation.tsx`는 하늘색에서 파란색으로 이어지는 비주얼 면적과 배지를 늘렸고, `progress-bar.tsx`와 전역 포커스/선택 토큰도 같은 블루 계열로 맞췄음.
- 검증: `npm run lint`, `npm run test:unit`, `npm run build`
- 참고 파일: `src/components/trip-compass/home/landing-page.tsx`, `src/components/trip-compass/home/hero-animation.tsx`, `src/components/trip-compass/home/progress-bar.tsx`, `src/app/globals.css`

### 2026-03-27 - 홈 헤더 아래 중복 안내 영역 정리
- 증상: 홈 상단 헤더 아래에 브랜드 배지와 `지금 바로 추천 · 로그인 없이 저장 · 링크 공유와 비교` 스트립이 연달아 붙어 있어, 핵심 헤드라인 전에 중복 정보가 먼저 보였음.
- 원인: 브랜드 존재감을 강화하는 과정에서 헤더가 이미 브랜드 역할을 하는데도 landing 상단에 같은 성격의 보조 영역을 추가했음.
- 해결: `Tripadvisor`, `Trip.com`처럼 헤더 아래는 바로 핵심 메시지와 행동으로 이어지도록, landing 상단의 브랜드 배지와 신뢰 스트립을 제거했음.
- 검증: `npm run lint`, `npm run build`
- 참고 파일: `src/components/trip-compass/home/landing-page.tsx`

### 2026-03-27 - 로그인 화면이 설명 패널과 카드가 많아 집중도가 떨어짐
- 증상: 로그인 화면이 좌측 설명 패널, 3개 정보 카드, 하단 안내 박스까지 겹쳐 한 번에 읽어야 할 정보가 많았고, 참고 로그인 화면들보다 훨씬 무겁게 보였음.
- 원인: 로그인 화면에 제품 설명과 기능 안내를 과하게 넣으면서, 실제 필요한 `로그인/회원가입` 행동보다 주변 정보가 먼저 보이게 되었음.
- 해결: 참고 이미지처럼 `중앙 집중형 단일 컬럼` 구조로 재설계했음. 좌측 패널과 정보 카드를 제거하고, 작은 비주얼, 짧은 헤드라인, 모드 전환, 폼, 한 줄 안내만 남겼음.
- 검증: `npm run lint`, `npm run test:unit`, `npm run build`
- 참고 파일: `src/components/trip-compass/auth-experience.tsx`

### 2026-03-27 - 홈 메인 화면 상단 헤더 복원
- 증상: 홈 첫 화면은 bare shell로 렌더링되어 상단 헤더와 로그인 버튼이 보이지 않았음.
- 원인: `home-experience.tsx`가 `ExperienceShell`에 `hideTopbar`를 전달해 홈에서만 공통 topbar를 숨기고 있었음.
- 해결: 홈에서도 공통 topbar가 보이도록 `hideTopbar`를 제거했고, smoke e2e도 현재 계약에 맞춰 헤더와 로그인 버튼이 보이는지 검증하도록 수정했음.
- 검증: `npm run lint`, `npm run test:unit`, `npm run build`, `npx playwright test tests/e2e/smoke.spec.ts --project=chromium`
- 참고 파일: `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/experience-shell.tsx`, `tests/e2e/smoke.spec.ts`

### 2026-03-27 - manifest와 앱 아이콘 404
- 증상: 브라우저 콘솔에서 `/manifest.webmanifest`, `/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png` 요청이 404로 실패했음.
- 원인: `src/app/layout.tsx`에 manifest와 아이콘 경로 메타는 있었지만, 실제 정적 파일이나 App Router special file이 없었음.
- 해결: 정적 `png` 파일을 따로 두지 않고 `src/app/manifest.ts`, `src/app/icon.tsx`, `src/app/apple-icon.tsx`를 추가해 Next가 manifest와 앱 아이콘을 직접 생성하도록 바꿨고, `layout.tsx`에서는 없는 정적 아이콘 경로 참조를 제거했음.
- 검증: `npm run lint`, `npm run test:unit`, `npm run build`
- 참고 파일: `src/app/layout.tsx`, `src/app/manifest.ts`, `src/app/icon.tsx`, `src/app/apple-icon.tsx`

### 2026-03-27 - PR CI Playwright E2E를 현재 UI 계약과 브라우저 설치 상태에 맞춤
- 증상: 대표 추천 보강과 홈 퍼널 변경 후 PR의 `Playwright E2E` 체크가 다수 실패해 머지가 막혔음.
- 원인: 일부 e2e가 예전 랜딩 헤드라인, lead card copy, 저장 후 share-link 위치를 그대로 기대하고 있었고, CI는 `webkit` 프로젝트를 실행하면서도 브라우저 설치 단계에서 `chromium`만 설치하고 있었음.
- 해결: 현재 UI 기준으로 smoke/recommendation/ios acquisition e2e 기대값을 업데이트했고, share-link는 형제 위치 가정 대신 실제 `href` 기준으로 찾도록 바꿨음. CI workflow는 `chromium webkit`을 함께 설치하도록 수정했음.
- 검증: `npm run lint`, `npm run test:unit`, `npm run build`
- 참고 파일: `tests/e2e/smoke.spec.ts`, `tests/e2e/recommendation-flow.spec.ts`, `tests/e2e/ios-acquisition-flow.spec.ts`, `.github/workflows/ci.yml`

### 2026-03-27 - 대표 추천 외부 여행 보조 데이터 레이어 추가
- 증상: 결과 화면과 저장 링크 복원 화면에서 대표 추천을 결정하는 데 필요한 실용 정보가 부족해, 이미지, 날씨, 지도, 환율, 주변 장소를 짧게 덧붙이는 요구가 생김.
- 원인: 기존 제품은 결정형 추천 결과와 분위기 근거, 저장/비교 흐름은 안정적이었지만 외부 여행 데이터 공급자를 묶는 서버 집계 레이어와 공용 UI가 없었음.
- 해결: 대표 추천 1곳만 대상으로 Unsplash, Open-Meteo, Google Maps Platform, exchangerate.host를 조합하는 fail-soft 집계 레이어를 추가했고, `/api/recommendations`, 목적지 상세, 저장 링크 복원 경로가 같은 supplement를 재사용하도록 맞췄음. 결과 화면은 이미지 우선, 날씨, 환율, 작은 지도, 주변 장소 순으로 얇게 보이도록 정리했고, 공유 링크를 열 때는 저장된 추천 결과 위에 외부 데이터만 다시 조회하도록 구성했음. 숙소 가격 범위는 v1에서 제외했음.
- 검증: `npx tsc --noEmit`, `npm run lint`, `npx vitest run tests/unit/api/recommendations-route.spec.ts tests/unit/travel-support/service.spec.ts`
- 참고 파일: `src/app/api/recommendations/route.ts`, `src/lib/domain/contracts.ts`, `src/lib/travel-support/service.ts`, `src/lib/trip-compass/route-data.ts`, `src/components/trip-compass/travel-support-panel.tsx`, `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/destination-detail-experience.tsx`, `.env.example`, `README.md`

### 2026-03-26 - 홈 funnel 리디자인 후 e2e contract copy/motion 정렬
- 증상: 외부 travel funnel 프롬프트 기준으로 홈 퍼널을 리디자인한 뒤 Playwright recommendation flow에서 저장 snapshot 복원과 lead card day-flow 검증이 브라우저 전반에서 실패했고, Oracle 리뷰에서도 `framer-motion` 미사용과 white-first 정렬 부족이 남아 있었음.
- 원인: 리디자인 과정에서 e2e가 기대하는 링크 라벨 `공유 페이지 보기`와 lead card heading `Day-flow`가 더 짧은 copy로 바뀌었고, 외부 프롬프트의 명시 요구사항인 `framer-motion` 기반 전환은 아직 반영되지 않았음.
- 해결: 홈 퍼널 UI는 유지하되 e2e contract copy를 정확히 복구하고, `framer-motion`을 추가해 landing, question, result, progress, hero에 최소 전환을 넣었으며, stale recommendation response가 restart/reopen 뒤에 늦게 state를 덮지 않도록 request invalidation guard를 추가했음. funnel color token도 더 white-first로 조정했음.
- 검증: `npm run lint`, `npx vitest run tests/unit/trip-compass/step-answer-adapter.spec.ts`, `npm run build`, `npx playwright test tests/e2e/recommendation-flow.spec.ts`
- 참고 파일: `package.json`, `src/app/globals.css`, `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/home/landing-page.tsx`, `src/components/trip-compass/home/hero-animation.tsx`, `src/components/trip-compass/home/step-question.tsx`, `src/components/trip-compass/home/progress-bar.tsx`, `src/components/trip-compass/home/result-page.tsx`, `tests/e2e/recommendation-flow.spec.ts`

### 2026-03-26 - 홈 funnel UI 리빌드 중 snapshot share URL 회귀
- 증상: 홈 UI 리빌드 이후 Playwright production e2e에서 저장 snapshot 생성 API는 200으로 성공했지만 `saved-snapshot-0`이 나타나지 않았고, 저장, 비교, clipboard fallback 관련 흐름이 연쇄적으로 실패했음.
- 원인: `home-experience.tsx`가 snapshot share URL을 만들 때 `window.location.origin` 대신 `buildPublicUrl()`를 사용하도록 바뀌었고, 이 helper는 production browser runtime에서 `NEXT_PUBLIC_APP_ORIGIN`이 없으면 throw 하도록 설계돼 있었음. 그 결과 저장 API 응답 직후 client-side 예외가 발생해 saved snapshot state가 반영되지 않았음.
- 해결: 홈 funnel UI는 유지하되, snapshot share URL 생성만 브라우저 현재 origin 기반으로 되돌려 저장, 공유, 비교 state 반영을 복구했음.
- 검증: `npx eslint "src/components/trip-compass/home-experience.tsx"`, `npx vitest run tests/unit/api/recommendations-route.spec.ts tests/unit/domain/recommendation-query.spec.ts`, `npm run build`, `npx playwright test tests/e2e/recommendation-flow.spec.ts`
- 참고 파일: `src/components/trip-compass/home-experience.tsx`, `src/lib/runtime/url.ts`, `tests/e2e/recommendation-flow.spec.ts`

### 2026-03-25 - iOS launch groundwork completed but native shell blocked by export/Xcode prerequisites
- 증상: `ios-launch-path` 작업 중 PWA, share URL, route restore, WebKit, shell CORS까지는 정리됐지만 실제 Capacitor iOS shell 생성 단계에서 repo가 production-safe static `webDir`를 만들지 못했고, 로컬 환경도 full Xcode/simulator를 제공하지 않았음.
- 원인: 현재 Next 16 App Router 구조는 일반 `next build`만으로 Capacitor가 기대하는 bundled HTML asset target을 만들지 않으며, dynamic routes, API, middleware를 유지한 상태라 native shell target을 별도로 설계해야 함. 또한 이 환경은 `/Library/Developer/CommandLineTools`만 활성화돼 있어 `xcodebuild` simulator 검증이 불가능했음.
- 해결: iOS groundwork는 계속 진행해 WebKit, Mobile Safari 검증, canonical public/API URL 분리, PWA metadata, clipboard/retry fallback, shell-origin CORS, route-data/view extraction, shell-mode CTA guard까지 반영했고, native shell / universal links 단계는 architecture + environment blocker로 명시적으로 중단했음.
- 검증: `npm run lint`, `npm run build`, `npx vitest run tests/unit/runtime/url.spec.ts`, `npx playwright test tests/e2e/recommendation-flow.spec.ts -g "shows a retry path when recommendation loading fails|shows a manual-copy fallback when snapshot clipboard copy fails|shows a manual-copy fallback when detail clipboard copy fails"`, `npx playwright test tests/e2e/smoke.spec.ts -g "keeps auth and account navigation in standard web mode"`, `NEXT_PUBLIC_IOS_SHELL=true npx playwright test tests/e2e/smoke.spec.ts -g "hides auth and account navigation in ios shell mode"`, runtime shell-origin CORS probe with `Origin: capacitor://localhost`
- 참고 파일: `src/lib/runtime/url.ts`, `src/lib/runtime/shell.ts`, `src/lib/security/cors.ts`, `src/lib/trip-compass/route-data.ts`, `src/components/trip-compass/snapshot-restore-view.tsx`, `src/components/trip-compass/compare-restore-view.tsx`, `src/components/trip-compass/experience-shell.tsx`, `src/app/layout.tsx`, `src/app/api/recommendations/route.ts`, `src/app/api/snapshots/route.ts`, `src/app/api/snapshots/[snapshotId]/route.ts`, `src/app/api/auth/session/route.ts`, `docs/ios-release-preflight.md`

### 2026-03-24 - Triple에 더 가까운 모바일 리듬으로 메인 표면 밀도 재조정
- 증상: 기존 리빌드 이후에도 홈, 결과, 상세, 비교, auth, account가 warm editorial 톤은 유지했지만 질문 화면의 진행 크롬, 카드 높이, 보조 카피, 정보 묶음이 여전히 두꺼워 모바일 기준 Triple류 앱보다 덜 촘촘하고 덜 즉각적으로 느껴졌음.
- 원인: 공통 shell, 카드 반경과 그림자, 홈 질문 카드, 결과 카드, 상세 섹션, 비교 표, auth/account 표면이 전반적으로 넉넉한 편집형 spacing과 다중 설명 블록을 유지해 한 화면 한 판단 리듬이 약했음.
- 해결: `globals.css`에서 radius, shadow와 공통 compact stack 패턴을 조정하고, `experience-shell`을 더 낮은 상단 chrome으로 줄였으며, 홈은 2열 답변 그리드와 compact progress 구조로, 결과 카드는 summary-first와 짧은 stacked section 구조로, 상세, 비교, auth, account는 더 짧은 코어 정보 블록과 낮은 카피 밀도로 재정렬했음. 기존 selector와 추천, 저장, 비교 계약은 유지했음.
- 검증: `npm run lint`, `npm run test:unit`, `npm run build`, `npm run test:e2e`
- 참고 파일: `src/app/globals.css`, `src/components/trip-compass/experience-shell.tsx`, `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/recommendation-card.tsx`, `src/components/trip-compass/destination-detail-experience.tsx`, `src/components/trip-compass/compare-board.tsx`, `src/components/trip-compass/account-experience.tsx`, `src/components/trip-compass/auth-experience.tsx`

### 2026-03-23 - Tripple형 단계식 추천 흐름으로 홈/상세/취향 루프 재구성
- 증상: 기존 SooGo는 추천, 저장, 비교 기능은 있었지만 홈이 단계식 질문 흐름보다 다중 패널 구조에 가까워 첫 진입 피로가 높았고, 목적지 상세와 취향 기록 루프도 한 제품 흐름으로 읽히지 않았음.
- 원인: 기존 UI 계층이 editorial shell, 카드 비교, 저장 복원 흐름 위주로 누적되어 `한 화면 한 질문 -> 짧은 TOP 결과 -> 목적지 상세 -> 취향 누적` 구조를 자연스럽게 만들지 못했음.
- 해결: 공통 셸을 낮은 크롬의 모바일 프레임으로 줄이고, 홈을 step-answer adapter 기반 단일 질문 흐름으로 재구성했으며, 결과를 TOP 요약 + 목적지 카드 구조로 정리하고, `/destinations/[slug]` 상세와 taste logging, `/s/[snapshotId]` 복원, `/compare/[snapshotId]` 비교, account/auth 화면을 recommendation-first 제품 언어에 맞게 한국어 중심으로 다듬었음. 추천, 히스토리, 스냅샷 백엔드 계약은 유지했음.
- 검증: `npm run lint`, `npm run test:unit`, `npm run build`, `npm run test:e2e`, `npm run dev`, `curl http://localhost:4010`, `curl http://localhost:4010/destinations/tokyo-japan`, `curl "http://localhost:4010/api/recommendations?partyType=couple&partySize=2&budgetBand=mid&tripLengthDays=5&departureAirport=ICN&travelMonth=10&pace=balanced&flightTolerance=medium&vibes=romance,food"`
- 참고 파일: `src/components/trip-compass/home-experience.tsx`, `src/lib/trip-compass/step-answer-adapter.ts`, `src/components/trip-compass/experience-shell.tsx`, `src/components/trip-compass/destination-detail-experience.tsx`, `src/app/destinations/[slug]/page.tsx`, `src/app/s/[snapshotId]/page.tsx`, `src/app/compare/[snapshotId]/page.tsx`, `src/components/trip-compass/account-experience.tsx`, `src/components/trip-compass/auth-experience.tsx`, `src/lib/test-ids.ts`, `tests/e2e/recommendation-flow.spec.ts`, `tests/e2e/smoke.spec.ts`, `tests/unit/smoke.spec.tsx`

### 2026-03-23 - 목적지 중심 탐색 루프로 홈/상세/저장/비교/My Taste를 재정렬
- 증상: 기존 구조는 추천 엔진과 저장, 복원 계약은 안정적이었지만, 첫 화면 즉시 탐색, 목적지 상세, 저장된 추천 재열람, 취향 누적 루프가 하나의 모바일 중심 제품 흐름으로 이어지지 않았음.
- 원인: 홈이 질문 단계 중심으로 시작하고, `/s/[snapshotId]`는 저장된 추천 detail/workspace라기보다 카드 복원에 가까웠으며, 목적지 상세 route 자체가 없어 Triple, Trip.com, Airbnb식 destination-first loop가 약했음.
- 해결: `ui-ux-pro-max` 지침과 기존 토큰 시스템을 바탕으로 `globals.css`, shared shell, 홈 탐색, 질문 흐름, 추천 카드, compare board, auth/account 경험을 밝은 white, yellow, orange 톤의 destination-first UX로 재구성하고, 새 `/destinations/[slug]` route를 추가해 추천 맥락, 근거, 체크 포인트, My Taste 연결을 한 흐름으로 묶었음. 기존 recommendation, snapshot, compare 백엔드 계약은 유지했음.
- 검증: `npm run lint`, `npm run test:unit`, `npm run build`, `npm run test:e2e`
- 참고 파일: `src/app/globals.css`, `src/components/trip-compass/experience-shell.tsx`, `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/recommendation-card.tsx`, `src/components/trip-compass/compare-board.tsx`, `src/components/trip-compass/destination-detail-experience.tsx`, `src/app/destinations/[slug]/page.tsx`, `src/app/s/[snapshotId]/page.tsx`, `src/components/trip-compass/account-experience.tsx`, `src/components/trip-compass/auth-experience.tsx`

### 2026-03-22 - SooGo 전반 UI를 premium editorial workspace로 재정렬
- 증상: 홈, 결과 카드, 비교 보드, 복원 페이지, auth/account 화면이 서로 다른 시기의 시각 언어를 섞어 쓰고 있어 제품 전체가 하나의 curated travel workspace처럼 이어지지 않았음.
- 원인: recommendation, snapshot 흐름은 이미 안정적이었지만 shared shell, global tokens, 결과, 비교, 복원, auth, account 표면이 각각 다른 색감과 위계에 머물러 있어 플랫폼 단위의 일관성이 부족했음.
- 해결: `ui-ux-pro-max` 방향과 `design-system/soogo/MASTER.md`를 실제 제품 구조에 맞게 해석해, `globals.css` 토큰을 따뜻한 종이 질감, 잉크, 황동 계열 중심으로 재설계하고 home, results, restore, compare, auth, account를 같은 편집형 브리프 -> 후보 압축 -> 의사결정 작업 공간 언어로 통합했음. 기존 recommendation, save, restore, compare 동작과 selector 계약은 유지했음.
- 검증: `npm run lint`, `npm run test:unit`, `npm run build`, `npm run test:e2e`
- 참고 파일: `src/app/globals.css`, `src/components/trip-compass/experience-shell.tsx`, `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/recommendation-card.tsx`, `src/components/trip-compass/compare-board.tsx`, `src/app/s/[snapshotId]/page.tsx`, `src/app/compare/[snapshotId]/page.tsx`, `src/components/trip-compass/auth-experience.tsx`, `src/components/trip-compass/account-experience.tsx`, `src/app/layout.tsx`

### 2026-03-22 - 여행 추천 카드 중심 제품을 trip workspace 중심으로 재구성
- 증상: 기존 홈과 결과 흐름이 `설문 -> 추천 카드 -> 저장/비교`에 머물러, 벤치마킹한 여행 제안 플랫폼들처럼 조건 brief, explainable shortlist, 저장된 결정 보드로 이어지는 제품 경험이 약했음.
- 원인: 추천 엔진과 스냅샷 복원은 이미 충분했지만, `home-experience`, `recommendation-card`, restore, compare 페이지가 저장 결과를 planning workspace가 아니라 개별 카드 복원 화면처럼 표현하고 있었음.
- 해결: 기존 deterministic recommendation API와 `recommendation` / `comparison` snapshot 계약은 유지한 채, 홈을 브리프 우선 플래너로 재구성하고 결과, 저장, 비교, 공유 페이지를 후보 압축 및 의사결정 작업 공간 중심 UX로 재설계했음. 관련 presentation helper, restore helper, selector, unit/e2e assertion도 함께 맞춤.
- 검증: `npm run lint`, `npm run test:unit`, `npm run build`, `npm run test:e2e`, `npm run dev`, `curl http://localhost:4010`, `curl "http://localhost:4010/api/recommendations?partyType=couple&partySize=2&budgetBand=mid&tripLengthDays=5&departureAirport=ICN&travelMonth=10&pace=balanced&flightTolerance=medium&vibes=romance,food"`
- 참고 파일: `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/recommendation-card.tsx`, `src/components/trip-compass/compare-board.tsx`, `src/app/s/[snapshotId]/page.tsx`, `src/app/compare/[snapshotId]/page.tsx`, `src/lib/trip-compass/presentation.ts`, `src/lib/trip-compass/restore.ts`, `tests/e2e/recommendation-flow.spec.ts`

### 2026-03-19 - Trip Compass 홈/결과 UI 구조 회귀
- 증상: 홈 화면과 추천 결과 화면의 섹션 경계가 흐려지고, 입력 단계와 결과 단계가 한 덩어리처럼 보여 데스크톱 웹 플로우의 단계성이 약해짐.
- 원인: 과도한 de-cardify 이후 stage shell은 남아 있었지만 `home-experience`와 `recommendation-card`가 그 구조를 충분히 사용하지 못해 intro -> criteria -> result 흐름과 list/detail 위계가 약해졌음.
- 해결: `globals.css`에 stage, list-detail, compare board 공통 구조 클래스를 보강하고, 홈 화면을 3단계 데스크톱 흐름으로 재구성했으며, 추천 카드는 요약과 상세 위계로 정리하고 비교는 board/grid 구조를 유지하도록 조정함.
- 검증: `npm run lint`, `npm run test:unit`, `npm run build`, `npm run test:e2e`
- 참고 파일: `src/app/globals.css`, `src/components/trip-compass/experience-shell.tsx`, `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/recommendation-card.tsx`, `src/components/trip-compass/compare-board.tsx`

### 2026-03-18 - 로컬 JSON 스토어 임시 파일 충돌
- 증상: 저장 복원과 비교 보드 흐름이 간헐적으로 실패하고, e2e에서 `LOCAL_STORE_PARSE_FAILED` 또는 `.tmp` 파일 관련 오류가 발생함.
- 원인: 로컬 JSON 스토어가 항상 같은 임시 파일명을 사용해서 동시 쓰기 시 충돌이 발생함.
- 해결: 임시 파일명을 `randomUUID()` 기반으로 고유하게 만들고, 직렬 e2e 설정과 함께 사용함.
- 검증: `npm run test:e2e`, `npm run build`
- 참고 파일: `src/lib/persistence/local-store.ts`, `playwright.config.ts`

### 2026-03-18 - Playwright가 오래된 3000 포트 서버를 재사용하는 문제
- 증상: 최신 코드가 아닌 이전 빌드, 이전 개발 서버 기준으로 e2e가 실행되어 selector 또는 비교 보드 동작이 엇갈림.
- 원인: 3000 포트에 남아 있는 기존 프로세스와 `reuseExistingServer` 동작이 겹쳐 fresh server가 아닌 stale server를 보게 됨.
- 해결: Playwright는 항상 새 서버를 띄우도록 설정하고, 검증 전에 3000 포트를 정리하는 운영 절차를 사용함.
- 검증: `npm run test:e2e`, 수동 `npm run start` + `curl http://localhost:3000`
- 참고 파일: `playwright.config.ts`

### 2026-03-19 - CI e2e job에서 production build 누락
- 증상: GitHub Actions의 `Playwright E2E` job이 `Could not find a production build in the '.next' directory` 오류와 함께 시작 단계에서 실패함.
- 원인: `playwright.config.ts`는 `npm run start`를 사용하지만, 별도 job으로 실행되는 `.github/workflows/ci.yml`의 `e2e` 단계에서는 `npm run build`를 먼저 실행하지 않아 `.next` 산출물이 존재하지 않았음.
- 해결: `e2e` job 안에 `npm run build` 단계를 추가해 Playwright가 production server를 띄우기 전에 같은 job에서 `.next`를 생성하도록 수정함.
- 검증: `npm run build`, `npm run test:e2e`, GitHub Actions `Playwright E2E`
- 참고 파일: `.github/workflows/ci.yml`, `playwright.config.ts`

### 2026-03-19 - 로컬 기본 포트 3000 충돌
- 증상: 다른 프로젝트가 3000 포트를 사용 중일 때 이 저장소의 `npm run dev`, `npm run start`, Playwright 검증 흐름이 포트 충돌 또는 잘못된 로컬 서버 대상으로 이어질 수 있었음.
- 원인: `package.json`과 `playwright.config.ts`가 3000 포트 기본값에 묶여 있었고, 단위 테스트 fixture URL도 같은 포트를 하드코딩하고 있었음.
- 해결: 이 저장소의 로컬 기본 앱 포트를 4010으로 옮기고, Playwright base URL 및 테스트 fixture URL, README 사용 예시를 같은 값으로 맞춤.
- 검증: `npm run lint`, `npm run test:unit`, `npm run build`, `npm run start`, `curl http://localhost:4010`
- 참고 파일: `package.json`, `playwright.config.ts`, `tests/unit/api/recommendations-route.spec.ts`, `README.md`
