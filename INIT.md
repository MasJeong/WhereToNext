# 한눈에 보기

- `INIT.md`는 `떠나볼까?` 저장소에 처음 들어온 사람과 에이전트를 위한 빠른 온보딩 문서입니다.
- 이 문서는 `이 프로젝트가 무엇인지`, `어떤 파일에 어떤 내용을 써야 하는지`, `어디부터 읽고 어디까지 확인해야 하는지`를 짧게 정리합니다.
- 방문자용 소개는 `README.md`, 작업 규칙은 `AGENTS.md`, 반복 이슈는 `docs/issue-resolution-log.md`가 기준입니다.

# 이 프로젝트는 무엇인가

`떠나볼까?`는 한국 출발 여행자를 위한 해외 여행지 추천 제품입니다.  
질문 몇 개로 여행 성향을 받고, 설명 가능한 추천 엔진이 목적지를 제안합니다.

현재 제품 범위는 아래 흐름에 집중합니다.

- 로그인 없이 추천 시작
- 추천 결과 저장과 공유
- 로그인 후 내 여행 기록 관리
- 공개 여행 이야기 열람과 댓글
- 대표 결과의 보조 정보 노출
  예: 소셜 비디오, 여행 지원 정보, 제휴 CTA

이 저장소는 단순 랜딩 페이지가 아닙니다.  
`Next.js App Router` 기반의 풀스택 제품 저장소이며, UI, API, 추천 로직, DB 접근, 테스트가 한 코드베이스에 함께 있습니다.

# 이 문서를 왜 두는가

외부 문서 가이드는 첫 문서가 아래 질문에 빨리 답해야 한다고 권장합니다.

- 이 프로젝트는 무엇을 하는가
- 왜 유용한가
- 어떻게 시작하는가
- 어디서 도움을 얻는가
- 어떤 방식으로 기여해야 하는가

또 프로젝트 비전과 기여 기대치를 문서로 분리해 두면, 스코프가 흔들리거나 불필요한 변경이 들어오는 일을 줄일 수 있습니다.

이 저장소에서는 그 역할을 다음처럼 나눕니다.

- `README.md`: 외부 방문자와 신규 사용자용
- `INIT.md`: 첫 작업 진입용
- `AGENTS.md`: 작업 규칙과 검증 규칙
- `docs/issue-resolution-log.md`: 이미 해결한 문제 재사용

# 먼저 읽을 문서

1. `README.md`
2. `INIT.md`
3. `AGENTS.md`
4. `docs/tech-stack.md`
5. `docs/agent-token-efficiency.md`
6. `docs/korean-copy-guidelines.md`
7. `docs/issue-resolution-log.md`

# 핵심 구조

- `src/app/`: App Router page, layout, API route 진입점
- `src/components/trip-compass/`: 실제 사용자 화면 UI
- `src/lib/`: 도메인 로직, 서비스, helper, parser, DB runtime
- `src/lib/domain/contracts.ts`: 계약 정의 기준
- `src/lib/security/validation.ts`: Zod parser 기준
- `src/lib/db/`: schema와 runtime
- `tests/unit/`: 단위 테스트
- `tests/e2e/`: Playwright 브라우저 테스트
- `docs/`: 운영 문서와 제품/배포/이슈 기록

# 로컬에서 바로 시작하는 법

```bash
npm install
npm run dev
```

- 개발 서버: `http://localhost:4010`
- 빌드: `npm run build`
- 린트: `npm run lint`
- 단위 테스트: `npm run test:unit`
- e2e 테스트: `npm run test:e2e`

`DATABASE_URL`이 없으면 `PGlite` 대체 경로로 동작합니다.  
운영/실데이터 확인이 필요하면 `.env.local`과 DB 연결 상태를 먼저 확인합니다.

# 파일을 새로 쓰거나 크게 고칠 때 무엇이 들어가야 하나

## 1. App Router page / layout

이런 파일:

- `src/app/page.tsx`
- `src/app/community/page.tsx`
- `src/app/account/settings/page.tsx`

좋은 파일이 되려면:

- 페이지의 역할이 분명해야 합니다.
- 데이터 조합과 접근 제어만 담당하고, 큰 UI는 `src/components/trip-compass/`로 밀어냅니다.
- 라우트 계약이 있으면 `params`, `searchParams`, redirect, notFound 처리가 분명해야 합니다.
- 브라우저 상호작용이 필요하지 않으면 Server Component로 유지합니다.

피해야 할 것:

- 추천 로직이나 DB 로직을 page 파일 안에서 직접 구현
- 클라이언트 훅이 없는데도 `"use client"` 추가
- 검증 없는 query/body 해석

## 2. API route

이런 파일:

- `src/app/api/**/route.ts`

좋은 파일이 되려면:

- route는 얇아야 합니다.
- 입력 검증은 Zod와 기존 parser를 사용해야 합니다.
- 실제 비즈니스 로직은 `src/lib/` 서비스로 보냅니다.
- 실패 시 구조화된 JSON 에러와 안정된 `code`를 유지합니다.
- auth, validation, rate limit 실패는 초반에 early return합니다.

기본 포함 항목:

- 입력 파싱
- 인증/권한 확인
- 서비스 호출
- 성공 응답 shape
- 실패 응답 shape

## 3. UI component

이런 파일:

- `src/components/trip-compass/community-experience.tsx`
- `src/components/trip-compass/home-experience.tsx`

좋은 파일이 되려면:

- 이 화면의 핵심 행동이 무엇인지 바로 보여야 합니다.
- 기존 shell, token, 공용 class를 먼저 재사용해야 합니다.
- 로딩, 빈 상태, 에러, 성공 상태가 모두 있어야 합니다.
- 사용자가 빠르게 판단할 수 있는 정보 위계를 가져야 합니다.
- 테스트 가능한 selector가 필요하면 `src/lib/test-ids.ts`에 추가합니다.

기본 포함 항목:

- 사용자의 다음 행동을 돕는 제목/보조 문구
- 상태별 렌더링
- 모바일 기준에서도 읽히는 구조
- 접근성 속성

피해야 할 것:

- raw `data-testid` 문자열 임의 추가
- 전역 스타일 토큰 무시
- 기존 디자인 언어와 무관한 새 wrapper 남발

## 4. `src/lib/` 서비스 / helper

이런 파일:

- `src/lib/recommendation/engine.ts`
- `src/lib/community/service.ts`
- `src/lib/auth.ts`

좋은 파일이 되려면:

- 입력과 출력 계약이 분명해야 합니다.
- route나 component에서 재사용 가능한 단위여야 합니다.
- 실패 시 fallback, null, boolean failure, 에러 코드 중 하나로 의도를 드러내야 합니다.
- 추천 로직은 설명 가능하고 결정적이어야 합니다.
- DB 접근은 ad hoc client가 아니라 `src/lib/db/runtime.ts`를 거쳐야 합니다.

기본 포함 항목:

- 함수 책임이 드러나는 이름
- 필요한 경우 짧은 JSDoc
- 계약과 맞는 return shape
- 테스트 가능한 분리된 로직

## 5. 테스트 파일

이런 파일:

- `tests/unit/**/*.spec.ts(x)`
- `tests/e2e/**/*.spec.ts`

좋은 파일이 되려면:

- 바뀐 사용자 행동이나 계약을 직접 검증해야 합니다.
- 한 테스트는 한 의도를 읽히게 써야 합니다.
- 기존 실패와 이번 변경을 분리해서 볼 수 있어야 합니다.
- UI 테스트는 문구보다 행동과 결과를 우선 확인합니다.

기본 포함 항목:

- 성공 시나리오
- 최소 1개의 실패 또는 경계 시나리오
- 새 selector나 새 정렬/필터/계약이 있으면 그 검증

## 6. 문서 파일

이런 파일:

- `docs/*.md`
- `memory/**/plan.md`

좋은 파일이 되려면:

- 맨 위에 `한눈에 보기` 요약이 있어야 합니다.
- 현재 기준으로 맞는 정보만 남겨야 합니다.
- 명령어, 경로, 규칙은 실제 저장소 상태와 맞아야 합니다.
- 한국어 위주로 간결하게 씁니다.

문서에 특히 들어가면 좋은 것:

- 목적
- 현재 범위
- 실제 경로
- 검증 방법
- 다음 문서 링크

# 이 프로젝트에서 좋은 변경의 기준

- 작고 국소적인 diff
- 기존 helper, service, parser 재사용
- 계약과 테스트 동시 갱신
- 사용자 대상 문구는 한국어 톤 가이드 준수
- 보안 헤더, 입력 검증, auth 흐름 보존
- 마지막에 필요한 범위만 검증

# 작업 전에 스스로 확인할 질문

- 지금 바꾸는 파일이 page, component, route, service 중 어디에 속하는가?
- 이 파일에 들어가면 안 되는 로직을 넣고 있지 않은가?
- 이미 같은 역할을 하는 helper나 service가 있는가?
- 이번 변경으로 계약, selector, 테스트를 같이 바꿔야 하는가?
- 전체 검증 전에 더 가까운 단일 테스트가 있는가?

# 자주 틀리는 지점

- page에서 비즈니스 로직을 직접 구현
- API route에서 Zod 검증 생략
- `src/lib/db/runtime.ts`를 우회한 DB 접근
- 대형 파일 전체를 반복 열람
- 기존 문구/스타일 규칙을 무시한 한국어 카피 변경
- 변경 후 `docs/issue-resolution-log.md`를 갱신하지 않음

# 다음 문서

- 제품 소개와 실행: [README.md](./README.md)
- 작업 규칙: [AGENTS.md](./AGENTS.md)
- 스택 요약: [docs/tech-stack.md](./docs/tech-stack.md)
- 토큰/검증 비용 절감: [docs/agent-token-efficiency.md](./docs/agent-token-efficiency.md)
- 한국어 카피: [docs/korean-copy-guidelines.md](./docs/korean-copy-guidelines.md)
- 반복 이슈 기록: [docs/issue-resolution-log.md](./docs/issue-resolution-log.md)
