---
name: soogo-recommendation-engine
description: Updates SooGo recommendation scoring and ranking logic when requests mention recommendation weights, ranking order, scoring reasons, explainability, personalization impact, or golden-case drift, producing deterministic and explainable recommendation changes with aligned tests.
---

# SooGo Recommendation Engine

## Purpose
This skill handles recommendation scoring, ranking, and explanation changes centered on the engine layer.

In scope:
- scoring rule updates
- ranking order changes
- reason generation changes
- personalization impact tuning
- recommendation contract alignment
- golden-case and personalization test updates

Out of scope:
- route-only API transport fixes
- snapshot persistence or restore fixes
- pure UI rendering changes
- auth/session changes

## Use when
- "추천 점수 조정해줘"
- "랭킹 순서가 이상해"
- "whyThisFits 문구가 결과랑 안 맞아"
- "개인화 영향이 너무 커"
- "golden case가 깨졌어"
- "추천 이유 생성 로직 바꿔줘"

## Do not use when
- route error handling only
- snapshot restore failures
- selector or test-id only work
- DB runtime changes
- pure copy or CSS changes

## Repo grounding
- `src/lib/recommendation/engine.ts`
- `src/lib/recommendation/personalization.ts`
- `src/lib/catalog/scoring-version.ts`
- `src/lib/domain/contracts.ts`
- `src/lib/evidence/service.ts`
- `tests/unit/recommendation/golden-cases.spec.ts`
- `tests/unit/recommendation/personalization.spec.ts`

## Repo invariants
- Keep recommendation logic deterministic and explainable.
- Do not replace ranking with opaque AI heuristics.
- Evidence can enrich results but must not override hard filters.
- Keep score breakdown, reasons, and `whyThisFits` internally consistent.
- Keep runtime validation and static types aligned when result shapes change.
- Do not use type-suppression shortcuts.

## Instructions
1. Read `src/lib/recommendation/engine.ts` and the most relevant tests before editing.
2. Separate hard-filter behavior from score-tuning behavior before changing anything.
3. If score weights or thresholds change, review ranking order, confidence, and tie behavior together.
4. If explanation text changes, keep `reasons`, `whyThisFits`, and visible recommendation intent aligned.
5. If personalization changes, confirm the base score and personalization delta remain conceptually separate.
6. If evidence behavior changes, verify it still enriches rather than bypasses eligibility rules.
7. If response shape changes, update `src/lib/domain/contracts.ts` and affected consumers/tests together.
8. Update or add focused unit tests that explain the intended ranking behavior.
9. Prefer minimal scoring changes over broad refactors.
10. Run the minimum repo verification commands plus recommendation-specific tests.

## Inputs expected
- target scoring or ranking behavior
- failing or unexpected scenario
- desired recommendation order or explanation behavior
- affected destinations or inputs
- whether personalization is involved
- whether contract shape changes

## Output format
- 결론: 바뀐 scoring, ranking, explanation behavior
- 원인 또는 분석: 기존 계산 방식, drift 원인, explainability constraints
- 실행 방법 또는 코드 예시: 수정 함수, affected tests, expected before/after behavior

## Verification
- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `npx vitest run tests/unit/recommendation/golden-cases.spec.ts`
- `npx vitest run tests/unit/recommendation/personalization.spec.ts`

## Examples
- "budget-mid 조건에서 premium 목적지가 너무 위에 와"
  - This is a score and ranking calibration issue.
- "추천 이유 문장이 실제 점수랑 어긋나"
  - This is an explainability and engine-output alignment issue.
