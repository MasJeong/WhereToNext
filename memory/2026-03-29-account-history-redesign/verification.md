# 한눈에 보기

- 구조 변경, 데이터 계약 변경, 브라우저 플로우 변경이 함께 있어서 lint/unit/build/e2e를 모두 실행했다.

## 실행한 검증

```bash
npx eslint src/app/account/page.tsx src/app/account/history/new/page.tsx src/components/trip-compass/account-experience.tsx src/components/trip-compass/account-history-create-experience.tsx src/lib/domain/contracts.ts src/lib/db/schema.ts src/lib/profile/service.ts src/lib/test-ids.ts tests/e2e/recommendation-flow.spec.ts
npm run db:generate
npx vitest run tests/unit/auth/account-schema.spec.ts tests/unit/domain/recommendation-query.spec.ts
npx playwright test tests/e2e/recommendation-flow.spec.ts -g "allows social sign-in, trip history save, and personalized recommendations|shows saved recommendations in a separate account tab" --project=chromium
npx playwright test tests/e2e/recommendation-flow.spec.ts -g "shows saved recommendations in a separate account tab"
npm run lint
npm run test:unit
npm run build
npm run test:e2e
```

## 검증 메모

- 전체 e2e 첫 실행에서 `저장한 추천` 탭 테스트가 로그인 복귀 경로와 저장 완료 대기 타이밍 때문에 흔들렸고, 테스트를 안정화한 뒤 다시 통과시켰다.
- 최종 기준 검증 명령은 `npm run test:e2e`까지 포함한다.
