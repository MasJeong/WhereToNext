# 한눈에 보기

- 상태: 완료
- 검증 범위: unit, auth/recommendation/ios E2E, build, lint, 수동 라우트 QA

## 수행한 검증

1. `npm run test:unit`
   - 결과: 29 files / 71 tests passed
2. `npx playwright test tests/e2e/auth/social-login.spec.ts --config .sisyphus/drafts/playwright-social-auth.config.ts`
   - 결과: 6 passed
   - 범위: 소셜 로그인 전용 auth UI, Google 로그인, 저장 후 이어서 수행, collision error, Kakao no-email, Apple form_post
3. `npx playwright test tests/e2e/recommendation-flow.spec.ts --config .sisyphus/drafts/playwright-social-auth.config.ts`
   - 결과: 14 passed
4. `npx playwright test tests/e2e/ios-acquisition-flow.spec.ts --config .sisyphus/drafts/playwright-social-auth.config.ts`
   - 결과: 3 passed
5. `npm run build`
   - 결과: 성공
6. `npm run lint`
   - 결과: error 0 / warning 0
7. 수동 QA
   - mock OAuth 기반 auth flow와 저장 후 이어서 수행 흐름을 실제 브라우저 E2E로 실행해 결과를 확인했다.

## Oracle 후속 보완

- private saved snapshot을 owner session 기준으로 `/s/[snapshotId]`, `/compare/[snapshotId]`, destination detail restore에서 다시 읽도록 수정했다.
- `tests/e2e/recommendation-flow.spec.ts`, `tests/e2e/ios-acquisition-flow.spec.ts`를 소셜 로그인 전용 인증과 저장 게이트 기준으로 갱신했다.
- 후속 검증:
  - standard `playwright.config.ts` 기준: `tests/e2e/auth/social-login.spec.ts` 18 passed (chromium/webkit/Mobile Safari)
  - standard `playwright.config.ts` 기준: `tests/e2e/recommendation-flow.spec.ts` 42 passed (14 tests × 3 projects)
  - standard `playwright.config.ts` 기준: `tests/e2e/ios-acquisition-flow.spec.ts` 9 passed (3 tests × 3 projects)
  - 재실행 기준 최종 상태: `npm run lint` 성공, `npm run test:unit` 71 passed, `npm run build` 성공

## 참고

- 검증 중 사용한 임시 Playwright 설정은 `.sisyphus/drafts/playwright-social-auth.config.ts`에 남겨 두었다.
