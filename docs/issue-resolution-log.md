# 떠나볼까? 이슈 해결 기록

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

### 2026-04-13 - iOS 배포 계획 문서가 2026년 최신 Apple 제출 요건 일부를 반영하지 못하던 문제
- 증상: iOS 계획 문서는 `Privacy Policy URL`, `Support URL`, `App Privacy` 같은 기본 제출 항목은 담고 있었지만, 2026-04-28 이후 `iOS 26 SDK` 업로드 요구, `DSA trader status`, `Capacitor` privacy manifest 확인, `Support URL`의 실제 연락처 요구 같은 최신 항목은 명시되지 않았음.
- 원인: 기존 문서가 2026-04-05 기준 제출 준비를 정리한 뒤, Apple의 최신 제출 페이지와 compliance 문서 업데이트를 다시 대조하지 않았음.
- 해결: `docs/ios-release-preflight.md`, `docs/ios-app-store-readiness-plan.md`, `docs/ios-app-store-connect-submission-pack.md`, `docs/ios-app-privacy-matrix.md`, `docs/ios-at-home-release-checklist.md`에 `Xcode 26 / iOS 26 SDK`, `DSA trader status`, `Capacitor` privacy manifest 확인, `Support URL` 실제 연락처 요구를 반영했음.
- 검증: Apple Developer 공식 문서 `Submitting`, `Required app properties`, `Platform version information`, `Manage European Union Digital Services Act trader requirements`, `Third-party SDK requirements` 대조
- 참고 파일: `docs/ios-release-preflight.md`, `docs/ios-app-store-readiness-plan.md`, `docs/ios-app-store-connect-submission-pack.md`, `docs/ios-app-privacy-matrix.md`, `docs/ios-at-home-release-checklist.md`

### 2026-04-10 - iOS 제출 직전 App Store Connect 입력 자료가 여러 문서에 흩어져 있던 문제
- 증상: 집에서 실제 업로드를 진행할 때 `App Privacy`, `Review notes`, `Support URL`, 마지막 Xcode 순서를 한 곳에서 바로 따라가기 어려웠음.
- 원인: 기존 iOS 문서는 출시 전 점검과 정책 방향은 정리돼 있었지만, App Store Connect 입력표와 퇴근 후 바로 쓸 실행 순서는 분리돼 있지 않았음.
- 해결: `docs/ios-app-privacy-matrix.md`에 App Privacy 초안을 정리하고, `docs/ios-at-home-release-checklist.md`에 `shell build -> cap sync -> Xcode signing -> archive/upload -> App Store Connect 입력` 순서를 압축했음. 제출 패키지 문서에서도 두 문서를 바로 참조하게 연결했음.
- 검증: 문서 간 교차 참조 확인, 현재 코드 기준 개인정보처리방침/계정 삭제/소셜 로그인/API 경로 대조
- 참고 파일: `docs/ios-app-privacy-matrix.md`, `docs/ios-at-home-release-checklist.md`, `docs/ios-app-store-connect-submission-pack.md`

### 2026-04-10 - iOS shell build 자동화가 `npm run build` 경로에서 불안정하던 문제
- 증상: `npm run shell:build`가 `apps/ios-shell`에서 `next build` 실행 중 `.next/lock` 충돌이나 모듈 해석 오류처럼 실패해, TestFlight 전 마지막 shell export 자동화가 불안정했음.
- 원인: nested app인 `apps/ios-shell`에서 `npm run build`가 `next` bin 진입 과정에서 불안정했고, 같은 워크트리의 `.next` 잠금과 겹치며 재현성이 떨어졌음. 반면 동일 앱에서 `node node_modules/next/dist/bin/next build` 직접 실행은 정상 동작했음.
- 해결: `apps/ios-shell/package.json`의 build 스크립트를 `node node_modules/next/dist/bin/next build`로 바꿔 npm bin resolution과 lock 충돌 영향을 줄였음. 함께 누락돼 있던 `.sisyphus/plans/ios-launch-path.md`, `.sisyphus/plans/static-webdir-strategy.md`를 복원하고, iOS 공개 계획 문서의 깨진 참조와 Apple 공식 기준 메모를 현재 워크트리에 맞게 정리했음.
- 검증: `npm run shell:build`, `npx cap sync ios`, Apple Developer 공식 문서 `Manage app privacy`, `Platform version information`, `Upload app previews and screenshots`, `Overview of export compliance`, `App Review`
- 참고 파일: `apps/ios-shell/package.json`, `.sisyphus/plans/ios-launch-path.md`, `.sisyphus/plans/static-webdir-strategy.md`, `docs/ios-app-store-readiness-plan.md`, `docs/shell-route-inventory.md`

### 2026-04-09 - Airbnb DESIGN.md를 바로 확인할 스테이 샘플 화면이 없던 문제
- 증상: `design-systems/airbnb.md`를 저장해 둔 뒤에도 실제 앱 안에서 이 문서를 바탕으로 한 화면을 바로 열어 볼 진입점이 없었음.
- 원인: 상단 네비게이션은 추천, 커뮤니티, 계정만 제공하고 있었고, 디자인 샘플을 분리해 둘 route도 없었음.
- 해결: 헤더에 `/stays`로 연결되는 `스테이` 메뉴를 추가하고, Airbnb 문서의 핵심 규칙인 흰 배경, 코랄 CTA, 둥근 검색바, 사진 중심 카드 그리드를 반영한 정적 샘플 화면을 만들었음.
- 검증: `npx vitest run tests/unit/ui/stay-showcase-experience.spec.tsx tests/unit/ui/shell-primary-nav.spec.tsx`, `npm run lint`, `npm run build`
- 참고 파일: `src/components/trip-compass/experience-shell.tsx`, `src/components/trip-compass/stay-showcase-experience.tsx`, `src/app/stays/page.tsx`, `tests/unit/ui/stay-showcase-experience.spec.tsx`, `tests/unit/ui/shell-primary-nav.spec.tsx`

### 2026-04-09 - 추천 결과 화면에서 지도 카드의 필요성과 행동 유도가 약하던 문제
- 증상: 추천 결과 화면의 지도는 상단에 있더라도 왜 먼저 봐야 하는지 설명이 없어 존재 이유가 약했고, 카드 내부 라벨도 `Google MAP`, `새 창`, `열기`처럼 행동 유도가 약한 상태였음.
- 원인: `ResultPage`가 지도 슬롯을 단순 렌더링만 하고 있었고, `InteractiveDestinationMapCard`도 사용자 행동보다 구현 관점 라벨을 그대로 노출하고 있었음.
- 해결: 결과 화면에서 지도를 `위치 먼저 보기` 독립 섹션으로 감싸 필요성을 먼저 설명하고, 지도 카드 내부 라벨도 `위치 먼저 보기`, `지도 열기`, `Google 지도 열기` 중심으로 정리했음. 미리보기 지도를 못 열 때 문구도 fallback 사유보다 다음 행동이 먼저 읽히게 바꿨음.
- 검증: `npx vitest run tests/unit/ui/travel-support-panel.spec.tsx`, `npm run lint`, `npm run build` 시 기존 `/community`의 `useSearchParams()` Suspense 오류로 실패 확인
- 참고 파일: `src/components/trip-compass/home/result-page.tsx`, `src/components/trip-compass/interactive-destination-map-card.tsx`, `tests/unit/ui/travel-support-panel.spec.tsx`

### 2026-04-09 - 여행 보조 정보 상세에서 지도 카드가 약하게 보이던 문제
- 증상: 상세 화면에서 Google 지도 카드가 날씨·환율 카드와 같은 그리드 안에 섞여 보여, 위치 확인 행동이 눈에 먼저 들어오지 않았고 `구글맵 보기` 같은 어색한 라벨도 함께 노출됐음.
- 원인: `TravelSupportPanel`의 `full` 레이아웃이 지도도 작은 보조 정보 카드 중 하나로 취급하고 있었고, `InteractiveDestinationMapCard`는 컨트롤 이름을 반복하는 식의 카피를 사용하고 있었음.
- 해결: 상세 레이아웃에서는 지도를 날씨/환율 그리드 밖의 독립 섹션으로 올려 먼저 보이게 바꾸고, 지도 카드 문구를 `위치 먼저 보기`, `지도 열기`, `Google 지도 열기`처럼 행동 중심 한국어로 정리했음.
- 검증: `npx vitest run tests/unit/ui/travel-support-panel.spec.tsx`, `npm run lint`
- 참고 파일: `src/components/trip-compass/interactive-destination-map-card.tsx`, `src/components/trip-compass/travel-support-panel.tsx`, `tests/unit/ui/travel-support-panel.spec.tsx`

### 2026-04-09 - 여행 이야기 상세 읽기를 로그인 사용자로 제한
- 증상: `여행 이야기` 피드에 공개 글이 그대로 펼쳐져 있어, 비로그인 사용자도 개별 여행 후기 전체를 바로 읽을 수 있었음.
- 원인: 커뮤니티는 목록 피드와 댓글 API만 있었고, 개별 상세 route 자체가 없어 `상세 읽기 시 로그인 필요`라는 접근 제어 지점을 둘 수 없었음.
- 해결: `/community/[historyId]` 상세 route를 추가하고, 상세 페이지는 `getSessionOrNull()` 결과가 없으면 `/auth?next=/community/[historyId]&intent=link`로 즉시 보냈음. 목록 카드에서는 상세 링크를 통해 진입하게 바꾸고, 실제 상세 데이터는 공개 글만 조회하도록 `readPublicPost()`를 추가했음.
- 검증: `npx vitest run tests/unit/ui/community-detail-page.spec.tsx`
- 참고 파일: `src/app/community/[historyId]/page.tsx`, `src/components/trip-compass/community-experience.tsx`, `src/components/trip-compass/community-detail-experience.tsx`, `src/lib/community/service.ts`

### 2026-04-09 - PGlite 영속 DB에서 로컬 API가 재기동 후 500으로 죽던 문제
- 증상: `npm run dev` 후 홈 진입 시 `GET /api/trending-destinations`와 `GET /api/recommendations`가 모두 500을 반환했고, 로그에는 `CREATE TYPE "public"."budget_band" AS ENUM...`가 다시 실행되다 중단되는 오류가 남았음.
- 원인: `src/lib/db/runtime.ts`의 PGlite 경로는 로컬 영속 디렉터리를 사용하면서도 적용 이력을 기록하지 않고 `drizzle/*.sql`을 매번 처음부터 다시 실행했음. 이미 스키마가 있는 로컬 DB에서는 enum/table 생성문이 중복 실행돼 초기화가 실패했고, 여행 보조 정보 캐시와 트렌딩 집계가 모두 같은 런타임 DB를 사용해 추천/트렌딩 API가 함께 죽었음.
- 해결: PGlite 전용 마이그레이션 추적 테이블을 추가해 이미 적용한 SQL 파일은 다시 실행하지 않도록 했고, 추적 테이블이 없지만 기존 스키마가 있는 레거시 로컬 DB는 현재 migration 파일 목록을 적용 완료 상태로 백필하도록 보강했음.
- 검증: `npm run dev`, `curl http://localhost:4010/api/trending-destinations`, `curl "http://localhost:4010/api/recommendations?partyType=friends&partySize=4&budgetBand=mid&tripLengthDays=5&departureAirport=ICN&travelMonth=7&pace=packed&flightTolerance=long&vibes=culture"`
- 참고 파일: `src/lib/db/runtime.ts`, `src/app/api/trending-destinations/route.ts`, `src/app/api/recommendations/route.ts`

### 2026-04-07 - Places API 주변 장소 호출이 비용 대비 효용이 낮고 오류율이 높아 MVP에서 잠시 비활성화한 문제
- 증상: Google Cloud 사용량에서 `Places API (New)` 호출이 집계됐고, 현재 UI에서는 사용자 인지가 낮은 `먼저 볼 만한 곳` 목록에만 쓰이는데 오류율도 높았음.
- 원인: `travel-support` 보조 정보가 주변 장소까지 포함하도록 설계돼 있어, 추천 결과와 상세 화면 진입 시 `places:searchText`를 함께 호출하고 있었음.
- 해결: 계획 문서는 유지하되, 실제 운영 코드에서는 `getNearbyPlaces()`가 항상 `undefined`를 반환하도록 바꿔 Places API 네트워크 호출을 중단했음. 기존 UI는 데이터가 없을 때처럼 조용히 숨겨지므로 다른 보조 정보는 그대로 유지됨.
- 검증: `npx vitest run tests/unit/travel-support/service.spec.ts`, `npm run build`
- 참고 파일: `src/lib/travel-support/service.ts`, `tests/unit/travel-support/service.spec.ts`

### 2026-04-07 - 메인 hero 이미지 전환이 길고 단조로워 큰 여행 사진의 몰입감보다 슬라이드 전환 자체가 먼저 느껴지던 문제
- 증상: 메인 랜딩 hero의 여행지 이미지가 바뀔 때 전환 시간이 길고 이미지와 라벨, 아래 preview 카드가 거의 동시에 바뀌어 `크게 한 장면이 넘어가는 느낌`보다 단순 캐러셀처럼 느껴졌음.
- 원인: `hero-animation`이 이미지에만 비교적 긴 `opacity + scale` 전환을 걸고, 목적지 라벨과 아래 blurred preview strip은 별도 타이밍 없이 즉시 바뀌는 구조였음.
- 해결: 대형 플랫폼에서 자주 쓰는 짧은 `fade-through + subtle scale` 원칙으로 재조정해 이미지 전환을 약 `0.4s` 수준으로 줄이고 blur를 살짝 섞었음. 함께 목적지 라벨과 아래 preview strip은 별도 짧은 `fade + y` 전환으로 늦게 따라오게 만들어, 사진이 먼저 바뀌고 정보가 정리돼 들어오는 흐름으로 맞췄음.
- 검증: `npm run build`, `npm run lint`
- 참고 파일: `src/components/trip-compass/home/hero-animation.tsx`

### 2026-04-07 - 추천 결과에서 브라우저 뒤로가기로 6번째 질문으로 돌아간 뒤 다시 `추천 보기`를 눌렀을 때 로딩 없이 결과로 즉시 복귀할 수 있던 문제
- 증상: 결과 화면에서 브라우저 뒤로가기로 `빼고 싶은 나라` 단계로 돌아간 뒤 다시 `추천 보기`를 누르면, 새 추천을 다시 구하는 흐름보다 이전 결과 상태를 곧바로 복원하는 것처럼 느껴질 수 있었음.
- 원인: 추천 요청이 끝난 뒤에도 `pendingRecommendationQueryRef`가 남아 있어, 결과 URL 재진입/복원 판단에서 `아직 처리 중인 요청`처럼 해석될 여지가 있었음.
- 해결: 추천 성공/실패가 확정되면 `pendingRecommendationQueryRef`를 즉시 비우도록 바꿔, 뒤로가기 후 재진입이나 다시 제출할 때 항상 새 로딩 흐름으로 처리되게 맞췄음. 함께 e2e에 `result -> goBack -> step 6 -> 추천 보기 -> 로딩 패널 -> 결과` 시나리오를 추가했음.
- 검증: `npx playwright test tests/e2e/recommendation-flow.spec.ts`, `npm run build`
- 참고 파일: `src/components/trip-compass/home-experience.tsx`, `tests/e2e/recommendation-flow.spec.ts`

### 2026-04-07 - 비행/이동 부담 질문이 `장거리도 괜찮아요`까지만 있어 거리 자체를 판단 기준으로 두지 않는 사용자의 의도를 정확히 받지 못하던 문제
- 증상: 홈 질문 흐름의 비행 부담 단계는 모두 `거리 제약`을 선택하는 구조라, `거리 자체는 상관없다`는 사용자가 자신의 의도를 정확히 고르기 어려웠음.
- 원인: 질문 단계의 `flightPreference`가 추천 쿼리의 `flightTolerance` 3값에 그대로 종속돼 있었고, 질문 전용의 더 넓은 사용자 언어를 따로 갖지 않았음.
- 해결: 홈 질문 전용 값 `anywhere`를 추가하고 라벨을 `어디든 괜찮아요`로 노출했음. 질문 단계에서는 이 값을 그대로 유지하고, 실제 추천 쿼리로 바꿀 때만 가장 넓은 범위인 `flightTolerance: "long"`으로 매핑했음. 함께 결과 상단 query summary도 이 선택을 `어디든 괜찮아요`로 그대로 보여주게 맞췄음.
- 검증: `npx vitest run tests/unit/trip-compass/step-answer-adapter.spec.ts`, `npm run build`
- 참고 파일: `src/lib/trip-compass/step-answer-adapter.ts`, `src/components/trip-compass/home-experience.tsx`

### 2026-04-07 - 추천 결과 화면에 저장 후보 비교 기능이 함께 노출돼 핵심 행동이 흐려지던 문제
- 증상: 추천 결과 화면 하단에 `비교 담기`, `비교 보드 만들기`, 모바일 비교 트레이가 함께 노출돼 저장과 상세 보기보다 비교 기능이 불필요하게 경쟁했고, 결과 화면의 핵심 흐름이 복잡해졌음.
- 원인: `home-experience`가 저장한 추천 섹션에 비교용 selection state, compare snapshot 생성 액션, post-auth compare intent까지 같이 묶어 결과 화면 안에서 비교 보드 진입을 직접 열어두고 있었음.
- 해결: 결과 화면에서만 비교 관련 UI와 상태를 제거했음. 저장한 추천 섹션은 다시 `다시 열어 보기 / 계정에서 보기 / 링크 복사` 중심으로 정리했고, `비교 담기`, `비교 보드 만들기`, 모바일 비교 트레이, 결과 화면 compare e2e 기대도 함께 삭제했음.
- 검증: `npm run build`
- 참고 파일: `src/components/trip-compass/home-experience.tsx`, `tests/e2e/recommendation-flow.spec.ts`, `tests/e2e/ios-acquisition-flow.spec.ts`

### 2026-04-07 - 추천 결과·상세·비교 화면에 내부 기획 용어가 남아 사용자에게 바로 이해되지 않던 문제
- 증상: 결과·상세·비교 화면에 `원문 보기`, `분위기 근거`, `비교 보드`, `세부 정보 보기`, `최근 반응` 같은 내부 기획 용어가 남아 있어 첫 화면에서 바로 뜻이 읽히지 않았음.
- 원인: 결과 화면과 상세/비교 화면을 빠르게 확장하는 과정에서 제품 내부에서 쓰던 라벨과 데이터 상태 라벨이 그대로 노출됐음.
- 해결: 사용자 언어 기준으로 라벨을 다시 정리해 `자세히 보기`, `이런 느낌이에요`, `비교 항목`, `후보 비교`, `미리 보는 영상`, `바로 보기`, `요즘 많이 보는 내용`처럼 한 번에 읽히는 표현으로 교체했음.
- 검증: `npx vitest run tests/unit/ui/destination-detail-experience.spec.tsx`, `npm run build`
- 참고 파일: `src/components/trip-compass/home/result-page.tsx`, `src/components/trip-compass/destination-detail-experience.tsx`, `src/components/trip-compass/compare-board.tsx`, `src/components/trip-compass/compare-restore-view.tsx`, `src/lib/trip-compass/presentation.ts`

### 2026-04-07 - 비교 보드가 결과 화면보다 폰트와 카드 톤이 무겁고 올드하게 보여 결정 화면 위계가 흐리던 문제
- 증상: 비교 페이지는 `font-display` 비중과 베이지 그라데이션이 강해서, 결과 화면보다 더 무겁고 촌스럽게 느껴질 수 있었고 상단 요약/후보 카드/표 레이아웃의 밀도도 제각각이라 빠르게 비교하는 워크보드처럼 읽히지 않았음.
- 원인: `compare-restore-view`와 `compare-board`가 요약 문구를 길게 쓰고 serif headline을 여러 군데 반복했으며, compare 전용 표 스타일도 노란 톤이 강해 최신 결과 화면과 시각 언어가 어긋났음.
- 해결: 비교 페이지를 `빠르게 좁히는 보드` 톤으로 다시 정리해 상단 trust/summary 카피를 짧게 줄이고, 후보 카드와 표 헤더의 display serif를 sans 중심 위계로 바꿨음. compare 전용 grid/background도 결과 화면과 맞는 차분한 blue-neutral surface로 정리해 표가 더 단정하고 읽기 쉽게 보이게 맞췄음.
- 검증: `npm run build`
- 참고 파일: `src/components/trip-compass/compare-restore-view.tsx`, `src/components/trip-compass/compare-board.tsx`, `src/app/globals.css`

### 2026-04-07 - 추천 결과에서 `다시 고르기`를 눌러도 방금 본 여행지가 그대로 다시 섞여 나오던 문제
- 증상: 결과 화면에서 다시 추천을 요청해도 직전에 본 1위·후보 목적지가 다시 포함될 수 있어, 사용자는 `다른 선택지를 본다`는 기대와 다르게 비슷한 결과를 반복해서 보게 됐음.
- 원인: 재추천 요청이 기존 `RecommendationQuery`를 그대로 다시 보내고 있었고, 추천 엔진도 국가 제외만 하드 필터링할 뿐 이미 노출한 목적지 ID는 기억하지 않았음.
- 해결: `RecommendationQuery`에 `excludedDestinationIds`를 추가하고, 결과 화면의 `다시 고르기`는 현재 노출된 카드들의 목적지 ID를 다음 질의에 실어 보내도록 바꿨음. 추천 엔진은 해당 ID를 하드 필터로 제외해 재추천 시 같은 목적지가 재등장하지 않게 맞췄음.
- 검증: `npx vitest run tests/unit/domain/recommendation-query.spec.ts tests/unit/recommendation/engine.spec.ts tests/unit/api/recommendations-route.spec.ts tests/unit/ui/future-trip-result-cta.spec.tsx`, `npm run build`
- 참고 파일: `src/components/trip-compass/home-experience.tsx`, `src/lib/domain/contracts.ts`, `src/lib/recommendation/engine.ts`, `src/lib/security/validation.ts`, `src/lib/trip-compass/presentation.ts`

### 2026-04-07 - 추천 결과 로딩 화면이 구형 스켈레톤과 Sponsored 카드 중심이라 추천을 분석 중이라는 신뢰가 약하던 문제
- 증상: 추천 결과 로딩 화면이 진행 맥락보다 파트너 카드와 단순 progress bar에 치우쳐 보여, `지금 무엇을 기다리는지`와 `곧 어떤 결과가 나오는지`가 바로 읽히지 않았음.
- 원인: `result-loading-panel`이 단계 진행을 실제로 드러내지 않았고, 우측 카드도 추천 결과 preview보다 광고성 슬롯처럼 보이는 구조였음.
- 해결: 로딩 패널을 `추천 결과 준비 중` staged screen으로 재구성해 현재 단계 배지, 활성 단계 설명, 분석 기준 preview를 함께 보여주도록 바꿨음. 파트너 카드 대신 `곧 보게 될 화면`과 `정리 기준` 블록으로 바꿔 로딩 자체가 추천 경험의 일부처럼 읽히게 맞췄음.
- 검증: `npm run build`
- 참고 파일: `src/components/trip-compass/home/result-loading-panel.tsx`

### 2026-04-07 - 추천 결과 상단이 좌우 2컬럼으로 갈라져 유튜브와 1순위 카드의 정보 위계가 흐리고 높이 균형도 맞지 않던 문제
- 증상: 추천 결과 화면에서 왼쪽 YouTube 영역은 짧고 오른쪽 1순위 추천 카드만 길게 쌓여, 한 화면 안에서 `무엇을 먼저 봐야 하는지`가 약했고 결과 서비스보다 보조 콘텐츠 화면처럼 느껴질 수 있었음.
- 원인: `result-page`가 상단을 `영상 / 추천 결과` 동등 2컬럼으로 유지했고, 저장·지도·시기·날씨·영상·행동 제안이 하나의 세로 흐름으로 묶이지 않았음.
- 해결: 상단을 1컬럼으로 재배치해 `1순위 추천 hero -> CTA -> 지도/추천 시기/날씨 -> 참고 영상 -> 이 도시에서 먼저 할 것` 순서로 고정했음. 유튜브는 결과를 본 뒤 확신을 보강하는 섹션으로 하향했고, CTA는 hero 바로 아래 별도 박스로 고정했음.
- 검증: `npm run build`
- 참고 파일: `src/components/trip-compass/home/result-page.tsx`

### 2026-04-07 - 추천 결과 상단 조건 요약이 설명형 카드로 커져 스크롤이 늘고, 여행 지원 요약에서 지도가 날씨 안에 묻혀 보이던 문제
- 증상: 추천 결과 화면 상단에 `이번 추천 기준`과 설명 문구가 붙으면서 시작 구간 높이가 커졌고, 우측 여행 지원 요약도 하나의 카드 안에 지도와 날씨가 함께 들어가 `지도가 날씨 안에 있는 것처럼` 읽혔음.
- 원인: `result-page`의 조건 요약을 설명형 헤더 카드로 확장했고, `travel-support-panel` summary 레이아웃도 날씨와 지도를 하나의 컨테이너 안에서 연속 렌더링해 정보 경계가 흐려졌음.
- 해결: 상단 조건 요약을 기존처럼 칩 중심의 짧은 스트립으로 되돌렸고, summary 여행 지원은 `날씨 카드`, `지도 카드`, `주변 장소 카드`를 분리해 각 역할이 바로 읽히게 정리했음. 함께 summary 지도 높이도 줄여 결과 화면의 첫 스크롤 부담을 낮췄음.
- 검증: `npx vitest run tests/unit/ui/travel-support-panel.spec.tsx`, `npm run build`
- 참고 파일: `src/components/trip-compass/home/result-page.tsx`, `src/components/trip-compass/travel-support-panel.tsx`, `src/components/trip-compass/interactive-destination-map-card.tsx`, `tests/unit/ui/travel-support-panel.spec.tsx`

### 2026-04-05 - 추천 결과 YouTube가 최신성에 과하게 끌려 조회수 높은 대표 영상을 놓치고 2·3위 카드에는 영상 근거가 비어 있던 문제
- 증상: 추천 결과 1위 YouTube는 최근 업로드에 가산점이 커서, 아직 충분히 최신인 고조회수 대표 영상보다 더 새롭지만 작은 영상을 먼저 고를 수 있었음. 동시에 2위, 3위 추천 카드는 영상 근거가 없어 1위 대비 정보 밀도가 약했음.
- 원인: `scoreFreshness()`의 비중이 `engagementQuality` 대비 상대적으로 컸고, `selectSocialVideoCandidates()`도 최근성/짧은 길이 슬롯을 별도로 우선 채우는 구조였음. 프런트는 1위 카드의 `LeadSocialVideoPanel`만 사용해 보조 추천 카드에는 영상 진입점이 없었음.
- 해결: 조회수 절대값과 반응 품질 가중치를 높이고 최근성 가중치는 낮춰, 너무 오래되지 않은 범위에서는 고조회수 영상이 우선되게 조정했음. 함께 보조 후보 선택도 점수순 기반으로 단순화했고, 2위·3위 카드에는 `CompactSocialVideoPanel`을 추가해 경량 보조 영상을 함께 노출하게 했음.
- 검증: `npx vitest run tests/unit/social-video/service.spec.ts tests/unit/ui/social-video-panel.spec.tsx`, `npm run build`
- 참고 파일: `src/lib/social-video/service.ts`, `src/components/trip-compass/social-video-panel.tsx`, `src/components/trip-compass/home-experience.tsx`, `tests/unit/social-video/service.spec.ts`, `tests/unit/ui/social-video-panel.spec.tsx`

### 2026-04-05 - 추천 결과 상단 YouTube 패널이 로딩 전 빈 카드처럼 보여 준비 상태를 이해하기 어려웠던 문제
- 증상: 추천 결과가 먼저 나온 뒤 YouTube 영상이 붙기 전까지 상단 좌측 패널이 단순한 `영상을 불러오고 있어요` 수준으로만 보여, 비어 있거나 깨진 화면처럼 느껴졌음.
- 원인: `social-video-panel`의 placeholder와 `result-page`의 fallback placeholder가 모두 진행 단계, 기대 결과, 현재 정상 상태 여부를 설명하지 못했음.
- 해결: 메인/보조 영상 로딩 카드에 `영상 생성 중` 상태 배지, 준비 단계 카드, 로딩 안내 문구를 추가해 `추천 결과는 이미 정리됐고 영상만 뒤에서 붙는 중`이라는 맥락이 바로 읽히게 바꿨음. `result-page`의 임시 fallback도 같은 시각 언어로 맞췄음.
- 검증: `npx vitest run tests/unit/ui/social-video-panel.spec.tsx`, `npm run build`
- 참고 파일: `src/components/trip-compass/social-video-panel.tsx`, `src/components/trip-compass/home/result-page.tsx`, `tests/unit/ui/social-video-panel.spec.tsx`

### 2026-04-05 - GitHub Actions Playwright E2E가 PGlite 경로 오류와 오래된 퍼널 시나리오 때문에 20분 뒤 취소되던 문제
- 증상: PR #4의 필수 체크 `CI / Playwright E2E`가 약 20분 동안 끝나지 않다가 `Cancelled after 20m`로 종료돼 바로 merge할 수 없었음.
- 원인: CI 서버의 `PGlite` 런타임 경로가 `URL` 객체로 흘러 들어가 `path argument must be of type string` 예외를 내면서 추천/트렌딩 API가 반복 실패했고, 함께 Playwright 시나리오는 새 `excluded-countries` 단계와 최신 홈 문구를 아직 반영하지 않아 결과 페이지까지 정상 진입하지 못했음.
- 해결: `src/lib/db/runtime.ts`에서 `file:` 기반 `PGLITE_DATA_DIR`를 문자열 경로로 정규화하는 helper를 추가했고, 관련 unit test를 보강했음. 함께 `tests/e2e/recommendation-flow.spec.ts`, `tests/e2e/ios-acquisition-flow.spec.ts`를 현재 6단계 퍼널과 최신 카피 기준으로 갱신했음.
- 검증: `npx vitest run tests/unit/runtime/pglite-data-dir.spec.ts tests/unit/trending/trending-service.spec.ts`, `npx playwright test tests/e2e/recommendation-flow.spec.ts`, `npx playwright test tests/e2e/ios-acquisition-flow.spec.ts`, `npm run build`
- 참고 파일: `src/lib/db/runtime.ts`, `tests/unit/runtime/pglite-data-dir.spec.ts`, `tests/e2e/recommendation-flow.spec.ts`, `tests/e2e/ios-acquisition-flow.spec.ts`

### 2026-04-05 - GitHub Actions unit 단계가 `vitest run` 전체 실행에서 오래 멈추던 문제
- 증상: PR #4의 CI에서 `Lint, Unit, Build` job이 오래 `pending` 또는 진행 중으로 남았고, 로컬에서도 `tests/unit` 전체를 한 번에 돌리는 `vitest run`이 종료 없이 오래 붙잡히는 패턴이 있었음.
- 원인: 개별 실패 테스트가 아니라, `jsdom` 기반 unit 파일 61개를 단일 `vitest run`으로 한 번에 실행하는 경로가 현재 저장소에서 종료가 불안정했음. 같은 테스트도 폴더 묶음으로 나누면 각 shard는 수 초 내에 정상 종료됐음.
- 해결: CI 전용 스크립트 `test:unit:ci`를 추가하고, `auth/ui/api`, `account/affiliate/profile/snapshots`, 나머지 도메인 묶음으로 unit 테스트를 3개 shard로 순차 실행하도록 바꿨음. 함께 `vitest.config.ts`에서 CI일 때 worker 수를 제한하도록 설정했음.
- 검증: `time npm run test:unit:ci`로 3개 shard가 모두 통과하는 것을 확인했고, 로컬 기준 총 6.966초에 종료됐음.
- 참고 파일: `.github/workflows/ci.yml`, `package.json`, `vitest.config.ts`

### 2026-04-05 - OAuth 콜백 예외가 500으로 노출되고 헤더 로그인 복귀 경로가 끊기던 문제
- 증상: 공급자 토큰 교환이나 provider sign-in 단계에서 예외가 나면 OAuth callback이 500으로 끝날 수 있었고, 헤더의 `로그인`은 현재 결과/상세 경로를 `next`로 보존하지 않아 로그인 후 원래 화면으로 돌아가기 어려웠음. 로그아웃도 서버 세션 삭제 예외가 나면 현재 기기 쿠키 정리 없이 흐름이 끊길 수 있었음.
- 원인: `src/app/api/auth/oauth/[provider]/callback/route.ts`가 외부/DB 예외를 `try/catch`로 흡수하지 않았고, `src/components/trip-compass/shell-auth-nav.tsx`의 로그인 링크는 고정 `/auth`만 가리켔음. `src/app/api/auth/sign-out/route.ts`는 서버 세션 삭제 실패 시 쿠키 정리 fallback이 없었음.
- 해결: OAuth 콜백에서 공급자 교환과 provider sign-in 예외를 `OAUTH_CALLBACK_FAILED` redirect로 통일했고, 헤더 로그인 링크는 현재 pathname/search를 `next`로 보존하도록 바꿨음. sign-out route는 서버 세션 정리에 실패해도 현재 기기 세션 쿠키를 비우고 응답을 유지하도록 정리했음.
- 검증: `npx vitest run tests/unit/auth/sign-out-route.spec.ts tests/unit/auth/sign-out-route-error.spec.ts tests/unit/auth/session-read-refresh-routes.spec.ts tests/unit/auth/oauth-callback-shell.spec.ts tests/unit/api/auth-oauth-callback.spec.ts tests/unit/api/auth-google-callback.spec.ts tests/unit/api/auth-kakao-callback.spec.ts tests/unit/api/auth-apple-callback.spec.ts tests/unit/ui/auth-experience.spec.tsx tests/unit/ui/shell-auth-nav.spec.tsx`, `npm run lint`, `npm run build`
- 참고 파일: `src/app/api/auth/sign-out/route.ts`, `src/app/api/auth/oauth/[provider]/callback/route.ts`, `src/components/trip-compass/shell-auth-nav.tsx`, `src/lib/auth-client.ts`, `tests/unit/api/auth-oauth-callback.spec.ts`, `tests/unit/ui/shell-auth-nav.spec.tsx`

### 2026-04-05 - iOS 배포 문서가 아직 native shell 시작 전 상태처럼 남아 있어 오늘 배포 순서를 잘못 안내하던 문제
- 증상: iOS preflight 문서가 `실제 App Store/TestFlight용 native shell 생성은 아직 시작하면 안 되는 상태`라고 적고 있어, 이미 `capacitor.config.ts`, `apps/ios-shell/out`, `ios/App/**`가 준비된 현재 저장소 상태와 맞지 않았음.
- 원인: 초기 iOS 준비 문서가 shell 생성 전 단계 기준으로 작성된 뒤, 실제 scaffold와 static bundle 연결이 완료된 뒤에도 문서가 같은 결론을 유지하고 있었음.
- 해결: 문서를 `오늘 2시간 안에 TestFlight 업로드` 기준으로 다시 정리하고, 현재 저장소에서 확인된 bundle id, version, static `webDir`, `ios/App/**` 존재 여부를 반영했음. 추가로 Xcode signing의 `DEVELOPMENT_TEAM` 미설정과 App Store Connect 메타데이터 입력을 현재 진짜 차단 항목으로 명시했음.
- 검증: `capacitor.config.ts`, `apps/ios-shell/out`, `ios/App/App/Info.plist`, `ios/App/App.xcodeproj/project.pbxproj`, `package.json`을 대조하고 Apple Developer 공식 문서의 `App Privacy`, `Upload builds`, `App Review Information`, `Screenshot specifications`, `Overview of export compliance` 기준으로 `docs/ios-release-preflight.md`, `docs/ios-app-store-readiness-plan.md`를 갱신했음.
- 참고 파일: `docs/ios-release-preflight.md`, `docs/ios-app-store-readiness-plan.md`, `capacitor.config.ts`, `ios/App/App.xcodeproj/project.pbxproj`

### 2026-04-05 - 홈 추천 퍼널에 국가 배제 조건이 없어 특정 국가를 확실히 빼고 추천받기 어려웠던 문제
- 증상: 기존 홈 추천 조건은 좋아하는 여행 스타일과 이동 거리만 받았고, `중국은 이번엔 빼고 싶어요`처럼 특정 국가를 명시적으로 제외하는 신호를 받을 수 없었음.
- 원인: `RecommendationQuery`와 홈 질문 플로우, 추천 엔진 하드 필터 모두 배제 국가 개념을 갖고 있지 않았음.
- 해결: 홈 퍼널 마지막에 `빼고 싶은 나라` 멀티선택 단계를 추가하고, `excludedCountryCodes`를 추천 질의와 URL 계약에 넣었음. 추천 엔진에서는 해당 국가 코드를 하드 필터로 바로 제외하고, 결과 요약에도 제외 사실을 함께 보여 주도록 정리했음.
- 검증: `npx vitest run tests/unit/trip-compass/step-answer-adapter.spec.ts tests/unit/domain/recommendation-query.spec.ts tests/unit/recommendation/engine.spec.ts tests/unit/api/recommendations-route.spec.ts`
- 참고 파일: `src/components/trip-compass/home-experience.tsx`, `src/lib/trip-compass/step-answer-adapter.ts`, `src/lib/recommendation/engine.ts`, `src/lib/domain/contracts.ts`

### 2026-04-05 - iOS shell용 Capacitor 설정이 없어 static web bundle을 실제 패키징 경로에 연결하지 못하던 문제
- 증상: `apps/ios-shell/out` 정적 산출물은 있었지만 루트 `capacitor.config.ts`가 없어 iOS shell 패키징 경로가 설정되지 않은 상태였음.
- 원인: 초기 iOS 준비 작업이 웹 계약과 shell 정적 빌드까지만 정리됐고, 실제 Capacitor 설정 파일 단계는 남아 있었음.
- 해결: 루트 [capacitor.config.ts](/Users/jihun/Desktop/study/project/SooGo/capacitor.config.ts)를 추가하고 `webDir`를 `apps/ios-shell/out`으로 연결했음. `iosScheme`도 `capacitor`로 명시해 기존 shell-origin 계약과 맞췄음.
- 검증: `npm run shell:build` 산출물 경로와 `npx tsx --eval "import config from './capacitor.config.ts'; console.log(config.webDir, config.server?.iosScheme)"` 출력으로 설정값을 확인했음.
- 참고 파일: `capacitor.config.ts`, `apps/ios-shell/package.json`, `apps/ios-shell/next.config.ts`, `docs/ios-release-preflight.md`

### 2026-04-05 - iOS native scaffold가 없어 shell 산출물을 실제 iOS 프로젝트로 동기화하지 못하던 문제
- 증상: `capacitor.config.ts`와 `apps/ios-shell/out`은 준비됐지만 실제 `ios/App/**` 프로젝트와 `cap sync ios` 단계가 없어 native shell 검증을 이어갈 수 없었음.
- 원인: Capacitor CLI와 iOS platform 패키지가 저장소에 없었고, scaffold 생성 명령도 package scripts에 연결되지 않았음.
- 해결: `@capacitor/core`, `@capacitor/ios`, `@capacitor/cli`를 추가하고 `shell:ios:add`, `shell:ios:sync` 스크립트를 만들었음. 이후 `npm run shell:ios:add`로 `ios/App/**`를 생성하고 `npm run shell:ios:sync`로 shell export 후 iOS public assets와 `capacitor.config.json` 동기화를 확인했음.
- 검증: `npm run shell:ios:add`, `npm run shell:ios:sync`, `npx cap config`, `find ios/App -maxdepth 4 \\( -name '*.xcworkspace' -o -name 'Package.swift' -o -name 'capacitor.config.json' \\)` 출력으로 scaffold와 sync 결과를 확인했음.
- 참고 파일: `package.json`, `package-lock.json`, `ios/App/App/capacitor.config.json`, `ios/App/CapApp-SPM/Package.swift`, `docs/ios-app-store-readiness-plan.md`

### 2026-04-05 - iOS shell v1 범위 밖 화면과 계정 CTA가 여전히 노출되던 문제
- 증상: topbar에서 인증/계정 링크를 숨겨도 `/auth`, `/account`, `/account/settings`, `/account/history/*`는 직접 접근이 가능했고, 결과 화면에는 `내 여행에 담기`, `계정에서 보기` CTA가 남아 있었음.
- 원인: shell mode 제약이 헤더 레벨에만 적용돼 있었고, route-level guard와 결과 CTA 분기는 빠져 있었음.
- 해결: shell mode에서 `auth/account/account settings/history` 경로를 홈으로 redirect하도록 서버 페이지를 막았고, 결과 화면과 저장 목록의 account/save CTA도 숨겼음. 개인정보처리방침 화면의 `계정 설정으로` 링크도 shell mode에서는 숨기도록 맞췄음.
- 검증: `npm run build`, `npm run lint` 통과. shell-mode Playwright 검증은 `next/font`의 Google Fonts fetch가 막힌 현재 환경 제약 때문에 추가로 완료하지 못했음.
- 참고 파일: `src/app/auth/page.tsx`, `src/app/account/page.tsx`, `src/app/account/settings/page.tsx`, `src/app/account/history/new/page.tsx`, `src/app/account/history/[historyId]/edit/page.tsx`, `src/app/privacy/page.tsx`, `src/components/trip-compass/home-experience.tsx`, `tests/e2e/smoke.spec.ts`

### 2026-04-05 - iOS 배포 계획 문서에 Apple 공식 기준의 필수/조건부 구분이 흐리던 문제
- 증상: iOS 준비 문서에 `문의하기`, `Universal Links`, `app previews` 같은 항목의 우선순위가 섞여 있었고, 반대로 `Privacy Policy URL`, `App Review 연락처`, `Sign in with Apple`, 비로그인 접근 허용 같은 공식 기준은 선명도가 낮았음.
- 원인: 초기 계획이 기술 과제와 심사 메타데이터를 함께 압축하면서 Apple 공식 문서의 `필수`, `조건부`, `선택` 경계를 충분히 분리하지 못했음.
- 해결: Apple 공식 문서 기준으로 `Privacy Policy URL`, `App Privacy`, `App Review Information`, `demo account`, `Sign in with Apple`, `Age Rating`, `export compliance`, `screenshots`를 다시 정리했고, `UGC safeguard`, `Universal Links`, `app previews`, `문의하기`는 조건부 또는 선택 항목으로 문서에 명시했음. 추가로 심사 중 백엔드 가용성, 기능 URL 동작, 메타데이터 완전성도 계획 문서에 반영했음.
- 검증: Apple Developer 공식 문서(App Review Guidelines, App Store Connect metadata/privacy, screenshot/app review information, export compliance) 재확인 후 `docs/ios-app-store-readiness-plan.md`, `docs/ios-release-preflight.md` 수정
- 참고 파일: `docs/ios-app-store-readiness-plan.md`, `docs/ios-release-preflight.md`, `docs/issue-resolution-log.md`

### 2026-04-05 - iOS 배포 계획 문서의 App Store Connect 필수 항목 누락과 demo mode 표현을 공식 기준에 맞게 정정
- 증상: iOS 계획 문서에 `Support URL`, App Review 연락처, `screenshots` 필수/`app previews` 선택 구분이 빠져 있었고, `demo account 또는 demo mode`처럼 demo mode를 일반 대체 수단처럼 읽히게 적어 둔 상태였음.
- 해결: Apple 공식 문서를 다시 대조해 `Privacy Policy URL`, `Support URL`, App Review 연락처, `screenshots`, `Age Rating`, `export compliance`, 외부 콘텐츠 권리, `demo account` 요구와 `demo mode` 예외 조건을 계획 문서와 preflight 체크리스트에 반영했음.
- 검증: Apple Developer 공식 문서 `App Review Guidelines`, `Manage app privacy`, `App information`, `App review information`, `Upload app previews and screenshots`, `Overview of export compliance`, `Offering account deletion in your app` 기준으로 문서 내용을 재검토했음.
- 참고 파일: `docs/ios-app-store-readiness-plan.md`, `docs/ios-release-preflight.md`

### 2026-04-05 - 유튜브 검색어와 개인화 규칙이 이전 상태로 되돌아간 문제
- 증상: 추천 결과의 YouTube 카드에 국내/영문 혼합 검색어가 다시 섞일 수 있었고, `야경` 계열 라벨과 문구도 사용자 노출에 남아 있었음. 여행 기록의 `tags` 기반 개인화도 다시 추천 점수에 개입하는 상태로 돌아갔음.
- 원인: 검색어 생성과 vibe 라벨 매핑, evidence 키워드 추출, 추천 개인화 보정이 이전 정리 상태를 잃고 더 느슨한 계약으로 되돌아갔음.
- 해결: YouTube 검색어에서 `한국인`/`korean` 계열을 제거하고, `romance`는 `야경`으로만 노출하도록 바꿨음. 추천 개인화는 `wouldRevisit`와 `repeat/discover`만 반영하고, 여행 기록 `tags`와 `customTags` overlap은 다시 제외했음.
- 검증: `npx vitest run tests/unit/social-video/service.spec.ts tests/unit/recommendation/personalization.spec.ts tests/unit/api/social-video-route.spec.ts`
- 참고 파일: `src/lib/social-video/service.ts`, `src/lib/recommendation/personalization.ts`, `src/lib/trip-compass/presentation.ts`, `tests/unit/social-video/service.spec.ts`, `tests/unit/recommendation/personalization.spec.ts`

### 2026-04-05 - 세션 조회 응답에서 null 이메일이 빈 문자열로 바뀌던 문제
- 증상: 이메일이 없는 Kakao 계정이나 null 이메일 사용자도 세션 응답에서 `""`로 정규화될 수 있어, nullable user email 계약과 실제 응답이 어긋날 위험이 있었음.
- 원인: `getSessionFromHeaders`, `rotateSessionForUser`, 비밀번호 로그인 응답 경로에서 `user.email`을 `?? ""`로 덮어쓰고 있었음.
- 해결: 세션 응답과 로그인 응답이 `null`을 그대로 유지하도록 바꿨고, memory / database 두 경로에 대해 null email 회귀 테스트를 추가했음.
- 검증: `npx vitest run tests/unit/auth/session-storage-model.spec.ts tests/unit/auth/session-db-mode.spec.ts tests/unit/auth/account-schema.spec.ts`, `npx vitest run tests/unit/snapshots/snapshot-visibility.spec.ts tests/unit/api/snapshots-authz.spec.ts tests/unit/api/me-snapshots-route.spec.ts tests/unit/auth/session-read-refresh-routes.spec.ts`, `npx vitest run tests/unit/ui/destination-detail-experience.spec.tsx tests/unit/ui/future-trip-result-cta.spec.tsx`, `npm run lint`, `npm run build`
- 참고 파일: `src/lib/auth.ts`, `tests/unit/auth/session-storage-model.spec.ts`, `tests/unit/auth/session-db-mode.spec.ts`

### 2026-04-03 - 목적지 상세에 항공권 제휴 클릭 로그와 파트너 fallback 구조가 없던 문제
- 증상: 추천 이후 사용자를 자연스럽게 항공권 비교로 보내는 수익화 동선이 없었고, 어떤 목적지에서 제휴 CTA가 눌리는지 측정할 수 없었음.
- 원인: 목적지 상세 화면에는 저장과 외부 분위기 근거만 있었고, 제휴 링크 데이터·클릭 로그 API·DB 저장 경로가 분리돼 있지 않았음.
- 해결: `Skyscanner` 우선, `Trip.com` fallback 구조의 항공권 제휴 카탈로그와 링크 계산 서비스를 추가했고, 목적지 상세에 `FlightAffiliatePanel`을 넣어 한국어 고지와 함께 노출하게 했음. 클릭은 `POST /api/affiliate/clicks`로 저장하고, Postgres/PGlite fallback 모두에서 동작하도록 맞췄음.
- 검증: `npx vitest run tests/unit/affiliate/service.spec.ts tests/unit/api/affiliate-clicks-route.spec.ts tests/unit/ui/destination-detail-experience.spec.tsx`, `npm run lint`, `npm run build`
- 참고 파일: `src/lib/affiliate/catalog.ts`, `src/lib/affiliate/service.ts`, `src/components/trip-compass/flight-affiliate-panel.tsx`, `src/app/api/affiliate/clicks/route.ts`, `src/components/trip-compass/destination-detail-experience.tsx`

### 2026-04-02 - 추천 실패 시 생성 중 전용 화면이 거의 보이지 않아 재시도 UX가 흔들리던 문제
- 증상: 추천 API가 실패하는 경우 `생성 중` 전용 화면이 거의 보이지 않거나 바로 에러 상태로 넘어가, 재시도 흐름 e2e가 불안정했고 사용자가 생성 단계를 인지하기 어려웠음.
- 원인: `requestRecommendations`가 성공 경로에만 최소 로딩 노출 시간을 적용하고 있었고, 실패 경로는 즉시 `result` 단계로 전환해 `loading` 화면 체류가 보장되지 않았음. 함께 추천 퍼널 `뒤로 가기` e2e에는 현재 질문 순서와 맞지 않는 오래된 클릭 단계가 남아 있었음.
- 해결: 성공/실패 모두 같은 최소 로딩 노출 계약을 따르도록 `home-experience`를 조정했고, 테스트 환경에서도 아주 짧은 로딩 노출 시간을 유지하게 맞췄음. 추천 퍼널 `뒤로 가기` e2e도 현재 질문 순서에 맞게 정리했음.
- 검증: `npm run lint`, `npx playwright test tests/e2e/recommendation-flow.spec.ts --project=chromium`
- 참고 파일: `src/components/trip-compass/home-experience.tsx`, `tests/e2e/recommendation-flow.spec.ts`

### 2026-04-02 - GitHub Actions quality job이 Vitest 메모리 사용량과 15분 제한에 함께 막히던 문제
- 증상: PR 필수 체크 `Lint, Unit, Build`가 한 번은 `tests/unit/smoke.spec.tsx` 종료 무렵 `JavaScript heap out of memory`, `Worker forks emitted error`로 실패했고, 다음 run에서는 전체 job이 `15m0s` 제한을 넘겨 취소됐음.
- 원인: GitHub Actions `ubuntu-latest`에서 전체 `vitest run`을 기본 Node 힙으로 실행해 메모리 여유가 부족했고, 이후 메모리 완화만 넣은 상태에서는 `lint + unit + build` 합산 시간이 기존 `quality.timeout-minutes: 15`를 초과했음.
- 해결: `.github/workflows/ci.yml`의 unit 단계에 `NODE_OPTIONS=--max-old-space-size=6144`를 주입해 CI에서만 Node 힙을 늘리고, `quality` job 타임아웃을 `25분`으로 올려 전체 파이프라인이 중간 취소되지 않게 했음.
- 검증: 실패 run `23885761975`, `23886955335` 로그 확인, `.github/workflows/ci.yml` 반영 확인
- 참고 파일: `.github/workflows/ci.yml`, `docs/issue-resolution-log.md`

### 2026-04-02 - 추천 결과가 너무 즉시 열려 서비스형 대기 경험이 부족하던 문제
- 증상: 홈 질문을 마치면 추천 결과가 바로 열려, 다른 여행 플랫폼처럼 "조건을 분석 중"이라는 대기 연출이 거의 느껴지지 않았음.
- 원인: `requestRecommendations`가 응답을 받는 즉시 결과 화면을 렌더링했고, 로딩 상태도 단순 스켈레톤 카드 몇 개만 보여 주는 수준이었음.
- 해결: 홈 결과 화면에 전용 로딩 패널을 추가하고, 실제 브라우저에서는 추천 결과를 최소 5초 동안 분석 중 UI로 보여 준 뒤 결과를 노출하도록 조정했음. 로딩 중에는 결과 필터 바도 숨겨 집중도를 유지하게 했음.
- 검증: `npm run lint`, `npx playwright test tests/e2e/recommendation-flow.spec.ts --project=chromium`
- 참고 파일: `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/home/result-loading-panel.tsx`, `src/app/globals.css`, `tests/e2e/recommendation-flow.spec.ts`

### 2026-04-02 - 홈 퍼널과 계정 탭이 URL과 분리돼 새로고침·뒤로 가기·인증 복귀 맥락을 잃던 문제
- 증상: 홈 질문 퍼널은 새로고침하거나 뒤로 가면 현재 질문 단계와 선택값을 잃기 쉬웠고, 계정 탭은 탭을 바꿔도 주소가 유지되지 않았음. 로그인 없이 계속 보기 링크도 저장/공유 직전 맥락 대신 항상 홈으로 돌아가고, 비로그인 헤더에는 `내 여행` 진입점이 중복 노출됐음.
- 원인: 홈과 계정의 주요 탐색 상태를 로컬 state로만 관리했고, 인증 이탈 복귀 링크는 `next`를 읽으면서도 우회 CTA에 재사용하지 않았음. 홈 질문 기본값도 미리 채워져 있어 URL 복원 시 사용자가 선택하지 않은 값처럼 보일 수 있었음.
- 해결: 홈 퍼널에 `stage`, `step`, 질문 응답 query를 동기화하고 결과 URL도 일관되게 재구성하도록 수정했음. 질문 초기값은 빈 상태로 바꾸고, 인증 우회 CTA는 안전한 same-origin `next`로 복귀하게 했음. 계정 탭은 `?tab=`과 동기화했고, 비로그인 헤더에서는 중복 `내 여행` 링크를 제거했음.
- 검증: `npm run lint`, `npm run build`, `npm run test:e2e`, `npx vitest run tests/unit/ui/account-future-trips.spec.tsx tests/unit/ui/account-history-gallery.spec.tsx`, `npx vitest run tests/unit/ui/future-trip-result-cta.spec.tsx tests/unit/auth/oauth-callback-shell.spec.ts`
- 참고 파일: `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/account-experience.tsx`, `src/components/trip-compass/auth-experience.tsx`, `src/components/trip-compass/experience-shell.tsx`, `src/components/trip-compass/shell-auth-nav.tsx`, `src/components/trip-compass/shell-primary-nav.tsx`, `tests/e2e/recommendation-flow.spec.ts`, `tests/e2e/smoke.spec.ts`, `tests/e2e/account-future-trips.spec.ts`

### 2026-04-01 - Playwright가 stale `.next` 산출물과 낡은 UI 기대값 때문에 e2e가 연쇄 실패하던 문제
- 증상: `npm run test:e2e`가 로컬 `.next/server/chunks/ssr/*.js` 누락으로 무너질 수 있었고, 이후에도 `future-trip-cta-0`, `일정 담기`, 랜딩 헤드라인, 여행 기록 생성 step 기대값이 현재 UI와 어긋나 e2e가 다수 실패했음.
- 원인: Playwright webServer가 `next start`만 실행해 기존 `.next` 산출물 상태에 의존했고, 몇몇 e2e/spec이 현재 제품 계약이 아닌 이전 UI 문구와 액션 흐름을 계속 가정하고 있었음.
- 해결: `playwright.config.ts`의 webServer를 `build && start`로 바꿔 e2e 실행을 self-contained하게 만들고, 브라우저 테스트를 현재 저장/예정 여행/랜딩/여행 기록 흐름에 맞게 갱신했음.
- 검증: `npm run test:unit`, `npm run build`, `npm run test:e2e`
- 참고 파일: `playwright.config.ts`, `tests/e2e/account-future-trips.spec.ts`, `tests/e2e/recommendation-flow.spec.ts`, `tests/e2e/smoke.spec.ts`, `tests/unit/ui/future-trip-result-cta.spec.tsx`

### 2026-04-01 - 홈에서 추천을 담을 때 snapshot이 2개 저장될 수 있던 문제
- 증상: 로그인 사용자가 홈 추천 결과에서 `담기`를 누르면 저장 목록에 같은 추천이 2개 생기거나, account 저장 탭에서 같은 여행지가 두 번 보일 수 있었음.
- 원인: `src/components/trip-compass/home-experience.tsx`의 `saveCard`가 먼저 snapshot을 만든 뒤 `registerFutureTrip`를 이어 호출했는데, 같은 tick의 stale state 때문에 `registerFutureTrip`가 방금 만든 snapshot을 못 찾고 `createSnapshotReference`를 다시 호출해 두 번째 `/api/snapshots` POST를 만들 수 있었음.
- 해결: `saveCard`에서 이미 생성한 snapshot reference를 `registerFutureTrip`로 직접 넘기고, future trip 등록 경로에서는 state fallback만 사용하도록 바꿔 같은 저장 흐름에서 snapshot이 한 번만 생성되게 고정했음. 함께 이 경로를 고정하는 unit regression test를 추가했음.
- 검증: `npx vitest run tests/unit/ui/future-trip-result-cta.spec.tsx -t "reuses the freshly created snapshot when save also auto-registers a future trip"`, `npm run lint`, `npm run build`
- 참고 파일: `src/components/trip-compass/home-experience.tsx`, `tests/unit/ui/future-trip-result-cta.spec.tsx`

### 2026-04-01 - 브리즈번·상하이 추가 후 `spring-cafe-city` golden fixture가 기존 상위 3개를 유지하지 못하던 문제
- 증상: `src/lib/catalog/launch-catalog.ts`에 브리즈번과 상하이를 추가한 뒤 `npx vitest run tests/unit/recommendation/golden-cases.spec.ts`가 실패했고, `spring-cafe-city` fixture의 상위 3개가 기존 `tokyo / fukuoka / macau`에서 `tokyo / shanghai / fukuoka`로 바뀌었음.
- 원인: 상하이가 `city + culture`, short-haul, 봄 시즌 적합도를 동시에 만족해 기존 2위권 목적지를 추월했음.
- 해결: 추천 엔진 변경이 아니라 후보군 확장에 따른 의도된 결과로 보고 fixture 기대값을 현재 카탈로그 기준으로 갱신했음.
- 검증: `npx vitest run tests/unit/catalog/launch-catalog.spec.ts tests/unit/evidence/service.spec.ts`, `npx vitest run tests/unit/recommendation/golden-cases.spec.ts`
- 참고 파일: `src/lib/catalog/launch-catalog.ts`, `src/lib/evidence/catalog.ts`, `tests/unit/catalog/launch-catalog.spec.ts`, `tests/unit/recommendation/golden-fixtures.ts`

### 2026-04-01 - 호주·중국·뉴질랜드 목적지 확장 후 short-haul 문화/장거리 city-nature fixture 상위권이 재정렬되던 문제
- 증상: 브리즈번·퍼스·케언스·베이징·상하이·오클랜드·퀸스타운을 추가한 뒤 `spring-cafe-city`, `australia-city-loop` fixture 기대값이 현재 추천 결과와 어긋났음.
- 원인: 베이징은 short-haul 문화 도시 조합에서, 오클랜드·브리즈번·퍼스는 장거리 `city + nature` 조합에서 기존 후보보다 높은 점수를 받았음.
- 해결: `queenstown`의 과한 `luxury` 태그는 제거하고, 나머지 의도된 후보군 확장 영향은 golden fixture 기대값을 현재 카탈로그 기준으로 갱신했음.
- 검증: `npx vitest run tests/unit/catalog/launch-catalog.spec.ts tests/unit/evidence/service.spec.ts`, `npx vitest run tests/unit/recommendation/golden-cases.spec.ts`, `npm run build`
- 참고 파일: `src/lib/catalog/launch-catalog.ts`, `src/lib/evidence/catalog.ts`, `src/lib/travel-support/country-metadata.ts`, `tests/unit/recommendation/golden-fixtures.ts`

### 2026-04-01 - 캐나다·중국 남부·오세아니아 도시 확장 후 쇼핑/야경 fixture 상위권이 다시 재정렬되던 문제
- 증상: `밴프`, `밴쿠버`, `토론토`, `몬트리올`, `광저우`, `선전`, `애들레이드`, `크라이스트처치`를 추가한 뒤 `new-year-shopping`, `japan-food-hop`, `city-lights-winter` fixture 기대값이 현재 추천 결과와 어긋났음.
- 원인: 광저우와 선전이 short-haul `shopping + city`, `food + shopping`, `city + nightlife` 조합에서 기존 일본·싱가포르 후보보다 높은 점수를 받았음.
- 해결: 추천 엔진 변경이 아니라 후보군 확장 영향으로 보고 golden fixture 기대값을 현재 카탈로그 기준으로 갱신했음. 캐나다 목적지는 자연·도시 태그를 보수적으로 둬 과한 교란을 피했음.
- 검증: `npx vitest run tests/unit/catalog/launch-catalog.spec.ts tests/unit/evidence/service.spec.ts`, `npx vitest run tests/unit/recommendation/golden-cases.spec.ts`, `npm run build`, `npm run lint`
- 참고 파일: `src/lib/catalog/launch-catalog.ts`, `src/lib/evidence/catalog.ts`, `tests/unit/catalog/launch-catalog.spec.ts`, `tests/unit/recommendation/golden-fixtures.ts`

### 2026-03-31 - 여행지 카탈로그 확장 후 추천 golden fixture가 기존 상위 3개 결과를 고정해 회귀처럼 실패하던 문제
- 증상: 여행지 카탈로그에 한국어 소셜 기반 신규 목적지를 대거 추가한 뒤 `tests/unit/recommendation/golden-cases.spec.ts`가 실패했고, `anniversary-october-couple` fixture의 상위 3개가 기존 `lisbon / chiang-mai / paris`에서 `lisbon / seville / marrakech`로 바뀌었음.
- 원인: 추천 엔진 로직 자체는 바뀌지 않았지만, 입력 후보군인 `launchCatalog`가 확장되면서 같은 쿼리에서 더 높은 점수를 받는 신규 목적지가 상위권에 진입했음.
- 해결: 카탈로그 확장에 따른 의도된 랭킹 변화로 보고 golden fixture 기대값을 현재 후보군 기준 결과로 갱신했음.
- 검증: `npx vitest run tests/unit/catalog/launch-catalog.spec.ts tests/unit/recommendation/golden-cases.spec.ts`, `npm run test:unit`, `npm run build`
- 참고 파일: `src/lib/catalog/launch-catalog.ts`, `tests/unit/recommendation/golden-fixtures.ts`, `tests/unit/recommendation/golden-cases.spec.ts`

### 2026-03-31 - 세션 정책이 web/shell 구분 없이 고정 30일로 동작해 idle/absolute 만료와 롤링 갱신을 검증할 수 없던 문제
- 증상: 로그인 세션이 web과 iOS shell에서 같은 30일 쿠키/서버 만료 모델로 발급되어, web idle 14일 / shell idle 30일 같은 차등 정책과 absolute expiry를 적용할 수 없었음.
- 원인: `src/lib/auth.ts`가 발급 시점과 읽기 시점 모두에서 단일 `expiresAt` 비교만 사용했고, session storage에도 `clientType`, `lastSeenAt`, `absoluteExpiresAt`가 없어 legacy/new session을 구분할 수 없었음.
- 해결: session storage를 DB/local/memory 전부 additive metadata 구조로 확장하고, 발급 시점에는 정책 stamp를 중앙 helper로 통일했음. 읽기 시점에는 absolute expiry와 legacy grandfathering을 함께 처리했고, `/api/auth/session`에 throttled sliding refresh + cookie sync를 연결했음. auth sign-in/sign-up/oauth callback은 trusted shell origin에서만 `ios-shell` 정책을 발급하게 맞췄음.
- 검증: `npx vitest run tests/unit/auth/session-policy.spec.ts tests/unit/auth/session-storage-model.spec.ts tests/unit/auth/session-issuance-stamping.spec.ts tests/unit/auth/session-fixation.spec.ts tests/unit/auth/session-read-refresh-routes.spec.ts tests/unit/auth/session-local-fallback.spec.ts`, `npm run test:unit`, `npm run build`, 실서버 `curl`로 `sign-up -> /api/auth/session -> sign-out -> /api/auth/session` 및 shell-origin sign-up/session 확인
- 참고 파일: `src/lib/auth.ts`, `src/app/api/auth/session/route.ts`, `src/app/api/auth/sign-in/route.ts`, `src/app/api/auth/sign-up/route.ts`, `src/app/api/auth/oauth/[provider]/callback/route.ts`, `src/lib/provider-auth.ts`, `src/lib/runtime/shell.ts`, `tests/unit/auth/session-read-refresh-routes.spec.ts`, `tests/unit/auth/session-local-fallback.spec.ts`

### 2026-03-31 - 홈 상단 로고와 `추천 받기`가 같은 페이지에서 dead link처럼 느껴지던 문제
- 증상: 홈에서 상단 로고를 눌러도 `홈으로 돌아간다`는 신호가 약했고, `추천 받기`를 눌러도 같은 `/` 안에서는 이동 체감이 약해 추천 시작 액션처럼 느껴지지 않았음.
- 원인: `ExperienceShell` 상단 브랜드와 주요 메뉴가 단순 Link 렌더링만 사용해, 현재 경로가 홈일 때는 같은 페이지 액션과 홈 복귀 동작을 별도로 처리하지 않았음. `?start=1`도 시작 후 URL에 남을 수 있어 다시 landing으로 돌아왔을 때 재진입 체감이 흔들릴 여지가 있었음.
- 해결: 브랜드/주요 메뉴를 작은 클라이언트 헤더 컴포넌트로 분리해 홈에서는 로고가 landing 복귀 액션, `추천 받기`가 질문 흐름 즉시 시작 액션으로 동작하게 바꿨음. 로고는 기존 토큰 안에서 홈 affordance가 보이는 lockup으로 다듬었고, auto-start 뒤 `start` query도 지워 재진입 동작을 안정화했음. smoke e2e에는 로고 노출, 헤더 CTA 시작, 로고 복귀 검증을 추가했음.
- 검증: `npx playwright test tests/e2e/smoke.spec.ts`, `npm run lint`, `npm run build`
- 참고 파일: `src/components/trip-compass/experience-shell.tsx`, `src/components/trip-compass/shell-primary-nav.tsx`, `src/components/trip-compass/home-experience.tsx`, `src/lib/trip-compass/shell-events.ts`, `src/app/globals.css`, `tests/e2e/smoke.spec.ts`

### 2026-03-29 - 계정 `앞으로 갈 곳` 탭이 placeholder라 실제 컬렉션 관리와 분리 검증이 되지 않던 문제
- 증상: `/account?tab=future-trips`가 실제 future trips 데이터를 SSR로 불러오지 않았고, 탭 안에도 숨겨진 placeholder selector만 있어 빈 상태와 삭제-only 관리 흐름을 확인할 수 없었음.
- 원인: `AccountPage`가 `listUserFutureTrips`를 함께 로드하지 않았고, `AccountExperience`도 future trips 전용 로컬 상태와 DELETE 연동 없이 임시 마크업만 유지하고 있었음. e2e도 재사용되는 mock 소셜 계정의 기존 future trip 데이터를 정리하지 않아 empty state가 흔들릴 수 있었음.
- 해결: 계정 SSR 단계에 future trips 로딩을 추가하고, `AccountExperience`에 future trips 전용 state와 `/api/me/future-trips/[futureTripId]` 삭제 연동을 붙였음. 탭 UI는 저장한 추천/여행 기록과 섞지 않는 독립 리스트·empty state·삭제 버튼 구조로 교체했고, unit/e2e 테스트는 empty/list 렌더링과 delete가 history/saved UI 상태를 건드리지 않는지 검증하도록 추가했음. 함께 깨진 `AuthExperience` 단위 테스트도 현재 social-only auth 화면 계약에 맞게 갱신했음.
- 검증: `npx vitest run tests/unit/ui/account-future-trips.spec.tsx`, `npx playwright test tests/e2e/account-future-trips.spec.ts`, `npm run lint`, `npm run test:unit`, `npm run build`, `npm run test:e2e`
- 참고 파일: `src/app/account/page.tsx`, `src/components/trip-compass/account-experience.tsx`, `tests/unit/ui/account-future-trips.spec.tsx`, `tests/e2e/account-future-trips.spec.ts`, `tests/unit/ui/auth-experience.spec.tsx`, `tests/unit/profile/future-trips.spec.ts`

### 2026-03-29 - 추천 결과 화면에서 현재 날씨만 보여 선택한 여행 달의 판단 정보가 비어 있던 문제
- 증상: 추천 결과 화면의 보조 정보는 `지금 날씨`만 보여줘서, 사용자가 실제로 고른 `10월`, `12월` 같은 여행 시점 기준으로 더울지 비가 많을지 바로 판단하기 어려웠음.
- 원인: 추천 API가 목적지 보조 정보에 현재 forecast만 붙이고 있었고, 결과 화면도 그 값을 그대로 `날씨`로 노출하고 있었음.
- 해결: Open-Meteo archive 데이터를 사용해 최근 5년 동일 월의 평균 최고/최저와 비 오는 날 비중을 계산하는 `travelMonthWeather`를 supplement 계약에 추가했음. 결과 화면에선 product UX 기준에 맞춰 `선택한 달 기준`을 먼저 보여주고, `지금 날씨`는 보조 정보로 내렸음.
- 검증: `npx vitest run tests/unit/travel-support/service.spec.ts tests/unit/api/recommendations-route.spec.ts tests/unit/ui/travel-support-panel.spec.tsx`, `npm run lint`, `npm run build`
- 참고 파일: `src/lib/travel-support/service.ts`, `src/lib/domain/contracts.ts`, `src/app/api/recommendations/route.ts`, `src/components/trip-compass/travel-support-panel.tsx`, `tests/unit/travel-support/service.spec.ts`, `tests/unit/api/recommendations-route.spec.ts`, `tests/unit/ui/travel-support-panel.spec.tsx`

### 2026-03-29 - 추천 결과 소셜 비디오가 단일 카드라 메인/보조 참고 레이어를 함께 보여주지 못하던 문제
- 증상: 추천 결과 1위 카드에서 소셜 비디오는 1개만 노출되어, 메인 참고 영상과 최근/짧은 보조 영상을 함께 비교하며 훑는 흐름이 부족했음.
- 원인: `/api/social-video`가 단일 `item`만 반환하고 있었고, 서비스 랭킹도 `목적지 관련성 + 한국어 + 짧은 길이` 기준의 1개 선택에 맞춰져 있었음.
- 해결: YouTube 후보 수집을 `relevance`와 최근 `date` 검색으로 넓히고, `statistics`를 포함해 최근성/반응 품질을 함께 점수화했음. 결과는 메인 1개와 서브 2개까지 반환하도록 확장하고, UI는 큰 메인 카드 + 작은 서브 2카드 레이아웃으로 재구성했음. 빈 응답일 때도 결과 화면 레이아웃은 유지되도록 플레이스홀더 슬롯을 남겼음.
- 검증: `npx eslint src/app/api/social-video/route.ts src/components/trip-compass/social-video-panel.tsx src/lib/domain/contracts.ts src/lib/social-video/service.ts tests/unit/api/social-video-route.spec.ts tests/unit/social-video/service.spec.ts tests/e2e/recommendation-flow.spec.ts`, `npx vitest run tests/unit/api/social-video-route.spec.ts tests/unit/social-video/service.spec.ts tests/unit/domain/recommendation-query.spec.ts`, `npx playwright test tests/e2e/recommendation-flow.spec.ts -g "shows a social video block only for the lead recommendation|keeps recommendation results visible when social video is unavailable"`
- 참고 파일: `src/lib/social-video/service.ts`, `src/app/api/social-video/route.ts`, `src/components/trip-compass/social-video-panel.tsx`, `src/lib/domain/contracts.ts`, `tests/unit/api/social-video-route.spec.ts`, `tests/unit/social-video/service.spec.ts`, `tests/e2e/recommendation-flow.spec.ts`

### 2026-03-29 - 홈 5단 질문 퍼널 변경 뒤 e2e 헬퍼가 이전 클릭 순서를 따라가던 문제
- 증상: `auth/social-login`, `ios-acquisition-flow`, `recommendation-flow` 일부 e2e가 추천 결과, 빈 상태, 재시도 상태에 도달하지 못하고 타임아웃으로 실패했음.
- 원인: 홈 질문 퍼널이 `여행 스타일 선택 -> 다음 버튼 -> 비행 부담 선택` 구조로 바뀌었는데, 여러 테스트의 `submitQuickRecommendation` 계열 헬퍼와 예외 시나리오 테스트가 여전히 예전 1클릭 진행 순서를 사용하고 있었음.
- 해결: 세 e2e 파일의 공통 흐름을 현재 5단 퍼널에 맞게 맞추고, 여행 스타일 선택 뒤 `home-step-next`를 거친 다음 마지막 비행 부담 선택으로 추천 요청이 나가도록 수정했음. 빈 상태와 재시도 테스트도 같은 순서로 정렬했음.
- 검증: `npx eslint tests/e2e/auth/social-login.spec.ts tests/e2e/ios-acquisition-flow.spec.ts tests/e2e/recommendation-flow.spec.ts`, `npm run test:unit`, `npm run test:e2e`
- 참고 파일: `tests/e2e/auth/social-login.spec.ts`, `tests/e2e/ios-acquisition-flow.spec.ts`, `tests/e2e/recommendation-flow.spec.ts`, `src/components/trip-compass/home-experience.tsx`

### 2026-04-01 - 여행 기록 step 화면에서 `이전`과 `취소`가 붙어 있어 이탈 실수가 나기 쉬웠던 문제
- 증상: `/account/history/new`와 수정 화면 하단에서 `이전`과 `취소`가 같은 버튼군에 붙어 있어, step 이동과 화면 이탈이 비슷한 무게로 읽혔고 입력 중 잘못 누르면 바로 목록으로 나가 버렸음.
- 원인: 하단 액션이 `이전 | 취소 | 다음/저장` 구조로만 배치되어 있었고, 입력 변경 여부를 확인하는 dirty guard가 없어 `취소`가 즉시 라우팅됐음.
- 해결: `취소`를 상단 보조 액션으로 분리하고 문구를 `작성 중단`/`수정 그만하기`로 명확하게 바꿨음. draft가 바뀐 상태에서는 확인 레이어를 띄워 `계속 작성`과 이탈을 구분하도록 맞췄음. 하단은 `이전`과 `다음/저장` 중심으로 단순화했음.
- 검증: `npx eslint src/components/trip-compass/account-history-create-experience.tsx src/lib/test-ids.ts tests/unit/ui/account-history-create-experience.spec.tsx`, `npx vitest run tests/unit/ui/account-history-create-experience.spec.tsx tests/unit/ui/account-history-image-validation.spec.tsx`, `npm run build`
- 참고 파일: `src/components/trip-compass/account-history-create-experience.tsx`, `src/lib/test-ids.ts`, `tests/unit/ui/account-history-create-experience.spec.tsx`

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
- 해결: `Tripadvisor`, `Trip.com`, `Triple`의 상단 구조를 참고해 홈 헤더를 워드마크 + 텍스트 링크 + 로그인 버튼 중심으로 재정리했음. visible brand는 최종적으로 `떠나볼까?`로 맞췄고, 시스템용 짧은 이름은 `떠나볼까`로 분리해 홈/메타/manifest/title에 반영했음. `내 취향`은 사용자-facing 문맥에서 `여행 기록` 계열 표현으로 정리했음. 글자형 임시 로고는 헤더와 앱 아이콘 모두에서 나침반/핀 계열 심볼로 교체했음.
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

### 2026-03-27 - 홈 헤더가 카드형으로 보여 여행 플랫폼 인상이 약함
- Symptoms: 홈 상단에서 `내 취향`, `추천 우선` 같은 pill/card 요소와 원형 로고가 함께 보이면서 여행 플랫폼 헤더보다 도구형 UI처럼 읽혔음.
- Cause: `ExperienceShell` topbar가 브랜드, 상태, 이동 링크를 모두 pill 성격의 요소로 표현하고 있었고, visible brand 이름도 여행 서비스 카테고리를 바로 떠올리기 어려웠음.
- Resolution: `Tripadvisor`, `Trip.com`, `Triple`의 상단 구조를 참고해 홈 헤더를 워드마크 + 텍스트 링크 + 로그인 버튼 중심으로 재정리했음. visible brand는 최종적으로 `떠나볼까?`로 맞췄고, 시스템용 짧은 이름은 `떠나볼까`로 분리해 홈/메타/manifest/title에 반영했음. `내 취향`은 사용자-facing 문맥에서 `여행 기록` 계열 표현으로 정리했음. 글자형 임시 로고는 헤더와 앱 아이콘 모두에서 나침반/핀 계열 심볼로 교체했음.
- Verification: `npm run lint`, `npm run test:unit`, `npm run build`, `npx playwright test tests/e2e/smoke.spec.ts --project=chromium`
- References: `src/lib/brand.ts`, `src/components/trip-compass/experience-shell.tsx`, `src/components/trip-compass/account-experience.tsx`, `src/components/trip-compass/auth-experience.tsx`, `src/components/trip-compass/destination-detail-experience.tsx`, `src/app/layout.tsx`, `src/app/manifest.ts`, `tests/e2e/smoke.spec.ts`

### 2026-03-27 - 홈 첫 화면의 브랜드 블루 존재감 부족
- Symptoms: 전역 토큰을 블루 계열로 바꾼 뒤에도 홈 첫 화면은 거의 흰색으로만 보여 브랜드 컬러가 잘 느껴지지 않았음.
- Cause: 실제 첫 화면은 `landing-page.tsx`의 단순 카피, 중립적인 `hero-animation.tsx`, 작은 CTA 중심이라 블루 토큰이 화면 면적에서 거의 드러나지 않았음.
- Resolution: 레이아웃은 유지한 채 랜딩 상단에 브랜드 배지와 신뢰 스트립을 추가하고, CTA를 블루 그라데이션/그림자 중심으로 강화했음. `hero-animation.tsx`는 하늘색~파란색 비주얼 면적과 배지를 늘렸고, `progress-bar.tsx`와 전역 포커스/선택 토큰도 같은 블루 계열로 맞췄음.
- Verification: `npm run lint`, `npm run test:unit`, `npm run build`
- References: `src/components/trip-compass/home/landing-page.tsx`, `src/components/trip-compass/home/hero-animation.tsx`, `src/components/trip-compass/home/progress-bar.tsx`, `src/app/globals.css`

### 2026-03-27 - 홈 헤더 아래 중복 안내 영역 정리
- Symptoms: 홈 상단 헤더 아래에 브랜드 배지와 `지금 바로 추천 · 로그인 없이 저장 · 링크 공유와 비교` 스트립이 연달아 붙어 있어, 핵심 헤드라인 전에 중복 정보가 먼저 보였음.
- Cause: 브랜드 존재감을 강화하는 과정에서 헤더가 이미 브랜드 역할을 하는데도 landing 상단에 같은 성격의 보조 영역을 추가했음.
- Resolution: `Tripadvisor`, `Trip.com`처럼 헤더 아래는 바로 핵심 메시지와 행동으로 이어지도록, landing 상단의 브랜드 배지와 신뢰 스트립을 제거했음.
- Verification: `npm run lint`, `npm run build`
- References: `src/components/trip-compass/home/landing-page.tsx`

### 2026-03-27 - 로그인 화면이 설명 패널과 카드가 많아 집중도가 떨어짐
- Symptoms: 로그인 화면이 좌측 설명 패널, 3개 정보 카드, 하단 안내 박스까지 겹쳐 한 번에 읽어야 할 정보가 많았고, 참고 로그인 화면들보다 훨씬 무겁게 보였음.
- Cause: 로그인 화면에 제품 설명과 기능 안내를 과하게 넣으면서, 실제 필요한 `로그인/회원가입` 행동보다 주변 정보가 먼저 보이게 되었음.
- Resolution: 참고 이미지처럼 `중앙 집중형 단일 컬럼` 구조로 재설계했음. 좌측 패널과 정보 카드를 제거하고, 작은 비주얼, 짧은 헤드라인, 모드 전환, 폼, 한 줄 안내만 남겼음.
- Verification: `npm run lint`, `npm run test:unit`, `npm run build`
- References: `src/components/trip-compass/auth-experience.tsx`

### 2026-03-27 - 홈 메인 화면 상단 헤더 복원
- Symptoms: 홈 첫 화면은 bare shell로 렌더링되어 상단 헤더와 로그인 버튼이 보이지 않았음.
- Cause: `home-experience.tsx`가 `ExperienceShell`에 `hideTopbar`를 전달해 홈에서만 공통 topbar를 숨기고 있었음.
- Resolution: 홈에서도 공통 topbar가 보이도록 `hideTopbar`를 제거했고, smoke e2e도 현재 계약에 맞춰 헤더와 로그인 버튼이 보이는지 검증하도록 수정했음.
- Verification: `npm run lint`, `npm run test:unit`, `npm run build`, `npx playwright test tests/e2e/smoke.spec.ts --project=chromium`
- References: `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/experience-shell.tsx`, `tests/e2e/smoke.spec.ts`

### 2026-03-27 - manifest와 앱 아이콘 404
- Symptoms: 브라우저 콘솔에서 `/manifest.webmanifest`, `/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png` 요청이 404로 실패했음.
- Cause: `src/app/layout.tsx`에 manifest와 아이콘 경로 메타는 있었지만, 실제 정적 파일이나 App Router special file이 없었음.
- Resolution: 정적 `png` 파일을 따로 두지 않고 `src/app/manifest.ts`, `src/app/icon.tsx`, `src/app/apple-icon.tsx`를 추가해 Next가 manifest와 앱 아이콘을 직접 생성하도록 바꿨고, `layout.tsx`에서는 없는 정적 아이콘 경로 참조를 제거했음.
- Verification: `npm run lint`, `npm run test:unit`, `npm run build`
- References: `src/app/layout.tsx`, `src/app/manifest.ts`, `src/app/icon.tsx`, `src/app/apple-icon.tsx`

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
- 증상: 기존 떠나볼까?는 추천, 저장, 비교 기능은 있었지만 홈이 단계식 질문 흐름보다 다중 패널 구조에 가까워 첫 진입 피로가 높았고, 목적지 상세와 취향 기록 루프도 한 제품 흐름으로 읽히지 않았음.
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

### 2026-03-22 - 떠나볼까? 전반 UI를 premium editorial workspace로 재정렬
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

### 2026-03-29 - 저장한 추천과 앞으로 갈 곳 중복 정리
- 증상: 계정 화면에서 `저장한 추천`과 `앞으로 갈 곳`이 별도 엔티티로 나뉘어, 같은 목적지 후보를 두 번 관리하는 듯한 인상을 주고 상태 전환 흐름이 끊겼음.
- 원인: `saved`는 recommendation snapshot, `future-trips`는 별도 `userFutureTrips` 컬렉션이라 UI와 API가 완전히 갈라져 있었음.
- 해결: recommendation snapshot payload에 `meta.status`를 추가해 `saved | planned` 상태를 한 엔티티 안에서 관리하도록 확장하고, 계정 화면은 같은 저장 추천을 `저장한 추천`과 `앞으로 갈 곳` 탭으로 나눠 보여주되 PATCH로 상태만 바꾸도록 정리했음.
- 검증: `npm run lint`, `npm run test:unit`, `npm run build`, `npx playwright test tests/e2e/account-future-trips.spec.ts`
- 참고 파일: `src/lib/domain/contracts.ts`, `src/lib/snapshots/service.ts`, `src/app/api/me/snapshots/[snapshotId]/route.ts`, `src/components/trip-compass/account-experience.tsx`, `tests/unit/api/me-snapshots-route.spec.ts`, `tests/e2e/account-future-trips.spec.ts`

### 2026-04-03 - 상세 페이지를 메인 추천 플로우에서 분리
- 증상: 추천 결과 화면에서 이미 핵심 판단이 끝났는데도 `상세 보기`가 주요 CTA로 남아 있어, 저장/공유보다 긴 읽기 페이지로 흐름이 새고 모바일에서 정보 과부하가 커졌음.
- 원인: 메인 결과 카드와 리드 카드가 모두 목적지 상세 페이지를 기본 다음 단계로 가정했고, 저장한 추천을 다시 보는 진입점도 계정보다 상세/공유 페이지 쪽으로 기울어 있었음.
- 해결: 메인 결과 화면에서는 `상세 보기`를 제거하고 `내 여행에 담기 -> 계정에서 보기` 흐름으로 바꿨으며, 계정의 `저장한 추천` 탭은 다시 보는 기본 장소가 되도록 이름과 안내 문구를 정리하고 카드 안에 저장 이유 요약을 추가했음. 공유 복원 화면은 메인 플로우가 아니라 `공유 페이지` 성격이 드러나도록 문구를 조정했음.
- 검증: `npx vitest run tests/unit/ui/future-trip-result-cta.spec.tsx tests/unit/ui/account-future-trips.spec.tsx tests/unit/ui/destination-detail-experience.spec.tsx`, `npm run lint`, `npm run build`
- 참고 파일: `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/account-experience.tsx`, `src/components/trip-compass/snapshot-restore-view.tsx`, `tests/unit/ui/future-trip-result-cta.spec.tsx`

### 2026-04-06 - 임베드 지도 한계와 여행 보조 정보 재호출 누적
- 증상: 추천 결과와 상세 화면의 Google 지도 임베드가 드래그/줌 경험이 불안정했고, 여행 보조 정보가 화면 진입 때마다 다시 모여 외부 API 호출이 누적될 수 있었음.
- 원인: `iframe` 기반 `Maps Embed API`는 상호작용 제어가 제한적이고, `DestinationTravelSupplement`는 DB 캐시 없이 매번 외부 응답을 조합했음.
- 해결: 지도 계약을 좌표 기반 `map` 객체로 바꾸고, 클릭 후에만 `Maps JavaScript API`를 로드하는 인터랙티브 지도 카드로 교체했음. `destination_travel_supplement_cache` 테이블을 추가해 목적지와 여행 월 기준으로 보조 정보를 캐시하고, 결과/상세/복원 화면이 같은 데이터와 주변 장소 요약을 재사용하도록 정리했음. 공개 지도 키는 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, 서버 Places 키는 `GOOGLE_MAPS_API_KEY`로 분리해 문서와 예시 env도 갱신했음.
- 검증: `npx vitest run tests/unit/travel-support/service.spec.ts tests/unit/ui/travel-support-panel.spec.tsx`, `npm run lint`, `npm run build`, `npm run test:unit:ci`
- 참고 파일: `src/lib/travel-support/service.ts`, `src/components/trip-compass/interactive-destination-map-card.tsx`, `src/components/trip-compass/travel-support-panel.tsx`, `src/lib/db/schema.ts`, `drizzle/0010_lazy_moondragon.sql`

### 2026-04-07 - 상세 조회 화면의 결정 흐름이 분산돼 보이던 문제
- 증상: 목적지 상세 조회 화면이 정보는 많지만 상단 설득 카드, CTA 카드, 여행 판단 카드가 따로 떠 보여 저장 여부를 빠르게 결정하기 어려웠음.
- 원인: 상단 요약 구조와 펼친 뒤 세부 영역의 시각 톤이 충분히 이어지지 않았고, shell 카피도 실제 화면보다 설명적이어서 결정 화면이라는 인상이 약했음.
- 해결: 상단 좌측은 `결정 헤더 -> 이번 결정 기준 -> 핵심 사실 -> 왜 이 도시를 먼저 보냐면` 흐름으로 다시 묶고, 우측은 `지금 여기서 결정` CTA 카드로 정리했음. 상세 우측의 `TravelSupportPanel` summary 카피도 여행 판단 카드 톤으로 맞췄고, 상세 페이지 shell 문구 역시 결정 중심으로 조정했음.
- 검증: `npx vitest run tests/unit/ui/destination-detail-experience.spec.tsx tests/unit/ui/travel-support-panel.spec.tsx`, `npm run build`
- 참고 파일: `src/components/trip-compass/destination-detail-experience.tsx`, `src/components/trip-compass/travel-support-panel.tsx`, `src/app/destinations/[slug]/page.tsx`

### 2026-04-06 - 추천 결과를 행동 제안으로 번역하는 AI 레이어 추가
- 증상: 추천 결과는 `어디 갈지`까진 설득했지만, 바로 아래에서 `그래서 거기서 뭘 하면 좋은지`를 짧고 실행 가능하게 이어주지 못했음.
- 원인: 결과 화면과 상세 화면 모두 추천 이유, 날씨, 지도, 주변 장소는 있었지만 이를 `첫 행동`, `대표 경험`, `반나절 코스`처럼 행동 중심으로 묶는 계층이 없었음.
- 해결: 결과 화면 1위 패널과 상세 페이지에 `이 도시에서 먼저 할 것` 블록을 추가하고, 2·3위 카드에는 축약형 `대표 경험` 요약을 붙였음. 서버 `POST /api/ai/recommendation-actions` route를 추가해 `OPENAI_API_KEY`가 있으면 AI 문장을 생성하고, 없거나 실패하면 nearby places·추천 이유·watch-out을 바탕으로 규칙 기반 fallback을 반환하도록 정리했음.
- 검증: `npx vitest run tests/unit/api/recommendation-actions-route.spec.ts tests/unit/ui/recommendation-actions-panel.spec.tsx tests/unit/ui/destination-detail-experience.spec.tsx tests/unit/ui/social-video-panel.spec.tsx tests/unit/ui/travel-support-panel.spec.tsx`, `npm run build`
- 참고 파일: `src/app/api/ai/recommendation-actions/route.ts`, `src/lib/ai/recommendation-actions.ts`, `src/components/trip-compass/recommendation-actions-panel.tsx`, `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/destination-detail-experience.tsx`

### 2026-04-07 - 결과 카드 상세 진입과 저장 후 액션 라벨 충돌 정리
- 증상: 추천 결과 e2e에서 저장 후 `계정에서 보기` 링크가 두 군데 나타나 strict mode 충돌이 났고, 2·3위 카드에서 `상세 보기` 진입이 없어 상세 첫 fold 검증이 불안정했음.
- 원인: 저장한 추천 compact 카드와 리드 카드가 같은 라벨을 공유했고, 보조 추천 카드에는 상세 페이지 링크가 빠져 있었음. 상세 진입 e2e도 client transition 완료 전에 첫 fold를 찾고 있었음.
- 해결: 저장한 추천 compact 카드 라벨을 `저장 목록에서 보기`로 분리하고, 2·3위 추천 카드에도 `상세 보기` 링크를 추가했음. e2e는 목적지 페이지 URL 전환을 먼저 기다리도록 정리했음.
- 검증: `npx vitest run tests/unit/ui/recommendation-actions-panel.spec.tsx tests/unit/ui/destination-detail-experience.spec.tsx tests/unit/ui/future-trip-result-cta.spec.tsx`, `npx playwright test tests/e2e/recommendation-flow.spec.ts -g "keeps signed-in users on results while saving the lead card|shows the detail first fold with 3 facts and an itinerary CTA|shows a manual-copy fallback when result share copy fails"`
- 참고 파일: `src/components/trip-compass/home-experience.tsx`, `tests/e2e/recommendation-flow.spec.ts`

### 2026-04-07 - 상세 페이지 판단 위계와 카드 레이아웃 재구성
- 증상: 목적지 상세 화면이 카드가 세로로만 이어져 첫 화면에서 판단 포인트가 잘 보이지 않았고, display serif 중심 타이포그래피가 서비스 전체 톤과 어긋나 보였음.
- 원인: 상단 hero 요약, 액션, 주의점, 근거가 같은 밀도로 섞여 있었고, 모바일/데스크톱 모두에서 `한눈에 결정`보다 `스크롤해서 읽기`에 가까운 구조였음.
- 해결: 상단을 `요약 본문 + 우측 action rail` 구조로 재편하고, hero 이미지·핵심 facts·결정 이유·체크할 점을 첫 화면에 재배치했음. 펼침 이후에는 `AI 행동 제안/적합 이유/근거`와 `여행 보조 정보/다음 단계`를 2열로 나눠 당근·토스식 빠른 판단 흐름과 에어비앤비·트립닷컴식 보조 정보 위계를 함께 맞췄음. 헤드라인은 serif 대신 제품 본문 톤에 맞는 sans 위주로 정리했음.
- 검증: `npx vitest run tests/unit/ui/destination-detail-experience.spec.tsx tests/unit/ui/recommendation-actions-panel.spec.tsx tests/unit/ui/travel-support-panel.spec.tsx`, `npm run lint`, `npm run build`, `npx playwright test tests/e2e/recommendation-flow.spec.ts -g "shows the detail first fold with 3 facts and an itinerary CTA"`
- 참고 파일: `src/components/trip-compass/destination-detail-experience.tsx`

### 2026-04-07 - 유튜브 fallback 원인 명시와 상세 첫 화면 지도 노출
- 증상: 추천 결과 유튜브 패널이 단순 `영상 없음`처럼 보였고, 상세 화면은 `세부 정보 보기`를 열기 전까지 지도 진입점이 보이지 않아 지도가 빠진 것처럼 보였음.
- 원인: YouTube Data API `quotaExceeded`를 서비스가 `no-candidates`와 구분하지 않았고, `TravelSupportPanel`은 상세 펼침 영역 안에만 배치돼 있었음.
- 해결: 소셜 비디오 fallback reason에 `quota-exceeded`를 추가해 할당량 초과를 그대로 노출하고, 상세 첫 화면에도 `TravelSupportPanel`을 기본 배치해 지도/날씨/주변 장소 진입이 바로 보이게 했음.
- 검증: `npx vitest run tests/unit/api/social-video-route.spec.ts tests/unit/ui/destination-detail-experience.spec.tsx tests/unit/ui/social-video-panel.spec.tsx`, `npm run lint`, `npm run build`, 브라우저 확인(`social-video-block`가 `quota-exceeded` 안내 노출, `destination-travel-map-activate` 기본 노출)
- 참고 파일: `src/lib/social-video/service.ts`, `src/lib/domain/contracts.ts`, `src/components/trip-compass/destination-detail-experience.tsx`

### 2026-04-07 - 로그인 화면 로고를 `핀 + 길` 형태로 정리
- 증상: 로그인 화면 상단 로고는 색감은 좋았지만, 처음 보는 사용자가 여행 서비스 심볼로 바로 읽기 어려웠음.
- 원인: 기존 마크가 원형과 사선 조합 중심의 추상 형태라 `여행`, `목적지`, `이동` 중 무엇을 표현하는지 즉시 전달되지 않았음.
- 해결: 기존 파란 그라데이션은 유지하고, 내부 도형을 `도착 핀 + 안쪽 길 + 노란 도착 포인트`로 재구성해 의미 전달력을 높였음.
- 검증: `npx vitest run tests/unit/ui/auth-experience.spec.tsx`, `npm run build`
- 참고 파일: `src/components/trip-compass/auth-experience.tsx`

### 2026-04-14 - 한국 한정 iOS 배포 기준으로 DSA 연락처 요구 해석 정리
- 증상: iOS 제출 문서가 EU DSA trader 공개 연락처 요건을 한국 한정 배포에도 그대로 적용해 `집 주소 공개`가 필요한 것처럼 읽혔음.
- 원인: App Store Connect의 trader status 확인 흐름과 EU storefront에서 실제 공개되는 trader 연락처 요건을 구분하지 않고 문서화했음.
- 해결: iOS 제출 문서를 `대한민국만 배포` 기준으로 다시 정리하고, `Support URL`과 App Review 연락처는 실제 대응 가능한 `이름, 이메일, 전화번호`를 우선 준비하도록 수정했음. EU storefront를 열 때만 주소 또는 P.O. Box 재검토가 필요하다는 점도 함께 명시했음.
- 검증: Apple App Store Connect 최신 DSA/trader 문서 재확인, 제출 문서 교차 검토
- 참고 파일: `docs/ios-release-preflight.md`, `docs/ios-app-store-readiness-plan.md`, `docs/ios-app-store-connect-submission-pack.md`, `docs/ios-at-home-release-checklist.md`, `src/app/support/page.tsx`
