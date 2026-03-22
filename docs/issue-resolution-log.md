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
