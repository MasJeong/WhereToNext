# 한눈에 보기

- 여행 기록 생성과 수정 진입이 실제로 되는지 focused 검증으로 확인했다.

## 실행한 검증

```bash
npx eslint src/components/trip-compass/account-history-create-experience.tsx src/components/trip-compass/account-experience.tsx 'src/app/account/history/[historyId]/edit/page.tsx' src/lib/profile/service.ts src/lib/test-ids.ts tests/e2e/recommendation-flow.spec.ts
npx vitest run tests/unit/auth/account-schema.spec.ts tests/unit/domain/recommendation-query.spec.ts
npm run build
npx playwright test tests/e2e/recommendation-flow.spec.ts -g "lets users edit an existing trip history entry from the list|allows social sign-in, trip history save, and personalized recommendations" --project=chromium
```

## 참고 조사

- Polarsteps support: steps can be edited after publishing
- Apple Journal App Store: journaling suggestions, photos, videos, places 등을 이용해 빈 화면 부담을 줄임
