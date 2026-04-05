# 한눈에 보기

- 로그인 후 헤더에서 상태가 실제로 보이는지 lint, build, 브라우저 테스트로 확인했다.

## 실행한 검증

```bash
npx eslint src/components/trip-compass/shell-auth-nav.tsx tests/e2e/auth/social-login.spec.ts
npm run build
npx playwright test tests/e2e/auth/social-login.spec.ts -g "mock google login redirects to account" --project=chromium
```
