# 한눈에 보기

- 이 문서는 `떠나볼래` 저장소에서 에이전트와 사람이 작업할 때 LLM 컨텍스트 토큰과 불필요한 검증 비용을 함께 줄이기 위한 운영 기준입니다.
- 상세 근거와 예외는 이 문서에 두고, 매 작업에 바로 적용할 핵심 규칙은 루트 `AGENTS.md`에 짧게 유지합니다.
- 기본 원칙은 `작게 읽고`, `가깝게 검색하고`, `가까운 테스트부터 돌리고`, `전체 검증은 마지막에 한 번만`입니다.

# 토큰이 크게 늘어나는 작업

## 큰 파일 직접 수정

- `src/components/trip-compass/home-experience.tsx`
- `src/components/trip-compass/account-history-create-experience.tsx`
- 위처럼 1000줄 이상인 파일은 전체를 반복해서 읽지 말고, 관련 함수와 주변 80~200줄만 부분 읽습니다.

## 정적 카탈로그 확장

- `src/lib/catalog/launch-catalog.ts`
- `src/lib/evidence/catalog.ts`
- `tests/unit/recommendation/golden-fixtures.ts`
- 목적지 추가는 한 파일 수정으로 끝나지 않고 추천 fixture까지 흔들 수 있으므로, 처음부터 묶어서 다룹니다.

## 전체 저장소 검색 남발

- 루트 전체 `rg`는 마지막 수단입니다.
- 먼저 경로, 도메인, 심볼, 테스트 파일 후보를 좁혀서 검색합니다.

## 전체 검증 반복

- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `npm run test:e2e`
- 같은 턴에 위 명령을 여러 번 반복하면 로컬 시간과 에이전트 설명 토큰이 함께 증가합니다.

# 기본 탐색 원칙

## 검색

- 먼저 `src/lib/...`, `src/components/...`, `tests/unit/...`처럼 범위를 좁혀 `rg`를 실행합니다.
- 심볼이나 테스트명이 보이면 전체 파일 대신 해당 구간만 `sed -n`으로 읽습니다.
- 검색 결과가 길면 그대로 다 읽지 말고, 바로 다음 읽기 범위를 결정하는 데 필요한 줄만 봅니다.

## 읽기

- 300줄 이하 파일은 필요 시 전체 읽기를 허용합니다.
- 300줄 초과 파일은 관련 함수/타입/테스트 구간만 부분 읽기를 기본값으로 합니다.
- 한 번 읽은 파일은 다시 열기 전에 이미 확보한 사실을 요약해 재사용합니다.

## 출력

- 명령 출력 전체를 그대로 길게 싣지 않습니다.
- 실패 원인, 영향 파일, 다음 액션만 추려서 보고합니다.

# 최소 검증 운영 규칙

## 기본 순서

1. 가장 가까운 단일 테스트 또는 파일 단위 테스트
2. 관련 묶음 테스트
3. 필요 시 `build`
4. 작업 마무리 시 `lint`
5. 브라우저 플로우를 건드렸을 때만 `e2e`

## 작업 유형별 기본 검증

### 목적지 카탈로그 추가

- 먼저:
  - `npx vitest run tests/unit/catalog/launch-catalog.spec.ts tests/unit/evidence/service.spec.ts`
  - `npx vitest run tests/unit/recommendation/golden-cases.spec.ts`
- 그다음:
  - `npm run build`
- 마지막:
  - `npm run lint`
- `npm run test:unit` 전체는 위 테스트들로 범위를 좁혀 해결이 안 되거나, 연쇄 영향이 넓다고 판단될 때만 실행합니다.

### 검색 UX / 폼 입력 / selector 수정

- 먼저 해당 UI 테스트 파일 1개를 실행합니다.
- 예:
  - `npx vitest run tests/unit/ui/account-history-create-experience.spec.tsx`
- 브라우저 플로우를 직접 바꾼 것이 아니면 `e2e`는 생략합니다.

### 추천 엔진 / fixture / 점수 규칙 수정

- 먼저 관련 fixture나 엔진 테스트만 실행합니다.
- fixture가 흔들리면 카탈로그 확장 영향인지 로직 회귀인지 먼저 분리합니다.
- 의도된 후보군 확장이라면 fixture를 현재 결과에 맞추고, 그 사실을 `docs/issue-resolution-log.md`에 남깁니다.

### App Router / route handler / build-time contract 수정

- 단일 테스트가 있으면 먼저 실행합니다.
- 이후 `npm run build`를 우선합니다.
- `build`가 통과한 뒤에만 전체 unit 또는 `e2e` 확대를 검토합니다.

### 홈/결과/인증 같은 사용자 플로우 수정

- 단일 unit 또는 smoke 범위부터 실행합니다.
- 실제 라우팅, 상호작용, 인증 전환, 공유 링크, 복원 흐름이 바뀌었을 때만 `npx playwright test ...` 또는 `npm run test:e2e`를 실행합니다.

# 비싼 명령을 줄이는 운영 기준

## `lint`

- 기본적으로 마무리 단계 1회만 실행합니다.
- 같은 턴에서 이미 `lint` 경고만 확인했고 코드가 문서/데이터만 바뀌었다면 재실행하지 않습니다.

## `build`

- App Router, route handler, 환경 변수 참조, static params, Next metadata, build-time import 영향을 건드렸을 때 우선 실행합니다.
- 단순 카피, 작은 클라이언트 입력 처리, 단위 UI 테스트 수정만 했다면 바로 `build`로 가지 말고 단일 테스트부터 확인합니다.

## `test:unit`

- 1차 기본값으로 쓰지 않습니다.
- 단일 테스트나 관련 테스트 묶음이 모두 통과한 뒤, 영향 범위가 넓은 작업에서만 실행합니다.

## `test:e2e`

- 브라우저 플로우와 라우팅 계약 변경에만 사용합니다.
- 이 저장소는 Playwright가 `build && start`를 포함하므로 로컬 시간 비용이 큽니다.
- 저장소 내부 문서, 카탈로그 데이터, 단일 입력 처리 수정에는 기본적으로 사용하지 않습니다.

# 금지 패턴

- 문제를 확인하기도 전에 `npm run lint && npm run test:unit && npm run build`를 습관적으로 먼저 실행
- 루트 전체 `rg` 결과를 큰 덩어리로 반복해서 읽기
- 대형 파일을 처음부터 끝까지 여러 번 재열람
- 단일 테스트가 있는데도 곧바로 `npm run test:unit` 또는 `npm run test:e2e`로 확장
- 같은 턴에서 동일한 `build`나 `lint`를 이유 없이 반복

# 권장 패턴

- 검색은 좁게, 읽기는 부분적으로, 검증은 가까운 곳부터
- 변경 전에 영향 파일과 가장 가까운 테스트를 먼저 고정
- 실패가 나면 전체 검증으로 넓히기 전에 “의도된 변화 / 회귀 / 무관한 기존 실패”를 먼저 분리
- 큰 작업은 한 번에 구현하지 말고, 카탈로그/검색/검증처럼 결합 단위로 묶어서 순서화

# 목적지 추가 전용 절차

## 기본 절차

1. `launch-catalog`, `evidence`, `country-metadata` 필요 여부를 먼저 확인
2. 관련 테스트 파일과 `golden-fixtures` 존재 여부를 먼저 확인
3. 카탈로그 추가 후 `launch-catalog`, `evidence`, `golden-cases`만 우선 실행
4. fixture 변동이 의도된 결과라면 현재 후보군 기준으로 갱신
5. 마지막에 `build`, `lint` 순으로 1회 실행

## 이 절차가 필요한 이유

- 목적지 추가는 추천 결과를 쉽게 흔듭니다.
- 전체 unit을 먼저 돌리면 원인 파악보다 출력만 커집니다.
- 먼저 관련 테스트만 돌리면 영향 범위와 회귀 여부를 빠르게 분리할 수 있습니다.

# 문서 유지 원칙

- 실제 스크립트 이름과 테스트 경로가 바뀌면 이 문서를 즉시 갱신합니다.
- 반복적으로 비용을 많이 유발한 작업이 확인되면 `docs/issue-resolution-log.md`와 함께 이 문서를 보강합니다.
- 새 자동화 규칙을 도입하더라도 canonical source는 이 문서와 루트 `AGENTS.md`를 유지합니다.
