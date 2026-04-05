# 한눈에 보기

- 축소 Chromium 회귀와 전체 e2e까지 다시 녹색으로 확인했다.
- 현재 결과: `test:unit` 통과, `test:e2e` 90 passed / 3 skipped.

## 실행한 검증

1. `npx eslint tests/e2e/auth/social-login.spec.ts tests/e2e/ios-acquisition-flow.spec.ts tests/e2e/recommendation-flow.spec.ts`
2. `npx playwright test tests/e2e/auth/social-login.spec.ts tests/e2e/recommendation-flow.spec.ts tests/e2e/ios-acquisition-flow.spec.ts --project=chromium`
3. `npm run test:unit`
4. `npm run test:e2e`

## 결과 메모

- 축소 Chromium 실행: `27 passed`
- 전체 Playwright 실행: `90 passed`, `3 skipped`
- 스킵된 테스트는 기존 iOS shell 관련 smoke 항목이며 이번 수정과 무관했다.
