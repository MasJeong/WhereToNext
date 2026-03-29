# 한눈에 보기

- 상단 헤더가 세션 상태를 반영하는지 정적/브라우저 검증을 함께 진행한다.

## 실행한 검증

```bash
npx eslint src/components/trip-compass/experience-shell.tsx src/components/trip-compass/shell-auth-nav.tsx tests/e2e/auth/social-login.spec.ts
npx playwright test tests/e2e/auth/social-login.spec.ts -g "mock google login redirects to account" --project=chromium
npm run build
```
