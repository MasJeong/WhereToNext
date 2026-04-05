# 한눈에 보기
- lint, unit, build를 다시 확인했다.
- video-first 결과 상단과 소셜 비디오 fallback 흐름을 Playwright로 확인했다.
- 기존 `home-experience.tsx`의 `react-hooks/exhaustive-deps` 경고 1건은 유지됐다.

## 실행한 검증
- `npx eslint src/app/page.tsx src/components/trip-compass/home/result-page.tsx src/components/trip-compass/social-video-panel.tsx src/components/trip-compass/home-experience.tsx`
- `npx vitest run tests/unit/domain/recommendation-query.spec.ts tests/unit/social-video/service.spec.ts tests/unit/api/social-video-route.spec.ts`
- `npm run build`
- `npx playwright test tests/e2e/recommendation-flow.spec.ts -g "shows a social video block only for the lead recommendation|keeps recommendation results visible when social video is unavailable" --project=chromium`
- `npx playwright test tests/e2e/recommendation-flow.spec.ts -g "shows the lead summary and primary actions on the lead card" --project=chromium`

## 결과
- lint: 통과, 기존 hook warning 1건 유지
- unit: 통과
- build: 통과
- playwright: 통과
