# 한눈에 보기

- 린트, 빌드, 전체 e2e는 통과했다.
- 전체 `test:unit`은 기능 실패가 아니라 Vitest worker 메모리 종료 문제로 마무리되지 않아, 관련 범위 단위 테스트를 별도로 재검증했다.

## 실행한 검증

1. `npm run lint`
2. `npm run build`
3. `npx vitest run tests/unit/ui/account-future-trips.spec.tsx tests/unit/ui/account-history-gallery.spec.tsx`
4. `npx vitest run tests/unit/ui/future-trip-result-cta.spec.tsx tests/unit/auth/oauth-callback-shell.spec.ts`
5. `npm run test:e2e`

## 추가 메모

- `npm run test:unit`은 대부분 통과했지만 마지막 `tests/unit/smoke.spec.tsx` 종료 단계에서 Vitest worker가 out-of-memory로 종료됐다.
- 같은 변경 범위의 핵심 unit 테스트와 전체 e2e는 통과해, 이번 수정의 동작 회귀는 별도로 확인했다.
