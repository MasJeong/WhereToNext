---
name: soogo-snapshot-restore
description: Updates SooGo snapshot save, share, restore, and compare flows when requests mention saved recommendations, share links, snapshot hydration, compare restore errors, or `/s/[snapshotId]` and `/compare/[snapshotId]` issues, producing fail-closed restore-safe changes with aligned snapshot tests.
---

# SooGo Snapshot Restore

## Purpose
This skill handles recommendation snapshot save, share, restore, and compare workflows.

In scope:
- snapshot create and read behavior
- restore and hydration failures
- comparison snapshot restore behavior
- snapshot API and page alignment
- storage-path parity across DB, local file, and memory flows

Out of scope:
- recommendation scoring changes
- generic route cleanup unrelated to restore
- pure UI styling changes
- general DB runtime refactors not tied to snapshot behavior

## Use when
- "snapshot 복원이 안 돼"
- "공유 링크 에러 수정해줘"
- "saved result hydration 문제 있어"
- "compare restore 오류 봐줘"
- "`/s/[snapshotId]` 페이지 수정해줘"
- "`/compare/[snapshotId]` 복원 흐름 점검해줘"

## Do not use when
- recommendation ranking or scoring only
- auth/session-only API work
- selector-only UI work
- DB runtime setup changes unrelated to snapshots
- pure copy or style changes

## Repo grounding
- `src/lib/snapshots/service.ts`
- `src/lib/trip-compass/restore.ts`
- `src/lib/compare/service.ts`
- `src/app/api/snapshots/route.ts`
- `src/app/api/snapshots/[snapshotId]/route.ts`
- `src/app/s/[snapshotId]/page.tsx`
- `src/app/compare/[snapshotId]/page.tsx`
- `src/components/trip-compass/home-experience.tsx`
- `tests/unit/snapshots/service.spec.ts`
- `tests/e2e/recommendation-flow.spec.ts`
- `docs/issue-resolution-log.md`

## Repo invariants
- Snapshot restore must fail closed.
- Do not silently recompute or partially hydrate missing saved data.
- Preserve discriminated union boundaries such as snapshot `kind` values.
- Keep recommendation and comparison snapshot flows distinct.
- Do not ignore DB, local file, and memory storage differences.
- Check `docs/issue-resolution-log.md` when the failure resembles a recurring restore issue.

## Instructions
1. Identify whether the problem is in snapshot creation, read, hydration, compare assembly, or page-level restore handling.
2. Read `src/lib/snapshots/service.ts` and the relevant restore consumer before editing.
3. Confirm whether the affected payload is a recommendation snapshot or a comparison snapshot.
4. Preserve fail-closed behavior when saved data is missing or invalid.
5. Do not replace restore failures with silent recomputation.
6. Check whether the bug appears only in one storage mode or across DB, local file, and memory modes.
7. Keep API error responses and page-level restore errors consistent.
8. If payload shape changes, update schemas, restore logic, and tests together.
9. Review `docs/issue-resolution-log.md` for similar verified failures before changing restore behavior.
10. Run the minimum repo verification commands plus snapshot-specific tests.

## Inputs expected
- failing route or page path
- snapshot scenario or symptom
- recommendation or comparison snapshot kind
- observed current behavior
- expected restore behavior
- affected storage mode if known
- verification scope

## Output format
- 결론: 수정한 snapshot save, read, restore, or compare behavior
- 원인 또는 분석: hydration failure cause, fail-closed constraints, storage-path impact
- 실행 방법 또는 코드 예시: changed files, reproduction path, affected tests

## Verification
- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `npx vitest run tests/unit/snapshots/service.spec.ts`
- `npx playwright test tests/e2e/recommendation-flow.spec.ts`

## Examples
- "저장된 추천 링크로 들어가면 복원이 실패해"
  - This is a saved snapshot restore and hydration issue.
- "compare 페이지에서 저장 결과 묶음 복원이 깨져"
  - This is a comparison snapshot restore workflow issue.
