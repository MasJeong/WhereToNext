# AGENTS.md
Agent guide for the `SooGo` repository.
Scope: entire repository.

`떠나볼까?` 제품을 다루는 `WhereToNext` 저장소용 에이전트 작업 가이드입니다.
적용 범위는 저장소 전체입니다.

## 1) 우선순위와 기본 원칙
- 우선순위는 `사용자 요청 > 시스템/개발자 지침 > 이 파일` 순서입니다.
- 실제 파일, 스크립트, 설정을 읽고 확인한 뒤 행동합니다.
- 라우트, 스키마, 명령어, 워크플로를 추측으로 만들지 않습니다.
- 변경은 작고 국소적으로 유지하고, 주변 패턴과 맞춥니다.
- 기존 helper, 서비스 계층, parser를 재사용하고 병렬 추상화를 새로 만들지 않습니다.
- 스택 질문은 먼저 `docs/tech-stack.md`를 읽고 판단합니다.
- 토큰과 검증 비용을 줄이는 작업 원칙은 먼저 `docs/agent-token-efficiency.md`를 읽고 적용합니다.
- 사용자 대상 한국어 문구를 바꾸기 전 `docs/korean-copy-guidelines.md`를 읽습니다.
- 반복 이슈나 최근 회귀를 디버깅할 때는 `docs/issue-resolution-log.md`를 먼저 읽습니다.
- 비사소한 문제를 해결했다면 `docs/issue-resolution-log.md`에 검증된 짧은 기록을 남깁니다.

## 2) 규칙 파일 스택
- 현재 활성 로컬 규칙 소스는 루트 `AGENTS.md` 하나입니다.
- Opencode 공식 훅 경로는 `.opencode/plugins/`로 취급합니다.
- 현재 확인 기준으로 `.cursorrules`, `.cursor/rules/`, `.github/copilot-instructions.md`, 중첩 `AGENTS.md`는 발견되지 않았습니다.
- 나중에 위 파일이 생기면 해당 내용을 따르고, 이 문서의 규칙 스택 섹션도 함께 갱신합니다.

## 3) 저장소 개요
- 제품명: `떠나볼까?`
- 저장소/원격 식별값: `WhereToNext`, `MasJeong/WhereToNext`
- 프레임워크: `Next.js 16 App Router`, `React 19`
- 언어: `TypeScript 5`, `strict: true`
- 스타일링: `Tailwind CSS 4`
- 검증: `Zod`
- 데이터: `Drizzle ORM`, `Postgres`, `PGlite` fallback
- 테스트: `Vitest`, `Playwright`
- 린트: `ESLint 9`

## 5) Branch and Command Sources
- Treat `main` as production and `dev` as integration; prefer `feature/*` branches for work.
- Treat `package.json` as the canonical source for scripts.
- Treat `vitest.config.ts` as the source of truth for unit-test runner behavior.
- Treat `playwright.config.ts` as the source of truth for e2e runner behavior.
- Use `README.md`, `docs/deployment.md`, and `docs/ios-release-preflight.md` as supporting docs, not as substitutes for config files.

## 5) `.sisyphus/`와 `memory/`의 역할
- `.sisyphus/`는 내부 계획과 스크래치 공간입니다. 공개 기록을 대신하면 안 됩니다.
- 정식 내부 계획 문서는 `.sisyphus/plans/`에 둡니다.
- 작업 초안은 `.sisyphus/drafts/`, 주제별 메모는 `.sisyphus/notepads/`를 사용합니다.
- `.sisyphus/boulder.json`은 현재 작업 계획, 세션 정보 같은 상태 메타데이터를 담습니다.
- 중요한 작업은 `memory/YYYY-MM-DD-short-slug/`에 공개 작업 기록을 남깁니다.
- `memory/`에는 최소 `plan.md`, `changes.md`, `verification.md`를 둡니다.
- `memory/`에는 비밀번호, 토큰, 대용량 생성물, 숨김 메모 정보를 남기지 않습니다.
- Markdown 문서는 가능하면 한국어로 작성하고 맨 위에 `한눈에 보기` 요약을 둡니다.

## 6) 브랜치와 명령어 소스
- `main`은 프로덕션, `dev`는 통합 브랜치로 취급합니다.
- 새 작업은 가능하면 `feature/*` 브랜치에서 진행합니다.
- `dev`에서 작업을 시작했다면 사용자가 직접 원하지 않는 한 `feature/*`로 분기 후 커밋합니다.
- 사용자가 별도 요청하지 않는 한, 에이전트가 작성하는 Git 커밋 메시지는 기본적으로 한국어로 작성합니다.
- 실행 가능한 명령은 `package.json`을 기준으로 판단합니다.
- 단위 테스트 러너 동작은 `vitest.config.ts`, e2e 동작은 `playwright.config.ts`를 기준으로 봅니다.

## 7) 기본 실행 명령
- 의존성 설치: `npm install`
- 개발 서버: `npm run dev`
- 프로덕션 빌드: `npm run build`
- 프로덕션 서버 실행: `npm run start`
- 전체 린트: `npm run lint`
- DB artifact 생성: `npm run db:generate`
- 시드 실행: `npm run db:seed`
- 전체 단위 테스트: `npm run test:unit`
- 전체 e2e 테스트: `npm run test:e2e`
- 스모크 검증: `npm run test:smoke`
- iOS 셸 빌드: `npm run shell:build`

## 9) Required Verification Before Finishing
- Minimum for code changes: `npm run lint && npm run test:unit && npm run build`.
- Run `npm run test:e2e` when the change affects user-visible flows, routing, or browser behavior.
- When touching a specific domain module, run the closest single-file or named test first, then the broader suite.

## 10) Formatting and General Style
- Follow existing ESLint + Next formatting; do not assume Prettier is active.
- Match the current style: double quotes, semicolons, trailing commas, and 2-space indentation.
- Keep diffs focused; avoid drive-by refactors during bug fixes.
- Prefer small pure helpers for domain logic and thin route handlers for transport concerns.
- Add concise JSDoc to every new or materially changed function.
- Match surrounding documentation language: core/business files often use Korean JSDoc, UI files often use English JSDoc.

## 10) 작업 완료 전 최소 검증
- 코드 변경의 최소 기준은 `npm run lint && npm run test:unit && npm run build`입니다.
- 사용자에게 보이는 플로우, 라우팅, 브라우저 동작을 건드렸다면 `npm run test:e2e`도 실행합니다.
- 특정 모듈을 수정했다면 먼저 가장 가까운 단일 테스트를 돌리고, 그 다음 전체 범위 검증으로 넓힙니다.

## 10-1) 토큰·검증 비용 절감 기본 규칙
- 검색은 항상 좁은 경로와 심볼 기준으로 시작하고, 루트 전체 검색은 마지막 수단으로만 사용합니다.
- 300줄이 넘는 파일은 필요한 함수와 주변 구간만 부분 읽고, 대형 파일 전체 재열람을 반복하지 않습니다.
- 검증은 항상 가장 가까운 단일 테스트 또는 관련 테스트 묶음부터 시작합니다.
- `npm run lint`, `npm run test:unit`, `npm run build`는 같은 턴에서 습관적으로 반복하지 말고, 마무리 단계에 1회 실행을 기본으로 합니다.
- `npm run test:e2e`는 브라우저 플로우, 라우팅, 인증, 복원, 공유 링크 같은 실제 사용자 흐름을 건드렸을 때만 실행합니다.
- 목적지 추가, 추천 fixture 변경, 검색 UX 수정처럼 고비용 작업은 `docs/agent-token-efficiency.md`의 작업 유형별 절차를 그대로 따릅니다.

## 11) 포맷과 문서 스타일
- 이 저장소는 ESLint + Next 스타일을 따르며, Prettier를 전제로 두지 않습니다.
- 실제 코드 스타일은 큰따옴표, 세미콜론, trailing comma, 2칸 들여쓰기입니다.
- 버그를 수정할 때는 곁가지 리팩터링을 하지 말고 diff를 작게 유지합니다.
- 새 함수나 크게 수정한 함수에는 짧은 JSDoc을 붙입니다.
- 코어/도메인 파일은 한국어 JSDoc이 많고, UI 파일은 영어 JSDoc이 섞여 있으므로 주변 스타일을 맞춥니다.
- ChatGPT Codex 커넥터가 남기는 PR 리뷰, 인라인 리뷰 코멘트, 이슈 코멘트, 리뷰 답글은 사용자가 별도 요청하지 않는 한 기본적으로 한국어로 작성합니다.
- 리뷰 코멘트는 불필요한 번역투를 피하고, 파일 경로, 코드 식별자, 에러 코드, 명령어는 원문 그대로 유지합니다.

## 12) import와 모듈 경계
- 내부 모듈은 `@/*` 별칭 import를 사용합니다.
- import 순서는 보통 `프레임워크/서드파티 -> @/ 내부 모듈 -> 상대 경로`를 따릅니다.
- 타입만 쓰는 import는 `import type`을 우선합니다.
- Node 내장 모듈은 필요 시 `node:` prefix를 사용합니다.
- 라우트나 컴포넌트에서 비즈니스 로직을 새로 구현하지 말고 `src/lib/`의 helper를 재사용합니다.
- API route는 전달 계층으로 얇게 유지하고 실제 로직은 `src/lib/`로 밀어냅니다.

## 13) 타입, 스키마, 계약 규칙
- `strict` 타입 안전성을 유지합니다.
- `any`, `as any`, `@ts-ignore`, `@ts-expect-error`는 사용하지 않습니다.
- 스키마는 `src/lib/domain/contracts.ts`를 기준으로 두고 `z.infer` 기반 타입을 선호합니다.
- 런타임 검증과 정적 타입은 항상 같은 계약을 가리켜야 합니다.
- payload 구조를 바꾸면 schema, parser, service, API response, test를 함께 갱신합니다.
- snapshot `kind` 같은 discriminated union은 깨지지 않게 유지합니다.
- `allowJs`가 켜져 있어도 새 코드는 기본적으로 `.ts`/`.tsx`를 사용합니다.

## 15) Validation, Errors, and API Behavior
- Validate all external input with Zod; prefer shared parsers in `src/lib/security/validation.ts`.
- Return structured JSON errors from API routes.
- Preserve stable error `code` values where a route already defines them.
- Keep user-facing errors safe and generic; never leak stack traces or internal details.
- Preserve rate-limit headers where already used.
- Catch blocks must end in an intentional fallback, null state, boolean failure, or safe user message.
- In route handlers, prefer early returns for auth, validation, and rate-limit failures.

## 15) Next.js / React 패턴
- `src/app/` 아래는 기본적으로 Server Component로 유지합니다.
- 브라우저 API, hook, 상호작용이 필요할 때만 `"use client"`를 추가합니다.
- 클라이언트 비중이 큰 화면은 `src/components/trip-compass/`에 두고 route는 이를 조합합니다.
- API handler는 `src/app/api/**/route.ts`에 둡니다.
- 동적 App Router 페이지와 route handler는 현재 패턴대로 async `params: Promise<{...}>` 형태를 맞춥니다.
- 필요하면 `searchParams: Promise<...>` 패턴도 동일하게 맞춥니다.

## 16) 검증, 에러 처리, 보안
- 외부 입력은 모두 Zod로 검증하고 가능하면 `src/lib/security/validation.ts`의 parser를 재사용합니다.
- API는 구조화된 JSON 에러를 반환하고, 기존 `code` 값이 있으면 유지합니다.
- 사용자 대상 에러는 안전하고 일반적인 메시지로 제한하며 stack trace를 노출하지 않습니다.
- catch 블록은 비워 두지 말고, 의도된 fallback, null, boolean failure, 안전한 메시지 중 하나로 마무리해야 합니다.
- auth, validation, rate limit 실패는 route handler 초반에 early return하는 패턴을 선호합니다.
- query, body, header, cookie, snapshot ID는 모두 신뢰할 수 없는 입력으로 취급합니다.
- `middleware.ts`의 보안 헤더와 API `X-Robots-Tag` 동작을 유지합니다.

## 17) 데이터, 추천, 영속성 규칙
- DB 접근은 ad hoc client를 따로 만들지 말고 `src/lib/db/runtime.ts`를 사용합니다.
- `DATABASE_URL`이 있으면 Postgres, 없으면 `PGlite` 대체 경로 규칙을 유지합니다.
- snapshot 복원은 fail closed 해야 하며, 저장 데이터가 없을 때 조용히 재계산하거나 부분 hydrate 하지 않습니다.
- 추천 로직은 결정적이고 설명 가능해야 합니다.
- 하드 필터를 불투명한 AI 점수로 덮어쓰지 않습니다.
- 증거 레이어는 결과를 풍부하게 만들 수 있지만 핵심 순위를 임의로 뒤집으면 안 됩니다.

## 18) UI, 테스트, 문서화 규칙
- 공통 시각 토큰과 클래스는 `src/app/globals.css`를 우선 재사용합니다.
- Tailwind 유틸리티와 공용 클래스(`compass-*`, `instagram-card`)를 우선 사용합니다.
- 새 wrapper를 만들기 전에 `ExperienceShell` 같은 기존 shell/layout primitive가 있는지 먼저 확인합니다.
- 인터랙티브 UI 변경 시 `src/lib/test-ids.ts`의 selector를 재사용하거나 추가합니다.
- raw `data-testid` 문자열을 임의로 흩뿌리지 않습니다.
- 계약, recommendation weight, snapshot, selector, 복원 동작을 바꾸면 테스트도 같이 갱신합니다.
- 명령, 환경 변수, 규칙이 바뀌면 `README.md`, `AGENTS.md`, `.env.example`도 함께 갱신합니다.
- 로컬 참조 이미지가 주어졌다면 UI 작업 전에 반드시 확인하고 시각 기준으로 삼습니다.

## 19) 마무리 체크리스트
- 실제 존재하는 스크립트와 도구만 사용했는가?
- 타입 안전성과 기존 계약을 유지했는가?
- 외부 입력 검증과 보안 헤더를 보존했는가?
- 변경된 동작에 맞춰 테스트와 selector를 갱신했는가?
- `npm run lint`, `npm run test:unit`, `npm run build`를 실행했는가?
- 브라우저 동작 변경이면 `npm run test:e2e`까지 실행했는가?

## 20) 장시간 응답 / 비정상 호출 대응 원칙
- 도구 호출이 오래 걸리거나 비정상 응답처럼 보이면, 먼저 호출 형식 오류, 포트 충돌, 빌드 타이밍 문제, background task 상태를 점검합니다.
- 즉시 abort되는 경우는 장시간 실행으로 간주하지 말고, 파라미터/호출 형식 오류를 먼저 의심하고 수정합니다.
- 명백히 멈춘 로컬 프로세스나 포트 점유 문제는 정리한 뒤 재시도합니다.
- 정상 실행 중인 background task는 함부로 취소하지 말고, 실제 정지/오류 징후가 있을 때만 후속 조치를 판단합니다.
- 재시도 전에는 왜 실패했는지 한 줄로라도 원인을 확인하고, 같은 방식으로 반복 호출하지 않습니다.
- 작업을 위해 로컬 개발 서버를 내렸다면, 작업과 검증이 끝난 뒤 다시 서버를 올려 둡니다.
