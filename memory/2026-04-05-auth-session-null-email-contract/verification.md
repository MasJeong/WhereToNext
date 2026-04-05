# 한눈에 보기

- 세션 응답이 `null` 이메일을 유지하는지 unit 테스트로 확인했다.
- 전체 린트와 빌드도 통과했다.

## 검증

1. `npx vitest run tests/unit/auth/session-storage-model.spec.ts tests/unit/auth/session-db-mode.spec.ts tests/unit/auth/account-schema.spec.ts`
2. `npx vitest run tests/unit/snapshots/snapshot-visibility.spec.ts tests/unit/api/snapshots-authz.spec.ts tests/unit/api/me-snapshots-route.spec.ts tests/unit/auth/session-read-refresh-routes.spec.ts`
3. `npx vitest run tests/unit/ui/destination-detail-experience.spec.tsx tests/unit/ui/future-trip-result-cta.spec.tsx`
4. `npm run lint`
5. `npm run build`
