# 여행 퍼널 프롬프트 리디자인 검증

## 진단
- `lsp_diagnostics` 실행 대상:
  - `src/components/trip-compass/home-experience.tsx`
  - `src/components/trip-compass/home/landing-page.tsx`
  - `src/components/trip-compass/home/hero-animation.tsx`
  - `src/components/trip-compass/home/step-question.tsx`
  - `src/components/trip-compass/home/progress-bar.tsx`
  - `src/components/trip-compass/home/result-page.tsx`
  - `src/components/trip-compass/experience-shell.tsx`
- 결과: 이상 없음

## 실행한 명령
1. `npm run lint`
2. `npx vitest run tests/unit/trip-compass/step-answer-adapter.spec.ts`
3. `npm run build`
4. `npx playwright test tests/e2e/recommendation-flow.spec.ts`
5. 프롬프트 정합성과 글자 크기 체계 보정 후 `npm run lint`

## 결과
- `npm run lint` ✅
- `tests/unit/trip-compass/step-answer-adapter.spec.ts` ✅
- `npm run build` ✅
- `tests/e2e/recommendation-flow.spec.ts` ✅, Chromium, WebKit, Mobile Safari 전부 통과
- 최신 퍼널/글자 크기 체계 보정 이후 후속 `npm run lint`: 현재 세션에서는 대기 중

## 검증 중 디버깅 이력
- 초기 Playwright 실행은 port `4010`을 다른 로컬 Node process가 이미 사용 중이어서 실패했다.
- port 충돌을 해소한 뒤 e2e에서 실제 UI 회귀 2건이 드러났다.
  - saved-result link text가 `공유 페이지 보기`에서 변경돼 있었다
  - lead-card section heading `Day-flow`가 이름 변경돼 있었다
- 두 회귀 모두 최소한의 카피 수준 patch로 수정했고, 이후 suite를 다시 실행해 성공했다.
