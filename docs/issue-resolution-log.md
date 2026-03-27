# SooGo Issue Resolution Log

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
- Symptoms: 사용자가 본 현상 또는 에러 메시지
- Cause: 확인된 원인
- Resolution: 적용한 해결 방법
- Verification: 재현/테스트/빌드 등 확인 방법
- References: 관련 파일 경로
```

## Entries

### 2026-03-27 - 대표 추천 외부 여행 보조 데이터 레이어 추가
- Symptoms: 결과 화면과 저장 링크 복원 화면에서 대표 추천을 결정하는 데 필요한 실용 정보가 부족해, 이미지/날씨/지도/환율/주변 장소를 짧게 덧붙이는 요구가 생김.
- Cause: 기존 제품은 결정형 추천 결과와 분위기 근거, 저장/비교 흐름은 안정적이었지만 외부 여행 데이터 공급자를 묶는 서버 집계 레이어와 공용 UI가 없었음.
- Resolution: 대표 추천 1곳만 대상으로 Unsplash, Open-Meteo, Google Maps Platform, exchangerate.host를 조합하는 fail-soft 집계 레이어를 추가했고, `/api/recommendations`, 목적지 상세, 저장 링크 복원 경로가 같은 supplement를 재사용하도록 맞췄음. 결과 화면은 이미지 우선, 날씨/환율/작은 지도/주변 장소 순으로 얇게 보이도록 정리했고, 공유 링크를 열 때는 저장된 추천 결과 위에 외부 데이터만 다시 조회하도록 구성했음. 숙소 가격 범위는 v1에서 제외했음.
- Verification: `npx tsc --noEmit`, `npm run lint`, `npx vitest run tests/unit/api/recommendations-route.spec.ts tests/unit/travel-support/service.spec.ts`
- References: `src/app/api/recommendations/route.ts`, `src/lib/domain/contracts.ts`, `src/lib/travel-support/service.ts`, `src/lib/trip-compass/route-data.ts`, `src/components/trip-compass/travel-support-panel.tsx`, `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/destination-detail-experience.tsx`, `.env.example`, `README.md`

### 2026-03-26 - 홈 funnel 리디자인 후 e2e contract copy/motion 정렬
- Symptoms: 외부 travel funnel 프롬프트 기준으로 홈 퍼널을 리디자인한 뒤 Playwright recommendation flow에서 저장 snapshot 복원과 lead card day-flow 검증이 브라우저 전반에서 실패했고, Oracle 리뷰에서도 `framer-motion` 미사용과 white-first 정렬 부족이 남아 있었음.
- Cause: 리디자인 과정에서 e2e가 기대하는 링크 라벨 `공유 페이지 보기`와 lead card heading `Day-flow`가 더 짧은 copy로 바뀌었고, 외부 프롬프트의 명시 요구사항인 `framer-motion` 기반 전환은 아직 반영되지 않았음.
- Resolution: 홈 퍼널 UI는 유지하되 e2e contract copy를 정확히 복구하고, `framer-motion`을 추가해 landing/question/result/progress/hero에 최소 전환을 넣었으며, stale recommendation response가 restart/reopen 뒤에 늦게 state를 덮지 않도록 request invalidation guard를 추가했음. funnel color token도 더 white-first로 조정했음.
- Verification: `npm run lint`, `npx vitest run tests/unit/trip-compass/step-answer-adapter.spec.ts`, `npm run build`, `npx playwright test tests/e2e/recommendation-flow.spec.ts`
- References: `package.json`, `src/app/globals.css`, `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/home/landing-page.tsx`, `src/components/trip-compass/home/hero-animation.tsx`, `src/components/trip-compass/home/step-question.tsx`, `src/components/trip-compass/home/progress-bar.tsx`, `src/components/trip-compass/home/result-page.tsx`, `tests/e2e/recommendation-flow.spec.ts`

### 2026-03-26 - 홈 funnel UI 리빌드 중 snapshot share URL 회귀
- Symptoms: 홈 UI 리빌드 이후 Playwright production e2e에서 저장 snapshot 생성 API는 200으로 성공했지만 `saved-snapshot-0`이 나타나지 않았고, 저장/비교/clipboard fallback 관련 흐름이 연쇄적으로 실패했음.
- Cause: `home-experience.tsx`가 snapshot share URL을 만들 때 `window.location.origin` 대신 `buildPublicUrl()`를 사용하도록 바뀌었고, 이 helper는 production browser runtime에서 `NEXT_PUBLIC_APP_ORIGIN`이 없으면 throw 하도록 설계돼 있었음. 그 결과 저장 API 응답 직후 client-side 예외가 발생해 saved snapshot state가 반영되지 않았음.
- Resolution: 홈 funnel UI는 유지하되, snapshot share URL 생성만 브라우저 현재 origin 기반으로 되돌려 저장/공유/비교 state 반영을 복구했음.
- Verification: `npx eslint "src/components/trip-compass/home-experience.tsx"`, `npx vitest run tests/unit/api/recommendations-route.spec.ts tests/unit/domain/recommendation-query.spec.ts`, `npm run build`, `npx playwright test tests/e2e/recommendation-flow.spec.ts`
- References: `src/components/trip-compass/home-experience.tsx`, `src/lib/runtime/url.ts`, `tests/e2e/recommendation-flow.spec.ts`

### 2026-03-25 - iOS launch groundwork completed but native shell blocked by export/Xcode prerequisites
- Symptoms: `ios-launch-path` 작업 중 PWA, share URL, route restore, WebKit, shell CORS까지는 정리됐지만 실제 Capacitor iOS shell 생성 단계에서 repo가 production-safe static `webDir`를 만들지 못했고, 로컬 환경도 full Xcode/simulator를 제공하지 않았음.
- Cause: 현재 Next 16 App Router 구조는 일반 `next build`만으로 Capacitor가 기대하는 bundled HTML asset target을 만들지 않으며, dynamic routes/API/middleware를 유지한 상태라 native shell target을 별도로 설계해야 함. 또한 이 환경은 `/Library/Developer/CommandLineTools`만 활성화돼 있어 `xcodebuild` simulator 검증이 불가능했음.
- Resolution: iOS groundwork는 계속 진행해 WebKit/Mobile Safari 검증, canonical public/API URL 분리, PWA metadata, clipboard/retry fallback, shell-origin CORS, route-data/view extraction, shell-mode CTA guard까지 반영했고, native shell / universal links 단계는 architecture+environment blocker로 명시적으로 중단했음.
- Verification: `npm run lint`, `npm run build`, `npx vitest run tests/unit/runtime/url.spec.ts`, `npx playwright test tests/e2e/recommendation-flow.spec.ts -g "shows a retry path when recommendation loading fails|shows a manual-copy fallback when snapshot clipboard copy fails|shows a manual-copy fallback when detail clipboard copy fails"`, `npx playwright test tests/e2e/smoke.spec.ts -g "keeps auth and account navigation in standard web mode"`, `NEXT_PUBLIC_IOS_SHELL=true npx playwright test tests/e2e/smoke.spec.ts -g "hides auth and account navigation in ios shell mode"`, runtime shell-origin CORS probe with `Origin: capacitor://localhost`
- References: `src/lib/runtime/url.ts`, `src/lib/runtime/shell.ts`, `src/lib/security/cors.ts`, `src/lib/trip-compass/route-data.ts`, `src/components/trip-compass/snapshot-restore-view.tsx`, `src/components/trip-compass/compare-restore-view.tsx`, `src/components/trip-compass/experience-shell.tsx`, `src/app/layout.tsx`, `src/app/api/recommendations/route.ts`, `src/app/api/snapshots/route.ts`, `src/app/api/snapshots/[snapshotId]/route.ts`, `src/app/api/auth/session/route.ts`, `docs/ios-release-preflight.md`

### 2026-03-24 - Triple에 더 가까운 모바일 리듬으로 메인 표면 밀도 재조정
- Symptoms: 기존 리빌드 이후에도 홈, 결과, 상세, 비교, auth, account가 warm editorial 톤은 유지했지만 질문 화면의 진행 크롬, 카드 높이, 보조 카피, 정보 묶음이 여전히 두꺼워 모바일 기준 Triple류 앱보다 덜 촘촘하고 덜 즉각적으로 느껴졌음.
- Cause: 공통 shell, 카드 반경/그림자, 홈 질문 카드, 결과 카드, 상세 섹션, 비교 표, auth/account 표면이 전반적으로 넉넉한 편집형 spacing과 다중 설명 블록을 유지해 한 화면 한 판단 리듬이 약했음.
- Resolution: `globals.css`에서 radius/shadow와 공통 compact stack 패턴을 조정하고, `experience-shell`을 더 낮은 상단 chrome으로 줄였으며, 홈은 2열 답변 그리드와 compact progress 구조로, 결과 카드는 summary-first와 짧은 stacked section 구조로, 상세/비교/auth/account는 더 짧은 코어 정보 블록과 낮은 카피 밀도로 재정렬했음. 기존 selector와 추천/저장/비교 계약은 유지했음.
- Verification: `npm run lint`, `npm run test:unit`, `npm run build`, `npm run test:e2e`
- References: `src/app/globals.css`, `src/components/trip-compass/experience-shell.tsx`, `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/recommendation-card.tsx`, `src/components/trip-compass/destination-detail-experience.tsx`, `src/components/trip-compass/compare-board.tsx`, `src/components/trip-compass/account-experience.tsx`, `src/components/trip-compass/auth-experience.tsx`

### 2026-03-23 - Tripple형 단계식 추천 흐름으로 홈/상세/취향 루프 재구성
- Symptoms: 기존 SooGo는 추천/저장/비교 기능은 있었지만 홈이 단계식 질문 흐름보다 다중 패널 구조에 가까워 첫 진입 피로가 높았고, 목적지 상세·취향 기록 루프도 한 제품 흐름으로 읽히지 않았음.
- Cause: 기존 UI 계층이 editorial shell, 카드 비교, 저장 복원 흐름 위주로 누적되어 `한 화면 한 질문 -> 짧은 TOP 결과 -> 목적지 상세 -> 취향 누적` 구조를 자연스럽게 만들지 못했음.
- Resolution: 공통 셸을 낮은 크롬의 모바일 프레임으로 줄이고, 홈을 step-answer adapter 기반 단일 질문 흐름으로 재구성했으며, 결과를 TOP 요약 + 목적지 카드 구조로 정리하고, `/destinations/[slug]` 상세와 taste logging, `/s/[snapshotId]` 복원, `/compare/[snapshotId]` 비교, account/auth 화면을 recommendation-first 제품 언어에 맞게 한국어 중심으로 다듬었음. 추천/히스토리/스냅샷 백엔드 계약은 유지했음.
- Verification: `npm run lint`, `npm run test:unit`, `npm run build`, `npm run test:e2e`, `npm run dev`, `curl http://localhost:4010`, `curl http://localhost:4010/destinations/tokyo-japan`, `curl "http://localhost:4010/api/recommendations?partyType=couple&partySize=2&budgetBand=mid&tripLengthDays=5&departureAirport=ICN&travelMonth=10&pace=balanced&flightTolerance=medium&vibes=romance,food"`
- References: `src/components/trip-compass/home-experience.tsx`, `src/lib/trip-compass/step-answer-adapter.ts`, `src/components/trip-compass/experience-shell.tsx`, `src/components/trip-compass/destination-detail-experience.tsx`, `src/app/destinations/[slug]/page.tsx`, `src/app/s/[snapshotId]/page.tsx`, `src/app/compare/[snapshotId]/page.tsx`, `src/components/trip-compass/account-experience.tsx`, `src/components/trip-compass/auth-experience.tsx`, `src/lib/test-ids.ts`, `tests/e2e/recommendation-flow.spec.ts`, `tests/e2e/smoke.spec.ts`, `tests/unit/smoke.spec.tsx`

### 2026-03-23 - 목적지 중심 탐색 루프로 홈/상세/저장/비교/My Taste를 재정렬
- Symptoms: 기존 구조는 추천 엔진과 저장/복원 계약은 안정적이었지만, 첫 화면 즉시 탐색, 목적지 상세, 저장된 추천 재열람, 취향 누적 루프가 하나의 모바일 중심 제품 흐름으로 이어지지 않았음.
- Cause: 홈이 질문 단계 중심으로 시작하고, `/s/[snapshotId]`는 저장된 추천 detail/workspace라기보다 카드 복원에 가까웠으며, 목적지 상세 route 자체가 없어 Triple/Trip.com/Airbnb식 destination-first loop가 약했음.
- Resolution: `ui-ux-pro-max` 지침과 기존 토큰 시스템을 바탕으로 `globals.css`, shared shell, 홈 탐색/질문 흐름, 추천 카드, compare board, auth/account 경험을 밝은 white/yellow/orange 톤의 destination-first UX로 재구성하고, 새 `/destinations/[slug]` route를 추가해 추천 맥락·근거·체크 포인트·My Taste 연결을 한 흐름으로 묶었음. 기존 recommendation/snapshot/compare 백엔드 계약은 유지했음.
- Verification: `npm run lint`, `npm run test:unit`, `npm run build`, `npm run test:e2e`
- References: `src/app/globals.css`, `src/components/trip-compass/experience-shell.tsx`, `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/recommendation-card.tsx`, `src/components/trip-compass/compare-board.tsx`, `src/components/trip-compass/destination-detail-experience.tsx`, `src/app/destinations/[slug]/page.tsx`, `src/app/s/[snapshotId]/page.tsx`, `src/components/trip-compass/account-experience.tsx`, `src/components/trip-compass/auth-experience.tsx`

### 2026-03-22 - SooGo 전반 UI를 premium editorial workspace로 재정렬
- Symptoms: 홈, 결과 카드, 비교 보드, 복원 페이지, auth/account 화면이 서로 다른 시기의 시각 언어를 섞어 쓰고 있어 제품 전체가 하나의 curated travel workspace처럼 이어지지 않았음.
- Cause: recommendation/snapshot 흐름은 이미 안정적이었지만 shared shell, global tokens, 결과/비교/복원/auth/account 표면이 각각 다른 색감과 위계에 머물러 있어 플랫폼 단위의 일관성이 부족했음.
- Resolution: `ui-ux-pro-max` 방향과 `design-system/soogo/MASTER.md`를 실제 제품 구조에 맞게 해석해, `globals.css` 토큰을 warm paper/ink/brass 중심으로 재설계하고 home/results/restore/compare/auth/account를 같은 editorial brief -> shortlist -> decision workspace 언어로 통합했음. 기존 recommendation/save/restore/compare 동작과 selector 계약은 유지했음.
- Verification: `npm run lint`, `npm run test:unit`, `npm run build`, `npm run test:e2e`
- References: `src/app/globals.css`, `src/components/trip-compass/experience-shell.tsx`, `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/recommendation-card.tsx`, `src/components/trip-compass/compare-board.tsx`, `src/app/s/[snapshotId]/page.tsx`, `src/app/compare/[snapshotId]/page.tsx`, `src/components/trip-compass/auth-experience.tsx`, `src/components/trip-compass/account-experience.tsx`, `src/app/layout.tsx`

### 2026-03-22 - 여행 추천 카드 중심 제품을 trip workspace 중심으로 재구성
- Symptoms: 기존 홈과 결과 흐름이 `설문 -> 추천 카드 -> 저장/비교`에 머물러, 벤치마킹한 여행 제안 플랫폼들처럼 조건 brief, explainable shortlist, 저장된 결정 보드로 이어지는 제품 경험이 약했음.
- Cause: 추천 엔진과 스냅샷 복원은 이미 충분했지만, `home-experience`, `recommendation-card`, restore/compare 페이지가 저장 결과를 planning workspace가 아니라 개별 카드 복원 화면처럼 표현하고 있었음.
- Resolution: 기존 deterministic recommendation API와 `recommendation`/`comparison` snapshot 계약은 유지한 채, 홈을 brief-first planner로 재구성하고 결과/저장/비교/공유 페이지를 shortlist 및 decision workspace 중심 UX로 재설계했음. 관련 presentation helper, restore helper, selectors, unit/e2e assertions도 함께 맞춤.
- Verification: `npm run lint`, `npm run test:unit`, `npm run build`, `npm run test:e2e`, `npm run dev`, `curl http://localhost:4010`, `curl "http://localhost:4010/api/recommendations?partyType=couple&partySize=2&budgetBand=mid&tripLengthDays=5&departureAirport=ICN&travelMonth=10&pace=balanced&flightTolerance=medium&vibes=romance,food"`
- References: `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/recommendation-card.tsx`, `src/components/trip-compass/compare-board.tsx`, `src/app/s/[snapshotId]/page.tsx`, `src/app/compare/[snapshotId]/page.tsx`, `src/lib/trip-compass/presentation.ts`, `src/lib/trip-compass/restore.ts`, `tests/e2e/recommendation-flow.spec.ts`

### 2026-03-19 - Trip Compass 홈/결과 UI 구조 회귀
- Symptoms: 홈 화면과 추천 결과 화면의 섹션 경계가 흐려지고, 입력 단계와 결과 단계가 한 덩어리처럼 보여 데스크톱 웹 플로우의 단계성이 약해짐.
- Cause: 과도한 de-cardify 이후 stage shell은 남아 있었지만 `home-experience`와 `recommendation-card`가 그 구조를 충분히 사용하지 못해 intro -> criteria -> result 흐름과 list/detail 위계가 약해졌음.
- Resolution: `globals.css`에 stage/list-detail/compare board 공통 구조 클래스를 보강하고, 홈 화면을 3단계 데스크톱 흐름으로 재구성했으며, 추천 카드는 요약-상세 위계로 정리하고 비교는 board/grid 구조를 유지하도록 조정함.
- Verification: `npm run lint`, `npm run test:unit`, `npm run build`, `npm run test:e2e`
- References: `src/app/globals.css`, `src/components/trip-compass/experience-shell.tsx`, `src/components/trip-compass/home-experience.tsx`, `src/components/trip-compass/recommendation-card.tsx`, `src/components/trip-compass/compare-board.tsx`

### 2026-03-18 - 로컬 JSON 스토어 임시 파일 충돌
- Symptoms: 저장 복원과 비교 보드 흐름이 간헐적으로 실패하고, e2e에서 `LOCAL_STORE_PARSE_FAILED` 또는 `.tmp` 파일 관련 오류가 발생함.
- Cause: 로컬 JSON 스토어가 항상 같은 임시 파일명을 사용해서 동시 쓰기 시 충돌이 발생함.
- Resolution: 임시 파일명을 `randomUUID()` 기반으로 고유하게 만들고, 직렬 e2e 설정과 함께 사용함.
- Verification: `npm run test:e2e`, `npm run build`
- References: `src/lib/persistence/local-store.ts`, `playwright.config.ts`

### 2026-03-18 - Playwright가 오래된 3000 포트 서버를 재사용하는 문제
- Symptoms: 최신 코드가 아닌 이전 빌드/이전 개발 서버 기준으로 e2e가 실행되어 selector 또는 비교 보드 동작이 엇갈림.
- Cause: 3000 포트에 남아 있는 기존 프로세스와 `reuseExistingServer` 동작이 겹쳐 fresh server가 아닌 stale server를 보게 됨.
- Resolution: Playwright는 항상 새 서버를 띄우도록 설정하고, 검증 전에 3000 포트를 정리하는 운영 절차를 사용함.
- Verification: `npm run test:e2e`, 수동 `npm run start` + `curl http://localhost:3000`
- References: `playwright.config.ts`

### 2026-03-19 - CI e2e job에서 production build 누락
- Symptoms: GitHub Actions의 `Playwright E2E` job이 `Could not find a production build in the '.next' directory` 오류와 함께 시작 단계에서 실패함.
- Cause: `playwright.config.ts`는 `npm run start`를 사용하지만, 별도 job으로 실행되는 `.github/workflows/ci.yml`의 `e2e` 단계에서는 `npm run build`를 먼저 실행하지 않아 `.next` 산출물이 존재하지 않았음.
- Resolution: `e2e` job 안에 `npm run build` 단계를 추가해 Playwright가 production server를 띄우기 전에 같은 job에서 `.next`를 생성하도록 수정함.
- Verification: `npm run build`, `npm run test:e2e`, GitHub Actions `Playwright E2E`
- References: `.github/workflows/ci.yml`, `playwright.config.ts`

### 2026-03-19 - 로컬 기본 포트 3000 충돌
- Symptoms: 다른 프로젝트가 3000 포트를 사용 중일 때 이 저장소의 `npm run dev`, `npm run start`, Playwright 검증 흐름이 포트 충돌 또는 잘못된 로컬 서버 대상으로 이어질 수 있었음.
- Cause: `package.json`과 `playwright.config.ts`가 3000 포트 기본값에 묶여 있었고, 단위 테스트 fixture URL도 같은 포트를 하드코딩하고 있었음.
- Resolution: 이 저장소의 로컬 기본 앱 포트를 4010으로 옮기고, Playwright base URL 및 테스트 fixture URL, README 사용 예시를 같은 값으로 맞춤.
- Verification: `npm run lint`, `npm run test:unit`, `npm run build`, `npm run start`, `curl http://localhost:4010`
- References: `package.json`, `playwright.config.ts`, `tests/unit/api/recommendations-route.spec.ts`, `README.md`
