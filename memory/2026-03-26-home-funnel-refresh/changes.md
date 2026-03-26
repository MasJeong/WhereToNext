# 변경 파일 요약

- `src/components/trip-compass/home-experience.tsx`
  - 홈 상태 머신을 `landing | question | result`로 재구성
  - 질문 선택 시 자동 진행, 마지막 질문 후 실제 추천 호출
  - 결과 단계에서 기존 저장/공유/비교/상세 액션 유지
- `src/components/trip-compass/home/*`
  - `LandingPage`, `HeroAnimation`, `ProgressBar`, `StepQuestion`, `ResultPage` 추가
- `src/app/globals.css`
  - 퍼널 전용 stage/hero animation 스타일 추가
  - reduced-motion 대응 확장
- `src/lib/test-ids.ts`
  - `home-result-page` selector 추가
- `tests/e2e/recommendation-flow.spec.ts`
  - CTA 이후 질문 퍼널을 통과해야 결과가 보이는 흐름으로 갱신
- `tests/unit/smoke.spec.tsx`
  - landing-first 계약으로 갱신
