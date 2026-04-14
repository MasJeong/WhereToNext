---
name: soogo-api-route
description: Updates SooGo API route handlers when requests mention route.ts changes, API errors, response codes, Zod validation, auth/session guards, rate limits, or JSON contract fixes, producing validated route-safe changes with stable error codes and matching tests.
---

# SooGo API Route

## Purpose
This skill handles narrow API route work in `src/app/api/**/route.ts`.

In scope:
- request validation
- response shape updates
- stable error code handling
- auth/session checks
- rate-limit behavior and headers
- route-level test alignment

Out of scope:
- recommendation scoring changes
- snapshot restore internals
- general DB runtime refactors
- pure UI work

## Use when
- "route.ts 수정해줘"
- "API 에러 코드 바꿔줘"
- "추천 API 응답 shape 바꿔줘"
- "history API validation 고쳐줘"
- "preferences route에서 400 처리 수정해줘"
- "JSON 응답 구조 정리해줘"

## Do not use when
- recommendation ranking or scoring logic changes
- snapshot restore or compare hydration issues
- pure style or copy changes
- selector-only test work
- DB runtime or migration work

## Repo grounding
- `src/app/api/recommendations/route.ts`
- `src/app/api/snapshots/route.ts`
- `src/app/api/snapshots/[snapshotId]/route.ts`
- `src/app/api/me/preferences/route.ts`
- `src/app/api/me/history/route.ts`
- `src/app/api/me/history/[historyId]/route.ts`
- `src/lib/security/validation.ts`
- `src/lib/security/rate-limit.ts`
- `src/lib/domain/contracts.ts`
- `tests/unit/api/recommendations-route.spec.ts`

## Repo invariants
- Validate all external input with Zod.
- Keep API responses structured and explicit.
- Preserve stable error `code` values where a route already defines them.
- Keep user-facing errors safe and generic.
- Preserve existing rate-limit headers when present.
- Keep route handlers thin and reuse service/helpers.
- Do not use `any`, `as any`, `@ts-ignore`, or `@ts-expect-error`.

## Instructions
1. Read the target route and any directly connected validation and service files before editing.
2. Identify the current success response shape and every existing failure path.
3. Reuse existing Zod validation patterns from `src/lib/security/validation.ts` or nearby route files.
4. Preserve session checks and unauthorized response behavior for protected routes.
5. Preserve rate-limit behavior and headers for routes that already expose them.
6. If request or response shapes change, update the relevant contract or schema at the same time.
7. If a route already defines an error `code`, keep it stable unless the request explicitly requires a contract change.
8. End every catch path with an intentional JSON response or safe fallback.
9. Update related unit tests when route contracts or status behavior change.
10. Run the minimum repo verification commands plus route-specific tests.

## Inputs expected
- target route path
- requested behavior change
- affected request fields
- affected response fields
- auth required or not
- rate-limit affected or not
- verification scope

## Output format
- 결론: 변경한 route contract 또는 behavior
- 원인 또는 분석: 기존 validation, auth, error code, response constraints
- 실행 방법 또는 코드 예시: 수정 파일, payload example, test coverage

## Verification
- `npm run lint`
- `npm run test:unit`
- `npm run build`
- If recommendation route changed: `npx vitest run tests/unit/api/recommendations-route.spec.ts`

## Examples
- "recommendations route에서 INVALID_QUERY 응답 형식을 정리해줘"
  - This is a route-level contract and validation change.
- "me/history POST에 새 필드를 추가하고 validation도 맞춰줘"
  - This requires route, validation, and response alignment.
