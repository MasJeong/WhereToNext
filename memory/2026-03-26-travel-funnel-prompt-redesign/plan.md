# 여행 퍼널 프롬프트 리디자인 계획

## 목표
- SooGo 홈페이지 퍼널을 외부 `travel_funnel_prompt.txt` 명세와 맞춘다.
- 기존 추천 엔진, 저장/공유/비교 흐름, test-id 계약을 유지한다.

## 작업 계획
1. `/Users/jihun/Desktop/AI프롬프트/soogo/uiux/`의 외부 프롬프트와 참조 JSX를 읽는다.
2. `home-experience.tsx`와 관련 홈 컴포넌트의 현재 퍼널 구현을 매핑한다.
3. 랜딩, 질문, 결과 표현을 엄격한 흰색 중심 미니멀 퍼널로 다시 설계한다.
4. 추천 질의 파생과 snapshot 흐름은 그대로 유지한다.
5. diagnostics, lint, 대상 unit coverage, production build, recommendation e2e 흐름으로 검증한다.
6. 리뷰 중 확인된 프롬프트 불일치를 정리하고, 특히 모션과 흰색 중심 스타일링을 맞춘다.

## 제약 사항
- 퍼널 경험에는 그라디언트를 쓰지 않는다.
- 화면마다 주요 CTA는 1개만 둔다.
- 화면마다 질문은 1개만 보여주고, 선택 즉시 다음 단계로 진행한다.
- 결과 페이지는 대표 목적지 1개를 먼저 보여주고, 보조 추천은 단순화해 노출해야 한다.
- `any`, suppression comment, 관련 없는 비즈니스 로직 변경은 허용하지 않는다.
