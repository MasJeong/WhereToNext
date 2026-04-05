# 한눈에 보기
- 결과 페이지 상단을 `이미지 중심`에서 `영상 중심`으로 재구성한다.
- 좌측은 대표 YouTube 카드, 우측은 도시명과 추천 요약만 남겨 첫 판단 속도를 높인다.
- 외부 여행 보조 패널은 아래로 내려 상단 정보 구조를 단순화한다.

## 작업 목표
1. 큰 대표 이미지 영역을 제거하고, video-first 2단 레이아웃으로 전환한다.
2. 대표 YouTube 카드를 좌측 상단의 가장 큰 콘텐츠로 배치한다.
3. 우측에는 도시명, 한 줄 추천 이유, 태그, 핵심 fact 카드, CTA만 남긴다.
4. `다른 후보` 리스트는 유지하되 간격과 설명을 더 간결하게 다듬는다.

## 수정 대상
- `src/components/trip-compass/home/result-page.tsx`
- `src/components/trip-compass/social-video-panel.tsx`
- `src/components/trip-compass/home-experience.tsx`
- 필요 시 관련 e2e 검증
