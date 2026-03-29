# 한눈에 보기
- 우측 컬럼 간결화 후 lint, build, 핵심 e2e를 다시 확인했다.

## 실행한 검증
- `npx eslint src/components/trip-compass/home/result-page.tsx src/components/trip-compass/home-experience.tsx tests/e2e/recommendation-flow.spec.ts`
- `npx playwright test tests/e2e/recommendation-flow.spec.ts -g "shows the lead summary and primary actions on the lead card" --project=chromium`
- `npm run build`
